/**
 * @file DialogueEngine.js
 * @description Processes Branching Narrative, evaluating stat/item requirements and triggering actions.
 */
export default class DialogueEngine {
    constructor(state, inventory, questLog, db) {
        this.state = state;
        this.inventory = inventory;
        this.questLog = questLog;
        this.db = db;
        this.dialogues = {};
        this.currentNodeNode = null;
    }

    async init() {
        const nodes = await this.db.getDialogues();
        nodes.forEach(d => {
            this.dialogues[d.id] = d;
        });
    }

    getNode(nodeId) {
        return this.dialogues[nodeId];
    }

    /**
     * Evaluates if a given response is clickable by the player.
     * @param {Object} response - The response object containing optional 'conditions'
     * @returns {Object} { valid: boolean, reason: string }
     */
    evaluateCondition(response) {
        if (!response.conditions) return { valid: true };

        const c = response.conditions;
        if (c.minLevel !== undefined && this.state.player.level < c.minLevel) {
            return { valid: false, reason: `Requires Level ${c.minLevel}` };
        }
        if (c.requiredItem !== undefined) {
            if (!this.inventory.hasItem(c.requiredItem.id, c.requiredItem.qty || 1)) {
                return { valid: false, reason: `Missing ${c.requiredItem.qty || 1}x ${c.requiredItem.id}` };
            }
        }
        
        return { valid: true };
    }

    /**
     * Executes the actions tied to a successful response.
     * @param {Object} response
     */
    executeActions(response) {
        if (!response.actions) return;

        response.actions.forEach(act => {
            switch (act.type) {
                case 'START_QUEST':
                    this.questLog.startQuest(act.target);
                    break;
                case 'CANCEL_QUEST':
                    this.questLog.cancelQuest(act.target);
                    break;
                case 'ADVANCE_OBJECTIVE':
                    // format: target = "questId:objectiveId"
                    const [qId, oId] = act.target.split(':');
                    this.questLog.updateObjective(qId, oId, act.amount || 1);
                    break;
                case 'GIVE_ITEM':
                    this.inventory.addItem(act.item, act.qty || 1);
                    break;
                case 'GIVE_EXP':
                    this.state.gainExp(act.amount);
                    break;
                case 'SET_FLAG':
                    this.state.setFlag(act.target, act.value);
                    break;
                default:
                    console.warn("Unknown dialogue action:", act.type);
            }
        });
    }
}
