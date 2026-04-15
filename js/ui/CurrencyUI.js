import { mockDatabase } from '../core/database.js';

export default class CurrencyUI {
    constructor(state) {
        this.state = state;
        this.overlay = document.getElementById('currency-overlay');
        this.listContainer = document.getElementById('currency-list');
        
        window.addEventListener('openCurrencyBag', () => this.open());

        const btnClose = document.getElementById('btn-close-currency');
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
        await this.render();
    }

    async render() {
        this.listContainer.innerHTML = '<p class="text-dim text-center">Counting coins...</p>';
        
        const wallet = this.state.player.wallet || {};
        const currencies = await mockDatabase.getCurrencies();
        
        this.listContainer.innerHTML = '';
        
        let totalWealth = 0;
        
        // Core currencies grouped together
        const ordered = [...currencies].sort((a,b) => {
            const order = { 'gold': 1, 'silver': 2, 'copper': 3 };
            return (order[a.id] || 99) - (order[b.id] || 99);
        });

        ordered.forEach(curr => {
            const amount = wallet[curr.id] || 0;
            // Always show copper/silver/gold even if 0, only show event tokens if > 0
            if (amount > 0 || ['copper', 'silver', 'gold'].includes(curr.id)) {
                totalWealth++;
                const itemDiv = document.createElement('div');
                itemDiv.style.display = 'flex';
                itemDiv.style.justifyContent = 'space-between';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.padding = '10px';
                itemDiv.style.backgroundColor = 'rgba(0,0,0,0.3)';
                itemDiv.style.border = `1px solid ${curr.color || '#fff'}`;
                itemDiv.style.borderRadius = '5px';
                
                itemDiv.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:24px;">${curr.icon || '🪙'}</span>
                        <span style="color:${curr.color}; font-weight:bold;">${curr.name}</span>
                    </div>
                    <span style="font-size:1.2rem; font-family:var(--font-terminal);">${amount}</span>
                `;
                this.listContainer.appendChild(itemDiv);
            }
        });
        
        if (totalWealth === 0) {
            this.listContainer.innerHTML = '<p class="text-dim text-center">Your bag is completely empty.</p>';
        }
    }
}
