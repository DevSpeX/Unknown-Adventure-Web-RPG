import { mockDatabase } from '../core/database.js';
import WorldBuilderUI from './WorldBuilderUI.js';

/**
 * @file DevTools.js
 * @description Master Dev Tools controller: Visual Engine Room for creating NPCs, Quests, Items, and Linking.
 * Also hosts the World Builder for visual location management.
 */
export default class DevTools {
    constructor() {
        this.overlay = document.getElementById('devtools-overlay');
        this.listArea = document.getElementById('dev-actions-list');
        
        // Setup Areas
        this.areas = {
            npc: { container: document.getElementById('dev-npc-container'), form: document.getElementById('dev-npc-form'), msg: document.getElementById('dev-status-msg-npc') },
            quest: { container: document.getElementById('dev-quest-container'), form: document.getElementById('dev-quest-form'), msg: document.getElementById('dev-status-msg-quest') },
            dialogue: { container: document.getElementById('dev-dial-container'), form: document.getElementById('dev-dial-form'), msg: document.getElementById('dev-status-msg-dial') },
            linker: { container: document.getElementById('dev-linker-container'), form: document.getElementById('dev-linker-form'), msg: document.getElementById('dev-status-msg-linker') },
            item: { container: document.getElementById('dev-item-container'), form: document.getElementById('dev-item-form'), msg: document.getElementById('dev-status-msg-item') },
            recipe: { container: document.getElementById('dev-recipe-container'), form: document.getElementById('dev-recipe-form'), msg: document.getElementById('dev-status-msg') },
            location: { container: document.getElementById('dev-location-container'), form: document.getElementById('dev-location-form'), msg: document.getElementById('dev-status-msg-location') },
            enemy: { container: document.getElementById('dev-enemy-container'), form: document.getElementById('dev-enemy-form'), msg: document.getElementById('dev-status-msg-enemy') },
            currency: { container: document.getElementById('dev-currency-container'), form: document.getElementById('dev-currency-form'), msg: document.getElementById('dev-status-msg-currency') },
            skill: { container: document.getElementById('dev-skill-container'), form: document.getElementById('dev-skill-form'), msg: document.getElementById('dev-status-msg-skill') }
        };

        /** @property {WorldBuilderUI} worldBuilder - World Builder panel instance. */
        this.worldBuilder = new WorldBuilderUI();

        // Manager Area
        this.managerArea = {
            container: document.getElementById('dev-manager-container'),
            list: document.getElementById('dev-manager-list'),
            title: document.getElementById('dev-manager-title')
        };
        
        this.bindEvents();
    }

