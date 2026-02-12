// Namespace Ensure
window.Imposition = window.Imposition || {};

(function () {
    class ConfigTab {
        constructor() {
            this.container = null;
            this.isEditMode = false;
        }

        init(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;
            this.render(); // Initial render

            // RESTORE STATE: Load last used preset
            const lastId = window.Imposition.dataStore.getLastActive();
            if (lastId) {
                console.log("Restoring Last Preset:", lastId);
                // We need a slight delay or just call directly since render is sync
                this.loadPreset(lastId);

                // Update Select Box UI logic matches
                const sel = document.getElementById('load-preset-select');
                if (sel) sel.value = lastId;
            }

            this.bindEvents();
        }

        /**
         * Main Render: Wrapper + Dynamic Form from Schema
         */
        render() {
            // Load Standard Schema as default
            const schema = (window.BuiltinPresets && window.BuiltinPresets[0]) ? window.BuiltinPresets[0] : null;

            this.container.innerHTML = `
                <form id="config-form">
                    
                    <!-- Top Bar: Load Preset -->
                    <!-- Top Bar: Load Preset & Edit Toggle (Inline Compact) -->
                    <div style="margin-bottom: 15px; background: #222; padding: 4px 8px; border-radius: 4px; border: 1px solid #333; display: flex; align-items: center; gap: 8px;">
                        <label style="color: #aaa; font-size: 11px; white-space: nowrap; margin: 0;">📂 Preset:</label>
                        <select id="load-preset-select" style="flex: 1; padding: 2px 4px; background: #111; color: #eee; border: 1px solid #444; font-size: 11px; height: 22px;">
                            <option value="">-- Chọn --</option>
                            ${this.getPresetOptions()}
                        </select>
                        <button type="button" id="btn-toggle-edit" class="outline ${this.isEditMode ? 'contrast' : 'secondary'}" 
                            style="font-size: 10px; padding: 0 6px; height: 22px; line-height: 20px; white-space:nowrap;">
                            ${this.isEditMode ? 'Stop' : 'Edit'}
                        </button>
                    </div>

                    <input type="hidden" name="preset_id" id="preset_id" value="" />

                    <!-- Dynamic Sections -->
                    <div id="dynamic-form-body">
                        ${schema ? this.renderSchema(schema) : '<p>Error: Schema not loaded.</p>'}
                    </div>

                    <!-- Footer: Save Actions -->
                    <div style="background: #222; padding: 10px; border-radius: 4px; margin-top: 20px;">
                        <label style="margin-bottom: 5px;">Tên Cấu hình</label>
                        <input type="text" name="preset_name" id="preset_name" placeholder="Ví dụ: Catalogue A4" style="width: 100%; margin-bottom: 10px;" required />
                        
                            <div style="display: flex; gap: 8px;">
                                <button type="button" class="secondary outline" id="btn-reset-form" style="flex: 1; font-size: 12px;">🆕 Tạo mới</button>
                                <button type="submit" class="contrast" id="btn-save" style="flex: 2;">✅ Lưu Cấu Hình</button>
                            </div>
                        </div>
                    </div>

                    <!-- Add Field Modal (Hidden by default) -->
                    <div id="modal-add-field" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                        <div style="background: #222; padding: 20px; border-radius: 8px; border: 1px solid #444; width: 300px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                            <h4 style="margin-top: 0;">Thêm Hàng Mới (Row)</h4>
                            
                            <label style="font-size: 11px; display: block; margin-bottom: 5px;">Tên Hàng (Label):</label>
                            <input type="text" id="new-field-label" placeholder="Ví dụ: Bù Xéo" style="width: 100%; margin-bottom: 15px;">
                            
                            <label style="font-size: 11px; display: block; margin-bottom: 5px;">Loại Logic (Logic Type):</label>
                            <select id="new-field-classification" style="width: 100%; margin-bottom: 20px; padding: 5px;">
                                <option value="BASELINE">🟢 Cơ bản (Baseline - An toàn/Xén)</option>
                                <option value="STRUCTURAL">🟡 Cấu trúc (Structural - Gáy/Rãnh)</option>
                                <option value="ADDITIVE" selected>🔵 Cộng thêm (Additive - Bù/Keo)</option>
                            </select>

                            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                                <button type="button" class="secondary outline" id="btn-cancel-modal">Hủy</button>
                                <button type="button" class="contrast" id="btn-confirm-modal">Thêm</button>
                            </div>
                        </div>
                    </div>
                </form>
                
                <style>
                    .btn-edge {
                        flex: 1;
                        padding: 6px 4px;
                        background: #222;
                        border: 1px solid #444;
                        color: #888;
                        cursor: pointer;
                        font-size: 11px;
                        transition: all 0.2s;
                        border-radius: 3px;
                    }
                    .btn-edge:hover {
                        border-color: #666;
                    }
                    .btn-edge.active {
                        background: #0088ff;
                        border-color: #0099ff;
                        color: #fff;
                        font-weight: bold;
                    }
                </style>
                
                <script>
                    // Edge Selector Toggle Logic
                    document.addEventListener('click', function(e) {
                        if (e.target.classList.contains('btn-edge')) {
                            e.target.classList.toggle('active');
                            const wrapper = e.target.closest('.edge-selector-wrapper');
                            const input = wrapper.querySelector('input[type=hidden]');
                            const btns = wrapper.querySelectorAll('.btn-edge.active');
                            const edges = Array.from(btns).map(b => b.getAttribute('data-edge'));
                            input.value = edges.join(',');
                        }
                    });
                </script>
            `;
        }

        /**
         * UI Builder: Generate HTML from JSON Schema
         */
        renderSchema(schema) {
            if (!schema.sections) return '';

            return schema.sections.map(section => {
                let fieldsHtml = '';

                // Layout Strategy
                if (section.layout === 'matrix') {
                    fieldsHtml = this.renderMatrix(section);
                } else if (section.layout === 'stack') {
                    fieldsHtml = section.fields.map(f => this.renderFieldStack(f)).join('');
                } else if (section.layout && section.layout.startsWith('grid-')) {
                    const cols = section.layout.split('-')[1];
                    fieldsHtml = `<div class="grid grid-${cols}" style="gap: 10px;">` +
                        section.fields.map(f => this.renderFieldGrid(f)).join('') +
                        `</div>`;
                } else if (section.layout === 'complex') {
                    fieldsHtml = section.fields.map(f => this.renderFieldComplex(f)).join('');
                } else {
                    // Default Stack
                    fieldsHtml = section.fields.map(f => this.renderFieldStack(f)).join('');
                }

                const addBtn = this.isEditMode ?
                    `<button type="button" class="btn-add-field outline" data-section="${section.id}" style="font-size:10px; padding:2px 5px; float:right;">＋ Add Field</button>` : '';

                return `
                    <div style="margin-bottom: 15px;">
                        ${section.title ? `<h4 style="margin: 0 0 5px 0; font-weight: normal; color: #bbb;">${section.title} ${addBtn}</h4>` : ''}
                        ${fieldsHtml}
                        <hr style="border-color: #444; margin: 10px 0;" />
                    </div>
                `;
            }).join('');
        }

        // --- Field Renderers ---

        renderFieldGrid(f) {
            // Simple render for Grid cells (Label + Input)
            const required = f.required ? 'required' : '';
            const step = f.step ? `step="${f.step}"` : '';
            const val = f.default !== undefined ? `value="${f.default}"` : '';
            const ph = f.placeholder ? `placeholder="${f.placeholder}"` : '';

            const removeBtn = (this.isEditMode && !f.protected) ?
                `<button type="button" class="btn-remove-field" data-id="${f.id}" style="color:red; background:none; border:none; font-size:10px; padding:0; float:right;">✕</button>` : '';

            return `
                <div style="position:relative;">
                    ${removeBtn}
                    <label style="font-size: 11px;">${f.label}</label>
                    <input type="${f.type}" name="${f.id}" id="${f.id}" ${step} ${val} ${ph} ${required} style="width:100%;">
                </div>
            `;
        }

        renderFieldStack(f) {
            // Checkbox
            if (f.type === 'checkbox') {
                const checked = f.default ? 'checked' : '';

                // Enhanced: Disabled State (for Semantic Checkpoints)
                if (f.disabled) {
                    return `
                        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px; opacity: 0.6; pointer-events: none;">
                            <input type="checkbox" checked disabled />
                            <label style="margin:0; font-weight:bold; color:#ddd;">${f.label}</label>
                        </div>
                    `;
                }

                return `
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                        <input type="checkbox" id="${f.id}" name="${f.id}" ${checked} />
                        <label for="${f.id}" style="margin:0; cursor:pointer;">${f.label}</label>
                    </div>
                `;
            }

            // NEW: Edge Selector Widget (Button Group - Tier 2)
            if (f.type === 'edge_selector') {
                const val = f.default || "top,right,bottom,left";
                const has = (edge) => val.indexOf(edge) !== -1;

                return `
                    <div class="edge-selector-wrapper" style="margin-bottom: 15px;">
                        <label style="font-size: 11px; margin-bottom: 5px; display:block;">${f.label}</label>
                        <div style="display: flex; gap: 4px;">
                            <button type="button" class="btn-edge ${has('left') ? 'active' : ''}" data-edge="left">⬅️ L</button>
                            <button type="button" class="btn-edge ${has('right') ? 'active' : ''}" data-edge="right">➡️ R</button>
                            <button type="button" class="btn-edge ${has('top') ? 'active' : ''}" data-edge="top">⬆️ T</button>
                            <button type="button" class="btn-edge ${has('bottom') ? 'active' : ''}" data-edge="bottom">⬇️ B</button>
                        </div>
                        <input type="hidden" id="${f.id}" name="${f.id}" value="${val}" />
                    </div>
                `;
            }

            // Select (Generic)
            if (f.type === 'select' && f.options) {
                const opts = f.options.map(o => {
                    const selected = (f.default === o.val) ? 'selected' : '';
                    return `<option value="${o.val}" ${selected}>${o.txt}</option>`;
                }).join('');
                return `
                    <div style="margin-bottom: 5px;">
                        <label style="font-size: 11px;">${f.label}</label>
                        <select name="${f.id}" id="${f.id}" style="width: 100%; padding: 5px; background: #333; color: #eee; border: 1px solid #444;">${opts}</select>
                    </div>
                `;
            }

            return this.renderFieldGrid(f); // Fallback
        }

        renderMatrix(section) {
            // Colors based on Classification (Approximate to user request)
            const colors = {
                'BASELINE': 'rgba(40, 167, 69, 0.15)', // Green tint
                'STRUCTURAL': 'rgba(255, 193, 7, 0.15)', // Yellow tint
                'ADDITIVE': 'rgba(0, 123, 255, 0.15)'   // Blue tint
            };

            const headers = section.headers || ["Left", "Right", "Top", "Bottom"];
            const th = headers.map(h => `<th style="font-size: 10px; color: #aaa; text-align: center; font-weight: normal; padding-bottom:5px;">${h}</th>`).join('');

            const rowsHtml = section.rows.map(row => {
                const bg = colors[row.classification] || 'transparent';

                // Map fields to columns. 
                // We assume columns are: Left, Right, Top, Bottom (Order matters!)
                // If the preset has different header order, we need a map. But let's assume standard order.
                const edges = ['left', 'right', 'top', 'bottom'];

                const cells = edges.map(edge => {
                    const field = row.fields[edge];
                    if (!field) return `<td></td>`; // Empty Cell

                    // Render minimal input
                    const val = field.default !== undefined ? `value="${field.default}"` : '';
                    const step = field.step ? `step="${field.step}"` : '';
                    const disabled = field.protected && this.isEditMode ? 'disabled' : ''; // Just in case

                    // Tiny remove button?
                    const removeBtn = (this.isEditMode && !field.protected) ?
                        `<div style="position:absolute; right:0; top:0; cursor:pointer; color:red; font-size:8px; line-height:1;" data-id="${field.id}" class="btn-remove-field">✕</div>` : '';

                    return `
                        <td style="padding: 2px; position: relative;">
                            ${removeBtn}
                            <input type="number" name="${field.id}" id="${field.id}" ${val} ${step} style="width: 100%; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid #444; color: #fff;">
                        </td>
                    `;
                }).join('');

                // Row Label (First Column effectively, but maybe separate?)
                // Actually the design implied a label column.
                // "Rule Name (Row) | Left | Right..."

                // AUTO: Generate borderControl for EVERY row using row.id
                const bcId = row.id + "_draw_border";
                const bcStyleId = row.id + "_border_style";
                const bcDefault = row.borderControl ? row.borderControl.default : false;
                const bcLabel = row.borderControl ? row.borderControl.label : "Vẽ viền (Draw Border)";

                const borderRow = `
                    <tr style="background: rgba(0,0,0,0.3);">
                        <td colspan="5" style="padding: 5px 10px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="${bcId}" name="${bcId}" ${bcDefault ? 'checked' : ''} />
                                <label for="${bcId}" style="margin:0; font-size: 10px; cursor: pointer; color: #ccc;">${bcLabel}</label>
                                <select name="${bcStyleId}" id="${bcStyleId}" style="font-size: 10px; padding: 2px 5px; background: #222; color: #eee; border: 1px solid #444; margin-left: auto;">
                                    <option value="solid">—— Solid</option>
                                    <option value="dashed" selected>- - Dashed</option>
                                </select>
                            </div>
                        </td>
                    </tr>
                `;

                return `
                    <tr style="background: ${bg}; border-bottom: 2px solid #222;">
                        <td style="padding: 5px; font-size: 11px; white-space: nowrap;">
                            <strong style="color:#ddd;">${row.label}</strong>
                            ${this.isEditMode ? `<br><span style="font-size:9px; color:#888;">${row.classification}</span>` : ''}
                        </td>
                        ${cells}
                    </tr>
                    ${borderRow}
                `;
            }).join('');

            return `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                        <tr>
                            <th style="width: 25%;"></th> <!-- Label Col -->
                            ${th}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            `;
        }

        renderFieldComplex(f) {
            // Special handling for Checkbox + Select + Input (Binding/Perf)
            if (f.subFields) {
                const subHtml = f.subFields.map(sf => {
                    if (sf.type === 'select') {
                        const opts = sf.options.map(o => `<option value="${o.val}">${o.txt}</option>`).join('');
                        return `<select name="${sf.id}" id="${sf.id}" style="width: ${sf.width || 'auto'}; padding: 2px;">${opts}</select>`;
                    }
                    if (sf.type === 'number') {
                        return `<input type="number" name="${sf.id}" id="${sf.id}" placeholder="${sf.placeholder || ''}" style="flex:1;" step="0.1" value="10">`;
                    }
                    return '';
                }).join('');

                return `
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                        <input type="checkbox" id="${f.id}" name="${f.id}" />
                        <label for="${f.id}" style="margin:0; min-width: 60px;">${f.label}</label>
                        ${subHtml}
                    </div>
                `;
            }
            return '';
        }

        getPresetOptions() {
            const presets = window.Imposition.dataStore.getPresets();
            return presets.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
        }

        bindEvents() {
            // DELEGATION: Handle all clicks on the container to survive re-renders.
            this.container.addEventListener('click', (e) => {
                // 1. Toggle Edit Mode
                if (e.target.id === 'btn-toggle-edit') {
                    this.isEditMode = !this.isEditMode;
                    this.render();
                    return;
                }

                // 2. Add Field (Open Modal)
                const addBtn = e.target.closest('.btn-add-field');
                if (addBtn) {
                    const sectionId = addBtn.dataset.section;
                    this.openAddFieldModal(sectionId);
                    return;
                }

                // 2.1 Reset Form (Create New)
                if (e.target.id === 'btn-reset-form') {
                    if (confirm("Xóa trắng form để tạo cấu hình mới?")) {
                        this.isEditMode = false;
                        this.render();
                        // Last active will be cleared on next save
                    }
                    return;
                }

                // 3. Remove Field
                const removeBtn = e.target.closest('.btn-remove-field');
                if (removeBtn) {
                    const fieldId = removeBtn.dataset.id;
                    if (confirm("Xóa trường này?")) {
                        const schema = window.BuiltinPresets[0];
                        if (window.ConfigEngine.removeField(schema, fieldId)) {
                            // Need to persist this change?
                            // Ideally we auto-save or mark dirty. For now, just re-render.
                            this.render();
                        }
                    }
                    return;
                }

                // 4. Modal: Cancel
                if (e.target.id === 'btn-cancel-modal') {
                    const modal = document.getElementById('modal-add-field');
                    if (modal) modal.style.display = 'none';
                    return;
                }

                // 5. Modal: Confirm
                if (e.target.id === 'btn-confirm-modal') {
                    this.handleModalConfirm();
                    return;
                }

                // 6. Save Actions (Delegated)
                if (e.target.id === 'btn-save') {
                    const form = document.getElementById('config-form');
                    // Smart Save: Pass TRUE to allowUpdate. Logic inside handleSave decides based on preset_id presence.
                    if (form) this.handleSave(form, true);
                    return;
                }
            });

            // 7. Form Submit (Standard Listener on Container Capture? No, submit bubbles)
            // But form is re-created. Better to just listen on container click for Update button,
            // OR delegate submit event on container.
            this.container.addEventListener('submit', (e) => {
                if (e.target.id === 'config-form') {
                    e.preventDefault();
                    this.handleSave(e.target, true);
                }
            });

            // 8. Select Change (Load Preset)
            this.container.addEventListener('change', (e) => {
                // Load Preset Handler
                if (e.target.id === 'load-preset-select') {
                    if (e.target.value) this.loadPreset(e.target.value);
                }

                // Generic "showIf" Handler (Dynamic Visibility)
                this.evaluateConditionals();
            });

            // Initial conditional check
            this.evaluateConditionals();
        }

        /**
         * Evaluate 'showIf' conditions for all fields
         * Logic: showIf="fieldId=value"
         */
        evaluateConditionals() {
            if (!window.BuiltinPresets || !window.BuiltinPresets[0]) return;
            const schema = window.BuiltinPresets[0];

            // Helper to get value
            const getVal = (id) => {
                const el = document.getElementById(id);
                if (!el) return null;
                return (el.type === 'checkbox') ? el.checked.toString() : el.value;
            };

            // Recursively check fields
            const checkSection = (sec) => {
                if (sec.fields) sec.fields.forEach(checkField);
                if (sec.rows) sec.rows.forEach(r => Object.values(r.fields).forEach(checkField));
            };

            const checkField = (f) => {
                if (f.showIf) {
                    const parts = f.showIf.split('=');
                    const targetId = parts[0];
                    const targetVal = parts[1];

                    const currentVal = getVal(targetId);
                    const el = document.getElementById(f.id);

                    if (el) {
                        // Find closest container (div) to hide/show
                        const wrapper = el.closest('div');
                        if (wrapper) {
                            if (currentVal === targetVal) {
                                wrapper.style.display = 'block'; // Or flex/grid? Better to reset to initial
                                // If it was grid item, might need empty placeholder? 
                                // For now assume stack/simple block.
                                wrapper.style.opacity = '1';
                                wrapper.style.pointerEvents = 'auto';
                                // Simple display toggle might break layout if grid.
                                // Let's use visibility/display carefully.
                                wrapper.style.display = '';
                            } else {
                                wrapper.style.display = 'none';
                            }
                        }
                    }
                };

                schema.sections.forEach(checkSection);
            };
        }

        handleModalConfirm() {
            const modal = document.getElementById('modal-add-field');
            if (!modal) return;

            const label = document.getElementById('new-field-label').value;
            const classification = document.getElementById('new-field-classification').value;
            const sectionId = modal.dataset.section;

            if (!label) { alert("Vui lòng nhập tên!"); return; }

            const fieldDef = window.ConfigEngine.createFieldDefinition({
                label: label,
                type: 'number',
                classification: classification,
                edge: 'dynamic'
            });

            const schema = window.BuiltinPresets[0];
            if (window.ConfigEngine.addField(schema, sectionId, fieldDef)) {
                modal.style.display = 'none';
                this.render();
            } else {
                alert("Lỗi: Không tìm thấy Section hợp lệ.");
            }
        }

        openAddFieldModal(sectionId) {
            const modal = document.getElementById('modal-add-field');
            if (modal) {
                modal.dataset.section = sectionId; // Store context
                document.getElementById('new-field-label').value = ""; // Reset
                document.getElementById('new-field-classification').value = "ADDITIVE"; // Default
                modal.style.display = 'flex';
            }
        }

        loadPreset(id) {
            // Persist State
            window.Imposition.dataStore.saveLastActive(id);

            const p = window.Imposition.dataStore.getPresets().find(x => x.id === id);
            if (!p) return;

            // Phase 10: Load Schema from Preset if available
            if (p.schema) {
                console.log("Loading Embedded Schema from Preset:", p.label);
                window.BuiltinPresets[0] = p.schema;
                this.render();
                // CRITICAL: Restore dropdown selection after render
                const sel = document.getElementById('load-preset-select');
                if (sel) sel.value = id;
            }

            const form = document.getElementById('config-form');
            if (!form) {
                this.render();
                // CRITICAL: Restore dropdown selection after render
                const sel = document.getElementById('load-preset-select');
                if (sel) sel.value = id;
            }

            const formRef = document.getElementById('config-form');
            if (!formRef) return;

            // Meta
            document.getElementById('preset_id').value = p.id;
            document.getElementById('preset_name').value = p.label;

            // Fill Fields from rawValues (Universal Loader)
            if (p.rawValues) {
                // RESET: First reset all checkboxes to false since unchecked ones are missing from rawValues
                Array.from(formRef.querySelectorAll('input[type=checkbox]')).forEach(cb => cb.checked = false);

                Object.keys(p.rawValues).forEach(key => {
                    const el = formRef.elements[key];
                    if (el) {
                        if (el.type === 'checkbox') {
                            el.checked = p.rawValues[key] === 'on' || p.rawValues[key] === true || p.rawValues[key] === 'true';
                        } else {
                            el.value = p.rawValues[key];
                        }
                    }
                });
            } else {
                // Fallback for Legacy Presets (Hardcoded map)
                this.fillLegacyForm(formRef, p);
            }
        }

        fillLegacyForm(form, p) {
            if (p.geometry.finish) {
                if (form.elements['finish_w']) form.elements['finish_w'].value = p.geometry.finish.w || '';
                if (form.elements['finish_h']) form.elements['finish_h'].value = p.geometry.finish.h || '';
            }
        }



        handleSave(form, allowUpdate) {
            const formData = new FormData(form);
            const name = formData.get('preset_name');
            if (!name) { alert("Vui lòng nhập tên cấu hình!"); return; }

            let existingId = formData.get('preset_id');

            // SMART LOGIC: If ID exists but name is different, check if user wants to Update or Create New
            if (existingId && allowUpdate) {
                const oldPreset = window.Imposition.dataStore.getPresets().find(x => x.id === existingId);
                if (oldPreset && oldPreset.label !== name) {
                    const choice = confirm(`Bạn đã đổi tên từ "${oldPreset.label}" sang "${name}".\n\n- Bấm OK để CẬP NHẬT (Đổi tên cấu hình cũ).\n- Bấm Cancel để LƯU MỚI (Tạo thêm 1 cấu hình mới).`);
                    if (!choice) {
                        existingId = ''; // Clear ID to force new save
                    }
                }
            }

            const id = (allowUpdate && existingId) ? existingId : 'preset_' + Date.now();

            // Construct Preset Object
            // Note: We save rawValues so we can reload the form easily
            // Logic Compilation happens at Runtime (ActionTab), not Save time (ConfigTab)
            // But we must construct the Legacy Structure for the current 'imposition.jsx' until Phase 8 fully removes it.

            // However, since we did "Direct Rule Injection", we can just save Rules if we wanted.
            // But to support ConfigEngine re-compilation, we save rawValues.

            // FIELD_IDS reference for consistent field naming
            const F = window.FIELD_IDS || {};

            const preset = {
                id: id,
                label: name,
                createdAt: new Date().toISOString(),
                schemaId: 'embedded', // Mark as embedded
                // Save the Current Schema Structure (Snapshot)
                // In a real app, we should only save if modified, but for simplicity we save snapshot.
                schema: JSON.parse(JSON.stringify(window.BuiltinPresets[0])),

                rawValues: Object.fromEntries(formData),

                // Legacy Payload Shim (Using FIELD_IDS for consistency)
                geometry: {
                    finish: {
                        w: Number(formData.get(F.FINISH_W || 'finish_w')) || 0,
                        h: Number(formData.get(F.FINISH_H || 'finish_h')) || 0
                    },
                    safe: [
                        Number(formData.get(F.SAFE_TOP || 'safe_top')) || 0,
                        Number(formData.get(F.SAFE_BOTTOM || 'safe_bottom')) || 0,
                        Number(formData.get(F.SAFE_LEFT || 'safe_left')) || 0,
                        Number(formData.get(F.SAFE_RIGHT || 'safe_right')) || 0
                    ]
                },
                options: {
                    clone: formData.get('opt_clone') === 'on',
                    cleanup: formData.get('opt_cleanup') === 'on',
                    k100: formData.get('opt_k100') === 'on'
                }
            };

            window.Imposition.dataStore.savePreset(preset);

            const action = (allowUpdate && existingId) ? 'Cập nhật' : 'Tạo mới';
            alert(`✅ Đã ${action}: ${preset.label}`);

            if (!existingId && allowUpdate) {
                // If we forced new save, update hidden ID
                document.getElementById('preset_id').value = id;
            }

            this.render(); // Re-render to update dropdown
        }
    }

    window.Imposition.configTab = new ConfigTab();
})();
