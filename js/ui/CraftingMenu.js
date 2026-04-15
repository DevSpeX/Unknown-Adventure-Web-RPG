import { mockDatabase } from '../core/database.js';
import { GlobalLog } from './ActionLog.js';

/**
 * @file CraftingMenu.js
 * @description Advanced Crafting UI with checkmarks and visual timers.
 */
export default class CraftingMenu {
    constructor(engine) {
        this.engine = engine;
        this.recipes = [];
        this.overlay = document.getElementById('crafting-overlay');
        this.listContainer = document.getElementById('crafting-list');

        this.bindEvents();
    }

    bindEvents() {
        const btnOpen = document.getElementById('btn-open-crafting');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => this.open());
        }

        const btnClose = document.getElementById('btn-close-crafting');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                this.overlay.classList.remove('active');
                this.overlay.classList.add('hidden');
            });
        }
    }

    async open() {
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('active');
        this.listContainer.innerHTML = '<p class="text-dim text-center">Loading from DB...</p>';
        
        try {
            this.recipes = await mockDatabase.getRecipes();
            this.render();
        } catch (e) {
            this.listContainer.innerHTML = '<p class="text-dim text-center" style="color:var(--crimson-red);">Error loading recipes.</p>';
        }
    }

    render() {
        this.listContainer.innerHTML = '';
        
        if (this.recipes.length === 0) {
            this.listContainer.innerHTML = '<p class="text-dim text-center">No recipes discovered yet.</p>';
            return;
        }

        this.recipes.forEach(recipe => {
            const row = document.createElement('div');
            row.style.border = '1px solid var(--border-dim)';
            row.style.padding = '10px';
            row.style.marginBottom = '10px';
            row.className = 'choice-container'; 

            // Verify global constraints
            let allValid = true;
            if (this.engine.state.player.level < recipe.levelReq) allValid = false;

            // Generate ingredient UI
            let ingHtml = `<div style="margin-top: 10px; font-size: 0.9em; background: rgba(0,0,0,0.2); padding: 5px;">
                <div class="craft-req-row" style="background:transparent; border-bottom: 1px solid #333;">
                    <span>Level Requirement: ${recipe.levelReq}</span>
                    <span class="${this.engine.state.player.level >= recipe.levelReq ? 'craft-check' : 'craft-cross'}">
                        ${this.engine.state.player.level >= recipe.levelReq ? '✔' : '✘'}
                    </span>
                </div>
            `;
            
            recipe.materials.forEach(m => {
                const count = this.engine.inventory.countItem(m.id);
                const hasEnough = count >= m.qty;
                if (!hasEnough) allValid = false;
                
                ingHtml += `
                    <div class="craft-req-row">
                        <span>[${m.name || m.id}] ${count} / ${m.qty}</span>
                        <span class="${hasEnough ? 'craft-check' : 'craft-cross'}">${hasEnough ? '✔' : '✘'}</span>
                    </div>
                `;
            });
            ingHtml += `</div>`;

            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-direction: column;">
                    <div style="color: ${allValid ? 'var(--text-main)' : 'var(--text-dim)'}; font-size: 1.1em; border-bottom: 1px solid var(--border-dim); width: 100%; padding-bottom: 5px;">
                        <strong class="text-highlight" style="font-size:1.2rem;">${recipe.name}</strong> 
                        <span style="float:right; font-size: 0.9em; color:var(--text-highlight);">Yields: ${recipe.resultItem.name}</span>
                    </div>
                    ${ingHtml}
                </div>
                <div class="craft-prog-container hidden">
                    <div class="craft-prog-fill"></div>
                </div>
            `;

            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.width = '100%';
            btn.style.marginTop = '10px';
            btn.innerText = 'Craft Item';
            if (!allValid) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            }
            
            const progCont = row.querySelector('.craft-prog-container');
            const progBar = row.querySelector('.craft-prog-fill');

            btn.onclick = () => {
                if (!allValid) return;
                
                btn.disabled = true;
                progCont.classList.remove('hidden');
                
                // Animate Crafting Box Sequence (1s)
                let width = 0;
                const interval = setInterval(() => {
                    width += 10;
                    progBar.style.width = `${width}%`;
                    if (width >= 100) {
                        clearInterval(interval);
                        progCont.classList.add('hidden');
                        progBar.style.width = '0%';
                        
                        if (this.engine.craft(recipe)) {
                            this.render(); 
                            GlobalLog.log(`Successfully crafted: ${recipe.resultItem.name}`, 'loot');
                        }
                    }
                }, 100);
            };

            row.appendChild(btn);
            this.listContainer.appendChild(row);
        });
    }
}
