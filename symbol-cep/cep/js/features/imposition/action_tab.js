/* global Fuse */
// Namespace Ensure
window.Imposition = window.Imposition || {};

(function () {
    class ActionTab {
        constructor() {
            this.container = null;
            this.csInterface = new CSInterface();
            this.searchTerm = '';
            this.isManagerMode = false;
            this.selectedIndex = 0;
            this.filteredPresets = [];
            this.fuse = null;
        }

        init(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;

            // Event Delegation
            this.container.addEventListener('click', (e) => {
                const triggerItem = e.target.closest('.dropdown-item'); // Palette Mode
                const triggerBtnManager = e.target.closest('button.manager-run-btn'); // Manager Mode
                const deleteBtn = e.target.closest('.btn-delete');
                const toggleBtn = e.target.closest('#btn-toggle-manager');

                if (triggerItem && !deleteBtn) {
                    this.handleTrigger(triggerItem.dataset.id);
                } else if (triggerBtnManager && !deleteBtn) {
                    this.handleTrigger(triggerBtnManager.dataset.id);
                } else if (deleteBtn) {
                    this.handleDelete(deleteBtn.dataset.id);
                } else if (toggleBtn) {
                    this.isManagerMode = !this.isManagerMode;
                    this.searchTerm = '';
                    this.selectedIndex = 0;
                    this.render();
                }
            });

            // Keyboard Navigation Event
            this.container.addEventListener('keydown', (e) => {
                if (e.target.id === 'action-search' && !this.isManagerMode) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredPresets.length - 1);
                        this._renderDropdownContent(document.getElementById('action-list'));
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                        this._renderDropdownContent(document.getElementById('action-list'));
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selected = this.filteredPresets[this.selectedIndex];
                        if (selected) {
                            this.handleTrigger(selected.id);
                        }
                    }
                }
            });

            // Search Event
            this.container.addEventListener('input', (e) => {
                if (e.target.id === 'action-search') {
                    this.searchTerm = e.target.value.trim();
                    this.selectedIndex = 0;
                    this.renderList();
                }
            });

            this.render();
        }

        refresh() {
            this.render();
        }

        render() {
            this.container.innerHTML = `
                <div style="margin-bottom: 12px; display: flex; gap: 5px; align-items: center;">
                    <input type="text" id="action-search" placeholder="🔍 Gõ tên cấu hình..." 
                           value="${this.searchTerm}" autocomplete="off"
                           style="flex: 1 1 auto; width: 100%; min-width: 0; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: #eee; border-radius: 4px; font-size: 13px; box-sizing: border-box; margin-bottom: 0;">
                    <button id="btn-toggle-manager" class="${this.isManagerMode ? 'contrast' : 'secondary'}" 
                            style="padding: 0 10px; font-size: 14px; flex-shrink: 0; width: auto; margin-bottom: 0;" title="Chế độ Quản lý">
                        ${this.isManagerMode ? '🔓' : '🔒'}
                    </button>
                </div>
                <div id="action-list"></div>
            `;

            if (!this.isManagerMode) {
                setTimeout(() => {
                    const searchInput = document.getElementById('action-search');
                    if (searchInput) searchInput.focus();
                }, 50);
            }

            this.renderList();
        }

        _initFuse(presets) {
            if (window.Fuse && presets && presets.length > 0) {
                // [ARCHITECTURAL FIX] Pass a shallow copy [...presets] to Fuse.js
                // This decouples Fuse's internal _docs array from the UI array.
                // Any subsequent mutation (e.g. .sort()) on the UI array will NOT corrupt the search index.
                this.fuse = new Fuse([...presets], {
                    keys: [
                        { name: 'label', weight: 0.7 },
                        { name: 'id', weight: 0.3 }
                    ],
                    threshold: 0.4,
                    ignoreLocation: true,
                    includeScore: true
                });
            } else {
                this.fuse = null;
            }
        }

        renderList() {
            const listContainer = document.getElementById('action-list');
            if (!listContainer) return;

            const presets = window.Imposition.dataStore.getPresets();

            presets.sort((a, b) => {
                const useDiff = (b.usageCount || 0) - (a.usageCount || 0);
                if (useDiff !== 0) return useDiff;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            if (this.isManagerMode) {
                this._renderManagerList(listContainer, presets);
            } else {
                this._initFuse(presets);
                this._filterAndRenderDropdown(listContainer, presets);
            }
        }

        _filterAndRenderDropdown(container, presets) {
            // Note: presets already sorted in renderList() BEFORE _initFuse()

            if (this.searchTerm && this.fuse) {
                const results = this.fuse.search(this.searchTerm);
                this.filteredPresets = results.map(r => r.item).slice(0, 10);
            } else if (this.searchTerm) {
                this.filteredPresets = presets.filter(p => p.label.toLowerCase().includes(this.searchTerm.toLowerCase())).slice(0, 10);
            } else {
                this.filteredPresets = presets.slice(0, 10);
            }

            if (this.selectedIndex >= this.filteredPresets.length) {
                this.selectedIndex = Math.max(0, this.filteredPresets.length - 1);
            }

            this._renderDropdownContent(container);
        }

        _renderDropdownContent(container) {
            if (this.filteredPresets.length === 0) {
                container.innerHTML = `
                    <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
                        Không tìm thấy cấu hình phù hợp.
                    </p>
                `;
                return;
            }

            const html = this.filteredPresets.map((p, index) => {
                const isSelected = index === this.selectedIndex;
                const bg = isSelected ? '#0078d7' : 'transparent';
                const textColor = isSelected ? '#fff' : '#ccc';
                const usage = p.usageCount ? `<span style="color: ${isSelected ? '#fff' : '#4CAF50'}; font-size:10px; opacity: 0.8;">★ ${p.usageCount}</span>` : '';

                return `
                <div class="dropdown-item" data-id="${p.id}" style="padding: 10px 12px; margin-bottom: 2px; background: ${bg}; color: ${textColor}; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px;">
                       ${isSelected ? '▶ ' : '&nbsp;&nbsp;&nbsp;'}${p.label}
                    </span>
                    ${usage}
                </div>
                `;
            }).join('');

            container.innerHTML = `<div style="border: 1px solid #444; border-radius: 4px; background: #222; overflow: hidden; padding: 4px;">${html}</div>`;
        }

        _renderManagerList(container, presets) {
            if (this.searchTerm) {
                // Filter creates a new array so we need to reassign or declare a new variable
                // Actually presets is passed in as a parameter, so reassigning the parameter is fine,
                // but let's just make it a new var to avoid mutating the argument.
                // Wait, the warning was in 'action_tab.js' line 120: 'presets' is never reassigned.
                // Ah, line 120 is probably in `_renderManagerList`. Let me check line 120.
                presets = presets.filter(p =>
                    p.label.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    (p.geometry.finish && (p.geometry.finish.w + 'x' + p.geometry.finish.h).includes(this.searchTerm.toLowerCase()))
                );
            }

            presets.sort((a, b) => {
                const useDiff = (b.usageCount || 0) - (a.usageCount || 0);
                if (useDiff !== 0) return useDiff;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            if (presets.length === 0) {
                container.innerHTML = `
                    <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
                        ${this.searchTerm ? 'Không tìm thấy preset nào.' : 'Chưa có cấu hình. Hãy tạo mới bên Tab Config.'}
                    </p>
                `;
                return;
            }

            const cardsHtml = presets.map(p => {
                const usage = p.usageCount ? `<span style="color: #4CAF50; margin-left: 5px;">★ ${p.usageCount}</span>` : '';

                return `
                <article style="padding: 0; margin-bottom: 8px; background: transparent; border: none;">
                    <button class="primary manager-run-btn" data-id="${p.id}" style="width: 100%; padding: 12px; font-weight: bold; font-size: 14px; text-align: left; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${p.usageCount > 0 ? '#4CAF50' : '#444'};">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.label}</span>
                        ${usage}
                    </button>
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dotted #444; display: flex; gap: 5px;">
                        <button class="btn-delete contrast outline" data-id="${p.id}" style="font-size: 10px; padding: 2px 5px; flex: 1; border-color: #f55; color: #f55;">🗑️ Xóa</button>
                    </div>
                </article>
            `}).join('');

            container.innerHTML = cardsHtml;
        }

        handleDelete(id) {
            if (confirm("Bạn có chắc muốn xóa cấu hình này không?")) {
                window.Imposition.dataStore.deletePreset(id);
                this.renderList(); // Refresh
                // Optional: Notify ConfigTab to refresh dropdown if needed
                if (window.Imposition.configTab) window.Imposition.configTab.render();
            }
        }

        handleEdit(id) {
            if (window.switchTab) window.switchTab('config');
            if (window.Imposition.configTab) {
                // Trigger load logic
                // We need to simulate selecting the option or call a method
                // Let's modify ConfigTab to expose a load method or just tweak the DOM
                const select = document.getElementById('load-preset-select');
                if (select) {
                    select.value = id;
                    select.dispatchEvent(new Event('change'));
                }
            }
        }

        handleTrigger(id) {
            console.log("CLICK DETECTED:", id);

            // Track Usage
            window.Imposition.dataStore.incrementUsage(id);
            this.renderList(); // Refresh to update usage stats

            const presets = window.Imposition.dataStore.getPresets();
            const preset = presets.find(p => p.id === id);

            if (!preset) return;

            // Phase 8: Data-Driven Rule Compilation
            if (window.ConfigEngine && window.BuiltinPresets && preset.rawValues) {
                try {
                    // 1. Get Schema (Default to Standard for now)
                    const schemaId = preset.schemaId || 'standard_imposition';
                    const schema = window.BuiltinPresets.find(function (s) { return s.id === schemaId; });

                    if (schema) {
                        // 2. Compile Rules
                        const rules = window.ConfigEngine.compileRules(schema, preset.rawValues);
                        if (rules.length > 0) {
                            preset.rules = rules;
                            console.log("🚀 Rules Injected via ConfigEngine:", rules.length);
                        }
                    }
                } catch (e) {
                    console.error("ConfigEngine Compilation Failed:", e);
                }
            }

            console.log(`🚀 Executing Imposition:`, preset.label);
            const payload = JSON.stringify(preset).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

            // Call Unified Logic
            // FIX: Default to Symbol Mode (True) if undefined, for legacy presets compatibility
            const raw = preset.rawValues || {};
            const _useSymbol = (raw.opt_symbol_mode !== false && raw.opt_symbol_mode !== 'false');

            // Override: If user explicitly unchecked it (false), then useSymbol is false.
            // If undefined, useSymbol is true.
            // If 'true', useSymbol is true.

            console.log(`🚀 Dispatching [${preset.label}] to UNIFIED KERNEL...`);
            this.csInterface.evalScript(`$._imposition.engine.run("${payload}")`, function (result) {
                console.log("📝 JSX LOGS:\n" + result);
                if (result.indexOf("error") === 0) {
                    alert("Imposition Error:\n" + result);
                }
            });

        }
    }

    window.Imposition.actionTab = new ActionTab();
})();
