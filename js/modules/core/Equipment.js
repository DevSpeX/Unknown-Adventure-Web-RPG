/**
 * @file Equipment.js
 * @description Manages character equipment slots, equipping logic, and stat recalculation.
 */
export default class Equipment {
    constructor(state, inventory) {
        this.state = state;
        this.inventory = inventory;

        // Initialize state equipment storage if missing
        if (!this.state.player.equipment) {
            this.state.player.equipment = {
                head: null,
                chest: null,
                main_hand: null,
                off_hand: null,
                legs: null,
                feet: null,
                accessory: null
            };
        }
        
        this.recalculateStats();
    }

    /**
     * Equips an item if requirements are met and it matches a slot.
     */
    equip(itemId) {
        const invItem = this.inventory.items.find(i => i.id === itemId);
        if (!invItem) return false;

        const slot = this.getSlotForItem(invItem);
        if (!slot) {
            console.warn(`Item ${invItem.name} cannot be equipped.`);
            return false;
        }

        // Check Requirements (Level)
        if (invItem.reqLevel && this.state.player.level < invItem.reqLevel) {
            console.warn(`Level requirement not met for ${invItem.name}`);
            return false;
        }

        // Unequip currently equipped item in that slot
        if (this.state.player.equipment[slot]) {
            this.unequip(slot, false); // false to avoid double stat calc immediately
        }

        // Remove from inventory
        this.inventory.removeItem(itemId, 1);
        
        // Equip
        this.state.player.equipment[slot] = { ...invItem, qty: 1 };
        
        this.recalculateStats();
        
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('equipmentChanged'));
        }
        return true;
    }

    /**
     * Unequips an item from a specific slot back to inventory.
     */
    unequip(slot, recalc = true) {
        const item = this.state.player.equipment[slot];
        if (!item) return false;

        // Try to place back in inventory
        const success = this.inventory.addItem(item, 1);
        if (success) {
            this.state.player.equipment[slot] = null;
            if (recalc) this.recalculateStats();
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new Event('equipmentChanged'));
            }
            return true;
        } else {
            console.warn("Inventory full, cannot unequip.");
            return false;
        }
    }

    recalculateStats() {
        // Start from NATURAL base stats in State
        const newStats = { ...(this.state.player.baseAttributes || { str:0, agi:0, int:0 }) };
        
        let maxHpBonus = 0;
        let maxMpBonus = 0;
        
        // Sum additions from equipment
        Object.values(this.state.player.equipment).forEach(item => {
            if (item && item.stats) {
                if (item.stats.str) newStats.str = (newStats.str || 0) + item.stats.str;
                if (item.stats.agi) newStats.agi = (newStats.agi || 0) + item.stats.agi;
                if (item.stats.int) newStats.int = (newStats.int || 0) + item.stats.int;
                if (item.stats.maxHp) maxHpBonus += item.stats.maxHp;
                if (item.stats.maxMp) maxMpBonus += item.stats.maxMp;
            }
        });

        // Push to state seamlessly
        this.state.player.attributes = newStats;
        
        // Determine Bounds dynamically
        const b = this.state.player.baseAttributes || { str:0, agi:0, int:0 };
        this.state.player.maxHp = 20 + (b.str * 2) + maxHpBonus;
        this.state.player.maxMp = 10 + (b.int * 5) + maxMpBonus;
        
        if (this.state.player.hp > this.state.player.maxHp) this.state.player.hp = this.state.player.maxHp;
        if (this.state.player.mp > this.state.player.maxMp) this.state.player.mp = this.state.player.maxMp;
        
        // Also trigger global UI update for sidebar
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('statsUpdated'));
        }
    }

    getSlotForItem(item) {
        if (!item.type) return null;
        if (this.state.player.equipment.hasOwnProperty(item.type)) {
            return item.type;
        }
        return null; // Not an equippable type (e.g. material/consumable)
    }
}
