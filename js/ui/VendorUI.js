import { mockDatabase } from '../core/database.js';

export default class VendorUI {
    constructor(state, inventory) {
        this.state = state;
        this.inventory = inventory;
        
        this.overlay = document.getElementById('vendor-overlay');
        this.title = document.getElementById('vendor-title');
        this.walletDisplay = document.getElementById('vendor-wallet-display');
        this.listArea = document.getElementById('vendor-items-list');
        
        this.tabBuy = document.getElementById('btn-vendor-tab-buy');
        this.tabSell = document.getElementById('btn-vendor-tab-sell');
        
        this.currentMode = 'buy';
        this.vendorItems = [];
        
        this.bindEvents();
    }
    
    bindEvents() {
        window.addEventListener('openVendorShop', (e) => this.open(e.detail.vendorName, e.detail.vendorItems));
        
        document.getElementById('btn-close-vendor').addEventListener('click', () => {
            this.overlay.classList.remove('active');
            this.overlay.classList.add('hidden');
        });
        
        this.tabBuy.addEventListener('click', () => {
            this.currentMode = 'buy';
            this.tabBuy.className = 'btn text-highlight';
            this.tabSell.className = 'btn text-dim';
            this.render();
        });
        
        this.tabSell.addEventListener('click', () => {
            this.currentMode = 'sell';
            this.tabSell.className = 'btn text-highlight';
            this.tabBuy.className = 'btn text-dim';
            this.render();
        });
    }

    async open(vendorName, vendorItems) {
        this.title.innerText = `Merchant: ${vendorName}`;
        this.vendorItems = vendorItems || [];
        this.currentMode = 'buy';
        this.tabBuy.className = 'btn text-highlight';
        this.tabSell.className = 'btn text-dim';
        
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('active');
        await this.render();
    }
    
    updateWalletDisplay() {
        const c = this.state.player.wallet.copper || 0;
        const s = this.state.player.wallet.silver || 0;
        const g = this.state.player.wallet.gold || 0;
        
        let text = [];
        if(g>0) text.push(`${g} Gold`);
        if(s>0) text.push(`${s} Silver`);
        text.push(`${c} Copper`);
        
        this.walletDisplay.innerText = `Wallet: ${text.join(', ')}`;
    }

    async render() {
        this.updateWalletDisplay();
        this.listArea.innerHTML = '';
        
        if (this.currentMode === 'buy') {
            const allDbItems = await mockDatabase.getItems();
            let hasItems = false;
            
            this.vendorItems.forEach(itemId => {
                const dbItem = allDbItems.find(i => i.id === itemId);
                if(dbItem) {
                    hasItems = true;
                    // Buy price equals base value, fallback to 10
                    const cost = dbItem.value || 10;
                    this.appendItemCard(dbItem, cost, true);
                }
            });
            
            if(!hasItems) {
                this.listArea.innerHTML = '<p class="text-dim" style="grid-column: 1/-1; text-align:center;">This vendor has nothing for sale right now.</p>';
            }
        } else {
            // Sell mode
            let hasDroppables = false;
            
            this.inventory.items.forEach(item => {
                if(item.id !== 'currency_bag') { 
                    hasDroppables = true;
                    // Sell price is 50% of value
                    const sellPrice = Math.floor((item.value || 0) / 2) || 1;
                    this.appendItemCard(item, sellPrice, false);
                }
            });
            
            if(!hasDroppables) {
                this.listArea.innerHTML = '<p class="text-dim" style="grid-column: 1/-1; text-align:center;">You have nothing to sell.</p>';
            }
        }
    }
    
    appendItemCard(item, price, isBuy) {
        const card = document.createElement('div');
        card.className = 'panel';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        
        let prefix = isBuy ? 'Cost' : 'Sell For';
        
        card.innerHTML = `
            <div style="text-align:center;">
                <strong style="color:var(--text-highlight);">${item.name}</strong><br>
                <span class="text-dim" style="font-size:0.8rem;">Weight: ${item.weight || 0}</span>
            </div>
            <div style="text-align:center;">
                <span style="color:#d4af37; margin-top:5px; font-weight:bold;">${prefix}: ${price} <span style="font-size:0.8rem; font-weight:normal;">Copper</span></span>
                ${!isBuy ? `<br><span class="text-dim" style="font-size:0.8rem;">You have: ${item.quantity}</span>` : ''}
            </div>
        `;
        
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.marginTop = '10px';
        btn.style.borderColor = '#d4af37';
        btn.style.color = '#d4af37';
        btn.innerText = isBuy ? 'Buy 1' : 'Sell 1';
        
        if (!isBuy) {
            btn.style.borderColor = '#ffb3b3';
            btn.style.color = '#ffb3b3';
        }
        
        btn.onclick = () => {
            if(isBuy) {
                // Cost validation
                if(this.state.payCopper(price)) {
                    const success = this.inventory.addItem(item, 1);
                    if(!success) {
                        // Refund
                        this.state.addCurrency('copper', price);
                        alert("Inventory Full!");
                    } else {
                        // Flash green effect?
                        btn.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                        setTimeout(() => btn.style.backgroundColor = '', 300);
                    }
                } else {
                    alert("Not enough money!");
                }
            } else {
                // Sell logic
                const removed = this.inventory.removeItem(item.id, 1);
                if(removed) {
                    this.state.addCurrency('copper', price);
                    // Flash golden effect
                    btn.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                    setTimeout(() => btn.style.backgroundColor = '', 300);
                }
            }
            this.render(); // Refreshes UI
            if (window.appUpdateHook) window.appUpdateHook(); // Refresh sidebar optionally
        };
        
        card.appendChild(btn);
        this.listArea.appendChild(card);
    }
}
