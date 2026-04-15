# Build, Deploy & Run

## Prerequisites

- **Node.js** (v18+)
- **Firebase CLI**: `npm install -g firebase-tools`
- **Firebase Project**: `unknown-adventure-rpg`

## Local Development

No build step is required. Simply serve the files with any static server:

```bash
# Option 1: Firebase Emulator
firebase serve --only hosting

# Option 2: Any HTTP server
npx serve .

# Option 3: VS Code Live Server extension
```

> **Important**: The app uses ES Modules (`type="module"`) and must be served over HTTP, not opened as a local file.

## Deploy to Production

```bash
firebase deploy --only hosting
```

This deploys all files to `unknown-adventure-rpg.web.app`.

## Firebase Configuration

**`firebase.json`** configures:
- `public: "."` — Serves root directory
- SPA rewrite: All routes redirect to `index.html`
- Ignores: `firebase.json`, dotfiles, `node_modules`
