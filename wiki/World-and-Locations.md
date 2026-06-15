# World & Location System

## File: `js/modules/world/LocationEngine.js`

Manages the game world as a network of interconnected locations.

## Location Data Schema

```javascript
{
    id: "cellar",
    name: "The Cellar",
    description: "A dark, musty cellar...",
    connections: ["town_square", "sewer"],
    npcs: ["blacksmith", "mayor"],
    encounters: [
        { enemyId: "rat", chance: 80 },
        { enemyId: "spider", chance: 20 }
    ],
    // New: Custom Interactions
    interactions: [
        {
            label: "Search pockets",
            text: "You find a lockpick!",
            itemId: "rusty_lockpick", // Optional: grants item
            itemQty: 1,               // Optional
            onlyOnce: true,           // Optional: hides after one execution
            requiredItemId: "",       // Optional: requirement checks
            requiredFlag: "",
            setFlag: "pockets_searched"
        }
    ],
    // New: Connection Conditions (padlocks/keys)
    connectionConditions: {
        sewer: {
            requiredItemId: "rusty_lockpick",
            requiredFlag: "cellar_gate_unlocked",
            consumeItem: true,
            lockedText: "The gate is locked. You need a lockpick.",
            unlockText: "You successfully picked the gate lock!"
        }
    }
}
```

## Start Location System

The engine determines the player's starting location through a configurable system rather than a hardcoded value.

### Resolution Order

1. **Saved character data** — If the player has a `currentLocation` saved in Firestore, they resume there.
2. **World config** — The `config/world` Firestore document contains `startLocationId`, set via the World Builder or `admin.setStartLocation()`.
3. **Ultimate fallback** — If no config exists, defaults to `"cellar"` for backwards compatibility.

### Config Document: `config/world`

```javascript
{
    startLocationId: "town_square"   // Location ID where new characters spawn
}
```

This document is managed through:
- **World Builder** → Settings tab → Start Location dropdown
- **Console**: `admin.setStartLocation('town_square')`
- **Database**: `mockDatabase.saveWorldConfig({ startLocationId: 'town_square' })`

## How Locations Work

1. **Rendering**: `renderLocation()` displays description, NPC interaction buttons, and travel buttons. Buttons are disabled instantly on click to prevent spam.
2. **NPC Spawning**: For each NPC ID in the location:
   - If NPC has `defaultDialogueId` → "Speak to [Name]" button
   - If NPC has `isVendor: true` → "Trade with [Name]" button
3. **Travel**: Clicking "Move to [Location]" updates `currentLocation` and re-renders.
4. **Search**: Clicking "Search Area" rolls against the encounter table.
5. **Real-time Synchronization**: When a location is created or updated in Dev Tools, a `'locationsUpdated'` event is dispatched. The `LocationEngine` listens for this event to hot-reload locations and items in memory and re-renders immediately.

### Movement & Key Data Sync
Entering a new location or using key items from the inventory triggers state synchronization:
1. **Explicit Key Usage**: Keys and tools do not automatically unlock gates/doors by just sitting in the inventory. The player must open their inventory, select the key item, and click **"Use / Consume"** to trigger unlock flags permanently.
2. Using a key-like item from the inventory dispatches the `'useInventoryItem'` event, which:
   - Sets the unlocking flag in the player state.
   - Outputs a colorful notice to the global Action Log showing the gate/door was opened.
   - Auto-closes the inventory overlay.
   - Instantly unlocks the travel connections in real time.
3. A `statsUpdated` event is dispatched globally.
4. **Immediate Progress Saving**: To prevent progress loss on page refresh (F5), critical actions (like moving locations, using key items, finishing custom interactions, completing combat, or leveling up stats) bypass the 1.5-second debounce and write to Firestore immediately. Passive regeneration ticks still use the debounced save to reduce write frequencies.

## Encounter Roll Logic

```
Roll a random number 0–100.
Iterate through encounters, accumulating their chance values.
If roll <= cumulative chance: trigger that encounter.
If no encounter triggers: "You find nothing of interest."
```

## LocationEngine Methods

| Method | Signature | Description |
|---|---|---|
| `init()` | `async` | Preloads locations, enemies, items, and world config from Firestore. Binds teleport and inventory item usage listeners. |
| `renderLocation()` | — | Renders the current location details, search, NPC dialogues, custom interactions, and travel choices. |
| `handleCustomInteraction()` | `(locInfo, inter)` | Triggers a custom interaction, validates item weight constraints, sets world flags, and shows results. |
| `showModal()` | `(title, body)` | Opens a beautiful game overlay alert containing custom narrative or locked warning text. |
| `searchArea(locInfo)` | `(locInfo: Object)` | Rolls on the encounter table |
| `triggerEncounter(enemyId)` | `(enemyId: string)` | Starts combat |

## LocationEngine Properties

| Property | Type | Description |
|---|---|---|
| `locations` | `Array` | All loaded location objects |
| `enemies` | `Array` | All loaded enemy objects |
| `items` | `Array` | All loaded base item objects for lookup during interactions |
| `startLocationId` | `string` | Configured spawn point (from world config or fallback) |

> ⚠️ Connections must be bidirectional! If Location A connects to B, Location B must also list A. Use the World Builder's "Auto-Fix Connections" to detect and repair one-way links.
