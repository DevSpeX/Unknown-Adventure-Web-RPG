/**
 * @file firebase.js
 * @description Official Firebase V9 Modular Initialization.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAoGp5czVlCOK4a9dHGMv1KqZhrZkhGhKI",
    authDomain: "unknown-adventure-rpg.firebaseapp.com",
    projectId: "unknown-adventure-rpg",
    storageBucket: "unknown-adventure-rpg.firebasestorage.app",
    messagingSenderId: "972838513476",
    appId: "1:972838513476:web:5c1acb3a0dde7ecb09c511",
    measurementId: "G-7Z09F0NT75"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Production Firebase Cloud Services Initialized!");
