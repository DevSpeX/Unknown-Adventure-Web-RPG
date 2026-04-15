/**
 * @file InventoryUI.js
 * @description Dynamic UI for displaying and managing inventory items.
 */
import { GlobalLog } from './ActionLog.js';

export default class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.overlay = document.getElementById('inventory-overlay');
        this.listContainer = document.getElementById('inventory-list');
        this.bindEvents();
    }

    bindEvents() {
        const btnOpen = document.getElementById('btn-open-inventory');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => this.open());
        }

        const btnClose = document.getElementById('btn-close-inventory');
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

    showContextMenu(e, item) {
        // Remove existing
        const existing = document.getElementById('item-context-menu');
        if (existing) existing.remove();
        
        const menu = document.createElement('div');
        menu.id = 'item-context-menu';
        menu.className = 'item-context-menu';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        
        if (item.id === 'currency_bag') {
            const btn = document.createElement('button');
            btn.innerText = 'Open Bag';
            btn.onclick = () => { window.dispatchEvent(new CustomEvent('openCurrencyBag')); menu.remove(); };
            menu.appendChild(btn);
        } else {
            // Determine options based on type
            if (this.equipmentRef && item.type) {
                const eqBtn = document.createElement('button');
                eqBtn.innerText = 'Equip';
                if (item.reqLevel && this.equipmentRef.state.player.level < item.reqLevel) {
                    eqBtn.style.color = 'var(--text-dim)';
                    eqBtn.innerText += ` (Req Lvl ${item.reqLevel})`;
                } else {
                    eqBtn.onclick = () => { 
                        this.equipmentRef.equip(item.id); 
                        GlobalLog.log(`Equipped ${item.name}.`, 'system');
                        this.render(); 
                        menu.remove(); 
                    };
                }
                menu.appendChild(eqBtn);
            } 
            
            // Assume consumable if not equippable or specifically consumable type
            if (!item.type || item.type === 'consumable') {
                const useBtn = document.createElement('button');
                useBtn.innerText = 'Use / Consume';
                useBtn.onclick = () => {
                    this.inventory.removeItem(item.id, 1);
                    GlobalLog.log(`You used ${item.name}.`, 'loot');
                    this.render(); 
                    menu.remove(); 
                };
                menu.appendChild(useBtn);
            }
            
            const dropBtn = document.createElement('button');
            dropBtn.innerText = 'Discard';
            dropBtn.style.color = 'var(--crimson-red)';
            dropBtn.onclick = () => { 
                this.inventory.removeItem(item.id, 1); 
                GlobalLog.log(`Discarded ${item.name}.`, 'system');
                this.render(); 
                menu.remove(); 
            };
            menu.appendChild(dropBtn);
        }
        
        document.body.appendChild(menu);
        
        // click aside to close
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(ev) {
                if (!menu.contains(ev.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }

    render() {
        this.listContainer.innerHTML = '';
        
        if (this.inventory.items.length === 0) {
            this.listContainer.innerHTML = '<p class="text-dim text-center" style="margin-top: 2rem;">Your pack is empty.</p>';
            return;
        }

        const listNode = document.createElement('div');
        listNode.style.display = 'grid';
        listNode.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        listNode.style.gap = '10px';

        this.inventory.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'panel';
            if (item.rarity) card.classList.add(`rarity-${item.rarity.toLowerCase()}`);
            
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.cursor = 'pointer';

            card.innerHTML = `
                <strong style="color: var(--text-highlight); text-align:center;">${item.name || item.id}</strong>
                <span class="text-dim" style="font-size:0.8rem; margin-bottom:5px;">Qty: ${item.quantity}</span>
            `;

            card.onclick = (e) => this.showContextMenu(e, item);
            listNode.appendChild(card);
        });

        const statsRow = document.createElement('div');
        statsRow.style.width = '100%';
        statsRow.style.padding = '10px';
        statsRow.style.marginTop = 'auto';
        statsRow.style.borderTop = '1px solid var(--border-dim)';
        statsRow.style.textAlign = 'right';
        statsRow.innerHTML = `<strong>Total Weight:</strong> ${this.inventory.getTotalWeight()} / ${this.inventory.maxWeight}`;
        
        this.listContainer.appendChild(listNode);
        this.listContainer.appendChild(statsRow);
    }
}
