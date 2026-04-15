# Project Overview

**Unknown Adventure RPG** is a text-based, browser-rendered RPG engine built with vanilla HTML, CSS, and JavaScript ES Modules. It features:

- **Firebase Authentication** for login/register with admin privileges via Custom Claims
- **Firestore** cloud database for persistent game data (characters, quests, NPCs, items, etc.)
- **Multi-character** per-user support with cloud saves
- **Turn-based combat** with skills, crits, dodges, and loot drops
- **Branching dialogue** trees (Visual Novel style) with condition checks
- **Quest system** with objectives, tracking, and rewards
- **Equipment system** with 7 gear slots and stat bonuses
- **Crafting** with profession levels, material requirements, and progress bars
- **Economy** with copper → silver → gold auto-conversion
- **Vendor trading** with buy/sell tabs
- **In-game Dev Tools** for content creation (admin only)

The game uses a dark medieval aesthetic with serif fonts, tarnished gold borders, and parchment-colored text.

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Markup** | HTML5 | Single-page application (`index.html`) |
| **Styling** | Vanilla CSS | `css/main.css`, medieval dark theme |
| **Logic** | JavaScript (ES Modules) | No build tools, native `import/export` |
| **Authentication** | Firebase Auth v9 (Modular) | Email/Password, Custom Claims for admin |
| **Database** | Cloud Firestore v9 (Modular) | Real-time document store |
| **Hosting** | Firebase Hosting | Static file hosting with SPA rewrite |
| **Admin Scripts** | Node.js | `scripts/setAdmin.js` for Custom Claims |

### Firebase SDK Version
- Firebase JS SDK: `9.22.1` (loaded via CDN from `gstatic.com`)
- Firebase Admin SDK: `^13.8.0` (Node.js, for admin scripts)