    bindEvents() {
        // Global Dev Tools Toggle
        const btnOpen = document.getElementById('btn-dev-area');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                this.overlay.classList.remove('hidden');
                this.overlay.classList.add('active');
            });
        }

        const btnClose = document.getElementById('btn-close-devtools');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                this.overlay.classList.remove('active');
                this.overlay.classList.add('hidden');
            });
        }

        // Setup generic creation navigation
        Object.keys(this.areas).forEach(key => {
            const btnOpenArea = document.getElementById(`dev-action-${key}`);
            const btnBackArea = document.getElementById(`btn-dev-back-${key}`) || document.getElementById('btn-dev-back');
            const areaObj = this.areas[key];

            if (btnOpenArea && areaObj.container) {
                btnOpenArea.addEventListener('click', () => {
                    this.listArea.classList.add('hidden');
                    areaObj.container.classList.remove('hidden');
                    if (areaObj.form) areaObj.form.reset(); // clear when opening new
                    if (areaObj.msg) areaObj.msg.innerText = '';
                    if (key === 'linker') this.loadLinkerData();
                });
            }

            if (btnBackArea && areaObj.container) {
                btnBackArea.addEventListener('click', () => {
                    areaObj.container.classList.add('hidden');
                    this.listArea.classList.remove('hidden');
                });
            }
        });

        // World Builder button
        const btnWorldBuilder = document.getElementById('dev-action-worldbuilder');
        if (btnWorldBuilder && this.worldBuilder.container) {
            btnWorldBuilder.addEventListener('click', () => {
                this.listArea.classList.add('hidden');
                this.worldBuilder.container.classList.remove('hidden');
                this.worldBuilder.open();
            });
        }

        // Cross-module event: World Builder requests location edit form
        window.addEventListener('devtools:editLocation', (e) => {
            const loc = e.detail;
            if (loc && this.areas.location) {
                // Hide World Builder, show location editor with pre-filled data
                this.worldBuilder.container.classList.add('hidden');
                this.loadEditForm('location', loc);
            }
        });

        // Setup Manager bindings
        ['npc', 'quest', 'dialogue', 'recipe', 'item', 'location', 'enemy', 'currency', 'skill'].forEach(collection => {
            const btn = document.getElementById(`dev-manage-${collection}`);
            if (btn) {
                btn.addEventListener('click', () => this.openManager(collection));
            }
        });

        const btnBackManager = document.getElementById('btn-dev-back-manager');
        if (btnBackManager) {
            btnBackManager.addEventListener('click', () => {
                this.managerArea.container.classList.add('hidden');
                this.listArea.classList.remove('hidden');
            });
        }

        // Form Submissions
        if(this.areas.npc.form) this.areas.npc.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveNPC(); });
        if(this.areas.quest.form) this.areas.quest.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveQuest(); });
        if(this.areas.dialogue.form) this.areas.dialogue.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveDialogue(); });
        if(this.areas.linker.form) this.areas.linker.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.executeLink(); });
        if(this.areas.item.form) this.areas.item.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveItem(); });
        if(this.areas.recipe.form) this.areas.recipe.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveRecipe(); });
        if(this.areas.location.form) this.areas.location.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveLocation(); });
        if(this.areas.enemy.form) this.areas.enemy.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveEnemy(); });
        if(this.areas.currency.form) this.areas.currency.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveCurrency(); });
        if(this.areas.skill.form) this.areas.skill.form.addEventListener('submit', async (e) => { e.preventDefault(); await this.saveSkill(); });
    }

    // --- DB Manager Logic ---

    async openManager(collection) {
        this.listArea.classList.add('hidden');
        this.managerArea.container.classList.remove('hidden');
        this.managerArea.title.innerText = `Manage: ${collection.toUpperCase()}S`;
        this.managerArea.list.innerHTML = '<p class="text-dim">Loading...</p>';

        try {
            let data = [];
            if (collection === 'npc') data = await mockDatabase.getNPCs();
            else if (collection === 'quest') data = await mockDatabase.getQuests();
            else if (collection === 'dialogue') data = await mockDatabase.getDialogues();
            else if (collection === 'recipe') data = await mockDatabase.getRecipes();
            else if (collection === 'item') data = await mockDatabase.getItems();
            else if (collection === 'location') data = await mockDatabase.getLocations();
            else if (collection === 'enemy') data = await mockDatabase.getEnemies();
            else if (collection === 'currency') data = await mockDatabase.getCurrencies();
            else if (collection === 'skill') data = await mockDatabase.getSkills();
            
            this.renderManagerList(collection, data);
        } catch(e) {
            this.managerArea.list.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
        }
    }

    renderManagerList(collection, data) {
        this.managerArea.list.innerHTML = '';
        if (data.length === 0) {
            this.managerArea.list.innerHTML = '<p class="text-dim">No records found.</p>';
            return;
        }

        data.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:5px; border-bottom:1px solid var(--border-dim);";
            
            const label = item.name || item.title || item.npc || item.id;
            const spanText = document.createElement('span');
            spanText.innerHTML = `<strong>${label}</strong> <span class="text-dim" style="font-size:0.8rem;">(${item.id})</span>`;
            
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '5px';

            const btnEdit = document.createElement('button');
            btnEdit.innerText = 'Edit';
            btnEdit.className = 'btn';
            btnEdit.style.cssText = 'font-size:0.8rem; padding: 2px 5px; width:auto; border-color:#d4af37; color:#d4af37;';
            btnEdit.onclick = () => this.loadEditForm(collection, item);

            const btnDel = document.createElement('button');
            btnDel.innerText = 'Del';
            btnDel.className = 'btn';
            btnDel.style.cssText = 'font-size:0.8rem; padding: 2px 5px; width:auto; border-color:var(--crimson-red); color:var(--crimson-red);';
            btnDel.onclick = async () => {
                if(confirm(`Delete ${item.id}?`)) {
                    let collName = collection + 's';
                    if (collection === 'dialogue') collName = 'dialogues';
                    if (collection === 'enemy') collName = 'enemies';
                    if (collection === 'currency') collName = 'currencies';
                    if (collection === 'skill') collName = 'skills';
                    await mockDatabase.deleteEntity(collName, item.id);
                    this.openManager(collection); // refresh list
                }
            };

            if (collection === 'location') {
                const btnTeleport = document.createElement('button');
                btnTeleport.innerText = 'Teleport';
                btnTeleport.className = 'btn';
                btnTeleport.style.cssText = 'font-size:0.8rem; padding: 2px 5px; width:auto; border-color:var(--accent); color:var(--accent);';
                btnTeleport.onclick = () => {
                    window.dispatchEvent(new CustomEvent('teleportPlayer', { detail: item.id }));
                    this.overlay.classList.remove('active');
                    this.overlay.classList.add('hidden');
                };
                btnGroup.appendChild(btnTeleport);
            }

            btnGroup.appendChild(btnEdit);
            btnGroup.appendChild(btnDel);
            
            row.appendChild(spanText);
            row.appendChild(btnGroup);
            this.managerArea.list.appendChild(row);
        });
    }

    loadEditForm(collection, item) {
        this.managerArea.container.classList.add('hidden');
        this.areas[collection].container.classList.remove('hidden');
        if (this.areas[collection].msg) this.areas[collection].msg.innerText = "Editing existing ID will overwrite.";

        // Pre-populate fields based on collection
        if (collection === 'npc') {
            document.getElementById('dev-npc-id').value = item.id;
            document.getElementById('dev-npc-name').value = item.name;
            document.getElementById('dev-npc-sprite').value = item.spriteIcon || '';
            document.getElementById('dev-npc-isvendor').checked = item.isVendor || false;
            document.getElementById('dev-npc-vendoritems').value = item.vendorItems ? item.vendorItems.join(',') : '';
        } 
        else if (collection === 'quest') {
            document.getElementById('dev-qst-id').value = item.id;
            document.getElementById('dev-qst-title').value = item.title;
            document.getElementById('dev-qst-desc').value = item.description;
            if (item.requirements) {
                document.getElementById('dev-qst-reqlevel').value = item.requirements.level || 1;
                document.getElementById('dev-qst-reqquest').value = item.requirements.questId || '';
            }
            if (item.objectives && item.objectives.length > 0) {
                const obj = item.objectives[0]; // Assuming 1 objective for visual editor simplicity
                const [type, target] = obj.id.split('_'); 
                document.getElementById('dev-qst-objtype').value = type || 'kill';
                document.getElementById('dev-qst-objtarget').value = target || '';
                document.getElementById('dev-qst-objamount').value = obj.required || 1;
            }
            if (item.rewards) {
                document.getElementById('dev-qst-rewexp').value = item.rewards.exp || 0;
                document.getElementById('dev-qst-rewgold').value = item.rewards.gold || 0;
                if (item.rewards.items && item.rewards.items.length > 0) {
                    document.getElementById('dev-qst-rewitemid').value = item.rewards.items[0].id;
                } else {
                    document.getElementById('dev-qst-rewitemid').value = '';
                }
            }
        } 
        else if (collection === 'dialogue') {
            document.getElementById('dev-dial-id').value = item.id;
            document.getElementById('dev-dial-npc').value = item.npc;
            document.getElementById('dev-dial-text').value = item.text;
            document.getElementById('dev-dial-resps').value = JSON.stringify(item.responses, null, 2);
        }
        else if (collection === 'item') {
            document.getElementById('dev-item-id').value = item.id;
            document.getElementById('dev-item-name').value = item.name;
            document.getElementById('dev-item-weight').value = item.weight || 0;
            document.getElementById('dev-item-value').value = item.value || 0;
            document.getElementById('dev-item-maxhp').value = (item.stats && item.stats.maxHp) ? item.stats.maxHp : 0;
            document.getElementById('dev-item-maxmp').value = (item.stats && item.stats.maxMp) ? item.stats.maxMp : 0;
            document.getElementById('dev-item-rarity').value = item.rarity;
        }
        else if (collection === 'recipe') {
            document.getElementById('dev-rec-id').value = item.id;
            document.getElementById('dev-rec-name').value = item.name;
            document.getElementById('dev-rec-prof').value = item.profession;
            document.getElementById('dev-rec-level').value = item.levelReq;
            document.getElementById('dev-rec-mats').value = JSON.stringify(item.materials, null, 2);
            document.getElementById('dev-rec-result').value = JSON.stringify(item.resultItem, null, 2);
        }
        else if (collection === 'location') {
            document.getElementById('dev-loc-id').value = item.id;
            document.getElementById('dev-loc-name').value = item.name;
            document.getElementById('dev-loc-desc').value = item.description;
            document.getElementById('dev-loc-conns').value = item.connections ? item.connections.join(',') : '';
            document.getElementById('dev-loc-npcs').value = item.npcs ? item.npcs.join(',') : '';
            document.getElementById('dev-loc-encs').value = item.encounters ? JSON.stringify(item.encounters) : '[]';
            document.getElementById('dev-loc-ints').value = item.interactions ? JSON.stringify(item.interactions, null, 2) : '[]';
            document.getElementById('dev-loc-conds').value = item.connectionConditions ? JSON.stringify(item.connectionConditions, null, 2) : '{}';
        }
        else if (collection === 'enemy') {
            document.getElementById('dev-eny-id').value = item.id;
            document.getElementById('dev-eny-name').value = item.name;
            document.getElementById('dev-eny-hp').value = item.hp;
            document.getElementById('dev-eny-str').value = item.str;
            document.getElementById('dev-eny-exp').value = item.exp;
            document.getElementById('dev-eny-drops').value = item.drops ? JSON.stringify(item.drops) : '[]';
        }
        else if (collection === 'currency') {
            document.getElementById('dev-cur-id').value = item.id;
            document.getElementById('dev-cur-name').value = item.name;
            document.getElementById('dev-cur-icon').value = item.icon || '';
            document.getElementById('dev-cur-color').value = item.color || '#ffd700';
        }
        else if (collection === 'skill') {
            document.getElementById('dev-skl-id').value = item.id;
            document.getElementById('dev-skl-name').value = item.name;
            document.getElementById('dev-skl-mpcost').value = item.mpCost || 0;
            document.getElementById('dev-skl-scalestat').value = item.scaleStat || 'none';
            document.getElementById('dev-skl-dmgmult').value = item.dmgMult || 0;
            document.getElementById('dev-skl-healbase').value = item.healBase || 0;
        }
    }

    // --- Creation/Update Logic ---

    async saveNPC() {
        this.areas.npc.msg.innerText = "Saving...";
        try {
            const npcData = {
                id: document.getElementById('dev-npc-id').value,
                name: document.getElementById('dev-npc-name').value,
                spriteIcon: document.getElementById('dev-npc-sprite').value,
                isVendor: document.getElementById('dev-npc-isvendor').checked,
                vendorItems: document.getElementById('dev-npc-vendoritems').value ? document.getElementById('dev-npc-vendoritems').value.split(',').map(s=>s.trim()) : [],
                defaultDialogueId: null
            };
            // To prevent clearing out default dialogue ID when editing randomly
            const existing = await mockDatabase.getNPCs().then(all => all.find(n => n.id === npcData.id));
            if (existing) npcData.defaultDialogueId = existing.defaultDialogueId;

            await mockDatabase.saveNPC(npcData);
            this.areas.npc.msg.innerText = `NPC "${npcData.name}" saved!`;
            this.areas.npc.form.reset();
        } catch (err) {
            this.areas.npc.msg.innerText = `Error: ${err.message}`;
        }
    }

    async saveQuest() {
        this.areas.quest.msg.innerText = "Formatting and saving...";
        try {
            const objType = document.getElementById('dev-qst-objtype').value;
            const objTarget = document.getElementById('dev-qst-objtarget').value;
            const objAmount = parseInt(document.getElementById('dev-qst-objamount').value, 10);
            
            const objId = `${objType}_${objTarget}`;
            const objDesc = `${objType.charAt(0).toUpperCase() + objType.slice(1)} ${objAmount} ${objTarget}`;

            const objectives = [{
                id: objId,
                desc: objDesc,
                required: objAmount
            }];

            const rewExp = parseInt(document.getElementById('dev-qst-rewexp').value, 10);
            const rewGold = parseInt(document.getElementById('dev-qst-rewgold').value, 10);
            const rewItemId = document.getElementById('dev-qst-rewitemid').value;

            const rewards = {};
            if (rewExp > 0) rewards.exp = rewExp;
            if (rewGold > 0) rewards.gold = rewGold;
            if (rewItemId) {
                rewards.items = [{ id: rewItemId, qty: 1 }];
            }

            const quest = {
                id: document.getElementById('dev-qst-id').value,
                title: document.getElementById('dev-qst-title').value,
                description: document.getElementById('dev-qst-desc').value,
                requirements: {
                    level: parseInt(document.getElementById('dev-qst-reqlevel').value, 10) || 1,
                    questId: document.getElementById('dev-qst-reqquest').value || null
                },
                objectives: objectives,
                rewards: rewards
            };

            await mockDatabase.saveQuest(quest);
            this.areas.quest.msg.innerText = `Quest Saved!`;
            this.areas.quest.form.reset();
        } catch (err) {
            this.areas.quest.msg.innerText = `Error: ${err.message}`;
        }
    }

    async saveDialogue() {
        this.areas.dialogue.msg.innerText = "Validating...";
        try {
            const node = {
                id: document.getElementById('dev-dial-id').value,
                npc: document.getElementById('dev-dial-npc').value,
                text: document.getElementById('dev-dial-text').value,
                responses: JSON.parse(document.getElementById('dev-dial-resps').value)
            };
            await mockDatabase.saveDialogue(node);
            this.areas.dialogue.msg.innerText = `Dialogue Node saved!`;
            this.areas.dialogue.form.reset();
        } catch (err) {
            this.areas.dialogue.msg.innerText = `JSON Error: ${err.message}`;
        }
    }

    async saveItem() {
        this.areas.item.msg.innerText = "Validating and saving...";
        try {
            const item = {
                id: document.getElementById('dev-item-id').value,
                name: document.getElementById('dev-item-name').value,
                weight: parseInt(document.getElementById('dev-item-weight').value, 10),
                value: parseInt(document.getElementById('dev-item-value').value, 10) || 0,
                rarity: document.getElementById('dev-item-rarity').value,
            };
            
            // Build stats object if maxHp or maxMp inputs are populated
            let maxHp = parseInt(document.getElementById('dev-item-maxhp').value, 10) || 0;
            let maxMp = parseInt(document.getElementById('dev-item-maxmp').value, 10) || 0;
            if(maxHp !== 0 || maxMp !== 0) {
                item.stats = {};
                if(maxHp !== 0) item.stats.maxHp = maxHp;
                if(maxMp !== 0) item.stats.maxMp = maxMp;
            }
            await mockDatabase.saveItem(item);
            this.areas.item.msg.innerText = `Item "${item.name}" saved!`;
            this.areas.item.form.reset();
        } catch (err) {
            this.areas.item.msg.innerText = `Error: ${err.message}`;
        }
    }

    async saveRecipe() {
        this.areas.recipe.msg.innerText = "Parsing and saving...";
        try {
            const recipe = {
                id: document.getElementById('dev-rec-id').value,
                name: document.getElementById('dev-rec-name').value,
                profession: document.getElementById('dev-rec-prof').value,
                levelReq: parseInt(document.getElementById('dev-rec-level').value, 10),
                materials: JSON.parse(document.getElementById('dev-rec-mats').value),
                resultItem: JSON.parse(document.getElementById('dev-rec-result').value)
            };
            await mockDatabase.saveRecipe(recipe);
            this.areas.recipe.msg.innerText = `Recipe "${recipe.name}" saved!`;
            this.areas.recipe.form.reset();
        } catch (err) {
            this.areas.recipe.msg.innerText = `Error parsing JSON: ${err.message}`;
        }
    }

    async saveLocation() {
        this.areas.location.msg.innerText = "Parsing and saving...";
        try {
            const connsRaw = document.getElementById('dev-loc-conns').value.trim();
            const npcsRaw = document.getElementById('dev-loc-npcs').value.trim();
            const encsRaw = document.getElementById('dev-loc-encs').value.trim() || '[]';
            const intsRaw = document.getElementById('dev-loc-ints').value.trim() || '[]';
            const condsRaw = document.getElementById('dev-loc-conds').value.trim() || '{}';
            
            const locationData = {
                id: document.getElementById('dev-loc-id').value,
                name: document.getElementById('dev-loc-name').value,
                description: document.getElementById('dev-loc-desc').value,
                connections: connsRaw ? connsRaw.split(',').map(s => s.trim()) : [],
                npcs: npcsRaw ? npcsRaw.split(',').map(s => s.trim()) : [],
                encounters: JSON.parse(encsRaw),
                interactions: JSON.parse(intsRaw),
                connectionConditions: JSON.parse(condsRaw)
            };
            await mockDatabase.saveLocation(locationData);
            this.areas.location.msg.innerText = `Location "${locationData.name}" saved!`;
            this.areas.location.form.reset();
            window.dispatchEvent(new CustomEvent('locationsUpdated'));
        } catch (err) {
            this.areas.location.msg.innerText = `Error: ${err.message}`;
        }
    }

    async saveEnemy() {
        this.areas.enemy.msg.innerText = "Parsing and saving...";
        try {
            const enemyData = {
                id: document.getElementById('dev-eny-id').value,
                name: document.getElementById('dev-eny-name').value,
                hp: parseInt(document.getElementById('dev-eny-hp').value, 10),
                str: parseInt(document.getElementById('dev-eny-str').value, 10),
                exp: parseInt(document.getElementById('dev-eny-exp').value, 10),
                drops: JSON.parse(document.getElementById('dev-eny-drops').value || '[]')
            };
            await mockDatabase.saveEnemy(enemyData);
            this.areas.enemy.msg.innerText = `Enemy "${enemyData.name}" saved!`;
            this.areas.enemy.form.reset();
        } catch (err) {
            this.areas.enemy.msg.innerText = `Error: ${err.message}`;
        }
    }

    async saveCurrency() {
        this.areas.currency.msg.innerText = "Parsing and saving...";
        try {
            const currencyData = {
                id: document.getElementById('dev-cur-id').value,
                name: document.getElementById('dev-cur-name').value,
                icon: document.getElementById('dev-cur-icon').value,
                color: document.getElementById('dev-cur-color').value
            };
            await mockDatabase.saveCurrency(currencyData);
            this.areas.currency.msg.innerText = `Currency "${currencyData.name}" saved!`;
            this.areas.currency.form.reset();
        } catch (err) {
            this.areas.currency.msg.innerText = `Error: ${err.message}`;
        }
    }

    async saveSkill() {
        this.areas.skill.msg.innerText = "Saving skill...";
        try {
            const skillData = {
                id: document.getElementById('dev-skl-id').value,
                name: document.getElementById('dev-skl-name').value,
                mpCost: parseInt(document.getElementById('dev-skl-mpcost').value, 10) || 0,
                scaleStat: document.getElementById('dev-skl-scalestat').value,
                dmgMult: parseFloat(document.getElementById('dev-skl-dmgmult').value) || 0,
                healBase: parseInt(document.getElementById('dev-skl-healbase').value, 10) || 0
            };
            await mockDatabase.saveSkill(skillData);
            this.areas.skill.msg.innerText = `Skill "${skillData.name}" saved!`;
            this.areas.skill.form.reset();
        } catch (err) {
            this.areas.skill.msg.innerText = `Error: ${err.message}`;
        }
    }

    // --- The Linker Specific Logic ---

    async loadLinkerData() {
        this.areas.linker.msg.innerText = "Fetching engine data...";
        
        try {
            const [npcs, quests, dialogues] = await Promise.all([
                mockDatabase.getNPCs(),
                mockDatabase.getQuests(),
                mockDatabase.getDialogues()
            ]);

            const selNpc = document.getElementById('dev-link-npc');
            const selQuest = document.getElementById('dev-link-quest');
            const selDial = document.getElementById('dev-link-dial');

            // Clear dropwdowns
            selNpc.innerHTML = '';
            selQuest.innerHTML = '<option value="">-- None --</option>';
            selDial.innerHTML = '';

            npcs.forEach(n => {
                selNpc.innerHTML += `<option value="${n.id}">${n.name} (${n.id})</option>`;
            });

            quests.forEach(q => {
                selQuest.innerHTML += `<option value="${q.id}">${q.title} (${q.id})</option>`;
            });

            dialogues.forEach(d => {
                selDial.innerHTML += `<option value="${d.id}">${d.id} (${d.npc})</option>`;
            });

            this.areas.linker.msg.innerText = "";
        } catch(err) {
            this.areas.linker.msg.innerText = `Error loading logic: ${err.message}`;
        }
    }

    async executeLink() {
        this.areas.linker.msg.innerText = "Patching entity relationships...";
        
        try {
            const npcId = document.getElementById('dev-link-npc').value;
            const dialId = document.getElementById('dev-link-dial').value;
            const questId = document.getElementById('dev-link-quest').value;

            if (!npcId || !dialId) throw new Error("NPC and Dialogue Tree are required.");

            // 1. Fetch the exact NPC and update default dialogue
            const npcs = await mockDatabase.getNPCs();
            const npc = npcs.find(n => n.id === npcId);
            if (!npc) throw new Error("NPC not found.");
            
            npc.defaultDialogueId = dialId;
            await mockDatabase.saveNPC(npc);

            // 2. Fetch the dialogue node and inject quest if provided
            if (questId) {
                const dials = await mockDatabase.getDialogues();
                const dial = dials.find(d => d.id === dialId);
                
                if (dial) {
                    let hasQuestAction = false;
                    for (let resp of dial.responses) {
                        if (resp.actions && resp.actions.find(a => a.type === "START_QUEST" && a.target === questId)) {
                            hasQuestAction = true;
                            break;
                        }
                    }

                    if (!hasQuestAction) {
                        dial.responses.push({
                            text: `[Accept Quest] I will do it.`,
                            nextNodeId: null,
                            conditions: null,
                            actions: [{ type: "START_QUEST", target: questId }]
                        });
                        await mockDatabase.saveDialogue(dial);
                    }
                }
            }

            this.areas.linker.msg.innerText = `Successfully established links.`;
        } catch(err) {
            this.areas.linker.msg.innerText = `Error: ${err.message}`;
        }
    }
}
