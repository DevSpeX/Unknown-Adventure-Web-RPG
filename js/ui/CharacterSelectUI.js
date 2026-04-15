import { mockDatabase } from '../core/database.js?v=15';

export default class CharacterSelectUI {
    constructor(user, onCharacterSelect, onCreateNew) {
        this.user = user;
        this.onCharacterSelect = onCharacterSelect;
        this.onCreateNew = onCreateNew;
        
        this.overlay = document.getElementById('char-select-overlay');
        this.listContainer = document.getElementById('char-list-container');
        this.createNewBtn = document.getElementById('btn-create-new-char');
        
        this.bindEvents();
        this.show();
    }

    bindEvents() {
        // Clone to wipe previous listeners (useful if signing out and in)
        const newBtn = this.createNewBtn.cloneNode(true);
        this.createNewBtn.parentNode.replaceChild(newBtn, this.createNewBtn);
        this.createNewBtn = newBtn;
        
        this.createNewBtn.addEventListener('click', () => {
             this.hide();
             this.onCreateNew(this.user);
        });
    }

    async show() {
        this.overlay.classList.remove('hidden');
        this.listContainer.innerHTML = '<p class="text-dim" style="text-align: center;">Fetching characters...</p>';
        
        try {
            const chars = await mockDatabase.getCharacters(this.user.uid);
            this.renderList(chars);
        } catch (e) {
            this.listContainer.innerHTML = '<p class="auth-error">Failed to load characters.</p>';
        }
    }

    hide() {
        this.overlay.classList.add('hidden');
    }

    renderList(chars) {
        this.listContainer.innerHTML = '';
        
        if (chars.length === 0) {
            this.listContainer.innerHTML = '<p class="text-dim" style="text-align: center; margin-bottom: 15px;">You have no characters yet. Create one to begin!</p>';
            return;
        }

        chars.forEach(char => {
            const card = document.createElement('div');
            card.className = 'char-card';
            
            // Info side
            const info = document.createElement('div');
            info.className = 'char-info';
            info.innerHTML = `
                <div class="char-name">${char.name}</div>
                <div class="char-meta">LvL ${char.level} - ${char.origin}</div>
            `;
            
            // Actions
            const actions = document.createElement('div');
            actions.className = 'char-actions';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'btn';
            playBtn.innerText = 'Play';
            playBtn.onclick = () => {
                this.hide();
                this.onCharacterSelect(this.user, char);
            };
            
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger';
            delBtn.innerText = 'Delete';
            delBtn.onclick = async () => {
                if(confirm(`Are you sure you want to delete ${char.name}?`)) {
                    delBtn.innerText = '...';
                    delBtn.disabled = true;
                    await mockDatabase.deleteCharacter(this.user.uid, char.id);
                    this.show(); // refresh
                }
            };
            
            actions.appendChild(playBtn);
            actions.appendChild(delBtn);
            
            card.appendChild(info);
            card.appendChild(actions);
            
            this.listContainer.appendChild(card);
        });
    }
}
