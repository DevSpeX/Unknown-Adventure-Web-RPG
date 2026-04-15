# CSS Design System

## File: `css/main.css`

## Design Tokens (CSS Variables)

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

## Key CSS Classes

| Class | Purpose |
|---|---|
| `.panel` | Dark panel with border, shadow, padding |
| `.panel-header` | Uppercase, gold, centered section header |
| `.btn` | Standard button style |
| `.choice-container` | Flex column layout for buttons |
| `.has-tooltip` / `.tooltip-popup` | Hover tooltip system |
| `.overlay` | Modal overlay with transition |
| `.hidden` | `display: none !important` |
| `.combat-fullscreen` | Fixed fullscreen combat |
| `.vn-dialogue-overlay` | Bottom-anchored dialogue bar |
| `.rarity-*` | Rarity-colored item borders |
| `.item-context-menu` | Right-click context menu |

## Overlay System

Overlays use CSS transitions:
- Default: `visibility: hidden; opacity: 0; transform: translate(-50%, -45%)`
- Active: `visibility: visible; opacity: 1; transform: translate(-50%, -50%)`
- Side-by-side mode: `.overlay-left` + `.overlay-right`

---

# UI Layer Reference

## ActionLog (`js/ui/ActionLog.js`)

| Log Type | Color | Style |
|---|---|---|
| `info` | Gray | Default |
| `critical` | Crimson red | — |
| `loot` | Gold | — |
| `exp` | Green | — |
| `levelup` | Blue | Bold |
| `system` | Gold | Italic |

Usage: `GlobalLog.log("Message", "type")`

## Other UI Classes

| Class | File | Purpose |
|---|---|---|
| CharacterSelectUI | `CharacterSelectUI.js` | Character picker with Play/Delete/Create |
| DialogueUI | `DialogueUI.js` | Visual Novel dialogue bar |
| QuestLogUI | `QuestLogUI.js` | Quest journal + quick-view tracker |
| EquipmentUI | `EquipmentUI.js` | Paper-doll equipment display |
| InventoryUI | `InventoryUI.js` | Grid inventory with context menu |
| CombatUI | `CombatUI.js` | Fullscreen combat overlay |
| CraftingMenu | `CraftingMenu.js` | Crafting overlay with progress bars |
| CurrencyUI | `CurrencyUI.js` | Currency bag display |
| VendorUI | `VendorUI.js` | Buy/Sell shop interface |
| LevelUpUI | `LevelUpUI.js` | Stat point allocation |
| DevTools | `DevTools.js` | Admin content editor |
| UIManager | `UIManager.js` | Placeholder for future use |
