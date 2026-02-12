// Namespace Ensure
window.Imposition = window.Imposition || {};

(function () {
    class ActionTab {
        constructor() {
            this.container = null;
            this.csInterface = new CSInterface();
            this.searchTerm = '';
            this.isManagerMode = false;
        }

        init(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;

            // Event Delegation
            this.container.addEventListener('click', (e) => {
                const triggerBtn = e.target.closest('button[data-id]'); // Run Button
                const deleteBtn = e.target.closest('.btn-delete');
                const toggleBtn = e.target.closest('#btn-toggle-manager');

                if (triggerBtn && !deleteBtn) {
                    this.handleTrigger(triggerBtn.dataset.id);
                } else if (deleteBtn) {
                    this.handleDelete(deleteBtn.dataset.id);
                } else if (toggleBtn) {
                    this.isManagerMode = !this.isManagerMode;
                    this.render();
                }
            });

            // Search Event
            this.container.addEventListener('input', (e) => {
                if (e.target.id === 'action-search') {
                    this.searchTerm = e.target.value.toLowerCase();
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
                <div style="margin-bottom: 12px; display: flex; gap: 5px;">
                    <input type="text" id="action-search" placeholder="🔍 Tìm nhanh (Tên hoặc Kích thước)..." 
                           value="${this.searchTerm}" 
                           style="flex: 1; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: #eee; border-radius: 4px; font-size: 12px;">
                    <button id="btn-toggle-manager" class="${this.isManagerMode ? 'contrast' : 'secondary'}" 
                            style="padding: 0 10px; font-size: 14px;" title="Chế độ Quản lý">
                        ${this.isManagerMode ? '🔓' : '🔒'}
                    </button>
                </div>
                <div id="action-list"></div>
            `;
            this.renderList();
        }

        renderList() {
            const listContainer = document.getElementById('action-list');
            if (!listContainer) return;

            let presets = window.Imposition.dataStore.getPresets();

            // Filter
            if (this.searchTerm) {
                presets = presets.filter(p =>
                    p.label.toLowerCase().includes(this.searchTerm) ||
                    (p.geometry.finish && (p.geometry.finish.w + 'x' + p.geometry.finish.h).includes(this.searchTerm))
                );
            }

            // Sort: Usage Count DESC -> CreatedAt DESC
            presets.sort((a, b) => {
                const useDiff = (b.usageCount || 0) - (a.usageCount || 0);
                if (useDiff !== 0) return useDiff;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            if (presets.length === 0) {
                listContainer.innerHTML = `
                    <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
                        ${this.searchTerm ? 'Không tìm thấy preset nào.' : 'Chưa có cấu hình. Hãy tạo mới bên Tab Config.'}
                    </p>
                `;
                return;
            }

            const cardsHtml = presets.map(p => {
                const w = p.geometry.finish ? p.geometry.finish.w : '?';
                const h = p.geometry.finish ? p.geometry.finish.h : '?';
                const usage = p.usageCount ? `<span style="color: #4CAF50; margin-left: 5px;">★ ${p.usageCount}</span>` : '';

                // Manager Buttons (Delete only - Config removed for simplicity)
                const managerActions = this.isManagerMode ? `
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dotted #444; display: flex; gap: 5px;">
                        <button class="btn-delete contrast outline" data-id="${p.id}" style="font-size: 10px; padding: 2px 5px; flex: 1; border-color: #f55; color: #f55;">🗑️ Xóa</button>
                    </div>
                ` : '';

                return `
                <article style="padding: 0; margin-bottom: 8px; background: transparent; border: none;">
                    <button class="primary" data-id="${p.id}" style="width: 100%; padding: 12px; font-weight: bold; font-size: 14px; text-align: left; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${p.usageCount > 0 ? '#4CAF50' : '#444'};">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.label}</span>
                        ${usage}
                    </button>
                    ${managerActions}
                </article>
            `}).join('');

            listContainer.innerHTML = cardsHtml;
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
            const useSymbol = (raw.opt_symbol_mode !== false && raw.opt_symbol_mode !== 'false');

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
