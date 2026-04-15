# Crafting System

## Files
- `js/modules/crafting/CraftingEngine.js` — Crafting logic
- `js/ui/CraftingMenu.js` — Crafting overlay UI

## Recipe Schema

```javascript
{
    id: "iron_sword",
    name: "Iron Sword",
    profession: "smithing",
    levelReq: 1,
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

## Crafting Flow

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

## CraftingEngine Methods

| Method | Description |
|---|---|
| `canCraft(recipe)` | Returns `{ valid, reason }` — checks profession level and materials |
| `craft(recipe)` | Consumes materials, adds result item. Returns `true` if successful. |
