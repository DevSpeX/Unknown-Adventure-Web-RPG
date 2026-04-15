import State from './core/State.js';
import CharacterCreator from './core/CharacterCreator.js';
import AuthUI from './ui/AuthUI.js';
import CharacterSelectUI from './ui/CharacterSelectUI.js';
import Inventory from './modules/inventory/Inventory.js';
import CraftingEngine from './modules/crafting/CraftingEngine.js';
import CraftingMenu from './ui/CraftingMenu.js';
import InventoryUI from './ui/InventoryUI.js';
import DevTools from './ui/DevTools.js';
import QuestLog from './modules/quest/QuestLog.js';
import DialogueEngine from './modules/narrative/DialogueEngine.js';
import QuestLogUI from './ui/QuestLogUI.js';
import DialogueUI from './ui/DialogueUI.js';
import Equipment from './modules/core/Equipment.js';
import EquipmentUI from './ui/EquipmentUI.js';
import CombatEngine from './modules/combat/CombatEngine.js';
import CombatUI from './ui/CombatUI.js';
import LocationEngine from './modules/world/LocationEngine.js';
import CurrencyUI from './ui/CurrencyUI.js';
import VendorUI from './ui/VendorUI.js';
import LevelUpUI from './ui/LevelUpUI.js';
import ActionLog, { GlobalLog } from './ui/ActionLog.js';
import { auth } from './core/firebase.js';

/**
 * @file app.js
 * @description Main Entry point for the RPG Engine. Initializes Core Modules and wires the UI.
 */
class Engine {
    constructor() {
        this.state = new State();
        
        // Auto-Save Debouncer
        this.saveTimer = null;
        
        // Setup central UI update callback map
        this.uiUpdate = () => {
            this.refreshSidebar();
            this.triggerCloudSave();
        };
        
        this.creator = new CharacterCreator(this.state, this.uiUpdate);

        // Initialize Phase 2 Modules
        this.inventory = new Inventory(100);
        this.craftingEngine = new CraftingEngine(this.inventory, this.state);
        this.craftingMenu = new CraftingMenu(this.craftingEngine);
        this.inventoryUI = new InventoryUI(this.inventory);
        this.devTools = new DevTools();

        // Initialize Phase 3 Modules
        this.questLog = new QuestLog(this.state, this.inventory, null); // db will be set in init
        this.dialogueEngine = new DialogueEngine(this.state, this.inventory, this.questLog, null);
        this.questLogUI = new QuestLogUI(this.questLog, this.state);
        this.dialogueUI = new DialogueUI(this.dialogueEngine);
        
        // Equipment
        this.equipment = new Equipment(this.state, this.inventory);
        this.equipmentUI = new EquipmentUI(this.equipment);

        // Phase 4 Tools
        this.combatEngine = new CombatEngine(this.state, this.inventory, this.questLog);
        this.combatUI = new CombatUI(this.combatEngine);
        this.locationEngine = new LocationEngine(this.state, this.combatEngine);

        // Supply equipment reference to inventory for equipping
        this.inventoryUI.equipmentRef = this.equipment;
        
        // Economy UIs
        this.currencyUI = new CurrencyUI(this.state);
        this.vendorUI = new VendorUI(this.state, this.inventory);
        
        // Progression
        this.levelUpUI = new LevelUpUI(this.state, this.equipment);
        
        window.appUpdateHook = () => this.uiUpdate();

        this.bindGlobalEvents();
    }

    triggerCloudSave() {
        if (!auth.currentUser || !this.state.player || !this.state.player.id) return;
        
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(async () => {
            try {
                const snapshot = {
                    ...this.state.player,
                    inventory: this.inventory ? this.inventory.items : []
                };
                await this.db.saveCharacter(auth.currentUser.uid, snapshot);
                console.log("☁️ Progress saved to Firestore.");
            } catch (err) {
                console.error("Cloud Error:", err);
            }
        }, 1500); // 1.5s debounce
    }

