import { auth } from './firebase.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

export default class AuthManager {
    constructor(onAuthSuccess) {
        this.onAuthSuccess = onAuthSuccess;
        this.initialAuthHandled = false;
        this.authSuccessCalled = false;
        
        // Listen to Auth State implicitly for browser persistence restoration
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !this.initialAuthHandled) {
                this.initialAuthHandled = true;
                console.log("[AUTH] Session Restored:", user.email);
                this.handleAuthSuccess(user);
                unsubscribe(); // Only handle the initial restoration automatically
            }
        });
    }

    async register(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Registered:", userCredential.user);
            this.handleAuthSuccess(userCredential.user);
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    }

    async login(email, password, stayLoggedIn = true) {
        try {
            this.initialAuthHandled = true; // Manual login takes priority
            const persistenceMode = stayLoggedIn ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistenceMode);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in:", userCredential.user);
            this.handleAuthSuccess(userCredential.user);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    async handleAuthSuccess(user) {
        if (this.authSuccessCalled) {
            console.log("[AUTH] handleAuthSuccess ignored (already handled)");
            return;
        }
        this.authSuccessCalled = true;

        // Hide overlay securely
        document.getElementById('auth-overlay').classList.add('hidden');

        // Read the ID token to check for server-set Custom Claims
        try {
            const tokenResult = await user.getIdTokenResult();
            if (tokenResult.claims.admin === true) {
                user.roles = ['admin'];
                const devBtn = document.getElementById('btn-dev-area');
                if (devBtn) devBtn.classList.remove('hidden');
                console.log('%c[AUTH] Admin privileges detected.', 'color: #ffcc00; font-weight: bold;');
            }
        } catch (e) {
            console.warn('[AUTH] Could not read custom claims:', e);
        }

        // Setup Logout functionality
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.addEventListener('click', async () => {
                await signOut(auth);
                window.location.reload();
            });
        }

        // Let the engine know the user is ready
        this.onAuthSuccess(user);
    }
}
