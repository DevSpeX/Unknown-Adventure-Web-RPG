/**
 * @file LocationEngine.js
 * @description Replaces the static story text with an interactive exploration loop, allowing moving and searching.
 */
import { GlobalLog } from '../../ui/ActionLog.js';

export default class LocationEngine {
    constructor(state, combatEngine, inventory) {
        this.state = state;
        this.combatEngine = combatEngine;
        this.inventory = inventory;
        this.db = null; // Injected
        
        /** @property {string} startLocationId - Configurable spawn point, loaded from world config. */
        this.startLocationId = 'cellar'; // Ultimate fallback
        
        this.contentDiv = document.getElementById('main-content');
        this.choicesDiv = document.getElementById('choices-container');
        this.items = []; // Preloaded item definitions
    }

    async init() {
        // Fetch locations and enemies into memory for quick access
        this.locations = await this.db.getLocations();
        this.enemies = await this.db.getEnemies();
        this.items = await this.db.getItems(); // Load item database definitions
        
        // Load world config to determine the start location
        try {
            const worldConfig = await this.db.getWorldConfig();
            if (worldConfig && worldConfig.startLocationId) {
                this.startLocationId = worldConfig.startLocationId;
            }
        } catch (err) {
            console.warn('World config not found, using default start location:', this.startLocationId);
        }
        
        // Apply start location to player if they have no saved location
        if (!this.state.player.currentLocation) {
            this.state.player.currentLocation = this.startLocationId;
        }

        // Hook up combat end callback
        this.combatEngine.onCombatEnd = () => this.renderLocation();

        // Listen for global teleport events
        window.addEventListener('teleportPlayer', (e) => {
            const destId = e.detail;
            if (destId) {
                this.state.player.currentLocation = destId;
                this.renderLocation();
            }
        });

        // Listen for item usage events from the inventory UI
        window.addEventListener('useInventoryItem', (e) => {
            const { itemId, itemName } = e.detail;
            const locId = this.state.player.currentLocation || this.startLocationId;
            const locInfo = this.locations.find(l => l.id === locId);
            
            if (locInfo && locInfo.connections) {
                for (let connId of locInfo.connections) {
                    const conditions = locInfo.connectionConditions ? locInfo.connectionConditions[connId] : null;
                    if (conditions && conditions.requiredItemId === itemId) {
                        const hasFlag = conditions.requiredFlag ? this.state.getFlag(conditions.requiredFlag) : false;
                        if (!hasFlag) {
                            // Unlock the connection!
                            if (conditions.requiredFlag) {
                                this.state.setFlag(conditions.requiredFlag, true);
                            }
                            
                            // Mark the event as handled so the inventory UI consumes the item
                            e.detail.handled = true;
                            
                            // Show unlock message
                            const unlockText = conditions.unlockText || `You use ${itemName} to open the way.`;
                            this.showModal("Way Opened", unlockText);
                            GlobalLog.log(unlockText, 'quest');
                            
                            // Refresh gameplay sidebar & location view
                            if (window.appUpdateHook) {
                                window.appUpdateHook(true);
                            }
                            this.renderLocation();
                            return;
                        }
                    }
                }
            }
        });

        // Listen for database changes to hot-reload locations
        window.addEventListener('locationsUpdated', async () => {
            this.locations = await this.db.getLocations();
            this.items = await this.db.getItems();
            this.renderLocation();
        });
    }

