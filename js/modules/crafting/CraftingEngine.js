/**
 * @file CraftingEngine.js
 * @description Logic for checking professions and producing items via recipes.
 */
export default class CraftingEngine {
    /**
     * @param {Object} inventory - Reference to the player's Inventory instance.
     * @param {Object} state - Reference to the global State instance (for professions).
     */
    constructor(inventory, state) {
        this.inventory = inventory;
        this.state = state;
        
        // Define default professions if they don't exist
        if (!this.state.player.professions) {
            this.state.player.professions = {
                smithing: 1,
                alchemy: 1
            };
        }
    }

    /**
     * Checks if the player has the materials and profession level to craft a recipe.
     * @param {Object} recipe - { id, name, profession, levelReq, materials: [{id, qty}], resultItem: {id, name, weight, rarity} }
     */
    canCraft(recipe) {
        // Check profession level
        const playerLevel = this.state.player.professions[recipe.profession] || 0;
        if (playerLevel < recipe.levelReq) {
            return { valid: false, reason: `Requires ${recipe.profession} level ${recipe.levelReq}` };
        }

        // Check materials
        for (const mat of recipe.materials) {
            if (!this.inventory.hasItem(mat.id, mat.qty)) {
                return { valid: false, reason: `Missing material: ${mat.id} (x${mat.qty})` };
            }
        }

        return { valid: true };
    }

    /**
     * Consumes materials and generates the result item.
     */
    craft(recipe) {
        const check = this.canCraft(recipe);
        if (!check.valid) {
            console.error(check.reason);
            return false;
        }

        // Consume materials
        recipe.materials.forEach(mat => {
            this.inventory.removeItem(mat.id, mat.qty);
        });

        // Add result
        this.inventory.addItem(recipe.resultItem, 1);
        
        // Optionally grant XP (basic logic)
        // this.state.player.professions[recipe.profession] += 0.1;
        
        return true;
    }
}
