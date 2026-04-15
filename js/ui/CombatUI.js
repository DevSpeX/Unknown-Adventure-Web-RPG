/**
 * @file CombatUI.js
 * @description Masterpiece fullscreen CSS overlay for combat.
 */
import { mockDatabase } from '../core/database.js';

export default class CombatUI {
    constructor(engine) {
        this.engine = engine;
        this.engine.ui = this;
        
        this.overlay = document.getElementById('combat-overlay');
        this.logArea = document.getElementById('combat-log');
        
        this.playerHpFill = document.getElementById('combat-player-hp-fill');
        this.enemyHpFill = document.getElementById('combat-enemy-hp-fill');
    }

    async open(enemy) {
        this.overlay.classList.remove('hidden');
        // Small delay to allow display block to apply before transition
        setTimeout(() => this.overlay.classList.add('active'), 10);
        
        this.logArea.innerHTML = '';
        document.getElementById('combat-enemy-name').innerText = enemy.name;
        
        // Initialize HP bars
        this.updatePhase();
        
        // Render dynamic buttons
        await this.buildActionButtons();
    }

    async buildActionButtons() {
        const container = document.getElementById('combat-actions-container');
        container.innerHTML = '';
        
        const allDbSkills = await mockDatabase.getSkills();
        const playerSkills = this.engine.state.player.skills || []; 
        
        // Basic Strike button
        const btnStrike = document.createElement('button');
        btnStrike.className = 'btn combat-btn attack';
        btnStrike.innerText = 'Strike (Base)';
        btnStrike.onclick = () => this.engine.attack();
        container.appendChild(btnStrike);
        
        // Iterate learned skills
        playerSkills.forEach(skillId => {
            const dbSkill = allDbSkills.find(s => s.id === skillId);
            if (dbSkill) {
                const btn = document.createElement('button');
                btn.className = 'btn combat-btn';
                
                // Styling based on heal or attack
                if (dbSkill.healBase > 0) {
                    btn.classList.add('flee'); // visually non-aggressive
                    btn.style.borderColor = '#4CAF50';
                    btn.style.color = '#4CAF50';
                } else {
                    btn.classList.add('heavy');
                }
                
                let statsReq = `(${dbSkill.mpCost} MP)`;
                if (dbSkill.scaleStat === 'str') statsReq += ' [Str Scaling]';
                if (dbSkill.scaleStat === 'int') statsReq += ' [Int Scaling]';

                btn.innerText = `${dbSkill.name} ${statsReq}`;
                btn.onclick = () => this.engine.useSkill(dbSkill);
                container.appendChild(btn);
            }
        });
        
        const btnFlee = document.createElement('button');
        btnFlee.className = 'btn combat-btn flee';
        btnFlee.innerText = 'Flee';
        btnFlee.onclick = () => this.engine.flee();
        container.appendChild(btnFlee);
    }

    close() {
        this.overlay.classList.remove('active');
        setTimeout(() => this.overlay.classList.add('hidden'), 500);
    }

    updatePhase() {
        const p = this.engine.state.player;
        const pPct = Math.max(0, (p.hp / p.maxHp) * 100);
        this.playerHpFill.style.width = pPct + '%';
        document.getElementById('combat-player-name').innerText = `${p.name || 'Player'} (${p.hp} HP)`;
        
        const e = this.engine.enemy;
        const ePct = Math.max(0, (e.hp / e.maxHp) * 100);
        this.enemyHpFill.style.width = ePct + '%';
        document.getElementById('combat-enemy-name').innerText = `${e.name} (${e.hp} HP)`;
    }

    appendLog(msg) {
        const p = document.createElement('p');
        p.innerText = msg;
        this.logArea.appendChild(p);
        this.logArea.scrollTop = this.logArea.scrollHeight;
    }

    showFloatingText(target, text, cssClass) {
        const el = document.createElement('div');
        el.className = `floating-text ${cssClass}`;
        el.innerText = text;
        
        if (target === 'player') {
            document.querySelector('.player-entity').appendChild(el);
        } else {
            document.querySelector('.enemy-entity').appendChild(el);
        }
        
        // Remove element after animation completes (1s)
        setTimeout(() => el.remove(), 1000);
    }
}
