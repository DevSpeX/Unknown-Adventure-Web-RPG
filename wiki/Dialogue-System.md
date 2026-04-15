# Dialogue System

## Files
- `js/modules/narrative/DialogueEngine.js` — Dialogue tree evaluation + action execution
- `js/ui/DialogueUI.js` — Visual Novel-style dialogue bar

## Dialogue Node Schema

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

## Condition Types

| Condition | Schema | Description |
|---|---|---|
| Level Check | `{ minLevel: number }` | Requires minimum player level |
| Item Check | `{ requiredItem: { id: string, qty: number } }` | Requires item in inventory |

Locked options are displayed grayed out with a tooltip showing the reason.

## Action Types

| Action Type | Parameters | Description |
|---|---|---|
| `START_QUEST` | `{ target: questId }` | Starts a quest |
| `CANCEL_QUEST` | `{ target: questId }` | Cancels an active quest |
| `ADVANCE_OBJECTIVE` | `{ target: "questId:objId", amount: number }` | Increments a quest objective |
| `GIVE_ITEM` | `{ item: itemObj, qty: number }` | Gives item to player |
| `GIVE_EXP` | `{ amount: number }` | Grants EXP |
| `SET_FLAG` | `{ target: flagKey, value: any }` | Sets a world flag |

## DialogueEngine Methods

| Method | Description |
|---|---|
| `init()` | Loads all dialogue nodes from Firestore |
| `getNode(nodeId)` | Returns a cached dialogue node |
| `evaluateCondition(response)` | Returns `{ valid, reason }` for a response option |
| `executeActions(response)` | Runs all actions attached to a response |

## Example Dialogue Tree

```
mayor_intro (root)
├── [Response: "I'll help"] → START_QUEST:rat_problem → mayor_thanks
│                                                         └── [Response: "Farewell"] → null (close)
├── [Response: "Not interested"] → null (close)
└── [Response: "[Lvl 5] Intimidate"] → mayor_scared
                                         └── [Response: "Leave"] → null (close)
```

## Creating Dialogue Trees

1. **Create Dialogue Nodes**: Each node is a single "screen" of dialogue.
2. **Chain Nodes**: Use `nextNodeId` in responses to link nodes together.
3. **Add Actions**: Attach quest starts, item rewards, etc. to response buttons.
4. **Link to NPC**: Use [The Linker](Dev-Tools#the-linker) to bind the root node to an NPC.
