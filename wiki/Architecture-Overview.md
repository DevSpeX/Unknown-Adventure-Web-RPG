# Architecture Overview

## Design Principles

1. **Separation of Concerns**: Logic modules (`modules/`) never touch the DOM. UI modules (`ui/`) handle rendering. Core modules (`core/`) manage state and persistence.
2. **ES Module System**: All files use native `import`/`export`. No bundler needed.
3. **Event-Driven Communication**: Modules communicate via `window.dispatchEvent()` with custom events.
4. **Cloud-First Persistence**: All game content is stored in Firestore. Character progress auto-saves with a 1.5-second debounce.

## Initialization Flow

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
        │    └── new WorldBuilderUI()       ← Visual world map
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

## Event System

| Event Name | Dispatched By | Listened By |
|---|---|---|
| `statsUpdated` | CombatEngine, Equipment, LevelUpUI | Engine (sidebar refresh) |
| `equipmentChanged` | Equipment | EquipmentUI, CombatEngine |
| `questUpdated` | QuestLog | QuestLogUI |
| `openNPCDialogue` | LocationEngine | Engine → DialogueUI |
| `openCurrencyBag` | InventoryUI (context menu) | CurrencyUI |
| `openVendorShop` | LocationEngine | VendorUI |
| `teleportPlayer` | DevTools, WorldBuilderUI, admin console | LocationEngine |
| `devtools:editLocation` | WorldBuilderUI | DevTools (opens location form) |

## Layout Grid

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
