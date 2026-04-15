export default class LevelUpUI {
    constructor(state, equipment) {
        this.state = state;
        this.equipment = equipment;
        this.overlay = document.getElementById('levelup-overlay');
        
        this.pts = document.getElementById('levelup-points');
        this.vStr = document.getElementById('levelup-val-str');
        this.vAgi = document.getElementById('levelup-val-agi');
        this.vInt = document.getElementById('levelup-val-int');
        
        this.pending = { str: 0, agi: 0, int: 0 };
        
        document.getElementById('btn-levelup-confirm').onclick = () => this.confirm();
        
        ['str', 'agi', 'int'].forEach(stat => {
            document.getElementById(`levelup-add-${stat}`).onclick = () => {
                if (this.state.player.statPoints > 0) {
                    this.pending[stat]++;
                    this.state.player.statPoints--;
                    this.render();
                }
            };
            document.getElementById(`levelup-sub-${stat}`).onclick = () => {
                if (this.pending[stat] > 0) {
                    this.pending[stat]--;
                    this.state.player.statPoints++;
                    this.render();
                }
            };
        });
    }
    
    open() {
        if (this.state.player.statPoints <= 0) return;
        this.pending = { str: 0, agi: 0, int: 0 };
        this.overlay.classList.remove('hidden');
        // setTimeout hack to ensure display block hits DOM before animation
        setTimeout(() => this.overlay.classList.add('active'), 10);
        this.render();
    }
    
    render() {
        this.pts.innerText = this.state.player.statPoints;
        const b = this.state.player.baseAttributes;
        
        this.vStr.innerHTML = `${b.str} <span style="color:#4CAF50;">+${this.pending.str}</span>`;
        this.vAgi.innerHTML = `${b.agi} <span style="color:#4CAF50;">+${this.pending.agi}</span>`;
        this.vInt.innerHTML = `${b.int} <span style="color:#4CAF50;">+${this.pending.int}</span>`;
    }
    
    confirm() {
        // apply pending to base attributes
        this.state.player.baseAttributes.str += this.pending.str;
        this.state.player.baseAttributes.agi += this.pending.agi;
        this.state.player.baseAttributes.int += this.pending.int;
        
        this.pending = { str: 0, agi: 0, int: 0 };
        
        // Remove active class to do CSS fade out transition
        this.overlay.classList.remove('active');
        setTimeout(() => this.overlay.classList.add('hidden'), 300);
        
        // Finalize equipment math (forces recalculation of HP/MP)
        this.equipment.recalculateStats();
        
        // Update sidebar
        if (window.appUpdateHook) window.appUpdateHook();
    }
}