    renderLocation() {
        const locId = this.state.player.currentLocation || this.startLocationId;
        const locInfo = this.locations.find(l => l.id === locId);
        
        document.getElementById('main-view-header').innerText = `Location: ${locInfo ? locInfo.name : 'Unknown'}`;
        
        this.contentDiv.innerHTML = `
            <p style="font-size: 1.1rem; line-height: 1.6;">${locInfo ? locInfo.description : 'You are lost in the void.'}</p>
        `;
        
        this.choicesDiv.innerHTML = '';
        
        if (!locInfo) return;

        // 1. Search Action (Standard)
        const btnSearch = document.createElement('button');
        btnSearch.className = 'btn text-highlight';
        btnSearch.innerText = 'Search Area';
        btnSearch.onclick = () => {
            btnSearch.disabled = true;
            this.searchArea(locInfo);
            setTimeout(() => { btnSearch.disabled = false; }, 1000);
        };
        this.choicesDiv.appendChild(btnSearch);

        // 2. Custom Interactions
        if (locInfo.interactions && locInfo.interactions.length > 0) {
            locInfo.interactions.forEach(inter => {
                // Check if this is a one-time interaction and is already completed
                const flagName = inter.setFlag || `interacted_${locInfo.id}_${inter.label.replace(/\s+/g, '_')}`;
                if (inter.onlyOnce && this.state.getFlag(flagName)) {
                    // Already completed, hide it
                    return;
                }

                // Check optional required world flag or items
                if (inter.requiredFlag && !this.state.getFlag(inter.requiredFlag)) {
                    return; // Requirement not met, hide it
                }
                if (inter.requiredItemId && !this.inventory.hasItem(inter.requiredItemId)) {
                    return; // Requirement not met, hide it
                }

                // Render button
                const btnInter = document.createElement('button');
                btnInter.className = 'btn text-highlight';
                btnInter.style.borderColor = 'var(--text-highlight)';
                btnInter.innerText = inter.label;
                btnInter.onclick = () => {
                    btnInter.disabled = true;
                    this.handleCustomInteraction(locInfo, inter);
                };
                this.choicesDiv.appendChild(btnInter);
            });
        }
        
        // 3. Dynamic NPC Spawning
        if (locInfo.npcs && locInfo.npcs.length > 0) {
            import('../../core/database.js').then(module => {
                module.mockDatabase.getNPCs().then(allNpcs => {
                    locInfo.npcs.forEach(npcId => {
                        const npcEntity = allNpcs.find(n => n.id === npcId);
                        if (npcEntity) {
                            if (npcEntity.defaultDialogueId) {
                                const btnSpeak = document.createElement('button');
                                btnSpeak.className = 'btn text-highlight';
                                btnSpeak.innerText = `Speak to ${npcEntity.name}`;
                                btnSpeak.style.borderColor = 'var(--text-highlight)';
                                btnSpeak.onclick = () => {
                                    btnSpeak.disabled = true;
                                    if (window.dispatchEvent) {
                                        window.dispatchEvent(new CustomEvent('openNPCDialogue', { detail: npcEntity.defaultDialogueId }));
                                    }
                                    setTimeout(() => { btnSpeak.disabled = false; }, 1000);
                                };
                                this.choicesDiv.appendChild(btnSpeak);
                            }
                            
                            if (npcEntity.isVendor) {
                                const btnTrade = document.createElement('button');
                                btnTrade.className = 'btn';
                                btnTrade.innerText = `Trade with ${npcEntity.name}`;
                                btnTrade.style.borderColor = '#d4af37';
                                btnTrade.style.color = '#d4af37';
                                btnTrade.onclick = () => {
                                    btnTrade.disabled = true;
                                    window.dispatchEvent(new CustomEvent('openVendorShop', { detail: { 
                                        vendorName: npcEntity.name, 
                                        vendorItems: npcEntity.vendorItems || []
                                    }}));
                                    setTimeout(() => { btnTrade.disabled = false; }, 1000);
                                };
                                this.choicesDiv.appendChild(btnTrade);
                            }
                        }
                    });
                });
            });
        }
        
        // 4. Travel Actions (Connections with locked conditions check)
        if (locInfo.connections) {
            locInfo.connections.forEach(connId => {
                const connInfo = this.locations.find(l => l.id === connId);
                const btnMove = document.createElement('button');
                btnMove.className = 'btn';
                
                // Retrieve lock conditions if defined
                const conditions = locInfo.connectionConditions ? locInfo.connectionConditions[connId] : null;
                let isLocked = false;

                if (conditions) {
                    const hasFlag = conditions.requiredFlag ? this.state.getFlag(conditions.requiredFlag) : false;
                    const hasItem = conditions.requiredItemId ? this.inventory.hasItem(conditions.requiredItemId) : false;

                    if (conditions.requiredFlag) {
                        isLocked = !hasFlag;
                    } else if (conditions.requiredItemId) {
                        isLocked = !hasItem;
                    }
                }

                if (isLocked) {
                    btnMove.innerText = `Move to ${connInfo ? connInfo.name : connId} [Locked]`;
                    btnMove.style.borderColor = 'var(--crimson-red)';
                    btnMove.style.color = 'var(--text-dim)';
                    btnMove.onclick = () => {
                        btnMove.disabled = true;
                        const lockedText = conditions.lockedText || "The way is locked. You cannot pass.";
                        this.showModal("Locked Connection", lockedText);
                        setTimeout(() => { btnMove.disabled = false; }, 1000);
                    };
                } else {
                    btnMove.innerText = `Move to ${connInfo ? connInfo.name : connId}`;
                    btnMove.onclick = () => {
                        btnMove.disabled = true;
                        // Check if we need to perform unlock/consume actions
                        if (conditions) {
                            const hasFlag = conditions.requiredFlag ? this.state.getFlag(conditions.requiredFlag) : false;
                            if (conditions.requiredItemId && !hasFlag) {
                                // Consume the item if configured to do so
                                if (conditions.consumeItem) {
                                    this.inventory.removeItem(conditions.requiredItemId, 1);
                                }
                                // Record permanent unlock flag in state
                                if (conditions.requiredFlag) {
                                    this.state.setFlag(conditions.requiredFlag, true);
                                }

                                // Show confirmation alert modal
                                const unlockText = conditions.unlockText || `You use ${conditions.requiredItemId} to open the way.`;
                                this.showModal("Way Opened", unlockText);
                                GlobalLog.log(unlockText, 'quest');
                            }
                        }

                        // Execute teleport
                        this.state.player.currentLocation = connId;
                        if (window.dispatchEvent) {
                            window.dispatchEvent(new Event('statsUpdated'));
                        }
                        this.renderLocation();
                    };
                }
                this.choicesDiv.appendChild(btnMove);
            });
        }
    }

