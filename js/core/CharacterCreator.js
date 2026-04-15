/**
 * @file CharacterCreator.js
 * @description Manages the step-by-step button-based character creation flow.
 * Interacts with the DOM to render options with tooltips and updates State.js.
 */
export default class CharacterCreator {
    /**
     * @param {Object} state - The global game State instance.
     * @param {Function} updateUICallback - Function to call to refresh sidebar stats.
     */
    constructor(state, updateUICallback) {
        this.state = state;
        this.updateUI = updateUICallback;
        this.currentStep = 0;
        
        // Temporary builder state
        this.builder = {
            origin: null,
            attributes: { str: 5, agi: 5, int: 5 },
            availablePoints: 5,
            name: "Traveler"
        };
    }

    /**
     * Starts the creator sequence.
     */
    start(user, onComplete) {
        this.currentUser = user;
        this.onComplete = onComplete;
        this.currentStep = 0;
        this.renderStep();
    }

    /**
     * Renders the current step into the Main View.
     */
    renderStep() {
        const contentDiv = document.getElementById('main-content');
        const choicesDiv = document.getElementById('choices-container');
        
        contentDiv.innerHTML = '';
        choicesDiv.innerHTML = '';

        switch (this.currentStep) {
            case 0:
                this.renderOriginSelect(contentDiv, choicesDiv);
                break;
            case 1:
                this.renderAttributeSelect(contentDiv, choicesDiv);
                break;
            case 2:
                this.renderFinalize(contentDiv, choicesDiv);
                break;
            case 3:
                this.finish();
                break;
        }
    }

    /**
     * Step 0: Origin Selection
     */
    renderOriginSelect(contentDiv, choicesDiv) {
        contentDiv.innerHTML = `
            <p>Welcome to the realm. Before your journey begins, you must remember who you are.</p>
            <p><strong>Choose your Origin:</strong></p>
        `;

        const origins = [
            { id: "knight", name: "Fallen Knight", desc: "A disgraced warrior. Starts with higher Strength.", str: 2, agi: 0, int: 0 },
            { id: "thief", name: "Gutter Thief", desc: "Raised in the shadows. Starts with higher Agility.", str: 0, agi: 2, int: 0 },
            { id: "scholar", name: "Exiled Scholar", desc: "A seeker of forbidden knowledge. Starts with higher Intellect.", str: 0, agi: 0, int: 2 }
        ];

        origins.forEach(orig => {
            const btn = document.createElement('button');
            btn.className = 'btn has-tooltip';
            btn.innerHTML = `
                ${orig.name}
                <span class="tooltip-popup">
                    <strong>${orig.name}</strong><br/>
                    ${orig.desc}<br/>
                    <em>Bonuses: +${orig.str} STR, +${orig.agi} AGI, +${orig.int} INT</em>
                </span>
            `;
            btn.onclick = () => {
                this.builder.origin = orig.name;
                this.builder.attributes.str += orig.str;
                this.builder.attributes.agi += orig.agi;
                this.builder.attributes.int += orig.int;
                
                this.state.updatePlayer({
                    origin: this.builder.origin,
                    baseAttributes: { ...this.builder.attributes },
                    attributes: { ...this.builder.attributes } // Initial total matches base
                });
                
                this.updateUI();
                this.currentStep++;
                this.renderStep();
            };
            choicesDiv.appendChild(btn);
        });
    }

