# Dev Tools (Admin Panel)

## File: `js/ui/DevTools.js`

The Dev Tools panel is a comprehensive content creation suite visible only to admin users.

## Access

1. User must have `admin: true` Custom Claim (set via `scripts/setAdmin.js`)
2. After login, "Enter Dev Area" button appears in sidebar
3. Clicking opens the Dev Tools overlay

## Content Editors

| Editor | Creates | Firestore Collection |
|---|---|---|
| Create NPC | NPC entities | `npcs` |
| Create Quest | Quest templates | `quests` |
| Create Dialogue Node | Dialogue tree nodes | `dialogues` |
| The Linker | NPC ↔ Dialogue ↔ Quest relationships | Updates `npcs` + `dialogues` |
| Create Location | World locations | `locations` |
| Create Enemy | Enemy definitions | `enemies` |
| Create Currency | Custom currencies | `currencies` |
| Create Skill | Combat skills | `skills` |
| Create Crafting Recipe | Crafting recipes | `recipes` |
| Create Base Item | Item definitions | `items` |

## Database Managers

Each entity type has a "Manage" button that lists all records with:
- **Edit**: Pre-fills the creation form with existing data
- **Delete**: Removes the record from Firestore (with confirmation)

## The Linker

A special tool for establishing relationships between entities:

1. **Select NPC**: Choose an NPC from the database
2. **Select Dialogue Tree**: Choose a dialogue root node
3. **Select Quest (Optional)**: Choose a quest to auto-inject

The Linker:
- Sets the NPC's `defaultDialogueId` to the selected dialogue
- If a quest is selected, adds an `[Accept Quest]` response to the dialogue

## World Builder

### File: `js/ui/WorldBuilderUI.js`

A dedicated visual tool for managing the game world's location network. Accessed via the "🗺️ World Builder" button in the Dev Tools action list.

### Tab 1 — Interactive Map

- Force-directed canvas graph rendering all locations as **draggable nodes**.
- **Connection lines** drawn between linked locations:
  - Solid gold lines = bidirectional (healthy).
  - Dashed red lines = one-way (broken — needs reciprocal link).
- **Color-coded nodes**:
  - 🟢 Green = start location.
  - 🟡 Amber = has NPCs.
  - 🔴 Red = has encounters.
  - 🟠 Orange = has both NPCs and encounters.
  - ⚫ Gray = empty (no NPCs or encounters).
- **Click** a node → detail pane shows info + quick actions (Teleport, Edit, Set as Start, Delete).
- **Double-click** a node → teleports the player to that location.
- **Drag** nodes to rearrange the map layout.
- **Warning badge** (⚠) on orphan nodes (no connections).

### Tab 2 — Location Table

Sortable data grid showing all locations:

| Column | Description |
|---|---|
| ID | Location identifier |
| Name | Display name |
| Conns | Number of connections (⚠ if one-way detected) |
| NPCs | Number of NPCs present |
| Encs | Number of encounter entries |
| Start | ★ if this is the configured start location |
| Actions | Teleport, Set as Start, Edit, Delete |

Click column headers to sort ascending/descending.

### Tab 3 — World Settings

- **Start Location**: Dropdown to select and save the player spawn location. Persisted to Firestore `config/world`.
- **Auto-Fix Connections**: Scans all locations for one-way connections. It intelligently identifies missing reciprocal links and creates them. If a target location ID is invalid, it provides a specific warning in the status log.
- **Validation Report**: Full integrity scan checking for:
  - Orphan locations (no connections)
  - One-way connections
  - References to non-existent locations, NPCs, or enemies
  - Encounter chance totals exceeding 100%

## Premium Aesthetics

The Dev Tools UI features a modern, premium design system:
- **Glassmorphism Panels**: Semi-transparent backgrounds with backdrop blur.
- **Golden Accents**: Tarnished gold borders and highlights consistent with the RPG theme.
- **Dynamic Feedback**: Success/Error messages use animated status bars and color-coded logging.

## Creating Complete Content Chains

**Full workflow to add a new questline:**

1. **Create Enemy** (e.g., `goblin`)
2. **Create Item** (e.g., `goblin_fang` for rewards/drops)
3. **Create Quest** (e.g., `goblin_hunt` — kill 5 goblins, reward 200 EXP)
4. **Create NPC** (e.g., `guard_captain`)
5. **Create Dialogue Nodes**:
   - `captain_intro`: "We need help with goblins..."
   - `captain_thanks`: "You did it! Thank you."
6. **Use The Linker**: Bind `guard_captain` → `captain_intro` → `goblin_hunt`
7. **Create/Edit Location**: Add `guard_captain` to NPC list. Add `goblin` to encounters.
8. **Use World Builder**: Verify the new location appears on the map, connections are bidirectional, and run validation.

---

## Admin Console Commands

When logged in as admin, the browser console exposes `window.admin`:

### `admin.giveItem(id, name, qty, weight, rarity, type, stats)`

```javascript
admin.giveItem('excalibur', 'Excalibur', 1, 3, 'legendary', 'main_hand', { str: 15, maxHp: 50 });
```

### `admin.giveExp(amount)`

```javascript
admin.giveExp(500);
```

### `admin.addRecipe(recipeObj)`

```javascript
admin.addRecipe({
    id: 'super_potion', name: 'Super Potion',
    profession: 'alchemy', levelReq: 3,
    materials: [{ id: 'herb', qty: 5 }],
    resultItem: { id: 'super_potion', name: 'Super Potion', weight: 1, rarity: 'rare' }
});
```

### `admin.addDialogue(dialObj)`

```javascript
admin.addDialogue({
    id: 'test_node', npc: 'Test NPC',
    text: 'Hello, this is a test.',
    responses: [{ text: 'Bye', nextNodeId: null, conditions: null, actions: null }]
});
```

### `admin.teleport(locationId)`

```javascript
admin.teleport('town_square');
```

### `admin.setStartLocation(locationId)`

```javascript
admin.setStartLocation('town_square');
```

Sets the world-wide spawn point for new characters. Persists to Firestore `config/world`.

### `admin.reloadLocations()`

```javascript
admin.reloadLocations();
```

Hot-reloads all locations from Firestore into the LocationEngine without restarting.
