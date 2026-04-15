# Project Structure

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
│   │   └── entities.js         # Static legacy entity definitions (unused)
│   │
│   ├── modules/                # Game logic (no DOM interaction)
│   │   ├── combat/CombatEngine.js
│   │   ├── core/Equipment.js
│   │   ├── crafting/CraftingEngine.js
│   │   ├── inventory/Inventory.js
│   │   ├── narrative/DialogueEngine.js
│   │   ├── quest/QuestLog.js
│   │   └── world/LocationEngine.js
│   │
│   └── ui/                     # DOM rendering layer
│       ├── ActionLog.js        ├── CombatUI.js
│       ├── AuthUI.js           ├── CraftingMenu.js
│       ├── CharacterSelectUI.js├── CurrencyUI.js
│       ├── DevTools.js         ├── DialogueUI.js
│       ├── EquipmentUI.js      ├── InventoryUI.js
│       ├── LevelUpUI.js        ├── QuestLogUI.js
│       ├── UIManager.js        ├── VendorUI.js
│       └── WorldBuilderUI.js
│
├── docs/                       # Documentation
│   ├── UNKNOWN_ADVENTURE_RPG_DOCUMENTATION.md   # Full documentation (Markdown)
│   └── UNKNOWN_ADVENTURE_RPG_DOCUMENTATION.html # Full documentation (PDF-ready)
│
├── wiki/                       # Wiki pages (this folder)
│
└── scripts/
    └── setAdmin.js             # Node CLI tool: grant/revoke admin claims
```

# Complete File Reference

## Core Files

| File | Lines | Purpose |
|---|---|---|
| `js/app.js` | 300 | Engine bootstrap, module wiring, sidebar updates, cloud save |
| `js/core/firebase.js` | 28 | Firebase SDK initialization |
| `js/core/AuthManager.js` | 66 | Authentication flow + admin detection |
| `js/core/State.js` | 173 | Central player state, EXP, currency, flags |
| `js/core/database.js` | 97 | Firestore CRUD for all collections + world config |
| `js/core/CharacterCreator.js` | 262 | 3-step character creation wizard |

## Module Files

| File | Lines | Purpose |
|---|---|---|
| `js/modules/combat/CombatEngine.js` | 226 | Turn-based combat state machine |
| `js/modules/core/Equipment.js` | 130 | Equipment slots + stat recalculation |
| `js/modules/crafting/CraftingEngine.js` | 68 | Recipe validation + crafting |
| `js/modules/inventory/Inventory.js` | 65 | Item storage, stacking, weight |
| `js/modules/narrative/DialogueEngine.js` | 82 | Dialogue tree traversal + actions |
| `js/modules/quest/QuestLog.js` | 134 | Quest lifecycle management |
| `js/modules/world/LocationEngine.js` | 162 | World exploration + encounters + start location |

## UI Files

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
