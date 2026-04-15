# Data Schemas (Firestore Collections)

## Collection: `users/{uid}/characters`

```javascript
{
    id: "abc123",
    name: "Aldric",
    origin: "Fallen Knight",
    level: 5,
    exp: 120,
    expNext: 759,
    hp: 34, maxHp: 34,
    mp: 35, maxMp: 35,
    statPoints: 0,
    skills: ["heavy_slash", "fire_ball"],
    attributes: { str: 12, agi: 8, int: 7 },
    baseAttributes: { str: 10, agi: 8, int: 7 },
    wallet: { copper: 45, silver: 3, gold: 0 },
    currentLocation: "town_square",
    equipment: {
        head: null,
        chest: { id: "iron_plate", name: "Iron Plate", ... },
        main_hand: { id: "iron_sword", ... },
        off_hand: null, legs: null, feet: null, accessory: null
    },
    activeQuests: { ... },
    completedQuests: ["rat_problem"],
    professions: { smithing: 1, alchemy: 1 },
    inventory: [ { id: "health_potion", name: "Health Potion", quantity: 5, ... } ]
}
```

## Collection: `npcs`

```javascript
{
    id: "blacksmith",
    name: "Brom the Smith",
    spriteIcon: "icon-smith.png",
    isVendor: true,
    vendorItems: ["iron_sword", "iron_shield"],
    defaultDialogueId: "smith_greeting"
}
```

## Collection: `quests`

```javascript
{
    id: "rat_problem",
    title: "The Rat Problem",
    description: "Clear the cellar of rats.",
    requirements: { level: 1, questId: null },
    objectives: [{ id: "kill_rat", desc: "Kill 5 rats", required: 5 }],
    rewards: { exp: 100, gold: 5, items: [{ id: "rat_tail", qty: 1 }] }
}
```

## Collection: `dialogues`

```javascript
{
    id: "mayor_intro",
    npc: "Mayor Thomas",
    text: "Welcome to our village...",
    responses: [
        {
            text: "I'll help.",
            nextNodeId: "mayor_thanks",
            conditions: null,
            actions: [{ type: "START_QUEST", target: "rat_problem" }]
        }
    ]
}
```

## Collection: `locations`

```javascript
{
    id: "cellar",
    name: "The Cellar",
    description: "A dark, musty cellar...",
    connections: ["town_square", "sewer"],
    npcs: ["blacksmith", "mayor"],
    encounters: [
        { enemyId: "rat", chance: 80 },
        { enemyId: "spider", chance: 20 }
    ]
}
```

## Collection: `enemies`

```javascript
{
    id: "giant_spider",
    name: "Giant Cave Spider",
    hp: 25,
    str: 4,
    exp: 30,
    drops: [
        { id: "spider_silk", name: "Spider Silk", chance: 50, qty: 2 },
        { id: "spider_fang", name: "Spider Fang", chance: 25, qty: 1 }
    ]
}
```

## Collection: `items`

```javascript
{
    id: "iron_sword",
    name: "Iron Sword",
    weight: 5,
    value: 50,
    rarity: "uncommon",
    stats: { str: 2, maxHp: 5 }
}
```

## Collection: `skills`

```javascript
{
    id: "fire_ball",
    name: "Fireball",
    mpCost: 8,
    scaleStat: "int",
    dmgMult: 2,
    healBase: 0
}
```

## Collection: `recipes`

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

## Collection: `currencies`

```javascript
{
    id: "halloween_token",
    name: "Spooky Token",
    icon: "🎃",
    color: "#ff6600"
}
```

## Document: `config/world`

Global world configuration. Single document, not a collection.

```javascript
{
    startLocationId: "town_square"   // Location ID where new characters spawn
}
```

Managed via the World Builder (Settings tab) or `admin.setStartLocation()`.
