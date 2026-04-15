/**
 * @file Inventory.js
 * @description Manages player items, supports stacking, rarity, and weight checks.
 */
export default class Inventory {
    constructor(maxWeight = 100) {
        // array of { id, name, rarity, weight, quantity, type }
        this.items = [];
        this.maxWeight = maxWeight;
    }

    /**
     * @returns {number} The current total weight of the inventory.
     */
    getTotalWeight() {
        return this.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
    }

    /**
     * Adds an item to the inventory. Stacks if the item ID already exists.
     * @param {Object} itemObj - e.g. { id: 'iron_ingot', name: 'Iron Ingot', rarity: 'common', weight: 2 }
     * @param {number} qty - Amount to add
     * @returns {boolean} True if successful, false if overweight.
     */
    addItem(itemObj, qty = 1) {
        const addedWeight = itemObj.weight * qty;
        if (this.getTotalWeight() + addedWeight > this.maxWeight) {
            console.warn("Inventory full: Cannot carry more weight.");
            return false;
        }

        const existing = this.items.find(i => i.id === itemObj.id);
        if (existing) {
            existing.quantity += qty;
        } else {
            this.items.push({ ...itemObj, quantity: qty });
        }
        return true;
    }

    /**
     * Checks if inventory contains at least 'qty' of 'itemId'
     */
    hasItem(itemId, qty = 1) {
        const existing = this.items.find(i => i.id === itemId);
        return existing ? existing.quantity >= qty : false;
    }

    /**
     * Removes an item from the inventory.
     * @returns {boolean} True if successfully removed, false if not enough items.
     */
    removeItem(itemId, qty = 1) {
        if (!this.hasItem(itemId, qty)) return false;

        const existing = this.items.find(i => i.id === itemId);
        existing.quantity -= qty;
        
        if (existing.quantity <= 0) {
            this.items = this.items.filter(i => i.id !== itemId);
        }
        return true;
    }
}
