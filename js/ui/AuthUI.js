import AuthManager from '../core/AuthManager.js';

export default class AuthUI {
    constructor(onReady) {
        this.authManager = new AuthManager(onReady);

        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.toggleLoginBtn = document.getElementById('toggle-to-login');
        this.toggleRegisterBtn = document.getElementById('toggle-to-register');
        this.errorMsg = document.getElementById('auth-error-msg');

        this.bindEvents();
    }

    bindEvents() {
        this.toggleRegisterBtn.addEventListener('click', () => {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
            this.clearError();
        });

        this.toggleLoginBtn.addEventListener('click', () => {
            this.registerForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
            this.clearError();
        });

        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.clearError();

            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;

            // disable button
            const btn = this.loginForm.querySelector('button');
            btn.innerText = "Processing...";
            btn.disabled = true;

            try {
                await this.authManager.login(email, pass);
            } catch (err) {
                this.showError("Invalid email or password.");
                btn.innerText = "Log In";
                btn.disabled = false;
            }
        });

        this.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.clearError();

            const email = document.getElementById('register-email').value;
            const pass = document.getElementById('register-password').value;

            // disable button
            const btn = this.registerForm.querySelector('button');
            btn.innerText = "Processing...";
            btn.disabled = true;

            try {
                await this.authManager.register(email, pass);
            } catch (err) {
                this.showError("Failed to register account.");
                btn.innerText = "Register";
                btn.disabled = false;
            }
        });
    }

    clearError() {
        if (this.errorMsg) this.errorMsg.innerText = "";
    }

    showError(msg) {
        if (this.errorMsg) this.errorMsg.innerText = msg;
    }
}
