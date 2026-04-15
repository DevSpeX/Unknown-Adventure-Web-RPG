# Equipment System

## File: `js/modules/core/Equipment.js`

Manages 7 equipment slots with stat bonuses.

## Equipment Slots

| Slot Key | Display Name |
|---|---|
| `head` | Head |
| `chest` | Chest |
| `main_hand` | Main Hand |
| `off_hand` | Off Hand |
| `legs` | Legs |
| `feet` | Feet |
| `accessory` | Accessory |

## Stat Calculation

```
Total Stats = Base Attributes + Sum of Equipment Bonuses

maxHp = 20 + (baseSTR × 2) + Σ(equipment.stats.maxHp)
maxMp = 10 + (baseINT × 5) + Σ(equipment.stats.maxMp)
```

Equipment bonuses can include: `str`, `agi`, `int`, `maxHp`, `maxMp`.

## Equipment Methods

| Method | Description |
|---|---|
| `equip(itemId)` | Equips item from inventory. Checks level requirement. Unequips current slot first. |
| `unequip(slot)` | Returns item to inventory (fails if inventory is full). |
| `recalculateStats()` | Recomputes total attributes and HP/MP from base + gear. |
| `getSlotForItem(item)` | Returns the slot key matching `item.type`, or null. |

## Equipping Flow

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
