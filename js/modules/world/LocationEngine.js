/**
 * @file LocationEngine.js
 * @description Replaces the static story text with an interactive exploration loop, allowing moving and searching.
 */
export default class LocationEngine {
    constructor(state, combatEngine) {
        this.state = state;
        this.combatEngine = combatEngine;
        this.db = null; // Injected
        
        /** @property {string} startLocationId - Configurable spawn point, loaded from world config. */
        this.startLocationId = 'cellar'; // Ultimate fallback
        
        this.contentDiv = document.getElementById('main-content');
        this.choicesDiv = document.getElementById('choices-container');
    }

    async init() {
        // Fetch locations and enemies into memory for quick access
        this.locations = await this.db.getLocations();
        this.enemies = await this.db.getEnemies();
        
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

        // Search Action
        const btnSearch = document.createElement('button');
        btnSearch.className = 'btn text-highlight';
        btnSearch.innerText = 'Search Area';
        btnSearch.onclick = () => this.searchArea(locInfo);
        this.choicesDiv.appendChild(btnSearch);
        
        // Dynamic NPC Spawning
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
                                    if (window.dispatchEvent) {
                                        window.dispatchEvent(new CustomEvent('openNPCDialogue', { detail: npcEntity.defaultDialogueId }));
                                    }
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
                                    window.dispatchEvent(new CustomEvent('openVendorShop', { detail: { 
                                        vendorName: npcEntity.name, 
                                        vendorItems: npcEntity.vendorItems || []
                                    }}));
                                };
                                this.choicesDiv.appendChild(btnTrade);
                            }
                        }
                    });
                });
            });
        }
        
        // Travel Actions
        if (locInfo.connections) {
            locInfo.connections.forEach(connId => {
                const connInfo = this.locations.find(l => l.id === connId);
                const btnMove = document.createElement('button');
                btnMove.className = 'btn';
                btnMove.innerText = `Move to ${connInfo ? connInfo.name : connId}`;
                btnMove.onclick = () => {
                    this.state.player.currentLocation = connId;
                    this.renderLocation();
                };
                this.choicesDiv.appendChild(btnMove);
            });
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