    bindGlobalEvents() {
        const btnChar = document.getElementById('btn-open-char');
        if (btnChar) {
            btnChar.addEventListener('click', () => {
                // Side by side viewing
                this.equipmentUI.overlay.classList.add('overlay-left');
                this.inventoryUI.overlay.classList.add('overlay-right');
                
                this.equipmentUI.open();
                this.inventoryUI.open();
            });
        }
        
        // Remove active overlay states when closing
        ['btn-close-char', 'btn-close-inventory'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                   this.equipmentUI.overlay.classList.remove('overlay-left');
                   this.inventoryUI.overlay.classList.remove('overlay-right');
                });
            }
        });
        
        // Listen to stat updates
        window.addEventListener('statsUpdated', () => this.uiUpdate());
        
        // Generic dialogue trigger hook from LocationEngine
        window.addEventListener('openNPCDialogue', (e) => {
             const nodeId = e.detail;
             
             // Check if it's the specific Mayor Thomas logic override
             if (nodeId === 'mayor_intro') {
                 const activeQuests = this.state.player.activeQuests || {};
                 if (activeQuests['rat_problem'] || this.state.player.completedQuests.includes('rat_problem')) {
                     this.dialogueUI.openNode('mayor_waiting');
                     return;
                 }
             }
             
             // General dialogue open
             this.dialogueUI.openNode(nodeId);
        });
    }

    async init() {
        console.log("RPG Engine Initialized. Waiting for Authentication...");
        
        // Dynamically import DB
        const dbModule = await import('./core/database.js');
        this.db = dbModule.mockDatabase;
        this.questLog.db = this.db;
        this.dialogueEngine.db = this.db;
        this.locationEngine.db = this.db;

        // Start Auth UI
        new AuthUI(async (user) => {
            console.log("Authentication successful! Welcome", user.email);
            
            // Load Engine Data only after authorization holds valid permissions
            await this.questLog.init();
            await this.dialogueEngine.init();
            await this.locationEngine.init();
            
            // Launch Character Select Window
            new CharacterSelectUI(
                user,
                // On select an existing character
                (user, savedCharacter) => {
                    this.state.updatePlayer(savedCharacter);
                    if (savedCharacter.inventory) {
                        this.inventory.items = savedCharacter.inventory;
                    }
                    this.equipment.recalculateStats();
                    this.refreshSidebar();
                    this.startGameplay(savedCharacter.name);
                },
                // On create new character
                (user) => {
                    this.creator.start(user, (charData) => {
                        this.startGameplay(charData.name);
                    });
                }
            );

            // Hook up Admin F12 Console Tools
            if (user.roles && user.roles.includes("admin")) {
                window.admin = {
                    /**
                     * Bestow a specific item directly into the player's inventory,
                     * Examples: admin.giveItem('excalibur', 'Excalibur', 1, 1, 'legendary', 'main_hand', {str: 10})
                     */
                    giveItem: (id, name = "Dev Item", qty = 1, weight = 1, rarity = "legendary", type = null, stats = null) => {
                        const itemObj = { id, name, weight, rarity };
                        if (type) itemObj.type = type;
                        if (stats) itemObj.stats = stats;
                        
                        const success = this.inventory.addItem(itemObj, qty);
                        if (success) {
                            this.inventoryUI.render();
                            console.log(`%c[ADMIN] Bestowed ${qty}x ${name} to player.`, "color: #FF6600");
                            GlobalLog.log(`Developer intervened: Received ${qty}x ${name}.`, 'system');
                        } else {
                            console.error("[ADMIN] Inventory might be too heavy!");
                        }
                    },
                    /**
                     * Gain EXP quickly
                     */
                    giveExp: (amount = 100) => {
                        this.state.gainExp(amount);
                        this.uiUpdate();
                        console.log(`%c[ADMIN] Bestowed ${amount} EXP. Level: ${this.state.player.level}`, "color: #FF6600");
                    },
                    /**
                     * Save a dynamic Javascript object directly to the recipes Database
                     */
                    addRecipe: async (recipeObj) => {
                        await this.db.saveRecipe(recipeObj);
                        console.log(`%c[ADMIN] Recipe ${recipeObj.name} forged in database.`, "color: #FF6600");
                        this.craftingMenu.open();
                    },
                    /**
                     * Teleport instantly to any location by ID.
                     */
                    teleport: (locationId) => {
                        window.dispatchEvent(new CustomEvent('teleportPlayer', { detail: locationId }));
                        console.log(`%c[ADMIN] Teleported to ${locationId}`, "color: #FF6600");
                    },
                    /**
                     * Add Dialogue
                     */
                    addDialogue: async (dialObj) => {
                        await this.db.saveDialogue(dialObj);
                        console.log(`%c[ADMIN] Dialogue ${dialObj.id} forged in database.`, "color: #FF6600");
                    },
                    /**
                     * Set the world's start location for new characters.
                     * @param {string} locationId - The location ID to set as the spawn point.
                     */
                    setStartLocation: async (locationId) => {
                        await this.db.saveWorldConfig({ startLocationId: locationId });
                        this.locationEngine.startLocationId = locationId;
                        console.log(`%c[ADMIN] Start location set to "${locationId}".`, "color: #FF6600");
                    },
                    /**
                     * Hot-reload all locations from Firestore into the LocationEngine.
                     */
                    reloadLocations: async () => {
                        this.locationEngine.locations = await this.db.getLocations();
                        this.locationEngine.renderLocation();
                        console.log(`%c[ADMIN] Locations reloaded from Firestore.`, "color: #FF6600");
                    }
                };
                console.log("%c[SYSTEM] Developer powers activated. Type 'admin' to see available tools.", "color: #ffcc00; font-weight: bold;");
            }

        });
    }

    logAction(msg) {
        GlobalLog.log(msg, 'system');
    }

    startGameplay(charName) {
        GlobalLog.log(`Welcome to the Unknown Adventure, ${charName}!`, 'levelup');
        this.state.setFlag('creation_complete', true);
        
        // Guarantee the player has the Currency Bag
        if (!this.inventory.hasItem('currency_bag')) {
            this.inventory.addItem({ id: 'currency_bag', name: 'Currency Bag', weight: 0, rarity: 'epic', value: 0 }, 1);
            if (this.inventoryUI) this.inventoryUI.render();
        }
        
        // Engine takes over
        this.locationEngine.renderLocation();
    }

    /**
     * Refreshes the Sidebar with current player State
     */
    refreshSidebar() {
        const p = this.state.player;
        document.getElementById('stat-name').innerText = p.name;
        document.getElementById('stat-origin').innerText = p.origin;
        document.getElementById('stat-str').innerText = p.attributes.str;
        document.getElementById('stat-agi').innerText = p.attributes.agi;
        document.getElementById('stat-int').innerText = p.attributes.int;
        
        const lvlEl = document.getElementById('stat-level');
        if (lvlEl) lvlEl.innerText = p.level || 1;
        
        const expEl = document.getElementById('stat-exp');
        if (expEl) expEl.innerText = p.exp || 0;
        
        const expnEl = document.getElementById('stat-expnext');
        if (expnEl) expnEl.innerText = p.expNext || 100;
        
        const hpEl = document.getElementById('stat-hp');
        if (hpEl) hpEl.innerText = p.hp || 0;
        const maxHpEl = document.getElementById('stat-maxhp');
        if (maxHpEl) maxHpEl.innerText = p.maxHp || 20;

        const mpEl = document.getElementById('stat-mp');
        if (mpEl) mpEl.innerText = p.mp || 0;
        const maxMpEl = document.getElementById('stat-maxmp');
        if (maxMpEl) maxMpEl.innerText = p.maxMp || 10;
        
        const upgBtn = document.getElementById('btn-upgrade-stats');
        if (upgBtn) {
            if (p.statPoints > 0) {
                upgBtn.classList.remove('hidden');
                upgBtn.onclick = () => this.levelUpUI.open();
            } else {
                upgBtn.classList.add('hidden');
            }
        }
    }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
    const gameEngine = new Engine();
    gameEngine.init();
});
