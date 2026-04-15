/**
 * @file DialogueUI.js
 * @description Handles the bottom-anchored Visual Novel style dialogue box.
 */
export default class DialogueUI {
    constructor(engine) {
        this.engine = engine;
        this.overlay = document.getElementById('vn-dialogue');
        this.npcName = document.getElementById('vn-npc-name');
        this.textWindow = document.getElementById('vn-text');
        this.choicesBox = document.getElementById('vn-choices');
    }

    /**
     * Opens a dialogue node on the screen.
     * @param {string|null} nodeId - The ID of the dialogue node to open. Null to close.
     */
    openNode(nodeId) {
        if (!nodeId) {
            this.overlay.classList.add('hidden');
            return;
        }
        const node = this.engine.getNode(nodeId);
        if (!node) {
            console.error(`Dialogue node ${nodeId} not found.`);
            this.overlay.classList.add('hidden');
            return;
        }

        // Show the panel
        this.overlay.classList.remove('hidden');
        
        // Typewriter or instant text
        this.npcName.innerText = node.npc || 'Unknown Entity';
        this.textWindow.innerText = node.text;
        
        // Render Choices
        this.choicesBox.innerHTML = '';
        node.responses.forEach(res => {
            const check = this.engine.evaluateCondition(res);
            
            const btn = document.createElement('button');
            btn.className = check.valid ? 'btn' : 'btn has-tooltip';
            
            if (!check.valid) {
                 btn.disabled = true;
                 btn.style.opacity = '0.4';
                 btn.style.cursor = 'not-allowed';
                 btn.innerHTML = `${res.text} <span class="tooltip-popup">Locked: ${check.reason}</span>`;
            } else {
                 btn.innerText = res.text;
                 btn.onclick = () => {
                     this.engine.executeActions(res);
                     this.openNode(res.nextNodeId);
                 };
            }
            this.choicesBox.appendChild(btn);
        });
    }
}
