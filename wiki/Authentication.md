# Authentication System

## Files
- `js/core/firebase.js` — Firebase app initialization, exports `auth` and `db`
- `js/core/AuthManager.js` — Login, register, logout, admin detection
- `js/ui/AuthUI.js` — Form handling for login/register UI
- `scripts/setAdmin.js` — CLI tool for admin privileges

## Flow

1. **Page Load**: Auth overlay appears (blocks game view)
2. **Login/Register**: User submits email + password
3. **Success**: 
   - Auth overlay hides
   - Custom Claims are checked for `admin: true`
   - If admin: Dev Tools button becomes visible
   - Logout button appears
   - Character Select overlay opens
4. **Logout**: Calls `signOut()` and reloads the page

## AuthManager Class

```javascript
class AuthManager {
    constructor(onAuthSuccess)  // Callback when auth succeeds
    async register(email, password)  // Creates new user
    async login(email, password)     // Signs in existing user
    async handleAuthSuccess(user)    // Hides overlay, checks claims, shows logout
}
```

## Admin Claims

Admin privileges are set server-side via Firebase Custom Claims:

```bash
# Grant admin
node scripts/setAdmin.js user@example.com

# Revoke admin
node scripts/setAdmin.js user@example.com --revoke
```

The user must log out and back in for changes to take effect.
