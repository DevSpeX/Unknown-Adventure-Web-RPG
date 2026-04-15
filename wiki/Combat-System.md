# Combat System

## Files
- `js/modules/combat/CombatEngine.js` — Turn-based combat logic
- `js/ui/CombatUI.js` — Fullscreen overlay rendering

## Combat Flow

```
1. LocationEngine.searchArea() rolls an encounter
2. CombatEngine.startCombat(enemyObj) starts combat
3. Player chooses: Strike (base), Use Skill, or Flee
4. Player attacks → Enemy attacks back (after 800ms delay)
5. Combat ends on victory or defeat
6. Control returns to LocationEngine.renderLocation()
```

## Damage Formulas

### Basic Attack (Strike)
```
damage = max(1, player.STR + random(0..2))
critChance = player.AGI × 2 (percentage)
if critical: damage = floor(damage × 1.5)
```

### Skill Attack
```
scaleStatValue = player[skill.scaleStat]  // str, int, or agi
damage = floor(scaleStatValue × skill.dmgMult + random(0..3))
damage = max(1, damage)
Costs: skill.mpCost MP
```

### Skill Heal
```
healAmount = skill.healBase
if skill.scaleStat == 'int': healAmount += player.INT × skill.dmgMult
healAmount = max(1, floor(healAmount))
Player HP clamped to maxHp
```

### Enemy Attack
```
damage = max(1, enemy.STR + random(0..1))
dodgeChance = player.AGI × 1.5 (percentage)
If dodged: no damage
```

### Flee
```
escapeChance = 30 + (player.AGI × 5) percentage
If success: combat ends
If fail: enemy gets a turn
```

## Victory Rewards
- EXP from `enemy.exp`
- Loot drops: Each drop has a `chance` (percentage). Roll per drop.
- Quest progress: `kill_{enemyId}` objectives are advanced

## Defeat Penalty
- 10% EXP loss: `exp = floor(exp × 0.9)`
- HP set to 1 (survival)

## CombatEngine Methods

| Method | Description |
|---|---|
| `startCombat(enemyObj)` | Clones enemy, opens combat UI |
| `attack()` | Player basic attack |
| `useSkill(skill)` | Use a learned skill (checks MP) |
| `flee()` | Attempt to escape |
| `enemyTurn()` | Enemy attacks the player |
| `victory()` | Grants EXP, rolls loot, advances quest objectives |
| `defeat()` | Applies death penalty |
| `endCombat()` | Closes UI, returns to location |

## CombatUI Methods

| Method | Description |
|---|---|
| `open(enemy)` | Shows fullscreen combat overlay |
| `buildActionButtons()` | Renders Strike, skill buttons, and Flee |
| `close()` | Fades out combat overlay |
| `updatePhase()` | Updates HP bar widths and name labels |
| `appendLog(msg)` | Adds message to combat log |
| `showFloatingText(target, text, cssClass)` | Animated floating damage/heal number |

## Enemy Data Schema

```javascript
{
    id: "giant_spider",
    name: "Giant Cave Spider",
    hp: 25,
    str: 4,
    exp: 30,
    drops: [
        { id: "spider_silk", name: "Spider Silk", chance: 50, qty: 2 },
        { id: "spider_fang", name: "Spider Fang", chance: 25, qty: 1, 
          type: "accessory", stats: { agi: 1 } }
    ]
}
```
