# How-To Guides

## How to Create a New NPC

1. **Dev Tools** → "Create NPC"
2. Enter NPC ID, display name, and sprite reference
3. Check "Is a Vendor?" if this NPC sells items
4. Enter vendor item IDs (comma-separated) if vendor
5. Save NPC
6. **Create dialogue nodes** for this NPC
7. Use **The Linker** to bind dialogue to the NPC
8. **Edit a Location** to add this NPC's ID to its `npcs` array

## How to Create a Complete Quest Chain

```
Step 1: Plan your quest
  - What is the objective? (kill, fetch, talk)
  - What enemy/item/NPC is the target?
  - What are the rewards?

Step 2: Create prerequisites
  - Create enemies (if kill quest)
  - Create items (if fetch quest or item rewards)
  - Create the quest-giver NPC

Step 3: Create the quest
  - Dev Tools → Create Quest
  - Set objective type, target, and amount

Step 4: Create dialogue tree
  - Root node: NPC explains the problem
  - Response with action: START_QUEST
  - Follow-up node for when quest is accepted/completed

Step 5: Link everything
  - The Linker: NPC → Root Dialogue → Quest

Step 6: Place in the world
  - Add NPC to a location
  - Add enemies to location encounter table (if kill quest)
```

## How to Create a New Location

1. **Dev Tools** → "Create Location"
2. Enter location ID, name, and atmospheric description
3. Add connections to other locations (comma-separated IDs)
4. Add NPCs that should be present (comma-separated IDs)
5. Add encounter table as JSON (if enemies should appear)
6. Save
7. **Edit connected locations** to add a reciprocal connection back

> ⚠️ Connections must be bidirectional! If Location A connects to B, Location B must also list A.

### Using the World Builder (Recommended)

After creating locations, use **Dev Tools → 🗺️ World Builder** to:

1. **Verify connections** — Open the Map tab to see all locations as nodes. One-way connections appear as dashed red lines.
2. **Auto-fix** — Open the Settings tab → "Auto-Fix One-Way Connections" to add missing reciprocal links.
3. **Set start location** — Open the Settings tab → select a location from the Start Location dropdown → Save.
4. **Validate** — Run the Full Validation to check for orphans, broken NPC/enemy references, and encounter totals.

### Setting the Start Location

New characters spawn at the configured start location. To change it:

- **World Builder** → Settings → Start Location dropdown → Save
- **Console**: `admin.setStartLocation('town_square')`


## How to Add an Item as an Enemy Drop

Edit the enemy's `drops` array:

```javascript
drops: [
    {
        id: "item_id",        // Must match an existing item
        name: "Item Name",    // Display name in loot log
        chance: 50,           // Percentage chance (0-100)
        qty: 1,               // How many to drop
        type: "main_hand",    // Optional: equipment slot
        stats: { str: 5 }     // Optional: stat bonuses
    }
]
```

## How to Grant Admin Privileges

```bash
# Navigate to the project root
cd web_rpg_game

# Grant admin
node scripts/setAdmin.js user@example.com

# Revoke admin
node scripts/setAdmin.js user@example.com --revoke

# The user must log out and log back in
```

## How to Add a New Equipment Slot

1. Add the slot to `State.js` in the player's `equipment` initialization
2. Add the slot name to `EquipmentUI.js` in `this.slotNames`
3. Create items with `type` matching your new slot key

## How to Add a New Profession

1. Add the profession to `State.js` in `player.professions`:
   ```javascript
   professions: { smithing: 1, alchemy: 1, enchanting: 1 }
   ```
2. Create recipes with `profession: "enchanting"`
3. The crafting system automatically checks profession levels

## How to Add a New Dialogue Action Type

1. Open `DialogueEngine.js`
2. Add a new case in `executeActions()`:
   ```javascript
   case 'MY_ACTION':
       // Your custom logic here
       break;
   ```
3. Use it in dialogue response JSON:
   ```javascript
   actions: [{ type: "MY_ACTION", target: "someValue" }]
   ```
