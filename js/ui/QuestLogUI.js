/**
 * @file QuestLogUI.js
 * @description Renders the player's active and completed quests with visual objectives.
 */
export default class QuestLogUI {
    constructor(questLog, state) {
        this.questLog = questLog;
        this.state = state;
        this.overlay = document.getElementById('quest-overlay');
        this.listArea = document.getElementById('quest-list-area');
        this.bindEvents();
        
        // Listen for global quest updates
        window.addEventListener('questUpdated', () => {
            if (this.overlay.classList.contains('active')) {
                this.render();
            }
            this.updateQuickView();
        });
    }

    bindEvents() {
        const btnOpen = document.getElementById('btn-open-quests');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => this.open());
        }

        const btnClose = document.getElementById('btn-close-quests');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                this.overlay.classList.remove('active');
                this.overlay.classList.add('hidden');
            });
        }
    }

    open() {
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('active');
        this.render();
    }

    render() {
        this.listArea.innerHTML = '';
        
        const activeQuests = this.state.player.activeQuests || {};
        const completedQuests = this.state.player.completedQuests || [];

        const noQuests = Object.keys(activeQuests).length === 0 && completedQuests.length === 0;
        if (noQuests) {
            this.listArea.innerHTML = '<p class="text-dim text-center" style="margin-top:2rem;">Your journal is empty.</p>';
            this.updateQuickView();
            return;
        }

        // Render Active Quests
        Object.values(activeQuests).forEach(quest => {
            const card = document.createElement('div');
            card.className = 'choice-container';
            card.style.border = '1px solid var(--border-gold)';
            card.style.padding = '10px';
            card.style.marginBottom = '10px';

            let objHtml = quest.objectives.map(o => {
                const color = o.complete ? 'var(--text-highlight)' : 'var(--text-dim)';
                const mark = o.complete ? '☑' : '☐';
                return `<div style="color: ${color}; margin-left: 15px;">${mark} ${o.desc} (${o.current}/${o.required})</div>`;
            }).join('');

            const isTracked = quest.tracked ? 'checked' : '';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4 style="color: var(--text-highlight); margin-bottom: 5px;">${quest.title} (Active)</h4>
                    <label style="font-size: 0.8rem; cursor:pointer; color: var(--text-dim);">Track <input type="checkbox" class="track-cb" data-qid="${quest.id}" ${isTracked}></label>
                </div>
                <p style="font-size: 0.9sm; margin-bottom: 10px;">${quest.description}</p>
                ${objHtml}
            `;
            this.listArea.appendChild(card);
        });

        // Render Completed Quests minimalistically
        completedQuests.forEach(qId => {
            const template = this.questLog.questData[qId];
            if (!template) return;
            
            const card = document.createElement('div');
            card.className = 'choice-container';
            card.style.border = '1px solid var(--border-dim)';
            card.style.opacity = '0.7';
            card.style.padding = '10px';
            card.style.marginBottom = '10px';
            card.innerHTML = `<h4 style="color: var(--text-dim);">☑ ${template.title} (Completed)</h4>`;
            this.listArea.appendChild(card);
        });

        // Attach listeners to tracking checkboxes
        this.listArea.querySelectorAll('.track-cb').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const qid = e.target.getAttribute('data-qid');
                this.state.player.activeQuests[qid].tracked = e.target.checked;
                this.updateQuickView();
            });
        });
        
        this.updateQuickView();
    }

    updateQuickView() {
        const tracker = document.getElementById('quest-tracker');
        if (!tracker) return;
        tracker.innerHTML = '';
        
        let hasTracked = false;
        const activeQuests = this.state.player.activeQuests || {};
        
        Object.values(activeQuests).forEach(q => {
             if (q.tracked) {
                 hasTracked = true;
                 const wrap = document.createElement('div');
                 wrap.style.marginBottom = '8px';
                 wrap.style.paddingLeft = '5px';
                 wrap.style.borderLeft = '2px solid var(--border-gold)';
                 wrap.innerHTML = `<div style="color:var(--text-highlight); font-weight:bold; margin-bottom:2px;">${q.title}</div>`;
                 q.objectives.forEach(o => {
                     const color = o.complete ? 'var(--text-dim)' : 'var(--text-main)';
                     wrap.innerHTML += `<div style="color:${color}; font-size:0.85rem; padding-left:5px;">- ${o.desc} (${o.current}/${o.required})</div>`;
                 });
                 tracker.appendChild(wrap);
             }
        });
        
        if (!hasTracked) {
             tracker.innerHTML = '<p class="text-dim">No quests tracked.</p>';
        }
    }
}
