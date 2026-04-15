# Quest System

## Files
- `js/modules/quest/QuestLog.js` — Quest lifecycle management
- `js/ui/QuestLogUI.js` — Quest journal overlay + quick-view tracker

## Quest Data Schema

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

## Quest Lifecycle

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

## QuestLog Methods

| Method | Signature | Description |
|---|---|---|
| `init()` | `async` | Loads all quest templates from Firestore into cache |
| `startQuest(questId)` | `(string)` | Activates a quest (copies template with tracking data) |
| `updateObjective(questId, objId, amount)` | `(string, string, number)` | Increments an objective counter. Auto-completes if threshold reached. |
| `cancelQuest(questId)` | `(string)` | Removes quest from active without rewards |
| `completeQuest(questId)` | `(string)` | Grants rewards (EXP, items), archives to `completedQuests` |

## Quest Tracking

Players can toggle a "Track" checkbox on any active quest. Tracked quests appear in the **Quest Quick View** at the bottom of the screen, showing real-time objective progress.

## Creating a New Quest

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

> **Connecting Quests to NPCs**: Use **The Linker** tool (see [Dev Tools](Dev-Tools)) to bind a quest to an NPC's dialogue tree.
