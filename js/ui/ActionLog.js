/**
 * @file ActionLog.js
 * @description Global logger pushing colorful notifications to the player's footer.
 */

export default class ActionLog {
    constructor() {
        this.container = document.getElementById('action-log');
    }

    log(message, type = 'info') {
        if (!this.container) {
            console.warn(`[ActionLog] ${message}`);
            return;
        }
        
        const p = document.createElement('p');
        p.innerText = `> ${message}`;
        p.style.margin = "2px 0";
        p.style.textShadow = "0 0 3px rgba(0,0,0,0.8)";
        
        switch(type) {
            case 'critical': 
                p.style.color = 'var(--crimson-red)'; 
                break;
            case 'loot': 
                p.style.color = '#ffd700'; 
                break;
            case 'exp': 
                p.style.color = '#4CAF50'; 
                break;
            case 'levelup': 
                p.style.color = '#66b3ff'; 
                p.style.fontWeight = 'bold';
                break;
            case 'system':
                p.style.color = '#d4af37';
                p.style.fontStyle = 'italic';
                break;
            default: 
                p.style.color = 'var(--text-dim)'; 
                break;
        }
        
        this.container.appendChild(p);
        this.container.parentElement.scrollTop = this.container.parentElement.scrollHeight;
    }
}

export const GlobalLog = new ActionLog();