    handleCustomInteraction(locInfo, inter) {
        // Double check required conditions just in case
        if (inter.requiredFlag && !this.state.getFlag(inter.requiredFlag)) return;
        if (inter.requiredItemId && !this.inventory.hasItem(inter.requiredItemId)) return;

        // Check if this is a one-time interaction and is already completed
        const flagName = inter.setFlag || `interacted_${locInfo.id}_${inter.label.replace(/\s+/g, '_')}`;
        if (inter.onlyOnce && this.state.getFlag(flagName)) {
            this.showModal(inter.label, "Nothing else was found.");
            return;
        }

        // If it rewards an item
        if (inter.itemId) {
            // Find the item definition in the loaded item database
            const itemObj = this.items.find(i => i.id === inter.itemId);
            if (!itemObj) {
                this.showModal("Error", `Item ID "${inter.itemId}" not found in database. Make sure the item exists.`);
                return;
            }

            const qty = inter.itemQty || 1;
            
            // Check inventory weight restrictions
            const addedWeight = itemObj.weight * qty;
            if (this.inventory.getTotalWeight() + addedWeight > this.inventory.maxWeight) {
                this.showModal("Inventory Full", "Your inventory is too heavy! Free up some weight before performing this action.");
                return;
            }

            // Grant item
            this.inventory.addItem(itemObj, qty);
        }

        // Set completion flag
        this.state.setFlag(flagName, true);

        // Display results modal popup
        this.showModal(inter.label, inter.text);

        // Synchronize and re-render
        if (window.appUpdateHook) {
            window.appUpdateHook(true);
        }
        this.renderLocation();
    }

    showModal(title, body) {
        const modal = document.getElementById('game-modal');
        const modalTitle = document.getElementById('game-modal-title');
        const modalBody = document.getElementById('game-modal-body');
        const modalClose = document.getElementById('game-modal-close');
        
        if (modal && modalTitle && modalBody && modalClose) {
            modalTitle.innerText = title || "";
            modalBody.innerHTML = String(body || "").replace(/\n/g, '<br>');
            
            modal.classList.remove('hidden');
            modal.classList.add('active');
            
            modalClose.onclick = () => {
                modal.classList.remove('active');
                modal.classList.add('hidden');
            };
        } else {
            // Fallback for isolated contexts or testing
            alert(body);
        }
    }

    searchArea(locInfo) {
        let encounterRolled = false;
        
        // Roll on encounter table
        if (locInfo.encounters) {
            const roll = Math.random() * 100;
            let currentLikelihood = 0;
            
            for (let enc of locInfo.encounters) {
                currentLikelihood += enc.chance;
                if (roll <= currentLikelihood) {
                    this.triggerEncounter(enc.enemyId);
                    encounterRolled = true;
                    break;
                }
            }
        }

        if (!encounterRolled) {
            // Nothing found
            const msg = document.createElement('p');
            msg.className = "text-dim";
            msg.innerText = "You search the area but find nothing of interest.";
            this.contentDiv.appendChild(msg);
        }
    }

    triggerEncounter(enemyId) {
        const enemyObj = this.enemies.find(e => e.id === enemyId);
        if (enemyObj) {
            // Start combat overlay
            this.combatEngine.startCombat(enemyObj);
        } else {
            console.error(`Enemy ID ${enemyId} not found in DB!`);
        }
    }
}
