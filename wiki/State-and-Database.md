# State & Database

## State (`js/core/State.js`)

The central data store for the game. Contains the player object, world flags, and quest storage.

### Player Object Structure

```javascript
{
    id: null,                       // Firestore document ID
    name: "Unknown",                // Character name
    origin: "Peasant",              // Origin class
    level: 1, exp: 0, expNext: 100,
    hp: 20, maxHp: 20,              // 20 + (STR × 2) + equipment bonuses
    mp: 10, maxMp: 10,              // 10 + (INT × 5) + equipment bonuses
    statPoints: 0,                  // Unspent stat points (3 per level)
    skills: ['heavy_slash'],
    attributes: { str: 0, agi: 0, int: 0 },      // TOTAL (base + equipment)
    baseAttributes: { str: 0, agi: 0, int: 0 },   // NATURAL (no equipment)
    wallet: { copper: 0, silver: 0, gold: 0 },
    currentLocation: "cellar",
    equipment: {
        head: null, chest: null,
        main_hand: null, off_hand: null,
        legs: null, feet: null, accessory: null
    },
    activeQuests: {},
    completedQuests: [],
    professions: { smithing: 1, alchemy: 1 },
    inventory: []
}
```

### State Methods

| Method | Signature | Description |
|---|---|---|
| `updatePlayer` | `(data: Object)` | Merges partial data into player. Recalculates HP/MP if `baseAttributes` changes. |
| `addCurrency` | `(id: string, amount: number)` | Adds currency with auto-rollover (100 copper → 1 silver → 1 gold). Caps gold at 999. |
| `payCopper` | `(amount: number) → boolean` | Deducts copper with auto-conversion from silver/gold. Returns false if too poor. |
| `gainExp` | `(amount: number) → boolean` | Adds EXP, handles leveling. Grants 3 stat points and full heal per level. |
| `regenTick` | `()` | Passively regenerates HP and MP by 1 point per tick up to maximum capacity. |
| `setFlag` | `(key: string, value: any)` | Sets a world flag (for narrative branching). |
| `getFlag` | `(key: string) → any` | Gets a world flag value. |

### EXP Scaling Formula

```
Level 1 → 2:  100 EXP
Level 2 → 3:  150 EXP
Level 3 → 4:  225 EXP
Formula: expNext = floor(expNext × 1.5)
```

### Passive Regeneration
The engine includes a passive resource restoration system to sustain gameplay during exploration and downtime.

- **Tick Rate**: Executes every 5 seconds.
- **Restored Resources**: +1 Health Point (HP) and +1 Mana Point (MP) per tick.
- **Logic**:
    - Only regenerates if HP > 0 (player is alive).
    - Capped at `maxHp` and `maxMp`.
    - Automatically updates the UI and syncs with the Combat Engine if in an active encounter.

---

## Database (`js/core/database.js`)

A Firestore ORM wrapping all CRUD operations. Exported as `mockDatabase`.

### Generic Methods

| Method | Description |
|---|---|
| `_getColl(collName)` | Reads all documents from a Firestore collection |
| `_setDoc(collName, data)` | Creates or updates a document (auto-generates ID if missing) |
| `deleteEntity(collName, id)` | Deletes a document by collection name and document ID |

### Collection-Specific Methods

| Collection | Get Method | Save Method |
|---|---|---|
| `users/{uid}/characters` | `getCharacters(uid)` | `saveCharacter(uid, data)` |
| `recipes` | `getRecipes()` | `saveRecipe(data)` |
| `items` | `getItems()` | `saveItem(data)` |
| `currencies` | `getCurrencies()` | `saveCurrency(data)` |
| `quests` | `getQuests()` | `saveQuest(data)` |
| `dialogues` | `getDialogues()` | `saveDialogue(data)` |
| `npcs` | `getNPCs()` | `saveNPC(data)` |
| `locations` | `getLocations()` | `saveLocation(data)` |
| `enemies` | `getEnemies()` | `saveEnemy(data)` |
| `skills` | `getSkills()` | `saveSkill(data)` |

### Auto-Save System

The Engine runs a debounced cloud save (`triggerCloudSave()`) 1.5 seconds after any state change. It saves the full player object + inventory to Firestore under `users/{uid}/characters/{charId}`.

**Data Scrubbing**: To prevent Firestore "Invalid data" errors, the state object is scrubbed of all `undefined` fields using `JSON.parse(JSON.stringify(snapshot))` before transmission. This ensures perfect compatibility with the Firebase SDK.
