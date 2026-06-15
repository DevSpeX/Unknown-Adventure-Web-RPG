/**
 * @file State.js
 * @description Central State Management for the RPG Engine.
 * Handles the player object, world flags, and quest tracking.
 */
import { GlobalLog } from '../ui/ActionLog.js';

export default class State {
    constructor() {
        /** 
         * @property {Object} player - The main character's data.
         */
        this.player = {
            id: null,
            name: "Unknown",
            origin: "Peasant",
            level: 1,
            exp: 0,
            expNext: 100,
            hp: 20,
            maxHp: 20,
            mp: 10,
            maxMp: 10,
            statPoints: 0,
            skills: ['heavy_slash'],
            attributes: {
                str: 0,
                agi: 0,
                int: 0
            },
            baseAttributes: {
                str: 0,
                agi: 0,
                int: 0
            },
            wallet: { copper: 0, silver: 0, gold: 0 },
            currentLocation: null,
            flags: {}
        };

        /**
         * @property {Object} quests - Active and completed quests.
         */
        this.quests = {};
    }

    /**
     * Updates the player's core information.
     * @param {Object} data - Partial player data to merge.
     */
    updatePlayer(data) {
        this.player = { ...this.player, ...data };
        if (!this.player.wallet) this.player.wallet = { copper: 0, silver: 0, gold: 0 };
        if (this.player.mp === undefined) this.player.mp = 10;
        if (this.player.maxMp === undefined) this.player.maxMp = 10;
        if (this.player.statPoints === undefined) this.player.statPoints = 0;
        if (!this.player.skills) this.player.skills = ['heavy_slash'];
        
        if (data.attributes) {
            this.player.attributes = { ...this.player.attributes, ...data.attributes };
        }
        if (!this.player.flags) this.player.flags = {};
        if (data.baseAttributes) {
            this.player.baseAttributes = { ...this.player.baseAttributes, ...data.baseAttributes };
            
            // Recalculate Natural Max HP/MP based on base traits
            this.player.maxHp = 20 + (this.player.baseAttributes.str * 2);
            this.player.maxMp = 10 + (this.player.baseAttributes.int * 5);
            
            if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp;
            if (this.player.mp > this.player.maxMp) this.player.mp = this.player.maxMp;
        }
    }

    /**
     * Adds currency and handles the 100 copper -> 1 silver rollover logic.
     * @param {string} id - Currency ID
     * @param {number} amount - Amount to add
     */
    addCurrency(id, amount) {
        if (!this.player.wallet[id]) this.player.wallet[id] = 0;
        this.player.wallet[id] += amount;

        // Auto rollover logic only applies to core currency
        if (this.player.wallet.copper >= 100) {
            let silverGain = Math.floor(this.player.wallet.copper / 100);
            this.player.wallet.copper = this.player.wallet.copper % 100;
            this.player.wallet.silver += silverGain;
        }
        if (this.player.wallet.silver >= 100) {
            let goldGain = Math.floor(this.player.wallet.silver / 100);
            this.player.wallet.silver = this.player.wallet.silver % 100;
            this.player.wallet.gold += goldGain;
        }
        // Cap gold at 999
        if (this.player.wallet.gold > 999) {
            this.player.wallet.gold = 999;
        }
    }

    /**
     * Deducts requested copper amount via auto-conversion from silver/gold if necessary.
     * @param {number} amount - Cost in copper
     * @returns {boolean} True if affordable and paid
     */
    payCopper(amount) {
        let totalCopper = this.player.wallet.copper + (this.player.wallet.silver * 100) + (this.player.wallet.gold * 10000);
        if (totalCopper < amount) return false; // Not enough wealth
        
        totalCopper -= amount;
        
        // Rebuild wallet exactly
        this.player.wallet.gold = Math.floor(totalCopper / 10000);
        totalCopper %= 10000;
        
        this.player.wallet.silver = Math.floor(totalCopper / 100);
        this.player.wallet.copper = totalCopper % 100;
        
        return true;
    }

    /**
     * Adds EXP and handles leveling up.
     * @param {number} amount - Amount of EXP to grant.
     * @returns {boolean} True if leveled up.
     */
    gainExp(amount) {
        this.player.exp += amount;
        let leveledUp = false;
        
        try { GlobalLog.log(`Gained ${amount} EXP.`, 'exp'); } catch(e){}
        
        while (this.player.exp >= this.player.expNext) {
            this.player.level++;
            // Make requirements inherently scale
            this.player.exp -= this.player.expNext;
            this.player.expNext = Math.floor(this.player.expNext * 1.5);
            
            // Auto grant stat points
            this.player.statPoints += 3;
            
            // Full heal/mana on level up
            this.player.hp = this.player.maxHp || 20;
            this.player.mp = this.player.maxMp || 10;
            
            leveledUp = true;
            try { GlobalLog.log(`Level Up! You reached Level ${this.player.level}! (+3 Stat Points)`, 'levelup'); } catch(e) {}
        }
        return leveledUp;
    }

    /**
     * Sets a world flag.
     * @param {string} key - The flag identifier.
     * @param {any} value - The value to set.
     */
    setFlag(key, value) {
        if (!this.player.flags) this.player.flags = {};
        this.player.flags[key] = value;
    }

    /**
     * Gets a world flag.
     * @param {string} key - The flag identifier.
     * @returns {any} The flag's value or undefined.
     */
    getFlag(key) {
        if (!this.player.flags) this.player.flags = {};
        return this.player.flags[key];
    }

    /**
     * Passive regeneration for HP and MP.
     * @returns {boolean} True if stats actually changed.
     */
    regenTick() {
        let changed = false;
        if (this.player.hp > 0) { // Only regen if alive
            if (this.player.hp < this.player.maxHp) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                changed = true;
            }
            if (this.player.mp < this.player.maxMp) {
                this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
                changed = true;
            }
        }
        return changed;
    }
}
