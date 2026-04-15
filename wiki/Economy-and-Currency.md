# Economy & Currency System

## Files
- `js/core/State.js` — Currency logic in `addCurrency()` and `payCopper()`
- `js/ui/CurrencyUI.js` — Currency bag overlay

## Core Currencies

| Currency | Auto-Rollover |
|---|---|
| Copper | 100 Copper → 1 Silver |
| Silver | 100 Silver → 1 Gold |
| Gold | Capped at 999 |

## Custom Currencies

You can create event/seasonal currencies (e.g., Halloween Tokens) via Dev Tools. These are stored in the player's `wallet` object and displayed in the currency bag.

## Currency Bag

The Currency Bag is a special inventory item (`currency_bag`, weight 0, epic rarity) auto-granted on game start. Right-clicking it opens the Currency overlay.

---

# Vendor / Shop System

## File: `js/ui/VendorUI.js`

NPCs marked as vendors can open a shop interface.

### Setup

```javascript
{
    id: "shopkeeper",
    name: "Greta the Merchant",
    isVendor: true,
    vendorItems: ["health_potion", "iron_sword", "leather_armor"]
}
```

### Buy/Sell Mechanics

| Action | Price Calculation |
|---|---|
| **Buy** | `item.value` copper (or 10 if no value) |
| **Sell** | `floor(item.value / 2)` copper (minimum 1) |

### Features
- **Buy Tab**: Shows vendor's stock with prices
- **Sell Tab**: Shows player's sellable items (excludes Currency Bag)
- **Wallet Display**: Shows current copper/silver/gold

---

# Skill System

## Skill Schema

```javascript
{
    id: "fire_ball",
    name: "Fireball",
    mpCost: 8,
    scaleStat: "int",     // none | str | agi | int
    dmgMult: 2,
    healBase: 0           // If > 0, this is a healing skill
}
```

Skills are stored in Firestore's `skills` collection. The player's `skills` array holds learned skill IDs. During combat, buttons are generated for each known skill.

---

# Leveling & Progression

| Event | Value |
|---|---|
| **Stat Points per Level** | 3 |
| **EXP Scaling** | `expNext = floor(expNext × 1.5)` |
| **On Level Up** | Full HP/MP heal |
| **Death Penalty** | 10% EXP loss |

When `statPoints > 0`, an "UPGRADE STATS" button appears. The Level Up overlay lets players distribute points among STR, AGI, INT with + / - buttons.
