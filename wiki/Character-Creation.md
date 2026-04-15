# Character Creation

## File: `js/core/CharacterCreator.js`

A 3-step wizard for creating new characters.

## Step 0: Origin Selection

| Origin | Display Name | STR | AGI | INT |
|---|---|---|---|---|
| `knight` | Fallen Knight | +2 | 0 | 0 |
| `thief` | Gutter Thief | 0 | +2 | 0 |
| `scholar` | Exiled Scholar | 0 | 0 | +2 |

All origins start with base attributes of **5 STR, 5 AGI, 5 INT** before bonuses.

## Step 1: Attribute Point Distribution

The player has **5 additional points** to distribute among STR, AGI, and INT. The "Confirm Attributes" button is disabled until all points are spent.

## Step 2: Naming

The player enters a character name. Clicking "Awaken" finalizes the character.

## Step 3: Save & Start

The character data is saved to Firestore and gameplay begins.

## Methods

| Method | Description |
|---|---|
| `start(user, onComplete)` | Begins the creation wizard |
| `renderStep()` | Routes to the current step's render method |
| `renderOriginSelect()` | Renders origin buttons with tooltip descriptions |
| `renderAttributeSelect()` | Renders +/- buttons for stat allocation |
| `renderFinalize()` | Renders name input field |
| `finish()` | Saves to Firestore, triggers gameplay start |
