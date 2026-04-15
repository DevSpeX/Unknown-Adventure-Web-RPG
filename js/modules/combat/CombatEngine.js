/**
 * @file CombatEngine.js
 * @description Core turn-based combat math and state machine.
 */
export default class CombatEngine {
    constructor(state, inventory, questLog) {
        this.state = state;
        this.inventory = inventory;
        this.questLog = questLog;
        this.ui = null; // Injected by UI
        
        this.inCombat = false;
        this.enemy = null;
    }

    startCombat(enemyObj) {
        this.enemy = { ...enemyObj };
        this.enemy.maxHp = this.enemy.hp; // snapshot max
        this.inCombat = true;
        
        this.ui.open(this.enemy);
        this.log(`A wild ${this.enemy.name} appears!`);
    }

    attack() {
        if (!this.inCombat) return;

        // Player attacks
        const pAttrs = this.state.player.attributes;
        let pDamage = Math.max(1, pAttrs.str + Math.floor(Math.random() * 3));
        
        // Crit chance
        const isCrit = Math.random() * 100 < (pAttrs.agi * 2);
        if (isCrit) {
            pDamage = Math.floor(pDamage * 1.5);
            this.ui.showFloatingText('enemy', `CRIT ${pDamage}`, 'float-damage');
            this.log(`Critical Hit! You strike the ${this.enemy.name} for ${pDamage} damage.`);
        } else {
            this.ui.showFloatingText('enemy', `-${pDamage}`, 'float-damage');
            this.log(`You strike the ${this.enemy.name} for ${pDamage} damage.`);
        }

        this.enemy.hp -= pDamage;
        this.ui.updatePhase();

        if (this.enemy.hp <= 0) {
            this.victory();
            return;
        }

        // Enemy attacks back after delay
        setTimeout(() => this.enemyTurn(), 800);
    }

    useSkill(skill) {
        if (!this.inCombat) return;

        // Mana check
        if (this.state.player.mp < skill.mpCost) {
            this.log(`Not enough MP to cast ${skill.name}! (Needs ${skill.mpCost})`);
            return;
        }

        // Subtract MP
        this.state.player.mp -= skill.mpCost;
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('statsUpdated')); // trigger sidebar MP visual update
        }

        const pAttrs = this.state.player.attributes;
        
        // Is it a heal?
        if (skill.healBase > 0) {
            let healAmount = skill.healBase;
            if (skill.scaleStat === 'int') healAmount += pAttrs.int * skill.dmgMult;
            
            healAmount = Math.max(1, Math.floor(healAmount));
            this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + healAmount);
            
            this.ui.showFloatingText('player', `+${healAmount}`, 'float-heal');
            this.log(`You use ${skill.name} and heal ${healAmount} HP!`);
            this.ui.updatePhase();
            
            setTimeout(() => this.enemyTurn(), 800);
            return;
        }
        
        // Attack Math
        let scaleStatValue = 0;
        if (skill.scaleStat === 'str') scaleStatValue = pAttrs.str;
        if (skill.scaleStat === 'int') scaleStatValue = pAttrs.int;
        if (skill.scaleStat === 'agi') scaleStatValue = pAttrs.agi;

        let pDamage = Math.floor( (scaleStatValue * skill.dmgMult) + (Math.random() * 4) );
        pDamage = Math.max(1, pDamage);

        this.ui.showFloatingText('enemy', `-${pDamage}`, 'float-damage');
        this.enemy.hp -= pDamage;
        this.log(`You hit the ${this.enemy.name} with ${skill.name} for ${pDamage} damage!`);
        this.ui.updatePhase();

        if (this.enemy.hp <= 0) {
            this.victory();
            return;
        }

        setTimeout(() => this.enemyTurn(), 800);
    }

    flee() {
        if (!this.inCombat) return;

        const playerAgi = this.state.player.attributes.agi || 0;
        const escapeChance = 30 + (playerAgi * 5); // baseline 30% + 5% per Agility

        if (Math.random() * 100 < escapeChance) {
            this.log(`Your Agility (${playerAgi}) allows you to escape successfully!`);
            setTimeout(() => this.endCombat(), 1000);
        } else {
            this.log("You weren't fast enough to escape!");
            setTimeout(() => this.enemyTurn(), 800);
        }
    }

    enemyTurn() {
        if (!this.inCombat) return;

        let eDamage = Math.max(1, this.enemy.str + Math.floor(Math.random() * 2));
        
        // Player dodge
        const dodgeChance = this.state.player.attributes.agi * 1.5;
        if (Math.random() * 100 < dodgeChance) {
            this.log(`You dodged the ${this.enemy.name}'s attack!`);
            this.ui.showFloatingText('player', 'DODGE', 'float-heal');
            return;
        }

        this.state.player.hp -= eDamage;
        this.ui.showFloatingText('player', `-${eDamage}`, 'float-damage');
        this.log(`The ${this.enemy.name} strikes you for ${eDamage} damage.`);
        
        this.ui.updatePhase();
        
        // Emit event for sidebar UI update
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('statsUpdated'));
        }

        if (this.state.player.hp <= 0) {
            this.defeat();
        }
    }

    victory() {
        this.enemy.hp = 0;
        this.ui.updatePhase();
        this.log(`You defeated the ${this.enemy.name}!`);
        
        // Rewards
        if (this.enemy.exp) {
            this.state.gainExp(this.enemy.exp);
            this.log(`Gained ${this.enemy.exp} EXP.`);
        }
        
        // Loot
        if (this.enemy.drops) {
            this.enemy.drops.forEach(drop => {
                if (Math.random() * 100 <= drop.chance) {
                    this.inventory.addItem({ id: drop.id, name: drop.name, weight: 1, type: drop.type, stats: drop.stats }, drop.qty);
                    this.log(`Looted: ${drop.qty}x ${drop.name}`);
                }
            });
        }
        
        // Quest hook: if the enemy ID matches an objective ID
        if (this.questLog && this.state.player.activeQuests) {
            Object.keys(this.state.player.activeQuests).forEach(qId => {
                this.questLog.updateObjective(qId, this.enemy.id, 1);
                this.questLog.updateObjective(qId, `kill_${this.enemy.id}`, 1);
                this.questLog.updateObjective(qId, `kill_${this.enemy.id}s`, 1);
            });
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('questUpdated'));
            }
        }
        
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('equipmentChanged'));
            window.dispatchEvent(new Event('statsUpdated'));
        }

        setTimeout(() => this.endCombat(), 2500);
    }

    defeat() {
        this.state.player.hp = 0;
        this.ui.updatePhase();
        this.log("You have been defeated...");
        
        // Death penalty
        this.state.player.exp = Math.floor(this.state.player.exp * 0.9);
        this.state.player.hp = 1;
        
        setTimeout(() => {
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('statsUpdated'));
            }
            this.endCombat();
        }, 3000);
    }

    endCombat() {
        this.inCombat = false;
        this.ui.close();
        
        // Return control to location engine
        if (this.onCombatEnd) {
            this.onCombatEnd();
        }
    }

    log(msg) {
        if (this.ui) this.ui.appendLog(msg);
    }
}
