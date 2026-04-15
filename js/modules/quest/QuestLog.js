/**
 * @file QuestLog.js
 * @description Manages quest states, progression of objectives, and grants rewards.
 */
export default class QuestLog {
    /**
     * @param {Object} state - The global State instance (stores active quests).
     * @param {Object} inventory - To grant item rewards.
     * @param {Object} db - The mock database reference to fetch templates.
     */
    constructor(state, inventory, db) {
        this.state = state;
        this.inventory = inventory;
        this.db = db;
        this.questData = {}; // Cache of all possible quests
        
        // Initialize state quest storage if not present
        if (!this.state.player.activeQuests) {
            this.state.player.activeQuests = {};
            this.state.player.completedQuests = [];
        }
    }

    async init() {
        const quests = await this.db.getQuests();
        quests.forEach(q => {
            this.questData[q.id] = q;
        });
    }

    startQuest(questId) {
        if (this.state.player.activeQuests[questId] || this.state.player.completedQuests.includes(questId)) {
            console.warn(`Quest ${questId} is already active or completed.`);
            return;
        }

        const template = this.questData[questId];
        if (!template) {
            console.error(`Quest ${questId} not found in database.`);
            return;
        }

        // Deep copy objectives for tracking
        const activeObjectives = template.objectives.map(obj => ({
            ...obj,
            current: 0,
            complete: false
        }));

        this.state.player.activeQuests[questId] = {
            id: template.id,
            title: template.title,
            description: template.description,
            objectives: activeObjectives,
            rewards: template.rewards
        };
        
        console.log(`Started Quest: ${template.title}`);
        this.logAction(`Quest Started: ${template.title}`);
    }

    updateObjective(questId, objId, amount = 1) {
        const quest = this.state.player.activeQuests[questId];
        if (!quest) return;

        const obj = quest.objectives.find(o => o.id === objId);
        if (!obj || obj.complete) return;

        obj.current += amount;
        if (obj.current >= obj.required) {
            obj.current = obj.required;
            obj.complete = true;
            this.logAction(`Objective Complete: ${obj.desc}`);
            
            // Check overall quest completion
            if (quest.objectives.every(o => o.complete)) {
                this.completeQuest(questId);
            }
        }
    }

    cancelQuest(questId) {
        const quest = this.state.player.activeQuests[questId];
        if (!quest) return;
        
        // Remove from active without rewards
        delete this.state.player.activeQuests[questId];
        this.logAction(`Quest Cancelled: ${quest.title}`);
        
        // Notify UI to refresh trackers if linked
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('questUpdated'));
        }
    }

    completeQuest(questId) {
        const quest = this.state.player.activeQuests[questId];
        if (!quest) return;

        // Grant Rewards
        if (quest.rewards) {
            if (quest.rewards.exp) {
                this.state.gainExp(quest.rewards.exp);
                this.logAction(`Reward: +${quest.rewards.exp} EXP`);
            }
            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    this.inventory.addItem(item, item.qty);
                    this.logAction(`Reward: Received ${item.qty}x ${item.id}`);
                });
            }
        }

        this.state.player.completedQuests.push(questId);
        delete this.state.player.activeQuests[questId];
        
        this.logAction(`Quest Complete: ${quest.title}`);
        
        // Notify UI to refresh trackers if linked
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('questUpdated'));
        }
    }

    logAction(msg) {
        const logWindow = document.getElementById('action-log');
        if (logWindow) {
            const p = document.createElement('p');
            p.innerText = `> ${msg}`;
            logWindow.appendChild(p);
        }
    }
}
