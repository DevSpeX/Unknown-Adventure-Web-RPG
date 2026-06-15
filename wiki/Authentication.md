# Authentication System

## Files
- `js/core/firebase.js` — Firebase app initialization, exports `auth` and `db`
- `js/core/AuthManager.js` — Login, register, logout, admin detection
- `js/ui/AuthUI.js` — Form handling for login/register UI
- `scripts/setAdmin.js` — CLI tool for admin privileges

## Flow

1. **Page Load**: Auth overlay appears (blocks game view).
2. **Login/Register**: User submits email + password.
3. **Success**: 
   - Auth overlay hides.
   - Custom Claims are checked for `admin: true`.
   - If admin: Dev Tools button becomes visible + developer powers activate.
   - Logout button appears.
   - Character Select overlay opens.
4. **Persistence Restoration**: On page reload (F5), the engine implicitly checks for an existing session and auto-logs in the user if "Stay Logged In" was previously selected.
5. **Logout**: Calls `signOut()` and reloads the page to clear local state.

## AuthManager Class

```javascript
class AuthManager {
    constructor(onAuthSuccess)  // Callback when auth succeeds
    async register(email, password)  // Creates new user
    async login(email, password, stayLoggedIn) // Signs in user with optional persistence
    async handleAuthSuccess(user)    // Hides overlay, checks claims, triggers character select (guarded against double execution)
}
```

### Double-Execution Guard
To prevent duplicate execution of database initialization, character select dialog creation, and session restoration, `AuthManager` features an internal boolean flag `authSuccessCalled`. Once `handleAuthSuccess` successfully executes, future invocations within the same session lifecycle are ignored.

### Caching and Revalidation
To avoid aggressive client-side caching of index files, scripts, and styles, `firebase.json` is configured to serve HTML, JS, and CSS files with `Cache-Control: no-cache, no-store, must-revalidate`. This ensures the latest fixes and assets are immediately loaded by the browser on page refresh.

### Persistence (Session vs. Local)
The login form includes a **"Stay Logged In"** checkbox.
- **Checked (Local)**: Uses `browserLocalPersistence`. Session survives browser restart.
- **Unchecked (Session)**: Uses `browserSessionPersistence`. Session cleared on tab close.
Explicit restoration is handled via `onAuthStateChanged` in the `AuthManager` constructor.

## Admin Claims

Admin privileges are set server-side via Firebase Custom Claims:

```bash
# Grant admin
node scripts/setAdmin.js user@example.com

# Revoke admin
node scripts/setAdmin.js user@example.com --revoke
```

The user must log out and back in for changes to take effect.
