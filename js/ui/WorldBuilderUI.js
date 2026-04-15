import { mockDatabase } from '../core/database.js';

/**
 * @file WorldBuilderUI.js
 * @description Interactive World Builder DevTool for visualizing, managing, and validating
 * the location graph. Provides three tabs:
 *   1. Visual Map   — Force-directed canvas rendering of the location network.
 *   2. Location Table — Sortable data grid with quick actions.
 *   3. World Settings — Start location config, auto-fix connections, validation report.
 * 
 * Follows the engine's modular UI pattern: constructor binds DOM, methods render state.
 */
export default class WorldBuilderUI {
    constructor() {
        // --- DOM References ---
        this.container = document.getElementById('dev-worldbuilder-container');
        this.canvas = document.getElementById('wb-map-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.detailPane = document.getElementById('wb-detail-pane');
        this.tableBody = document.getElementById('wb-table-body');
        this.settingsArea = document.getElementById('wb-settings-area');
        this.validationLog = document.getElementById('wb-validation-log');
        this.startLocSelect = document.getElementById('wb-start-location');
        this.statusMsg = document.getElementById('wb-status-msg');

        // --- Internal State ---
        /** @property {Array} locations - All locations loaded from Firestore. */
        this.locations = [];
        /** @property {Array} nodes - Layout nodes with {id, x, y, vx, vy, locData}. */
        this.nodes = [];
        /** @property {Object|null} selectedNode - Currently selected node on the canvas. */
        this.selectedNode = null;
        /** @property {Object|null} dragNode - Node currently being dragged. */
        this.dragNode = null;
        /** @property {boolean} isDragging - Whether a drag is in progress. */
        this.isDragging = false;
        /** @property {string} activeTab - Currently visible tab ('map', 'table', 'settings'). */
        this.activeTab = 'map';
        /** @property {string|null} startLocationId - The configured start location. */
        this.startLocationId = null;
        /** @property {number} animFrameId - requestAnimationFrame handle for the simulation. */
        this.animFrameId = null;
        /** @property {Object} camera - Pan/zoom state for the canvas. */
        this.camera = { x: 0, y: 0, zoom: 1 };
        /** @property {boolean} simulationRunning - Whether the force simulation is active. */
        this.simulationRunning = false;
        /** @property {string} sortColumn - Current sort column for the table. */
        this.sortColumn = 'name';
        /** @property {number} sortDir - Sort direction: 1 = asc, -1 = desc. */
        this.sortDir = 1;

        this.bindEvents();
    }

    // =========================================================================
    //  EVENT BINDING
    // =========================================================================

    /**
     * Binds all interactive events: tab switching, canvas mouse, settings buttons.
     */
    bindEvents() {
        // Tab Buttons
        ['map', 'table', 'settings'].forEach(tab => {
            const btn = document.getElementById(`wb-tab-${tab}`);
            if (btn) btn.addEventListener('click', () => this.switchTab(tab));
        });

        // Canvas Mouse Events
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
            this.canvas.addEventListener('mouseleave', () => this.onCanvasMouseUp());
            this.canvas.addEventListener('wheel', (e) => this.onCanvasWheel(e));
            this.canvas.addEventListener('dblclick', (e) => this.onCanvasDblClick(e));
        }

        // Settings: Save Start Location
        const btnSaveStart = document.getElementById('wb-save-start');
        if (btnSaveStart) btnSaveStart.addEventListener('click', () => this.saveStartLocation());

        // Settings: Auto-Fix Connections
        const btnAutoFix = document.getElementById('wb-autofix');
        if (btnAutoFix) btnAutoFix.addEventListener('click', () => this.autoFixConnections());

        // Settings: Run Validation
        const btnValidate = document.getElementById('wb-validate');
        if (btnValidate) btnValidate.addEventListener('click', () => this.runValidation());

        // Back Button
        const btnBack = document.getElementById('btn-dev-back-worldbuilder');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                this.stopSimulation();
                this.container.classList.add('hidden');
                document.getElementById('dev-actions-list').classList.remove('hidden');
            });
        }
    }

    // =========================================================================
    //  OPEN / LOAD
    // =========================================================================

    /**
     * Opens the World Builder panel and loads all location data from Firestore.
     * Called when the "World Builder" button is clicked in DevTools.
     */
    async open() {
        this.setStatus('Loading world data...');
        try {
            this.locations = await mockDatabase.getLocations();
            
            // Load world config for start location
            const worldConfig = await mockDatabase.getWorldConfig();
            this.startLocationId = worldConfig ? worldConfig.startLocationId : null;
            
            this.buildNodes();
            this.switchTab(this.activeTab);
            this.setStatus('');
        } catch (err) {
            this.setStatus(`Error loading: ${err.message}`);
        }
    }

    /**
     * Creates layout nodes from location data with random initial positions.
     * Preserves existing positions if nodes already existed (for re-load).
     */
    buildNodes() {
        const existing = {};
        this.nodes.forEach(n => { existing[n.id] = { x: n.x, y: n.y }; });
        
        const w = this.canvas ? this.canvas.width : 800;
        const h = this.canvas ? this.canvas.height : 600;
        const cx = w / 2;
        const cy = h / 2;

        this.nodes = this.locations.map((loc, i) => {
            const prev = existing[loc.id];
            // Distribute in a circle initially if no prior position
            const angle = (i / Math.max(this.locations.length, 1)) * Math.PI * 2;
            const radius = Math.min(w, h) * 0.3;
            return {
                id: loc.id,
                x: prev ? prev.x : cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
                y: prev ? prev.y : cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
                vx: 0,
                vy: 0,
                locData: loc
            };
        });

        this.selectedNode = null;
    }

    // =========================================================================
    //  TAB MANAGEMENT
    // =========================================================================

    /**
     * Switches between the three tabs: map, table, settings.
     * @param {string} tab - One of 'map', 'table', 'settings'.
     */
    switchTab(tab) {
        this.activeTab = tab;

        // Toggle tab content visibility
        ['map', 'table', 'settings'].forEach(t => {
            const panel = document.getElementById(`wb-panel-${t}`);
            if (panel) panel.classList.toggle('hidden', t !== tab);
        });

        // Toggle tab button active states
        ['map', 'table', 'settings'].forEach(t => {
            const btn = document.getElementById(`wb-tab-${t}`);
            if (btn) {
                btn.style.borderColor = (t === tab) ? 'var(--text-highlight)' : 'var(--border-dim)';
                btn.style.color = (t === tab) ? 'var(--text-highlight)' : 'var(--text-dim)';
            }
        });

        // Render appropriate tab
        if (tab === 'map') {
            this.resizeCanvas();
            this.startSimulation();
        } else {
            this.stopSimulation();
        }
        if (tab === 'table') this.renderTable();
        if (tab === 'settings') this.renderSettings();
    }

    // =========================================================================
    //  TAB 1: INTERACTIVE WORLD MAP (Canvas Force-Directed Graph)
    // =========================================================================

    /**
     * Resizes the canvas to fill its container.
     */
    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight - 4; // Prevent scrollbar
        }
    }

    /**
     * Starts the force-directed simulation and rendering loop.
     */
    startSimulation() {
        if (this.simulationRunning) return;
        this.simulationRunning = true;
        this.simulationTick();
    }

    /**
     * Stops the force simulation loop.
     */
    stopSimulation() {
        this.simulationRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    /**
     * Single tick of the force-directed layout + canvas redraw.
     * Uses a simplified force simulation:
     *   - Repulsion between all nodes (Coulomb's law).
     *   - Attraction along connection edges (Hooke's law).
     *   - Center gravity to prevent drift.
     */
    simulationTick() {
        if (!this.simulationRunning) return;

        const dt = 0.3;
        const repulsion = 8000;
        const attraction = 0.005;
        const centerGravity = 0.01;
        const damping = 0.85;
        const cx = (this.canvas ? this.canvas.width : 800) / 2;
        const cy = (this.canvas ? this.canvas.height : 600) / 2;

        // --- Force Calculation ---
        // Repulsion: every node repels every other node
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                let dx = a.x - b.x;
                let dy = a.y - b.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                let force = repulsion / (dist * dist);
                let fx = (dx / dist) * force;
                let fy = (dy / dist) * force;
                a.vx += fx * dt;
                a.vy += fy * dt;
                b.vx -= fx * dt;
                b.vy -= fy * dt;
            }
        }

        // Attraction: connected nodes are pulled together
        for (const node of this.nodes) {
            const conns = node.locData.connections || [];
            for (const connId of conns) {
                const target = this.nodes.find(n => n.id === connId);
                if (!target) continue;
                let dx = target.x - node.x;
                let dy = target.y - node.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                // Ideal distance ~180px
                let force = (dist - 180) * attraction;
                node.vx += (dx / dist) * force * dt;
                node.vy += (dy / dist) * force * dt;
            }
        }

        // Center gravity: pull nodes toward canvas center
        for (const node of this.nodes) {
            node.vx += (cx - node.x) * centerGravity * dt;
            node.vy += (cy - node.y) * centerGravity * dt;
        }

        // Apply velocity + damping (skip dragged node)
        for (const node of this.nodes) {
            if (node === this.dragNode) continue;
            node.vx *= damping;
            node.vy *= damping;
            node.x += node.vx;
            node.y += node.vy;
        }

        // --- Render ---
        this.renderCanvas();
        this.animFrameId = requestAnimationFrame(() => this.simulationTick());
    }

    /**
     * Draws the full canvas: grid, edges, nodes, labels, legend, and tooltips.
     */
    renderCanvas() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid pattern
        ctx.strokeStyle = 'rgba(74, 61, 44, 0.15)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // --- Draw Edges ---
        for (const node of this.nodes) {
            const conns = node.locData.connections || [];
            for (const connId of conns) {
                const target = this.nodes.find(n => n.id === connId);
                if (!target) continue;

                // Check if connection is bidirectional
                const targetConns = target.locData.connections || [];
                const isBidirectional = targetConns.includes(node.id);
                
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = isBidirectional ? 'rgba(140, 115, 75, 0.6)' : 'rgba(255, 77, 77, 0.6)';
                ctx.lineWidth = isBidirectional ? 2 : 2;
                
                // Dashed line for one-way connections
                if (!isBidirectional) ctx.setLineDash([6, 4]);
                else ctx.setLineDash([]);
                
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw arrowhead for one-way connections
                if (!isBidirectional) {
                    this.drawArrowhead(ctx, node.x, node.y, target.x, target.y, 'rgba(255, 77, 77, 0.8)');
                }
            }
        }

        // --- Draw Nodes ---
        for (const node of this.nodes) {
            const loc = node.locData;
            const isStart = loc.id === this.startLocationId;
            const isSelected = this.selectedNode === node;
            const hasNpcs = loc.npcs && loc.npcs.length > 0;
            const hasEncounters = loc.encounters && loc.encounters.length > 0;
            const hasNoConns = !loc.connections || loc.connections.length === 0;

            // Node radius
            const radius = isSelected ? 22 : 18;

            // Determine color
            let color = '#5a5a5a'; // gray = empty
            if (isStart) color = '#4CAF50'; // green = start
            else if (hasEncounters && hasNpcs) color = '#ff9800'; // orange = both
            else if (hasEncounters) color = '#e74c3c'; // red = encounters only
            else if (hasNpcs) color = '#d4af37'; // amber = npcs only

            // Outer glow for selected node
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 235, 181, 0.15)';
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#ffebb5' : 'rgba(140, 115, 75, 0.8)';
            ctx.lineWidth = isSelected ? 3 : 1.5;
            ctx.stroke();

            // Start location crown indicator
            if (isStart) {
                ctx.fillStyle = '#ffebb5';
                ctx.font = '14px serif';
                ctx.textAlign = 'center';
                ctx.fillText('★', node.x, node.y - radius - 6);
            }

            // Warning badge for orphan nodes
            if (hasNoConns) {
                ctx.fillStyle = '#ff4d4d';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚠', node.x + radius + 2, node.y - radius + 2);
            }

            // Node label
            ctx.fillStyle = '#d9cbb2';
            ctx.font = '11px "Book Antiqua", serif';
            ctx.textAlign = 'center';
            ctx.fillText(loc.name || loc.id, node.x, node.y + radius + 16);
        }

        // --- Legend ---
        this.drawLegend(ctx, w, h);
    }

    /**
     * Draws an arrowhead pointing from (x1,y1) toward (x2,y2).
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x1 - Start X.
     * @param {number} y1 - Start Y.
     * @param {number} x2 - End X.
     * @param {number} y2 - End Y.
     * @param {string} color - Arrow fill color.
     */
    drawArrowhead(ctx, x1, y1, x2, y2, color) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        const len = Math.sqrt(dx * dx + dy * dy);
        // Position arrow at 65% along the edge (near target but not overlapping node)
        const pos = 0.65;
        const ax = x1 + dx * pos;
        const ay = y1 + dy * pos;
        const size = 8;

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size / 2);
        ctx.lineTo(-size, size / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draws the color legend in the bottom-left corner of the canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w - Canvas width.
     * @param {number} h - Canvas height.
     */
    drawLegend(ctx, w, h) {
        const items = [
            { color: '#4CAF50', label: 'Start Location' },
            { color: '#d4af37', label: 'Has NPCs' },
            { color: '#e74c3c', label: 'Has Encounters' },
            { color: '#ff9800', label: 'NPCs + Encounters' },
            { color: '#5a5a5a', label: 'Empty' }
        ];

        const x = 15;
        let y = h - items.length * 20 - 15;

        // Background
        ctx.fillStyle = 'rgba(10, 8, 6, 0.8)';
        ctx.strokeStyle = 'rgba(74, 61, 44, 0.5)';
        ctx.lineWidth = 1;
        const boxW = 150;
        const boxH = items.length * 20 + 12;
        ctx.fillRect(x - 5, y - 16, boxW, boxH);
        ctx.strokeRect(x - 5, y - 16, boxW, boxH);

        ctx.font = '10px "Book Antiqua", serif';
        for (const item of items) {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(x + 6, y - 3, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#8b7d6a';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + 18, y);
            y += 20;
        }

        // Connection line legend
        ctx.strokeStyle = 'rgba(140, 115, 75, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 25, y - 3); ctx.stroke();
        ctx.fillStyle = '#8b7d6a';
        ctx.fillText('Bidirectional', x + 30, y);
        y += 18;

        ctx.strokeStyle = 'rgba(255, 77, 77, 0.6)';
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 25, y - 3); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText('One-way (broken)', x + 30, y);
    }

    // --- Canvas Mouse Handlers ---

    /**
     * Finds the node under the given canvas coordinates.
     * @param {number} mx - Mouse X relative to canvas.
     * @param {number} my - Mouse Y relative to canvas.
     * @returns {Object|null} The node object or null.
     */
    getNodeAt(mx, my) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            const dx = mx - n.x;
            const dy = my - n.y;
            if (dx * dx + dy * dy <= 22 * 22) return n;
        }
        return null;
    }

    /**
     * Handles mousedown: selects a node or starts dragging.
     * @param {MouseEvent} e
     */
    onCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const node = this.getNodeAt(mx, my);

        if (node) {
            this.selectedNode = node;
            this.dragNode = node;
            this.isDragging = true;
            this.renderDetailPane(node);
        } else {
            this.selectedNode = null;
            this.clearDetailPane();
        }
    }

    /**
     * Handles mousemove: updates drag position or shows hover cursor.
     * @param {MouseEvent} e
     */
    onCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (this.isDragging && this.dragNode) {
            this.dragNode.x = mx;
            this.dragNode.y = my;
            this.dragNode.vx = 0;
            this.dragNode.vy = 0;
        }

        // Cursor hint
        const hovered = this.getNodeAt(mx, my);
        this.canvas.style.cursor = hovered ? 'grab' : 'default';
        if (this.isDragging) this.canvas.style.cursor = 'grabbing';
    }

    /**
     * Handles mouseup: ends dragging.
     */
    onCanvasMouseUp() {
        this.isDragging = false;
        this.dragNode = null;
    }

    /**
     * Handles mouse wheel: zooms the canvas (future expansion).
     * @param {WheelEvent} e
     */
    onCanvasWheel(e) {
        e.preventDefault();
        // Reserved for future zoom implementation
    }

    /**
     * Handles double-click: teleports to the clicked location.
     * @param {MouseEvent} e
     */
    onCanvasDblClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const node = this.getNodeAt(mx, my);

        if (node) {
            window.dispatchEvent(new CustomEvent('teleportPlayer', { detail: node.id }));
            this.setStatus(`Teleported to ${node.locData.name || node.id}`);
        }
    }

    // --- Detail Pane ---

    /**
     * Renders the side detail pane for a selected location node.
     * @param {Object} node - The selected node with locData.
     */
    renderDetailPane(node) {
        if (!this.detailPane) return;
        const loc = node.locData;
        const isStart = loc.id === this.startLocationId;
        const conns = loc.connections || [];
        const npcs = loc.npcs || [];
        const encs = loc.encounters || [];

        // Check for broken connections (one-way)
        const brokenConns = conns.filter(connId => {
            const target = this.locations.find(l => l.id === connId);
            if (!target) return true; // Target doesn't exist at all
            return !(target.connections || []).includes(loc.id);
        });

        this.detailPane.innerHTML = `
            <h4 style="color:var(--text-highlight); margin-bottom:8px; font-size:1.1rem;">
                ${isStart ? '★ ' : ''}${loc.name}
            </h4>
            <p class="text-dim" style="font-size:0.8rem; margin-bottom:8px;">ID: ${loc.id}</p>
            <p style="font-size:0.9rem; margin-bottom:12px; line-height:1.4; max-height:80px; overflow-y:auto;">
                ${loc.description || '<em class="text-dim">No description</em>'}
            </p>
            
            <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px; font-size:0.85rem;">
                <span style="color:${conns.length > 0 ? '#4CAF50' : '#ff4d4d'};">
                    Connections: ${conns.length} ${brokenConns.length > 0 ? `<span style="color:#ff4d4d;">(${brokenConns.length} broken)</span>` : ''}
                </span>
                <span style="color:${npcs.length > 0 ? '#d4af37' : 'var(--text-dim)'};">
                    NPCs: ${npcs.length > 0 ? npcs.join(', ') : 'None'}
                </span>
                <span style="color:${encs.length > 0 ? '#e74c3c' : 'var(--text-dim)'};">
                    Encounters: ${encs.length > 0 ? encs.map(e => `${e.enemyId} (${e.chance}%)`).join(', ') : 'None'}
                </span>
            </div>

            ${brokenConns.length > 0 ? `
                <div style="background:rgba(255,77,77,0.1); border:1px solid rgba(255,77,77,0.3); border-radius:4px; padding:6px; margin-bottom:10px; font-size:0.8rem; color:#ff4d4d;">
                    ⚠ One-way connections to: ${brokenConns.join(', ')}
                </div>
            ` : ''}

            <div style="display:flex; flex-direction:column; gap:5px;">
                <button class="btn wb-action-btn" id="wb-action-teleport" 
                    style="font-size:0.85rem; padding:6px; border-color:var(--accent,#4CAF50); color:#4CAF50;">
                    ⚡ Teleport Here
                </button>
                <button class="btn wb-action-btn" id="wb-action-edit"
                    style="font-size:0.85rem; padding:6px; border-color:#d4af37; color:#d4af37;">
                    ✎ Edit Location
                </button>
                <button class="btn wb-action-btn" id="wb-action-setstart"
                    style="font-size:0.85rem; padding:6px; border-color:#4CAF50; color:${isStart ? 'var(--text-dim)' : '#4CAF50'};">
                    ${isStart ? '★ Already Start' : '★ Set as Start'}
                </button>
                <button class="btn wb-action-btn" id="wb-action-delete"
                    style="font-size:0.85rem; padding:6px; border-color:var(--crimson-red); color:var(--crimson-red);">
                    ✕ Delete Location
                </button>
            </div>
        `;

        // Bind detail pane action buttons
        document.getElementById('wb-action-teleport').onclick = () => {
            window.dispatchEvent(new CustomEvent('teleportPlayer', { detail: loc.id }));
            this.setStatus(`Teleported to ${loc.name}`);
        };

        document.getElementById('wb-action-edit').onclick = () => {
            // Dispatch event to open the location edit form
            window.dispatchEvent(new CustomEvent('devtools:editLocation', { detail: loc }));
        };

        document.getElementById('wb-action-setstart').onclick = async () => {
            if (isStart) return;
            await this.setStartLocation(loc.id);
        };

        document.getElementById('wb-action-delete').onclick = async () => {
            if (confirm(`Delete location "${loc.name}" (${loc.id})?`)) {
                await mockDatabase.deleteEntity('locations', loc.id);
                this.setStatus(`Deleted ${loc.name}`);
                await this.open(); // Reload
            }
        };
    }

    /**
     * Clears the detail pane when no node is selected.
     */
    clearDetailPane() {
        if (!this.detailPane) return;
        this.detailPane.innerHTML = `
            <p class="text-dim" style="text-align:center; margin-top:20px; font-size:0.9rem;">
                Click a location on the map to inspect it.
            </p>
            <p class="text-dim" style="text-align:center; font-size:0.8rem; margin-top:5px;">
                Double-click to teleport.
            </p>
        `;
    }

    // =========================================================================
    //  TAB 2: LOCATION TABLE
    // =========================================================================

    /**
     * Renders a sortable data table of all locations with quick actions.
     */
    renderTable() {
        if (!this.tableBody) return;

        // Sort locations
        const sorted = [...this.locations].sort((a, b) => {
            let valA, valB;
            switch (this.sortColumn) {
                case 'id': valA = a.id; valB = b.id; break;
                case 'name': valA = a.name || ''; valB = b.name || ''; break;
                case 'connections': valA = (a.connections || []).length; valB = (b.connections || []).length; break;
                case 'npcs': valA = (a.npcs || []).length; valB = (b.npcs || []).length; break;
                case 'encounters': valA = (a.encounters || []).length; valB = (b.encounters || []).length; break;
                default: valA = a.name || ''; valB = b.name || '';
            }
            if (typeof valA === 'string') return valA.localeCompare(valB) * this.sortDir;
            return (valA - valB) * this.sortDir;
        });

        this.tableBody.innerHTML = '';

        if (sorted.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-dim">No locations found.</td></tr>';
            return;
        }

        for (const loc of sorted) {
            const conns = loc.connections || [];
            const npcs = loc.npcs || [];
            const encs = loc.encounters || [];
            const isStart = loc.id === this.startLocationId;
            const isOrphan = conns.length === 0;

            // Check for one-way connections
            const hasOneWay = conns.some(connId => {
                const target = this.locations.find(l => l.id === connId);
                return !target || !(target.connections || []).includes(loc.id);
            });

            const tr = document.createElement('tr');
            tr.style.cssText = isOrphan ? 'background:rgba(255,77,77,0.05);' : '';
            
            tr.innerHTML = `
                <td style="color:${isStart ? '#4CAF50' : 'var(--text-main)'}; font-weight:${isStart ? 'bold' : 'normal'};">
                    ${isStart ? '★ ' : ''}${loc.id}
                </td>
                <td style="color:var(--text-highlight);">${loc.name || '—'}</td>
                <td style="color:${hasOneWay ? '#ff4d4d' : isOrphan ? '#ff4d4d' : '#4CAF50'};">
                    ${conns.length}${hasOneWay ? ' ⚠' : ''}${isOrphan ? ' (orphan)' : ''}
                </td>
                <td style="color:${npcs.length > 0 ? '#d4af37' : 'var(--text-dim)'};">
                    ${npcs.length}
                </td>
                <td style="color:${encs.length > 0 ? '#e74c3c' : 'var(--text-dim)'};">
                    ${encs.length}
                </td>
                <td style="text-align:center;">${isStart ? '★' : '—'}</td>
                <td></td>
            `;

            // Action buttons cell
            const actionCell = tr.querySelector('td:last-child');
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = 'display:flex; gap:4px; justify-content:flex-end;';

            // Teleport button
            const btnTp = document.createElement('button');
            btnTp.className = 'btn';
            btnTp.innerText = '⚡';
            btnTp.title = 'Teleport';
            btnTp.style.cssText = 'width:auto; padding:2px 6px; font-size:0.75rem; margin:0; border-color:#4CAF50; color:#4CAF50;';
            btnTp.onclick = () => {
                window.dispatchEvent(new CustomEvent('teleportPlayer', { detail: loc.id }));
                this.setStatus(`Teleported to ${loc.name}`);
            };

            // Set as Start button
            const btnStart = document.createElement('button');
            btnStart.className = 'btn';
            btnStart.innerText = '★';
            btnStart.title = 'Set as Start';
            btnStart.style.cssText = `width:auto; padding:2px 6px; font-size:0.75rem; margin:0; border-color:#4CAF50; color:${isStart ? 'var(--text-dim)' : '#4CAF50'};`;
            btnStart.disabled = isStart;
            btnStart.onclick = async () => {
                await this.setStartLocation(loc.id);
                this.renderTable();
            };

            // Edit button
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn';
            btnEdit.innerText = '✎';
            btnEdit.title = 'Edit';
            btnEdit.style.cssText = 'width:auto; padding:2px 6px; font-size:0.75rem; margin:0; border-color:#d4af37; color:#d4af37;';
            btnEdit.onclick = () => {
                window.dispatchEvent(new CustomEvent('devtools:editLocation', { detail: loc }));
            };

            // Delete button
            const btnDel = document.createElement('button');
            btnDel.className = 'btn';
            btnDel.innerText = '✕';
            btnDel.title = 'Delete';
            btnDel.style.cssText = 'width:auto; padding:2px 6px; font-size:0.75rem; margin:0; border-color:var(--crimson-red); color:var(--crimson-red);';
            btnDel.onclick = async () => {
                if (confirm(`Delete location "${loc.name}" (${loc.id})?`)) {
                    await mockDatabase.deleteEntity('locations', loc.id);
                    this.setStatus(`Deleted ${loc.name}`);
                    await this.open();
                }
            };

            btnContainer.appendChild(btnTp);
            btnContainer.appendChild(btnStart);
            btnContainer.appendChild(btnEdit);
            btnContainer.appendChild(btnDel);
            actionCell.appendChild(btnContainer);

            this.tableBody.appendChild(tr);
        }

        // Bind sort headers
        ['id', 'name', 'connections', 'npcs', 'encounters'].forEach(col => {
            const th = document.getElementById(`wb-sort-${col}`);
            if (th) {
                th.style.cursor = 'pointer';
                th.onclick = () => {
                    if (this.sortColumn === col) this.sortDir *= -1;
                    else { this.sortColumn = col; this.sortDir = 1; }
                    this.renderTable();
                };
            }
        });
    }

    // =========================================================================
    //  TAB 3: WORLD SETTINGS
    // =========================================================================

    /**
     * Renders the settings tab with start location dropdown, auto-fix, and validation.
     */
    renderSettings() {
        // Populate start location dropdown
        if (this.startLocSelect) {
            this.startLocSelect.innerHTML = '<option value="">-- Select Start Location --</option>';
            for (const loc of this.locations) {
                const opt = document.createElement('option');
                opt.value = loc.id;
                opt.textContent = `${loc.name} (${loc.id})`;
                if (loc.id === this.startLocationId) opt.selected = true;
                this.startLocSelect.appendChild(opt);
            }
        }
    }

    /**
     * Saves the selected start location to Firestore world config.
     */
    async saveStartLocation() {
        if (!this.startLocSelect) return;
        const locId = this.startLocSelect.value;
        if (!locId) {
            this.setStatus('Please select a start location.');
            return;
        }
        await this.setStartLocation(locId);
    }

    /**
     * Sets a location as the world start location and persists to Firestore.
     * @param {string} locId - The location ID to set as start.
     */
    async setStartLocation(locId) {
        try {
            await mockDatabase.saveWorldConfig({ startLocationId: locId });
            this.startLocationId = locId;
            const loc = this.locations.find(l => l.id === locId);
            this.setStatus(`Start location set to "${loc ? loc.name : locId}"`);
            // Re-render current tab to reflect change
            if (this.activeTab === 'settings') this.renderSettings();
            if (this.activeTab === 'table') this.renderTable();
            if (this.selectedNode) this.renderDetailPane(this.selectedNode);
        } catch (err) {
            this.setStatus(`Error: ${err.message}`);
        }
    }

    /**
     * Scans all locations for one-way connections and adds missing reciprocal links.
     * Updates Firestore for each fixed location.
     */
    async autoFixConnections() {
        this.setStatus('Scanning for one-way connections...');
        let fixCount = 0;
        const toSave = new Map(); // locId -> updated location data

        for (const loc of this.locations) {
            const conns = loc.connections || [];
            for (const connId of conns) {
                const target = this.locations.find(l => l.id === connId);
                if (!target) continue; // Target doesn't exist — can't fix
                const targetConns = target.connections || [];
                if (!targetConns.includes(loc.id)) {
                    // Missing reciprocal — add it
                    if (!toSave.has(target.id)) {
                        toSave.set(target.id, { ...target, connections: [...targetConns] });
                    }
                    toSave.get(target.id).connections.push(loc.id);
                    fixCount++;
                }
            }
        }

        // Persist all fixed locations
        for (const [id, data] of toSave) {
            await mockDatabase.saveLocation(data);
        }

        if (fixCount > 0) {
            this.setStatus(`Fixed ${fixCount} missing reciprocal connection(s). Reloading...`);
            await this.open(); // Reload data
        } else {
            this.setStatus('All connections are already bidirectional. No fixes needed.');
        }
    }

    /**
     * Runs a full validation scan on the location network and outputs a report.
     * Checks for:
     *   - Orphan locations (no connections).
     *   - One-way connections.
     *   - References to non-existent locations.
     *   - References to non-existent NPCs.
     */
    async runValidation() {
        if (!this.validationLog) return;
        this.validationLog.innerHTML = '<p class="text-dim">Running validation...</p>';

        const issues = [];
        const locIds = new Set(this.locations.map(l => l.id));
        
        // Load NPCs for cross-reference validation
        let allNpcs = [];
        try { allNpcs = await mockDatabase.getNPCs(); } catch(e) { /* silent */ }
        const npcIds = new Set(allNpcs.map(n => n.id));

        // Load enemies for cross-reference validation
        let allEnemies = [];
        try { allEnemies = await mockDatabase.getEnemies(); } catch(e) { /* silent */ }
        const enemyIds = new Set(allEnemies.map(e => e.id));

        for (const loc of this.locations) {
            const conns = loc.connections || [];
            const npcs = loc.npcs || [];
            const encs = loc.encounters || [];

            // Check: Orphan (no connections)
            if (conns.length === 0) {
                issues.push({ severity: 'warning', loc: loc.id, msg: `Orphan location — no connections.` });
            }

            // Check: Connections to non-existent locations
            for (const connId of conns) {
                if (!locIds.has(connId)) {
                    issues.push({ severity: 'error', loc: loc.id, msg: `Connection to non-existent location "${connId}".` });
                } else {
                    // Check: One-way connection
                    const target = this.locations.find(l => l.id === connId);
                    if (target && !(target.connections || []).includes(loc.id)) {
                        issues.push({ severity: 'warning', loc: loc.id, msg: `One-way connection to "${connId}" (not reciprocal).` });
                    }
                }
            }

            // Check: NPC references
            for (const npcId of npcs) {
                if (!npcIds.has(npcId)) {
                    issues.push({ severity: 'error', loc: loc.id, msg: `References non-existent NPC "${npcId}".` });
                }
            }

            // Check: Enemy references in encounters
            for (const enc of encs) {
                if (!enemyIds.has(enc.enemyId)) {
                    issues.push({ severity: 'error', loc: loc.id, msg: `Encounter references non-existent enemy "${enc.enemyId}".` });
                }
            }

            // Check: Encounter chance total
            if (encs.length > 0) {
                const totalChance = encs.reduce((sum, e) => sum + (e.chance || 0), 0);
                if (totalChance > 100) {
                    issues.push({ severity: 'warning', loc: loc.id, msg: `Encounter chances sum to ${totalChance}% (exceeds 100%).` });
                }
            }
        }

        // Render validation results
        if (issues.length === 0) {
            this.validationLog.innerHTML = `
                <div style="color:#4CAF50; padding:10px; border:1px solid rgba(76,175,80,0.3); border-radius:4px; text-align:center;">
                    ✓ All ${this.locations.length} locations passed validation. No issues found.
                </div>`;
            return;
        }

        let html = `<p style="margin-bottom:8px; color:var(--text-highlight);">Found ${issues.length} issue(s) across ${this.locations.length} locations:</p>`;
        for (const issue of issues) {
            const color = issue.severity === 'error' ? '#ff4d4d' : '#ff9800';
            const icon = issue.severity === 'error' ? '✕' : '⚠';
            html += `<div style="padding:4px 8px; margin-bottom:3px; font-size:0.85rem; border-left:3px solid ${color}; background:rgba(0,0,0,0.2);">
                <span style="color:${color}; font-weight:bold;">${icon} ${issue.loc}:</span>
                <span style="color:var(--text-main);">${issue.msg}</span>
            </div>`;
        }
        this.validationLog.innerHTML = html;
    }

    // =========================================================================
    //  UTILITY
    // =========================================================================

    /**
     * Displays a status message in the World Builder panel.
     * @param {string} msg - The message to display.
     */
    setStatus(msg) {
        if (this.statusMsg) this.statusMsg.innerText = msg;
    }
}
