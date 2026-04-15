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
    ]
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

1. **Rendering**: `renderLocation()` displays description, NPC interaction buttons, and travel buttons.
2. **NPC Spawning**: For each NPC ID in the location:
   - If NPC has `defaultDialogueId` → "Speak to [Name]" button
   - If NPC has `isVendor: true` → "Trade with [Name]" button
3. **Travel**: Clicking "Move to [Location]" updates `currentLocation` and re-renders.
4. **Search**: Clicking "Search Area" rolls against the encounter table.

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
| `init()` | `async` | Preloads locations, enemies, and world config from Firestore |
| `renderLocation()` | — | Renders the current location |
| `searchArea(locInfo)` | `(locInfo: Object)` | Rolls on the encounter table |
| `triggerEncounter(enemyId)` | `(enemyId: string)` | Starts combat |

## LocationEngine Properties

| Property | Type | Description |
|---|---|---|
| `locations` | `Array` | All loaded location objects |
| `enemies` | `Array` | All loaded enemy objects |
| `startLocationId` | `string` | Configured spawn point (from world config or fallback) |

> ⚠️ Connections must be bidirectional! If Location A connects to B, Location B must also list A. Use the World Builder's "Auto-Fix Connections" to detect and repair one-way links.