    /**
     * Step 1: Attribute Point Distribution
     */
    renderAttributeSelect(contentDiv, choicesDiv) {
        contentDiv.innerHTML = `
            <p>You have <strong>${this.builder.availablePoints}</strong> attribute points remaining.</p>
            <p>Distribute them to shape your capabilities.</p>
        `;

        const attrs = [
            { key: 'str', name: 'Strength', desc: 'Determines physical damage and carrying capacity.' },
            { key: 'agi', name: 'Agility', desc: 'Determines evasion and critical strike chance.' },
            { key: 'int', name: 'Intellect', desc: 'Determines magic power and dialogue options.' }
        ];

        attrs.forEach(attr => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.marginBottom = '10px';

            row.innerHTML = `
                <div class="has-tooltip" style="width: 120px;">
                    <strong>${attr.name}</strong>: ${this.builder.attributes[attr.key]}
                    <span class="tooltip-popup">${attr.desc}</span>
                </div>
            `;

            const btnContainer = document.createElement('div');
            
            const addBtn = document.createElement('button');
            addBtn.className = 'btn';
            addBtn.style.width = '40px';
            addBtn.style.display = 'inline-block';
            addBtn.textContent = '+';
            addBtn.onclick = () => {
                if (this.builder.availablePoints > 0) {
                    this.builder.attributes[attr.key]++;
                    this.builder.availablePoints--;
                    this.updateStateAndReRender();
                }
            };

            const subBtn = document.createElement('button');
            subBtn.className = 'btn';
            subBtn.style.width = '40px';
            subBtn.style.display = 'inline-block';
            subBtn.textContent = '-';
            subBtn.onclick = () => {
                // Prevent going below base + origin bonus
                let baseObj = { str: 5, agi: 5, int: 5 };
                // A simplistic check, ideally we track base vs added points.
                if (this.builder.attributes[attr.key] > 5) {
                    this.builder.attributes[attr.key]--;
                    this.builder.availablePoints++;
                    this.updateStateAndReRender();
                }
            };

            btnContainer.appendChild(subBtn);
            btnContainer.appendChild(addBtn);
            row.appendChild(btnContainer);
            choicesDiv.appendChild(row);
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn';
        nextBtn.style.marginTop = '20px';
        nextBtn.textContent = 'Confirm Attributes';
        if (this.builder.availablePoints > 0) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
            nextBtn.title = 'Spend all points first.';
        }
        nextBtn.onclick = () => {
            if (this.builder.availablePoints === 0) {
                this.currentStep++;
                this.renderStep();
            }
        };
        choicesDiv.appendChild(nextBtn);
    }

    updateStateAndReRender() {
        this.state.updatePlayer({ 
            baseAttributes: { ...this.builder.attributes },
            attributes: { ...this.builder.attributes } 
        });
        this.updateUI();
        this.renderStep();
    }

    /**
     * Step 2: Finalize Name
     */
    renderFinalize(contentDiv, choicesDiv) {
        contentDiv.innerHTML = `
            <p>Your body and mind are prepared.</p>
            <p>By what name are you known?</p>
            <input type="text" id="char-name-input" class="btn" style="background-color: var(--bg-dark); color: var(--text-main); cursor: text;" placeholder="Enter name...">
        `;

        const finishBtn = document.createElement('button');
        finishBtn.className = 'btn';
        finishBtn.style.marginTop = '15px';
        finishBtn.textContent = 'Awaken';
        finishBtn.onclick = () => {
            const nameInput = document.getElementById('char-name-input').value.trim();
            if (nameInput) {
                this.builder.name = nameInput;
                this.state.updatePlayer({ 
                    name: this.builder.name,
                    baseAttributes: { ...this.builder.attributes },
                    attributes: { ...this.builder.attributes }
                });
                this.updateUI();
                this.currentStep++;
                this.renderStep();
            }
        };
        choicesDiv.appendChild(finishBtn);
    }

    /**
     * Finish Creation
     */
    async finish() {
        const contentDiv = document.getElementById('main-content');
        const choicesDiv = document.getElementById('choices-container');
        
        contentDiv.innerHTML = `<p style="text-align:center;">Saving to chronosphere...</p>`;
        choicesDiv.innerHTML = '';

        // Save mock Firebase
        if (this.currentUser) {
             const { mockDatabase } = await import('./database.js?v=15');
             // FIX: Ensure baseAttributes is explicitly saved so Equipment layer doesn't zero it on reload.
             this.builder.baseAttributes = { ...this.builder.attributes };
             await mockDatabase.saveCharacter(this.currentUser.uid, this.builder);
        }

        if (this.onComplete) {
             this.onComplete(this.builder);
        }
    }

    logAction(msg) {
        const logWindow = document.getElementById('action-log');
        const p = document.createElement('p');
        p.innerText = `> ${msg}`;
        logWindow.appendChild(p);
    }
}
