# Extending the Engine

## Adding a New Module

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

## Adding a New Firestore Collection

1. **Add methods** to `database.js`:
   ```javascript
   async getMyEntities() { return this._getColl('myentities'); },
   async saveMyEntity(d) { return this._setDoc('myentities', d); }
   ```
2. **Add Dev Tools form** in `index.html` (follow existing pattern)
3. **Add handler** in `DevTools.js` (follow existing save/manage pattern)

## Adding a New Custom Event

1. **Dispatch** from any module:
   ```javascript
   window.dispatchEvent(new CustomEvent('myEvent', { detail: data }));
   ```
2. **Listen** in the appropriate UI:
   ```javascript
   window.addEventListener('myEvent', (e) => { /* handle e.detail */ });
   ```

## Adding a New Quest Objective Type

Currently supported: `kill`, `fetch`, `talk`. To add more:

1. Add an `<option>` in the Dev Tools quest form (`index.html`)
2. The objective ID format is `{type}_{target}` — ensure your code calls `questLog.updateObjective()` with the matching ID

## Adding Custom Stat Scaling

To add new stats beyond STR/AGI/INT:

1. Add the stat to `State.js` player `attributes` and `baseAttributes`
2. Add to `Equipment.js` `recalculateStats()` summing logic
3. Add to `LevelUpUI.js` for point allocation
4. Add to sidebar display in `Engine.refreshSidebar()`
5. Add scaling option in skill creation (Dev Tools + CombatEngine)
