/**
 * @file database.js
 * @description Cloud Firestore ORM.
 */
import { db } from './firebase.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockDatabase = {
    
    async deleteEntity(collName, id) {
        await deleteDoc(doc(db, collName, id));
        return true;
    },

    // ---------------- Characters & Persistence ----------------

    async getCharacters(uid) {
        const snapshot = await getDocs(collection(db, `users/${uid}/characters`));
        return snapshot.docs.map(doc => doc.data());
    },

    async saveCharacter(uid, characterData) {
        const id = characterData.id || generateId();
        const newChar = { ...characterData, id };
        await setDoc(doc(db, `users/${uid}/characters`, id), newChar);
        return newChar;
    },

    async deleteCharacter(uid, charId) {
        await deleteDoc(doc(db, `users/${uid}/characters`, charId));
        return true;
    },

    // ---------------- Global Environment Wrappers ----------------
    
    async _getColl(coll) {
        const snapshot = await getDocs(collection(db, coll));
        return snapshot.docs.map(d => d.data());
    },
    
    async _setDoc(coll, data) {
        const id = data.id || generateId();
        const d = { ...data, id };
        await setDoc(doc(db, coll, id), d);
        return d;
    },

    async getRecipes() { return this._getColl('recipes'); },
    async saveRecipe(d) { return this._setDoc('recipes', d); },

    async getItems() { return this._getColl('items'); },
    async saveItem(d) { return this._setDoc('items', d); },

    async getCurrencies() { return this._getColl('currencies'); },
    async saveCurrency(d) { return this._setDoc('currencies', d); },

    async getQuests() { return this._getColl('quests'); },
    async saveQuest(d) { return this._setDoc('quests', d); },

    async getDialogues() { return this._getColl('dialogues'); },
    async saveDialogue(d) { return this._setDoc('dialogues', d); },

    async getNPCs() { return this._getColl('npcs'); },
    async saveNPC(d) { return this._setDoc('npcs', d); },

    async getLocations() { return this._getColl('locations'); },
    async saveLocation(d) { return this._setDoc('locations', d); },

    async getEnemies() { return this._getColl('enemies'); },
    async saveEnemy(d) { return this._setDoc('enemies', d); },

    async getSkills() { return this._getColl('skills'); },
    async saveSkill(d) { return this._setDoc('skills', d); },

    // ---------------- World Configuration ----------------

    /**
     * Retrieves the global world configuration document (config/world).
     * Contains settings like the starting location ID.
     * @returns {Object|null} The world config object or null if unset.
     */
    async getWorldConfig() {
        const snap = await getDoc(doc(db, 'config', 'world'));
        return snap.exists() ? snap.data() : null;
    },

    /**
     * Saves the global world configuration document (config/world).
     * @param {Object} data - Configuration data to persist.
     */
    async saveWorldConfig(data) {
        await setDoc(doc(db, 'config', 'world'), data);
        return data;
    }
};
