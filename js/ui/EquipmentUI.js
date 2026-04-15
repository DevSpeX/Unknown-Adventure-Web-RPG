/**
 * @file EquipmentUI.js
 * @description Renders the Character UI side-by-side with Inventory and displays the Paper Doll setup.
 */
export default class EquipmentUI {
    constructor(equipment) {
        this.equipment = equipment;
        this.overlay = document.getElementById('char-overlay');
        this.slotsContainer = document.getElementById('equipment-slots');
        this.statsContainer = document.getElementById('equipment-stats');
        
        this.slotNames = {
            head: "Head",
            chest: "Chest",
            main_hand: "Main Hand",
            off_hand: "Off Hand",
            legs: "Legs",
            feet: "Feet",
            accessory: "Accessory"
        };
        
        this.bindEvents();
        window.addEventListener('equipmentChanged', () => {
            if (this.overlay.classList.contains('active')) {
                this.render();
            }
        });
    }

    bindEvents() {
        const btnClose = document.getElementById('btn-close-char');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.close());
        }
    }

    open() {
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('active');
        this.render();
    }

    close() {
        this.overlay.classList.remove('active');
        this.overlay.classList.add('hidden');
        // Clean up side-by-side classes globally handled by app.js if needed
    }

    render() {
        this.slotsContainer.innerHTML = '';
        
        // Render each slot
        const equip = this.equipment.state.player.equipment;
        Object.keys(equip).forEach(slotKey => {
            const item = equip[slotKey];
            
            const slotDiv = document.createElement('div');
            slotDiv.className = 'choice-container';
            slotDiv.style.border = item ? '1px solid var(--border-gold)' : '1px dashed var(--border-dim)';
            slotDiv.style.padding = '10px';
            slotDiv.style.marginTop = '0';
            slotDiv.style.display = 'flex';
            slotDiv.style.flexDirection = 'column';
            slotDiv.style.alignItems = 'center';
            slotDiv.style.justifyContent = 'center';
            slotDiv.style.minHeight = '80px';
            slotDiv.style.textAlign = 'center';
            
            slotDiv.innerHTML = `<span style="color:var(--text-dim); font-size:0.8rem; text-transform:uppercase;">${this.slotNames[slotKey]}</span>`;
            
            if (item) {
                const title = document.createElement('div');
                title.style.color = 'var(--text-highlight)';
                title.style.fontWeight = 'bold';
                title.style.marginTop = '5px';
                title.innerText = item.name;
                slotDiv.appendChild(title);
                
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.width = 'auto';
                btn.style.padding = '4px 8px';
                btn.style.marginTop = '10px';
                btn.innerText = 'Unequip';
                btn.onclick = () => {
                    this.equipment.unequip(slotKey);
                };
                slotDiv.appendChild(btn);
            } else {
                const empty = document.createElement('div');
                empty.style.color = 'var(--text-dim)';
                empty.style.marginTop = '5px';
                empty.style.fontStyle = 'italic';
                empty.innerText = 'Empty';
                slotDiv.appendChild(empty);
            }
            
            this.slotsContainer.appendChild(slotDiv);
        });

        // Render Summary Stats
        const attrs = this.equipment.state.player.attributes;
        this.statsContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span class="text-highlight">Total Strength:</span> <span>${attrs.str}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span class="text-highlight">Total Agility:</span> <span>${attrs.agi}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span class="text-highlight">Total Intellect:</span> <span>${attrs.int}</span>
            </div>
        `;
    }
}
