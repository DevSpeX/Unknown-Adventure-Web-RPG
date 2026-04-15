# Inventory System

## File: `js/modules/inventory/Inventory.js`

A weight-based inventory with item stacking.

## Item Object Structure

```javascript
{
    id: "iron_sword",
    name: "Iron Sword",
    weight: 5,
    rarity: "uncommon",    // common | uncommon | rare | epic | legendary
    quantity: 1,
    type: "main_hand",     // Equipment slot (null for non-equippables)
    value: 50,             // Base value in copper
    stats: { str: 3, maxHp: 10 },
    reqLevel: 5            // Level requirement (optional)
}
```

## Inventory Methods

| Method | Signature | Returns | Description |
|---|---|---|---|
| `getTotalWeight()` | — | `number` | Sum of (weight × quantity) for all items |
| `addItem(itemObj, qty)` | `(Object, number)` | `boolean` | Adds item, stacks if exists. Returns false if overweight. |
| `hasItem(itemId, qty)` | `(string, number)` | `boolean` | Checks if enough of an item exists |
| `removeItem(itemId, qty)` | `(string, number)` | `boolean` | Removes quantity. Deletes entry if quantity reaches 0. |

## Weight System

- Default max weight: **100 units**
- Items exceeding the limit cannot be added
- Weight is displayed in the inventory footer

## Rarity Visual System

| Rarity | Border Color | Effect |
|---|---|---|
| Common | `#b0bec5` (gray) | Solid left border |
| Uncommon | `#4CAF50` (green) | Green border + subtle glow |
| Rare | `#66b3ff` (blue) | Blue border + glow |
| Epic | `#9c27b0` (purple) | Purple border + glow + text shadow |
| Legendary | `#ffd700` (gold) | Gold border + pulsing glow animation |

## InventoryUI Features

- **Grid layout** with rarity-colored borders
- **Context menu** on click:
  - **Currency Bag**: Opens Currency overlay
  - **Equippable items**: "Equip" button
  - **Consumables**: "Use / Consume" button
  - **All items**: "Discard" button (removes 1)
