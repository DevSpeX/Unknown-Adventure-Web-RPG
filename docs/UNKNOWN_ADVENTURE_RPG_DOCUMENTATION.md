# Unknown Adventure RPG — Complete Technical Documentation

> **Version**: 1.0.1 · **Last Updated**: April 16, 2026  
> **Platform**: Web (Browser-based) · **Backend**: Firebase (Auth + Firestore)  
> **Hosted at**: `unknown-adventure-rpg.web.app`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Build, Deploy & Run](#5-build-deploy--run)
6. [Authentication System](#6-authentication-system)
7. [Core Systems — State & Database](#7-core-systems--state--database)
8. [Player and Attributes](#8-player-and-attributes)
9. [Character Creation](#9-character-creation)
10. [World & Location System](#10-world--location-system)
11. [Combat System](#11-combat-system)
12. [Quest System](#12-quest-system)
13. [Dialogue System](#13-dialogue-system)
14. [Inventory System](#14-inventory-system)
15. [Equipment System](#15-equipment-system)
16. [Crafting System](#16-crafting-system)
17. [Economy & Currency System](#17-economy--currency-system)
18. [Vendor / Shop System](#18-vendor--shop-system)
19. [Skill System](#19-skill-system)
20. [Leveling & Progression](#20-leveling--progression)
21. [Dev Tools (Admin Panel)](#21-dev-tools-admin-panel)
22. [UI Layer Reference](#22-ui-layer-reference)
23. [CSS Design System](#23-css-design-system)
24. [Admin Console Commands](#24-admin-console-commands)
25. [Data Schemas (Firestore Collections)](#25-data-schemas-firestore-collections)
26. [How-To Guides](#26-how-to-guides)
27. [Extending the Engine](#27-extending-the-engine)
28. [Complete File Reference](#28-complete-file-reference)

---

## 1. Project Overview

**Unknown Adventure RPG** is a text-based, browser-rendered RPG engine built with vanilla HTML, CSS, and JavaScript ES Modules. It features:

- **Firebase Authentication** for login/register with admin privileges via Custom Claims
- **Firestore** cloud database for persistent game data (characters, quests, NPCs, items, etc.)
- **Multi-character** per-user support with cloud saves
- **Turn-based combat** with skills, crits, dodges, and loot drops
- **Branching dialogue** trees (Visual Novel style) with condition checks
- **Quest system** with objectives, tracking, and rewards
- **Equipment system** with 7 gear slots and stat bonuses
- **Crafting** with profession levels, material requirements, and progress bars
- **Economy** with copper → silver → gold auto-conversion
- **Vendor trading** with buy/sell tabs
- **In-game Dev Tools** for content creation (admin only)

The game uses a dark medieval aesthetic with serif fonts, tarnished gold borders, and parchment-colored text.

---

## 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Markup** | HTML5 | Single-page application (`index.html`) |
| **Styling** | Vanilla CSS | `css/main.css`, medieval dark theme |
| **Logic** | JavaScript (ES Modules) | No build tools, native `import/export` |
| **Authentication** | Firebase Auth v9 (Modular) | Email/Password, Custom Claims for admin |
| **Database** | Cloud Firestore v9 (Modular) | Real-time document store |
| **Hosting** | Firebase Hosting | Static file hosting with SPA rewrite |
| **Admin Scripts** | Node.js | `scripts/setAdmin.js` for Custom Claims |

### Firebase SDK Version

- Firebase JS SDK: `9.22.1` (loaded via CDN from `gstatic.com`)
- Firebase Admin SDK: `^13.8.0` (Node.js, for admin scripts)

---

## 3. Project Structure

```
web_rpg_game/
├── index.html                  # Main HTML — all overlays, panels, forms
├── firebase.json               # Firebase Hosting configuration
├── .firebaserc                 # Firebase project alias
├── package.json                # Node dependencies (firebase, firebase-admin)
├── serviceAccountKey.json      # Firebase Admin SDK service account (SECRET)
│
├── css/
│   └── main.css                # Complete stylesheet & design system
│
├── js/
│   ├── app.js                  # Engine bootstrap — wires all modules together
│   │
│   ├── core/                   # Core framework modules
│   │   ├── firebase.js         # Firebase initialization (app, auth, db exports)
│   │   ├── AuthManager.js      # Login/Register/Logout + Custom Claims detection
│   │   ├── State.js            # Central game state (player object, flags, EXP)
│   │   ├── database.js         # Firestore ORM — CRUD for all collections
│   │   └── CharacterCreator.js # 3-step character creation wizard
│   │
│   ├── data/
│   │   └── entities.js         # Static legacy entity definitions (unused in prod)
│   │
│   ├── modules/                # Game logic (no DOM interaction)
│   │   ├── combat/
│   │   │   └── CombatEngine.js # Turn-based combat state machine
│   │   ├── core/
│   │   │   └── Equipment.js    # Equipment slots + stat recalculation
│   │   ├── crafting/
│   │   │   └── CraftingEngine.js # Recipe validation + crafting logic
│   │   ├── inventory/
│   │   │   └── Inventory.js    # Item storage, stacking, weight management
│   │   ├── narrative/
│   │   │   └── DialogueEngine.js # Dialogue tree traversal + action execution
│   │   ├── quest/
│   │   │   └── QuestLog.js     # Quest lifecycle (start → objectives → complete)
│   │   └── world/
│   │       └── LocationEngine.js # World exploration, NPC spawning, encounters
│   │
│   └── ui/                     # DOM rendering layer
│       ├── ActionLog.js        # Color-coded footer log messages
│       ├── AuthUI.js           # Login/Register form event handling
│       ├── CharacterSelectUI.js # Character picker overlay
│       ├── CombatUI.js         # Fullscreen combat overlay + HP bars
│       ├── CraftingMenu.js     # Crafting overlay with progress bars
│       ├── CurrencyUI.js       # Currency bag overlay
│       ├── DevTools.js         # Admin content editor (all entity forms)
│       ├── DialogueUI.js       # Visual Novel dialogue bar
│       ├── EquipmentUI.js      # Paper-doll equipment display
│       ├── InventoryUI.js      # Grid inventory with context menus
│       ├── LevelUpUI.js        # Stat point allocation overlay
│       ├── QuestLogUI.js       # Quest journal + quick-view tracker
│       ├── UIManager.js        # Placeholder (reserved for future use)
│       └── VendorUI.js         # Buy/Sell shop interface
│
└── scripts/
    └── setAdmin.js             # Node CLI tool: grant/revoke admin claims
```

---

## 4. Architecture Overview

### Design Principles

1. **Separation of Concerns**: Logic modules (`modules/`) never touch the DOM. UI modules (`ui/`) handle rendering. Core modules (`core/`) manage state and persistence.
2. **ES Module System**: All files use native `import`/`export`. No bundler needed.
3. **Event-Driven Communication**: Modules communicate via `window.dispatchEvent()` with custom events (`statsUpdated`, `equipmentChanged`, `questUpdated`, `openNPCDialogue`, `openCurrencyBag`, `openVendorShop`).
4. **Cloud-First Persistence**: All game content is stored in Firestore. Character progress auto-saves with a 1.5-second debounce.

### Initialization Flow

```
DOMContentLoaded
  └── new Engine()
       ├── new State()                    ← Central player state
       ├── new CharacterCreator()         ← Creation wizard
       ├── new Inventory(100)             ← 100 weight capacity
       ├── new CraftingEngine()           ← Recipe processor
       ├── new CraftingMenu()             ← Crafting UI
       ├── new InventoryUI()              ← Inventory display
       ├── new DevTools()                 ← Admin panel
       ├── new QuestLog()                 ← Quest manager
       ├── new DialogueEngine()           ← Dialogue processor
       ├── new QuestLogUI()               ← Quest journal display
       ├── new DialogueUI()               ← VN dialogue bar
       ├── new Equipment()                ← Gear management
       ├── new EquipmentUI()              ← Paper-doll display
       ├── new CombatEngine()             ← Combat state machine
       ├── new CombatUI()                 ← Fullscreen combat
       ├── new LocationEngine()           ← World exploration
       ├── new CurrencyUI()               ← Currency bag
       ├── new VendorUI()                 ← Shop system
       ├── new LevelUpUI()                ← Stat allocation
       ├── bindGlobalEvents()             ← Event wiring
       └── init()
            ├── import database.js        ← Load Firestore ORM
            ├── new AuthUI(callback)      ← Show login screen
            └── [on auth success]:
                 ├── questLog.init()      ← Load all quests from Firestore
                 ├── dialogueEngine.init()← Load all dialogue nodes
                 ├── locationEngine.init()← Load locations + enemies
                 └── CharacterSelectUI   ← Pick or create character
                      └── startGameplay()← Enter the world
```

### Event System

| Event Name | Dispatched By | Listened By |
|---|---|---|
| `statsUpdated` | CombatEngine, Equipment, LevelUpUI | Engine (sidebar refresh) |
| `equipmentChanged` | Equipment | EquipmentUI, CombatEngine |
| `questUpdated` | QuestLog | QuestLogUI |
| `openNPCDialogue` | LocationEngine | Engine → DialogueUI |
| `openCurrencyBag` | InventoryUI (context menu) | CurrencyUI |
| `openVendorShop` | LocationEngine | VendorUI |

---

## 5. Build, Deploy & Run

### Prerequisites

- **Node.js** (v18+)
- **Firebase CLI**: `npm install -g firebase-tools`
- **Firebase Project**: `unknown-adventure-rpg`

### Local Development

No build step is required. Simply serve the files with any static server:

```bash
# Option 1: Firebase Emulator
firebase serve --only hosting

# Option 2: Any HTTP server
npx serve .

# Option 3: VS Code Live Server extension
```

> **Important**: The app uses ES Modules (`type="module"`) and must be served over HTTP, not opened as a local file.

### Deploy to Production

```bash
firebase deploy --only hosting
```

This deploys all files to `unknown-adventure-rpg.web.app`.

### Firebase Configuration

**`firebase.json`** configures:

- `public: "."` — Serves root directory
- SPA rewrite: All routes redirect to `index.html`
- Ignores: `firebase.json`, dotfiles, `node_modules`

---

## 6. Authentication System

### Files

- `js/core/firebase.js` — Firebase app initialization, exports `auth` and `db`
- `js/core/AuthManager.js` — Login, register, logout, admin detection
- `js/ui/AuthUI.js` — Form handling for login/register UI
- `scripts/setAdmin.js` — CLI tool for admin privileges

### Flow

1. **Page Load**: Auth overlay appears (blocks game view)
2. **Login/Register**: User submits email + password
3. **Success**:
   - Auth overlay hides
   - Custom Claims are checked for `admin: true`
   - If admin: Dev Tools button becomes visible + developer powers activate
   - Logout button appears
   - Character Select overlay opens
4. **Persistence Restoration**: On page reload (F5), the engine implicitly checks for an existing session and auto-logs in the user if "Stay Logged In" was previously selected.
5. **Logout**: Calls `signOut()` and reloads the page to clear local state.

### AuthManager Class

```javascript
class AuthManager {
    constructor(onAuthSuccess)  // Callback when auth succeeds
    
    async register(email, password)  // Creates new user
    async login(email, password, stayLoggedIn) // Signs in user with optional persistence
    async handleAuthSuccess(user)    // Hides overlay, checks claims, triggers character select
}
```

### Persistence (Session vs. Local)

The login form includes a **"Stay Logged In"** checkbox.

- **Checked (Local)**: Uses `browserLocalPersistence`. Session survives browser restart.
- **Unchecked (Session)**: Uses `browserSessionPersistence`. Session cleared on tab close.
Explicit restoration is handled via `onAuthStateChanged` in the `AuthManager` constructor.

### Admin Claims

Admin privileges are set server-side via Firebase Custom Claims:

```bash
# Grant admin
node scripts/setAdmin.js user@example.com

# Revoke admin
node scripts/setAdmin.js user@example.com --revoke
```

The user must log out and back in for changes to take effect.

### AuthUI Class

```javascript
class AuthUI {
    constructor(onReady)    // onReady = callback after auth
    
    bindEvents()            // Attaches form submit + toggle listeners
    clearError()            // Clears error message
    showError(msg)          // Displays error message
}
```

---

## 7. Core Systems — State & Database

### State (`js/core/State.js`)

The central data store for the game. Contains the player object, world flags, and quest storage.

### Database (`js/core/database.js`)

A Firestore ORM wrapping all CRUD operations. Exported as `mockDatabase`.

#### Generic Methods

| Method | Description |
|---|---|
| `_getColl(collName)` | Reads all documents from a Firestore collection |
| `_setDoc(collName, data)` | Creates or updates a document (auto-generates ID if missing) |
| `deleteEntity(collName, id)` | Deletes a document by collection name and document ID |

#### Collection-Specific Methods

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
| `config/world` | `getWorldConfig()` | `saveWorldConfig(data)` |

#### Auto-Save System

The Engine runs a debounced cloud save (`triggerCloudSave()`) 1.5 seconds after any state change. It saves the full player object + inventory to Firestore under `users/{uid}/characters/{charId}`.

---

## 8. Player and Attributes

#### Player Object Structure

```javascript
{
    id: null,                       // Firestore document ID
    name: "Unknown",                // Character name
    origin: "Peasant",              // Origin class
    level: 1,
    exp: 0,
    expNext: 100,                   // EXP needed for next level
    hp: 20,
    maxHp: 20,                      // 20 + (STR × 2) + equipment bonuses
    mp: 10,
    maxMp: 10,                      // 10 + (INT × 5) + equipment bonuses
    statPoints: 0,                  // Unspent stat points (3 per level)
    skills: ['heavy_slash'],        // Array of skill IDs the player knows
    attributes: {                   // TOTAL stats (base + equipment)
        str: 0, agi: 0, int: 0
    },
    baseAttributes: {               // NATURAL stats (no equipment)
        str: 0, agi: 0, int: 0
    },
    wallet: {                       // Currency
        copper: 0, silver: 0, gold: 0
    },
    currentLocation: null,          // Current location ID (resolved from world config)
    equipment: {                    // Equipped gear
        head: null, chest: null,
        main_hand: null, off_hand: null,
        legs: null, feet: null, accessory: null
    },
    activeQuests: {},               // { questId: questTrackingData }
    completedQuests: [],            // Array of completed quest IDs
    professions: {                  // Crafting professions
        smithing: 1, alchemy: 1
    },
    inventory: []                   // Saved with character for persistence
}
```

#### State Methods

| Method | Signature | Description |
|---|---|---|
| `updatePlayer` | `(data: Object)` | Merges partial data into player. Recalculates HP/MP if `baseAttributes` changes. |
| `addCurrency` | `(id: string, amount: number)` | Adds currency with auto-rollover (100 copper → 1 silver → 1 gold). Caps gold at 999. |
| `payCopper` | `(amount: number) → boolean` | Deducts copper with auto-conversion from silver/gold. Returns false if too poor. |
| `gainExp` | `(amount: number) → boolean` | Adds EXP, handles leveling. Grants 3 stat points and full heal per level. EXP scaling: `expNext × 1.5`. |
| `setFlag` | `(key: string, value: any)` | Sets a world flag (for narrative branching). |
| `regenTick` | `() → boolean` | Restores 1 HP and 1 MP automatically over time (passive regen system). |
| `getFlag` | `(key: string) → any` | Gets a world flag value. |

#### EXP Scaling Formula

```
Level 1 → 2:  100 EXP
Level 2 → 3:  150 EXP
Level 3 → 4:  225 EXP
Level 4 → 5:  337 EXP
...
Formula: expNext = floor(expNext × 1.5)
```

#### Passive Regeneration

The engine includes a passive resource restoration system to sustain gameplay during exploration and downtime.

- **Tick Rate**: Every 5 seconds.
- **Restoration Amount**: +1 Health Point (HP) and +1 Mana Point (MP) per tick.
- **Conditions**:
  - Regeneration only occurs if the player is alive (HP > 0).
  - Resources will not exceed the player's `maxHp` or `maxMp`.
- **Implementation**: Managed by the `regenTick()` method in `State.js` and driven by a global `setInterval` in `app.js`.

### Performance & Expansion

The Player object is the heart of the engine. Developers can expand it by adding new attributes (e.g., luck: 10) in State.js and updating the updatePlayer() logic to handle secondary stat calculations.

Key keyword: **Regeneration**. The passive system ensures that downtime is minimal, restoring 1 HP/MP every 5 seconds as long as the player is not dead.

---

## 9. Character Creation

### File: `js/core/CharacterCreator.js`

A 3-step wizard for creating new characters.

### Steps

#### Step 0: Origin Selection

The player chooses from three origins, each granting +2 to one attribute:

| Origin | Display Name | STR | AGI | INT |
|---|---|---|---|---|
| `knight` | Fallen Knight | +2 | 0 | 0 |
| `thief` | Gutter Thief | 0 | +2 | 0 |
| `scholar` | Exiled Scholar | 0 | 0 | +2 |

All origins start with base attributes of **5 STR, 5 AGI, 5 INT** before bonuses.

#### Step 1: Attribute Point Distribution

The player has **5 additional points** to distribute among STR, AGI, and INT. Points cannot reduce below 5. The "Confirm Attributes" button is disabled until all points are spent.

#### Step 2: Naming

The player enters a character name. Clicking "Awaken" finalizes the character.

#### Step 3: Save & Start

The character data is saved to Firestore and gameplay begins.

### CharacterCreator Methods

| Method | Description |
|---|---|
| `start(user, onComplete)` | Begins the creation wizard |
| `renderStep()` | Routes to the current step's render method |
| `renderOriginSelect()` | Renders origin buttons with tooltip descriptions |
| `renderAttributeSelect()` | Renders +/- buttons for stat allocation |
| `renderFinalize()` | Renders name input field |
| `finish()` | Saves to Firestore, triggers gameplay start |
| `updateStateAndReRender()` | Updates State and re-renders current step |

---

## 10. World & Location System

### File: `js/modules/world/LocationEngine.js`

Manages the game world as a network of interconnected locations. Each location can contain NPCs, travel connections, and random combat encounters.

### Location Data Schema

```javascript
{
    id: "cellar",                        // Unique location ID
    name: "The Cellar",                  // Display name
    description: "A dark, musty cellar...", // Atmospheric text
    connections: ["town_square", "sewer"],   // IDs of connected locations
    npcs: ["blacksmith", "mayor"],          // NPCs present here
    encounters: [                            // Random encounter table
        { enemyId: "rat", chance: 80 },      // 80% chance to find a rat
        { enemyId: "spider", chance: 20 }    // 20% chance for a spider
    ]
}
```

### How Locations Work

1. **Rendering**: `renderLocation()` displays the current location's description, NPC interaction buttons, and travel buttons.
2. **NPC Spawning**: For each NPC ID in the location, the engine fetches NPC data from Firestore:
   - If NPC has `defaultDialogueId` → "Speak to [Name]" button appears
   - If NPC has `isVendor: true` → "Trade with [Name]" button appears
3. **Travel**: Clicking "Move to [Location]" updates `currentLocation` and re-renders.
4. **Search**: Clicking "Search Area" rolls against the encounter table.

### Movement Data Sync

Entering a new location triggers an automatic state synchronization:

1. `this.state.player.currentLocation` is updated.
2. A `statsUpdated` event is dispatched globally.
3. The Engine intercepts the event and calls `triggerCloudSave()`.
4. The user's location is scrubbed of `undefined` fields and persisted to Firestore.

### Encompassed Functions

```
Roll a random number 0–100.
Iterate through encounters, accumulating their chance values.
If roll <= cumulative chance: trigger that encounter.
If no encounter triggers: "You find nothing of interest."
```

### LocationEngine Methods

| Method | Signature | Description |
|---|---|---|
| `init()` | `async` | Preloads all locations, enemies, and world config from Firestore. Sets start location. Hooks combat end callback. |
| `renderLocation()` | — | Renders the current location with NPCs, travel, and search buttons. |
| `searchArea(locInfo)` | `(locInfo: Object)` | Rolls on the encounter table. |
| `triggerEncounter(enemyId)` | `(enemyId: string)` | Starts combat with the matched enemy. |

### LocationEngine Properties

| Property | Type | Description |
|---|---|---|
| `locations` | `Array` | All loaded location objects from Firestore. |
| `enemies` | `Array` | All loaded enemy objects from Firestore. |
| `startLocationId` | `string` | Configured spawn point, resolved from `config/world` Firestore document or `"cellar"` fallback. |

### Start Location System

The engine determines the player's starting location through a configurable system:

1. **Saved character data** — If the player has a `currentLocation` saved, they resume there.
2. **World config** — The `config/world` Firestore document contains `startLocationId`, set via the World Builder or `admin.setStartLocation()`.
3. **Ultimate fallback** — If no config exists, defaults to `"cellar"` for backwards compatibility.

#### Config Document: `config/world`

```javascript
{
    startLocationId: "town_square"   // Location ID where new characters spawn
}
```

### Creating a New Location

Use the Dev Tools → "Create Location" form:

1. **Location ID**: Unique identifier (e.g., `dark_forest`)
2. **Name**: Display name (e.g., `The Dark Forest`)
3. **Description**: Atmospheric text shown to the player
4. **Connections**: Comma-separated location IDs this location connects to
5. **NPCs**: Comma-separated NPC IDs present here
6. **Encounters**: JSON array of encounter objects

> ⚠️ **Important**: Connections must be bidirectional! If Location A connects to B, Location B must also list A in its connections. Use the World Builder's "Auto-Fix Connections" to detect and repair one-way links.

---

## 11. Combat System

### Files

- `js/modules/combat/CombatEngine.js` — Turn-based combat logic
- `js/ui/CombatUI.js` — Fullscreen overlay rendering

### Combat Flow

```
1. LocationEngine.searchArea() rolls an encounter
2. CombatEngine.startCombat(enemyObj) starts combat
3. Player chooses: Strike (base), Use Skill, or Flee
4. Player attacks → Enemy attacks back (after 800ms delay)
5. Combat ends on victory or defeat
6. Control returns to LocationEngine.renderLocation()
```

### Input & Death Locks

To ensure combat integrity, the engine implements a **hard input lock** when either the player or the enemy reaches 0 HP:

- All action buttons (Strike, Skills, Flee) are disabled.
- The state is locked into a "Resolving" phase until the victory/defeat logic concludes.
- This prevents the player from hitting a "dead" enemy or consuming resources post-defeat.

### Damage Formulas

#### Basic Attack (Strike)

```
damage = max(1, player.STR + random(0..2))
critChance = player.AGI × 2 (percentage)
if critical: damage = floor(damage × 1.5)
```

#### Skill Attack

```
scaleStatValue = player[skill.scaleStat]  // str, int, or agi
damage = floor(scaleStatValue × skill.dmgMult + random(0..3))
damage = max(1, damage)
Costs: skill.mpCost MP
```

#### Skill Heal

```
healAmount = skill.healBase
if skill.scaleStat == 'int': healAmount += player.INT × skill.dmgMult
healAmount = max(1, floor(healAmount))
Player HP clamped to maxHp
```

#### Enemy Attack

```
damage = max(1, enemy.STR + random(0..1))
dodgeChance = player.AGI × 1.5 (percentage)
If dodged: no damage
```

#### Flee

```
escapeChance = 30 + (player.AGI × 5) percentage
If success: combat ends
If fail: enemy gets a turn
```

### Victory Rewards

- EXP from `enemy.exp`
- Loot drops: Each drop has a `chance` (percentage). Roll per drop.
- Quest progress: `kill_{enemyId}` objectives are advanced

### Defeat Penalty

- 10% EXP loss: `exp = floor(exp × 0.9)`
- HP set to 1 (survival)

### CombatEngine Methods

| Method | Description |
|---|---|
| `startCombat(enemyObj)` | Clones enemy, opens combat UI |
| `attack()` | Player basic attack |
| `useSkill(skill)` | Use a learned skill (checks MP) |
| `flee()` | Attempt to escape |
| `enemyTurn()` | Enemy attacks the player |
| `victory()` | Grants EXP, rolls loot, advances quest objectives |
| `defeat()` | Applies death penalty |
| `endCombat()` | Closes UI, returns to location |

### CombatUI Methods

| Method | Description |
|---|---|
| `open(enemy)` | Shows fullscreen combat overlay |
| `buildActionButtons()` | Renders Strike, skill buttons, and Flee |
| `close()` | Fades out combat overlay |
| `updatePhase()` | Updates HP bar widths and name labels |
| `appendLog(msg)` | Adds message to combat log |
| `showFloatingText(target, text, cssClass)` | Animated floating damage/heal number |

---

## 12. Quest System

### Files

- `js/modules/quest/QuestLog.js` — Quest lifecycle management
- `js/ui/QuestLogUI.js` — Quest journal overlay + quick-view tracker

### Quest Data Schema

```javascript
{
    id: "rat_problem",
    title: "The Rat Problem",
    description: "Clear the cellar of rats.",
    requirements: {
        level: 1,           // Minimum player level
        questId: null        // Prerequisite quest ID (optional)
    },
    objectives: [
        {
            id: "kill_rat",           // Objective ID (format: type_target)
            desc: "Kill 5 rats",      // Display text
            required: 5               // Amount needed
        }
    ],
    rewards: {
        exp: 100,                     // EXP reward
        gold: 5,                      // Gold reward (optional)
        items: [                      // Item rewards (optional)
            { id: "rat_tail", qty: 1 }
        ]
    }
}
```

### Quest Lifecycle

```
Database Template → startQuest(id) → Active Quest (with tracking)
                                        ↓
                                   updateObjective(questId, objId, amount)
                                        ↓
                                   All objectives complete?
                                        ↓
                                   completeQuest(questId)
                                        ↓
                                   Rewards granted, quest archived
```

### QuestLog Methods

| Method | Signature | Description |
|---|---|---|
| `init()` | `async` | Loads all quest templates from Firestore into cache |
| `startQuest(questId)` | `(string)` | Activates a quest (copies template with tracking data) |
| `updateObjective(questId, objId, amount)` | `(string, string, number)` | Increments an objective counter. Auto-completes if threshold reached. |
| `cancelQuest(questId)` | `(string)` | Removes quest from active without rewards |
| `completeQuest(questId)` | `(string)` | Grants rewards (EXP, items), archives to `completedQuests` |

### Quest Tracking

Players can toggle a "Track" checkbox on any active quest. Tracked quests appear in the **Quest Quick View** at the bottom of the screen, showing real-time objective progress.

### Creating a New Quest

1. Open Dev Tools → "Create Quest"
2. Fill in:
   - **Quest ID**: Unique (e.g., `fetch_sword`)
   - **Title**: Display name
   - **Description**: Quest story text
   - **Required Level**: Minimum level
   - **Required Quest**: Prerequisite quest ID (leave empty for none)
   - **Objective Type**: `kill`, `fetch`, or `talk`
   - **Target ID**: The enemy/item/NPC ID
   - **Amount**: How many
   - **EXP Reward**: Experience points
   - **Gold Reward**: Gold (in copper equivalent for display)
   - **Item Reward ID**: Optional item to give
3. Click "Save Formatted Quest"

> **Connecting Quests to NPCs**: Use **The Linker** tool (see Dev Tools section) to bind a quest to an NPC's dialogue tree.

---

## 13. Dialogue System

### Files

- `js/modules/narrative/DialogueEngine.js` — Dialogue tree evaluation + action execution
- `js/ui/DialogueUI.js` — Visual Novel-style dialogue bar

### Dialogue Node Schema

```javascript
{
    id: "mayor_intro",
    npc: "Mayor Thomas",
    text: "Welcome to our village, traveler. We have a rat problem in the cellar...",
    responses: [
        {
            text: "I'll help.",                  // Button label
            nextNodeId: "mayor_thanks",          // Next dialogue node (null = close)
            conditions: null,                    // Access conditions (optional)
            actions: [                           // Side effects (optional)
                { type: "START_QUEST", target: "rat_problem" }
            ]
        },
        {
            text: "Not my problem.",
            nextNodeId: null,                    // Ends dialogue
            conditions: null,
            actions: null
        },
        {
            text: "[Requires Level 5] Intimidate",
            nextNodeId: "mayor_scared",
            conditions: { minLevel: 5 },         // Locked if level < 5
            actions: [
                { type: "GIVE_EXP", amount: 50 }
            ]
        }
    ]
}
```

### Condition Types

| Condition | Schema | Description |
|---|---|---|
| Level Check | `{ minLevel: number }` | Requires minimum player level |
| Item Check | `{ requiredItem: { id: string, qty: number } }` | Requires item in inventory |

Locked options are displayed grayed out with a tooltip showing the reason.

### Action Types

| Action Type | Parameters | Description |
|---|---|---|
| `START_QUEST` | `{ target: questId }` | Starts a quest |
| `CANCEL_QUEST` | `{ target: questId }` | Cancels an active quest |
| `ADVANCE_OBJECTIVE` | `{ target: "questId:objId", amount: number }` | Increments a quest objective |
| `GIVE_ITEM` | `{ item: itemObj, qty: number }` | Gives item to player |
| `GIVE_EXP` | `{ amount: number }` | Grants EXP |
| `SET_FLAG` | `{ target: flagKey, value: any }` | Sets a world flag |

### DialogueEngine Methods

| Method | Description |
|---|---|
| `init()` | Loads all dialogue nodes from Firestore |
| `getNode(nodeId)` | Returns a cached dialogue node |
| `evaluateCondition(response)` | Returns `{ valid, reason }` for a response option |
| `executeActions(response)` | Runs all actions attached to a response |

### Creating Dialogue Trees

1. **Create Dialogue Nodes**: Each node is a single "screen" of dialogue.
2. **Chain Nodes**: Use `nextNodeId` in responses to link nodes together.
3. **Add Actions**: Attach quest starts, item rewards, etc. to response buttons.
4. **Link to NPC**: Use The Linker to bind the root node to an NPC.

#### Example Dialogue Tree

```
mayor_intro (root)
├── [Response: "I'll help"] → START_QUEST:rat_problem → mayor_thanks
│                                                         └── [Response: "Farewell"] → null (close)
├── [Response: "Not interested"] → null (close)
└── [Response: "[Lvl 5] Intimidate"] → mayor_scared
                                         └── [Response: "Leave"] → null (close)
```

### Creating a New Dialogue Node

1. Open Dev Tools → "Create Dialogue Node"
2. Fill in:
   - **Node ID**: Unique identifier (e.g., `blacksmith_greeting`)
   - **NPC Name**: Display name above the dialogue
   - **Speech Text**: The NPC's dialogue text
   - **Responses JSON**: Array of response objects (see schema above)
3. Click "Save Node"

---

## 14. Inventory System

### File: `js/modules/inventory/Inventory.js`

A weight-based inventory with item stacking.

### Item Object Structure

```javascript
{
    id: "iron_sword",       // Unique identifier
    name: "Iron Sword",     // Display name
    weight: 5,              // Weight per unit
    rarity: "uncommon",     // common | uncommon | rare | epic | legendary
    quantity: 1,            // Current stack count
    type: "main_hand",      // Equipment slot (null for non-equippables)
    value: 50,              // Base value in copper
    stats: {                // Stat bonuses (equippables only)
        str: 3,
        maxHp: 10
    },
    reqLevel: 5             // Level requirement (optional)
}
```

### Inventory Methods

| Method | Signature | Returns | Description |
|---|---|---|---|
| `getTotalWeight()` | — | `number` | Sum of (weight × quantity) for all items |
| `addItem(itemObj, qty)` | `(Object, number)` | `boolean` | Adds item, stacks if exists. Returns false if overweight. |
| `hasItem(itemId, qty)` | `(string, number)` | `boolean` | Checks if enough of an item exists |
| `removeItem(itemId, qty)` | `(string, number)` | `boolean` | Removes quantity. Deletes entry if quantity reaches 0. |

### Weight System

- Default max weight: **100 units**
- Items exceeding the limit cannot be added
- Weight is displayed in the inventory footer

### InventoryUI Features

- **Grid layout** with rarity-colored borders
- **Context menu** on click:
  - **Currency Bag**: Opens Currency overlay
  - **Equippable items**: "Equip" button
  - **Consumables**: "Use / Consume" button
  - **All items**: "Discard" button (removes 1)

### Rarity Visual System

| Rarity | Border Color | Effect |
|---|---|---|
| Common | `#b0bec5` (gray) | Solid left border |
| Uncommon | `#4CAF50` (green) | Green border + subtle glow |
| Rare | `#66b3ff` (blue) | Blue border + glow |
| Epic | `#9c27b0` (purple) | Purple border + glow + text shadow |
| Legendary | `#ffd700` (gold) | Gold border + pulsing glow animation |

---

## 15. Equipment System

### File: `js/modules/core/Equipment.js`

Manages 7 equipment slots with stat bonuses.

### Equipment Slots

| Slot Key | Display Name |
|---|---|
| `head` | Head |
| `chest` | Chest |
| `main_hand` | Main Hand |
| `off_hand` | Off Hand |
| `legs` | Legs |
| `feet` | Feet |
| `accessory` | Accessory |

### Stat Calculation

```
Total Stats = Base Attributes + Sum of Equipment Bonuses

maxHp = 20 + (baseSTR × 2) + Σ(equipment.stats.maxHp)
maxMp = 10 + (baseINT × 5) + Σ(equipment.stats.maxMp)
```

Equipment bonuses can include: `str`, `agi`, `int`, `maxHp`, `maxMp`.

### Equipment Methods

| Method | Description |
|---|---|
| `equip(itemId)` | Equips item from inventory. Checks level requirement. Unequips current slot first. |
| `unequip(slot)` | Returns item to inventory (fails if inventory is full). |
| `recalculateStats()` | Recomputes total attributes and HP/MP from base + gear. |
| `getSlotForItem(item)` | Returns the slot key matching `item.type`, or null. |

### Equipping Flow

```
1. Player clicks item in inventory → Context menu → "Equip"
2. Equipment.equip(itemId):
   a. Find item in inventory
   b. Determine slot from item.type
   c. Check level requirement
   d. Unequip current item in that slot (if any) → back to inventory
   e. Remove item from inventory
   f. Place in equipment slot
   g. Recalculate all stats
```

---

## 16. Crafting System

### Files

- `js/modules/crafting/CraftingEngine.js` — Crafting logic
- `js/ui/CraftingMenu.js` — Crafting overlay UI

### Recipe Schema

```javascript
{
    id: "iron_sword",
    name: "Iron Sword",
    profession: "smithing",              // Required profession
    levelReq: 1,                         // Minimum profession level
    materials: [
        { id: "iron_ingot", qty: 2 },
        { id: "leather_strip", qty: 1 }
    ],
    resultItem: {
        id: "iron_sword",
        name: "Iron Sword",
        weight: 5,
        rarity: "uncommon"
    }
}
```

### Crafting Flow

```
1. Player opens Crafting Menu
2. All recipes loaded from Firestore
3. Each recipe shows:
   - ✔/✘ for level requirement
   - ✔/✘ for each material (current/required)
4. "Craft Item" button enabled only if all requirements met
5. Clicking craft:
   a. Disables button
   b. Shows animated progress bar (1 second)
   c. Consumes materials
   d. Adds result item to inventory
   e. Logged to Action Log
```

### CraftingEngine Methods

| Method | Description |
|---|---|
| `canCraft(recipe)` | Returns `{ valid, reason }` — checks profession level and materials |
| `craft(recipe)` | Consumes materials, adds result item. Returns `true` if successful. |

### Creating a Recipe

1. Dev Tools → "Create Crafting Recipe"
2. Fill in:
   - **Recipe ID**: Unique (e.g., `health_potion`)
   - **Recipe Name**: Display name
   - **Profession**: `smithing`, `alchemy`, etc.
   - **Level Required**: Profession level needed
   - **Materials JSON**: `[{"id": "herb", "qty": 3}]`
   - **Result Item JSON**: `{"id": "health_potion", "name": "Health Potion", "weight": 1, "rarity": "common"}`
3. Click "Save Recipe to DB"

---

## 17. Economy & Currency System

### Files

- `js/core/State.js` — Currency logic in `addCurrency()` and `payCopper()`
- `js/ui/CurrencyUI.js` — Currency bag overlay

### Core Currencies

| Currency | Icon | Auto-Rollover |
|---|---|---|
| Copper | 🪙 | 100 Copper → 1 Silver |
| Silver | 🪙 | 100 Silver → 1 Gold |
| Gold | 🪙 | Capped at 999 |

### Custom Currencies

You can create event/seasonal currencies (e.g., Halloween Tokens). These are stored in the player's `wallet` object and displayed in the currency bag.

### Currency Bag

The Currency Bag is a special inventory item (`currency_bag`, weight 0, epic rarity) auto-granted on game start. Right-clicking it opens the Currency overlay showing all currencies.

### Creating a New Currency

1. Dev Tools → "Create Currency"
2. Fill in:
   - **Currency ID**: Unique (e.g., `halloween_token`)
   - **Display Name**: e.g., `Spooky Token`
   - **Icon Text**: Emoji (e.g., `🎃`)
   - **Color**: Hex color for display
3. Click "Save Currency to DB"

---

## 18. Vendor / Shop System

### File: `js/ui/VendorUI.js`

NPCs marked as vendors can open a shop interface.

### Vendor NPC Setup

An NPC becomes a vendor when:

```javascript
{
    id: "shopkeeper",
    name: "Greta the Merchant",
    isVendor: true,
    vendorItems: ["health_potion", "iron_sword", "leather_armor"]
}
```

`vendorItems` is an array of item IDs from the `items` Firestore collection.

### Buy/Sell Mechanics

| Action | Price Calculation |
|---|---|
| **Buy** | `item.value` copper (or 10 if no value) |
| **Sell** | `floor(item.value / 2)` copper (minimum 1) |

### VendorUI Features

- **Buy Tab**: Shows vendor's stock with prices
- **Sell Tab**: Shows player's sellable items (excludes Currency Bag)
- **Wallet Display**: Shows current copper/silver/gold
- **Flash Effects**: Green flash on buy, gold flash on sell

---

## 19. Skill System

### Skill Data Schema

```javascript
{
    id: "fire_ball",
    name: "Fireball",
    mpCost: 8,
    scaleStat: "int",     // none | str | agi | int
    dmgMult: 2,           // Damage multiplier applied to scaling stat
    healBase: 0           // If > 0, this is a healing skill instead
}
```

### How Skills Work

1. Skills are stored in Firestore's `skills` collection
2. The player's `skills` array (in State) holds learned skill IDs
3. During combat, `CombatUI.buildActionButtons()` fetches all skills from DB and creates buttons for each skill the player knows
4. Clicking a skill button calls `CombatEngine.useSkill(skill)`

### Skill Display in Combat

```
[Skill Name] (MP Cost) [Scaling Stat]
Example: "Fireball (8 MP) [Int Scaling]"
```

Healing skills are colored green; attack skills use the "heavy" combat button style.

### Creating a New Skill

1. Dev Tools → "Create Skill"
2. Fill in:
   - **Skill ID**: Unique (e.g., `heal_light`)
   - **Display Name**: e.g., `Light Heal`
   - **MP Cost**: Mana cost
   - **Scaling Stat**: `none`, `str`, `agi`, or `int`
   - **Damage Multiplier**: Multiplied by the scaling stat value
   - **Heal Base**: If > 0, this becomes a healing skill
3. Click "Save Skill to DB"

### Teaching a Skill to a Player

Currently, skills are assigned via the `player.skills` array. To add a skill:

- Use admin console: modify the player data directly
- Or extend the code to add skill rewards to quests/dialogue actions

---

## 20. Leveling & Progression

### Files

- `js/core/State.js` — EXP + leveling logic
- `js/ui/LevelUpUI.js` — Stat point allocation overlay

### Leveling Mechanics

| Event | Value |
|---|---|
| **Stat Points per Level** | 3 |
| **EXP Scaling** | `expNext = floor(expNext × 1.5)` |
| **On Level Up** | Full HP/MP heal |
| **Death Penalty** | 10% EXP loss |

### Stat Point Allocation

When `statPoints > 0`, an "UPGRADE STATS" button appears in the sidebar. Clicking it opens the Level Up overlay:

1. Points can be distributed among STR, AGI, INT
2. - and - buttons to add/remove pending points
3. "Finalize Upgrades" commits the changes
4. `Equipment.recalculateStats()` is called to update total stats

---

## 21. Dev Tools (Admin Panel)

### File: `js/ui/DevTools.js`

The Dev Tools panel is a comprehensive content creation suite visible only to admin users.

### Access

1. User must have `admin: true` Custom Claim (set via `setAdmin.js`)
2. After login, "Enter Dev Area" button appears in sidebar
3. Clicking opens the Dev Tools overlay

### Content Editors

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

### Database Managers

Each entity type has a "Manage" button that lists all records with:

- **Edit**: Pre-fills the creation form with existing data for editing
- **Delete**: Removes the record from Firestore (with confirmation)

### The Linker

A special tool for establishing relationships between entities:

1. **Select NPC**: Choose an NPC from the database
2. **Select Dialogue Tree**: Choose a dialogue root node
3. **Select Quest (Optional)**: Choose a quest to auto-inject

The Linker:

- Sets the NPC's `defaultDialogueId` to the selected dialogue
- If a quest is selected, adds an `[Accept Quest]` response to the dialogue (if not already present)

### World Builder (`js/ui/WorldBuilderUI.js`)

A dedicated visual tool for managing the game world's location network. Accessed via the "🗺️ World Builder" button in the Dev Tools action list.

#### Tab 1 — Interactive Map

- Force-directed canvas graph rendering all locations as **draggable nodes**.
- **Connection lines** between linked locations:
  - Solid gold lines = bidirectional (healthy).
  - Dashed red lines = one-way (broken — needs reciprocal link).
- **Color-coded nodes**: green = start location, amber = NPCs, red = encounters, orange = both, gray = empty.
- **Click** a node → detail pane shows info + quick actions (Teleport, Edit, Set as Start, Delete).
- **Double-click** a node → teleports the player to that location.
- **Drag** nodes to rearrange the map layout.
- **Warning badge** (⚠) on orphan nodes (no connections).

#### Tab 2 — Location Table

Sortable data grid of all locations. Click column headers to sort. Columns: ID, Name, Connections, NPCs, Encounters, Start, Actions.

#### Tab 3 — World Settings

- **Start Location**: Dropdown to select and save the player spawn location. Persisted to `config/world`.
- **Auto-Fix Connections**: Scans all locations for one-way connections. It intelligently identifies missing reciprocal links and creates them. If a target location ID is invalid, it provides a specific warning in the status log.
- **Validation Report**: Full integrity scan (orphans, one-way links, missing NPC/enemy references, encounter chance totals).

### Premium Aesthetics

The Dev Tools UI features a modern, premium design system:

- **Glassmorphism Panels**: Semi-transparent backgrounds with backdrop blur.
- **Golden Accents**: Tarnished gold borders and highlights consistent with the RPG theme.
- **Dynamic Feedback**: Success/Error messages use animated status bars and color-coded logging.

### Creating Complete Content Chains

**Full workflow to add a new questline:**

1. **Create Enemy** (e.g., `goblin`)
2. **Create Item** (e.g., `goblin_fang` for quest rewards/drops)
3. **Create Quest** (e.g., `goblin_hunt` — kill 5 goblins, reward 200 EXP)
4. **Create NPC** (e.g., `guard_captain`)
5. **Create Dialogue Nodes**:
   - `captain_intro`: "We need help with goblins..."
   - `captain_thanks`: "You did it! Thank you."
6. **Use The Linker**: Bind `guard_captain` → `captain_intro` → `goblin_hunt`
7. **Create/Edit Location**: Add `guard_captain` to a location's NPC list. Add `goblin` to encounter table.
8. **Use World Builder**: Verify connectivity on the map, run validation, set start location if needed.

---

## 22. UI Layer Reference

### ActionLog (`js/ui/ActionLog.js`)

Color-coded message logger in the footer.

| Log Type | Color | Style |
|---|---|---|
| `info` | `--text-dim` (gray) | Default |
| `critical` | `--crimson-red` | — |
| `loot` | `#ffd700` (gold) | — |
| `exp` | `#4CAF50` (green) | — |
| `levelup` | `#66b3ff` (blue) | Bold |
| `system` | `#d4af37` (gold) | Italic |

Usage: `GlobalLog.log("Message", "type")`

### CharacterSelectUI (`js/ui/CharacterSelectUI.js`)

Displays after login. Shows all characters for the current user with:

- **Play**: Loads character and starts gameplay
- **Delete**: Removes character from Firestore (with confirmation)
- **Create New Character**: Opens the CharacterCreator

### DialogueUI (`js/ui/DialogueUI.js`)

Bottom-anchored Visual Novel dialogue bar with:

- NPC name header (gold)
- Speech text
- Response buttons (grayed out if conditions not met, with tooltip)

### QuestLogUI (`js/ui/QuestLogUI.js`)

Quest journal overlay with:

- Active quests: Title, description, objectives with checkmarks
- Completed quests: Grayed out with checkmark
- Track checkbox: Toggles quest in Quick View

### UIManager (`js/ui/UIManager.js`)

Placeholder class reserved for a future centralized UI orchestration layer. Currently empty.

---

## 23. CSS Design System

### File: `css/main.css`

### Design Tokens (CSS Variables)

```css
--bg-dark:       #110e0c      /* Deep dark brown/black background */
--bg-panel:      #1d1715      /* Panel backgrounds */
--bg-panel-hover:#2a221f      /* Hover state for panels */
--border-gold:   #8c734b      /* Tarnished gold borders */
--border-dim:    #4a3d2c      /* Dim gold/brown borders */
--text-main:     #d9cbb2      /* Parchment off-white text */
--text-dim:      #8b7d6a      /* Dim text (secondary) */
--text-highlight:#ffebb5      /* Bright gold (emphasis) */
--crimson-red:   #7c1a1a      /* Dark red (damage, danger) */
--font-content:  'Book Antiqua', serif   /* Medieval serif font */
--font-terminal: 'Courier New', mono     /* Monospaced for logs */
```

### Layout Grid

The main layout uses CSS Grid:

```
┌──────────────────────────────┬──────────┐
│                              │          │
│     Main View (Story/        │ Sidebar  │
│     Combat/Creator)          │ (Stats)  │
│                              │          │
├──────────────────────────────┴──────────┤
│           Bottom Bar (Log + Quests)     │
└─────────────────────────────────────────┘
```

Grid definition:

- Columns: `1fr 300px`
- Rows: `1fr 200px`
- Areas: `main sidebar / bottom bottom`

### Overlay System

Overlays use CSS transitions for smooth open/close:

- Default: `visibility: hidden; opacity: 0; transform: translate(-50%, -45%)`
- Active: `visibility: visible; opacity: 1; transform: translate(-50%, -50%)`
- Side-by-side mode: `.overlay-left` (25% left) + `.overlay-right` (75% left)

### Combat UI

Fullscreen overlay with radial gradient background:

- `radial-gradient(circle, #2a1610 0%, #0a0503 100%)`
- HP bars with animated width transitions
- Floating damage/heal text with CSS keyframe animation (`floatUp`)

### Key CSS Classes

| Class | Purpose |
|---|---|
| `.panel` | Dark panel with border, shadow, padding |
| `.panel-header` | Uppercase, gold, centered section header |
| `.btn` | Standard button style |
| `.choice-container` | Flex column layout for buttons |
| `.has-tooltip` / `.tooltip-popup` | Hover tooltip system |
| `.overlay` | Modal overlay with transition |
| `.hidden` | `display: none !important` |
| `.auth-overlay` | Full-screen auth panel |
| `.combat-fullscreen` | Fixed fullscreen combat |
| `.vn-dialogue-overlay` | Bottom-anchored dialogue bar |
| `.rarity-*` | Rarity-colored borders (common, uncommon, rare, epic, legendary) |
| `.item-context-menu` | Right-click context menu |

---

## 24. Admin Console Commands

When logged in as admin, the browser console exposes `window.admin`:

### `admin.giveItem(id, name, qty, weight, rarity, type, stats)`

Grants an item directly to the player's inventory.

```javascript
// Give a legendary weapon
admin.giveItem('excalibur', 'Excalibur', 1, 3, 'legendary', 'main_hand', { str: 15, maxHp: 50 });

// Give 10 healing potions
admin.giveItem('healing_potion', 'Healing Potion', 10, 1, 'common');
```

### `admin.giveExp(amount)`

Grants EXP to the player. May trigger level-ups.

```javascript
admin.giveExp(500);   // Grant 500 EXP
admin.giveExp(10000); // Power-level
```

### `admin.addRecipe(recipeObj)`

Saves a recipe directly to the database.

```javascript
admin.addRecipe({
    id: 'super_potion',
    name: 'Super Potion',
    profession: 'alchemy',
    levelReq: 3,
    materials: [{ id: 'herb', qty: 5 }],
    resultItem: { id: 'super_potion', name: 'Super Potion', weight: 1, rarity: 'rare' }
});
```

### `admin.addDialogue(dialObj)`

Saves a dialogue node directly to the database.

```javascript
admin.addDialogue({
    id: 'test_node',
    npc: 'Test NPC',
    text: 'Hello, this is a test.',
    responses: [{ text: 'Bye', nextNodeId: null, conditions: null, actions: null }]
});
```

### `admin.teleport(locationId)`

Teleports the player to any location.

```javascript
admin.teleport('town_square');
```

### `admin.setStartLocation(locationId)`

Sets the world-wide spawn point for new characters. Persists to Firestore `config/world`.

```javascript
admin.setStartLocation('town_square');
```

### `admin.reloadLocations()`

Hot-reloads all locations from Firestore into the LocationEngine without restarting.

```javascript
admin.reloadLocations();
```

---

## 25. Data Schemas (Firestore Collections)

### Collection: `users/{uid}/characters`

```javascript
{
    id: "abc123",
    name: "Aldric",
    origin: "Fallen Knight",
    level: 5,
    exp: 120,
    expNext: 759,
    hp: 34,
    maxHp: 34,
    mp: 35,
    maxMp: 35,
    statPoints: 0,
    skills: ["heavy_slash", "fire_ball"],
    attributes: { str: 12, agi: 8, int: 7 },
    baseAttributes: { str: 10, agi: 8, int: 7 },
    wallet: { copper: 45, silver: 3, gold: 0 },
    currentLocation: "town_square",
    equipment: {
        head: null,
        chest: { id: "iron_plate", name: "Iron Plate", ... },
        main_hand: { id: "iron_sword", ... },
        off_hand: null,
        legs: null,
        feet: null,
        accessory: null
    },
    activeQuests: { ... },
    completedQuests: ["rat_problem"],
    professions: { smithing: 1, alchemy: 1 },
    inventory: [ { id: "health_potion", name: "Health Potion", quantity: 5, ... } ]
}
```

### Collection: `npcs`

```javascript
{
    id: "blacksmith",
    name: "Brom the Smith",
    spriteIcon: "icon-smith.png",
    isVendor: true,
    vendorItems: ["iron_sword", "iron_shield"],
    defaultDialogueId: "smith_greeting"
}
```

### Collection: `quests`

See [Quest Data Schema](#quest-data-schema) above.

### Collection: `dialogues`

See [Dialogue Node Schema](#dialogue-node-schema) above.

### Collection: `locations`

See [Location Data Schema](#location-data-schema) above.

### Collection: `enemies`

```javascript
{
    id: "giant_spider",
    name: "Giant Cave Spider",
    hp: 25,
    str: 4,
    exp: 30,
    drops: [
        { id: "spider_silk", name: "Spider Silk", chance: 50, qty: 2 },
        { id: "spider_fang", name: "Spider Fang", chance: 25, qty: 1, 
          type: "accessory", stats: { agi: 1 } }
    ]
}
```

### Collection: `items`

```javascript
{
    id: "iron_sword",
    name: "Iron Sword",
    weight: 5,
    value: 50,
    rarity: "uncommon",
    stats: {
        str: 2,
        maxHp: 5
    }
}
```

### Collection: `skills`

See [Skill Data Schema](#skill-data-schema) above.

### Collection: `recipes`

See [Recipe Schema](#recipe-schema) above.

### Collection: `currencies`

```javascript
{
    id: "halloween_token",
    name: "Spooky Token",
    icon: "🎃",
    color: "#ff6600"
}
```

### Document: `config/world`

Global world configuration. Single document, not a collection.

```javascript
{
    startLocationId: "town_square"   // Location ID where new characters spawn
}
```

Managed via the World Builder (Settings tab) or `admin.setStartLocation()`.

---

## 26. How-To Guides

### How to Create a New NPC

1. **Dev Tools** → "Create NPC"
2. Enter NPC ID, display name, and sprite reference
3. Check "Is a Vendor?" if this NPC sells items
4. Enter vendor item IDs (comma-separated) if vendor
5. Save NPC
6. **Create dialogue nodes** for this NPC
7. Use **The Linker** to bind dialogue to the NPC
8. **Edit a Location** to add this NPC's ID to its `npcs` array

### How to Create a Complete Quest Chain

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

### How to Create a New Location

1. **Dev Tools** → "Create Location"
2. Enter location ID, name, and atmospheric description
3. Add connections to other locations (comma-separated IDs)
4. Add NPCs that should be present (comma-separated IDs)
5. Add encounter table as JSON (if enemies should appear)
6. Save
7. **Edit connected locations** to add a reciprocal connection back

### How to Add an Item as an Enemy Drop

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

### How to Grant Admin Privileges

```bash
# Navigate to the project root
cd web_rpg_game

# Grant admin
node scripts/setAdmin.js user@example.com

# Revoke admin
node scripts/setAdmin.js user@example.com --revoke

# The user must log out and log back in
```

### How to Add a New Equipment Slot

1. Add the slot to `State.js` in the player's `equipment` initialization
2. Add the slot name to `EquipmentUI.js` in `this.slotNames`
3. Create items with `type` matching your new slot key

### How to Add a New Profession

1. Add the profession to `State.js` in `player.professions`:

   ```javascript
   professions: { smithing: 1, alchemy: 1, enchanting: 1 }
   ```

2. Create recipes with `profession: "enchanting"`
3. The crafting system automatically checks profession levels

---

## 27. Extending the Engine

### Adding a New Module

1. **Create logic file** in `js/modules/{category}/{ModuleName}.js`
   - Export a class with a constructor accepting needed dependencies (state, inventory, etc.)
2. **Create UI file** in `js/ui/{ModuleName}UI.js`
   - Handle DOM rendering and event binding
3. **Add HTML** to `index.html` (overlay, buttons, etc.)
4. **Add CSS** to `css/main.css` for styling
5. **Wire in `app.js`**:
   - Import both files
   - Instantiate in the Engine constructor
   - Pass dependencies

### Adding a New Firestore Collection

1. **Add methods** to `database.js`:

   ```javascript
   async getMyEntities() { return this._getColl('myentities'); },
   async saveMyEntity(d) { return this._setDoc('myentities', d); }
   ```

2. **Add Dev Tools form** in `index.html` (follow existing pattern)
3. **Add handler** in `DevTools.js` (follow existing save/manage pattern)

### Adding a New Dialogue Action

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

### Adding a New Custom Event

1. **Dispatch** from any module:

   ```javascript
   window.dispatchEvent(new CustomEvent('myEvent', { detail: data }));
   ```

2. **Listen** in the appropriate UI:

   ```javascript
   window.addEventListener('myEvent', (e) => { /* handle e.detail */ });
   ```

### Adding a New Quest Objective Type

Currently supported: `kill`, `fetch`, `talk`. To add more:

1. Add an `<option>` in the Dev Tools quest form (`index.html`)
2. The objective ID format is `{type}_{target}` — ensure your code calls `questLog.updateObjective()` with the matching ID

### Adding Custom Stat Scaling

To add new stats beyond STR/AGI/INT:

1. Add the stat to `State.js` player `attributes` and `baseAttributes`
2. Add to `Equipment.js` `recalculateStats()` summing logic
3. Add to `LevelUpUI.js` for point allocation
4. Add to sidbar display in `Engine.refreshSidebar()`
5. Add scaling option in skill creation (Dev Tools + CombatEngine)

---

## 28. Complete File Reference

### Core Files

| File | Lines | Purpose |
|---|---|---|
| `js/app.js` | 300 | Engine bootstrap, module wiring, sidebar updates, cloud save |
| `js/core/firebase.js` | 28 | Firebase SDK initialization |
| `js/core/AuthManager.js` | 66 | Authentication flow + admin detection |
| `js/core/State.js` | 173 | Central player state, EXP, currency, flags |
| `js/core/database.js` | 97 | Firestore CRUD for all collections + world config |
| `js/core/CharacterCreator.js` | 262 | 3-step character creation wizard |

### Module Files

| File | Lines | Purpose |
|---|---|---|
| `js/modules/combat/CombatEngine.js` | 226 | Turn-based combat state machine |
| `js/modules/core/Equipment.js` | 130 | Equipment slots + stat recalculation |
| `js/modules/crafting/CraftingEngine.js` | 68 | Recipe validation + crafting |
| `js/modules/inventory/Inventory.js` | 65 | Item storage, stacking, weight |
| `js/modules/narrative/DialogueEngine.js` | 82 | Dialogue tree traversal + actions |
| `js/modules/quest/QuestLog.js` | 134 | Quest lifecycle management |
| `js/modules/world/LocationEngine.js` | 162 | World exploration + encounters + start location |

### UI Files

| File | Lines | Purpose |
|---|---|---|
| `js/ui/ActionLog.js` | 51 | Color-coded footer log |
| `js/ui/AuthUI.js` | 80 | Login/Register forms |
| `js/ui/CharacterSelectUI.js` | 99 | Character picker |
| `js/ui/CombatUI.js` | 120 | Fullscreen combat overlay |
| `js/ui/CraftingMenu.js` | 144 | Crafting overlay |
| `js/ui/CurrencyUI.js` | 72 | Currency bag display |
| `js/ui/DevTools.js` | 610 | Admin content editor + World Builder integration |
| `js/ui/DialogueUI.js` | 61 | Visual Novel dialogue bar |
| `js/ui/EquipmentUI.js` | 116 | Paper-doll equipment |
| `js/ui/InventoryUI.js` | 153 | Grid inventory + context menu |
| `js/ui/LevelUpUI.js` | 71 | Stat point allocation |
| `js/ui/QuestLogUI.js` | 138 | Quest journal + tracker |
| `js/ui/UIManager.js` | 9 | Placeholder |
| `js/ui/VendorUI.js` | 178 | Buy/Sell shop |
| `js/ui/WorldBuilderUI.js` | 640 | Visual world map, location table, settings, validation |

### Other Files

| File | Lines | Purpose |
|---|---|---|
| `index.html` | 560 | Single-page HTML (all overlays) |
| `css/main.css` | 624 | Complete stylesheet |
| `scripts/setAdmin.js` | 53 | Node CLI for admin claims |
| `js/data/entities.js` | 9 | Legacy static entity data |
| `firebase.json` | 25 | Firebase Hosting config |
| `package.json` | 7 | Node dependencies |

---

## Appendix: Function Index

### State.js

- `constructor()` — Initializes player defaults
- `updatePlayer(data)` — Merges player data, recalculates HP/MP
- `addCurrency(id, amount)` — Adds currency with rollover
- `payCopper(amount)` → `boolean` — Deducts copper with auto-conversion
- `gainExp(amount)` → `boolean` — Adds EXP, handles level-ups
- `setFlag(key, value)` — Sets world flag
- `getFlag(key)` → `any` — Gets world flag

### Engine (app.js)

- `constructor()` — Creates all modules and wires events
- `triggerCloudSave()` — Debounced Firestore save (1.5s)
- `bindGlobalEvents()` — Wires character, equipment, dialogue events
- `init()` — Loads DB, starts AuthUI, launches character select
- `logAction(msg)` — Logs to GlobalLog
- `startGameplay(charName)` — Transitions to gameplay mode
- `refreshSidebar()` — Updates all sidebar DOM elements

### CharacterCreator.js

- `constructor(state, updateUICallback)` — Setup
- `start(user, onComplete)` — Begin wizard
- `renderStep()` — Route to current step
- `renderOriginSelect(contentDiv, choicesDiv)` — Step 0
- `renderAttributeSelect(contentDiv, choicesDiv)` — Step 1
- `renderFinalize(contentDiv, choicesDiv)` — Step 2
- `finish()` — Step 3 (save + complete)
- `updateStateAndReRender()` — Helper for live stat updates

### CombatEngine.js

- `constructor(state, inventory, questLog)` — Setup
- `startCombat(enemyObj)` — Clone enemy, start combat
- `attack()` — Player basic attack
- `useSkill(skill)` — Use a skill (costs MP)
- `flee()` — Attempt escape
- `enemyTurn()` — Enemy attacks back
- `victory()` — Rewards + quest hooks
- `defeat()` — Death penalty
- `endCombat()` — Close combat, return to location

### Equipment.js

- `constructor(state, inventory)` — Initialize 7 slots
- `equip(itemId)` → `boolean` — Equip item from inventory
- `unequip(slot, recalc)` → `boolean` — Unequip to inventory
- `recalculateStats()` — Recompute stats from base + gear
- `getSlotForItem(item)` → `string|null` — Get matching slot

### Inventory.js

- `constructor(maxWeight)` — Initialize with weight limit
- `getTotalWeight()` → `number` — Current total weight
- `addItem(itemObj, qty)` → `boolean` — Add with stacking
- `hasItem(itemId, qty)` → `boolean` — Check availability
- `removeItem(itemId, qty)` → `boolean` — Remove quantity

### QuestLog.js

- `constructor(state, inventory, db)` — Setup
- `init()` — Load quest templates
- `startQuest(questId)` — Activate quest
- `updateObjective(questId, objId, amount)` — Increment objective
- `cancelQuest(questId)` — Remove without rewards
- `completeQuest(questId)` — Grant rewards, archive

### DialogueEngine.js

- `constructor(state, inventory, questLog, db)` — Setup
- `init()` — Load dialogue nodes
- `getNode(nodeId)` → `Object` — Get cached node
- `evaluateCondition(response)` → `{ valid, reason }` — Check conditions
- `executeActions(response)` — Run action side effects

### LocationEngine.js

- `constructor(state, combatEngine)` — Setup
- `init()` — Load locations + enemies, hook combat end
- `renderLocation()` — Render current location
- `searchArea(locInfo)` — Roll encounter table
- `triggerEncounter(enemyId)` — Start combat

### database.js (mockDatabase)

- `deleteEntity(collName, id)` — Delete document
- `getCharacters(uid)` / `saveCharacter(uid, data)` / `deleteCharacter(uid, charId)`
- `getRecipes()` / `saveRecipe(d)` — and all analogous pairs for each collection

---

> **End of Documentation**  
> This document covers the complete codebase of Unknown Adventure RPG as of April 2026.  
> For questions or contributions, refer to the specific source files linked throughout this document.
