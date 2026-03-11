/**
 * MODULE: ConfigTab
 * LAYER: UI/Coordinator (L6)
 * PURPOSE: Config tab initialization, render coordination, and modal handling
 * DEPENDENCIES: ConfigRenderer, ConfigEvents, ConfigPersistence, DataStore, BuiltinPresets, ConfigEngine
 * SIDE EFFECTS: DOM manipulation
 * EXPORTS: ConfigTab class
 */

import { dataStore } from './data_store.js';
import { ConfigRenderer } from './config_renderer.js';
import { ConfigEvents } from './config_events.js';
import { BuiltinPresets } from './builtin_presets.js';
import { ConfigEngine } from './schema_editor.js';

export class ConfigTab {
    constructor() {
        this.container = null;
        this.isEditMode = false;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();

        ConfigEvents.bindEvents(this);
    }

    /**
     * Main Render: Shell + delegate to ConfigRenderer
     */
    render() {
        const schema = (BuiltinPresets && BuiltinPresets[0]) ? BuiltinPresets[0] : null;

        this.container.innerHTML = `
            <form id="config-form">
                ${this._renderTopBar()}
                <input type="hidden" name="preset_id" id="preset_id" value="" />
                <div id="dynamic-form-body">
                    ${schema ? ConfigRenderer.renderSchema(schema, this.isEditMode) : '<p>Error: Schema not loaded.</p>'}
                </div>
                ${this._renderFooter()}
                ${this._renderModal()}
            </form>
            ${this._renderStyles()}
        `;
    }

    /** @private */
    _renderTopBar() {
        return `
            <div style="margin-bottom: 15px; background: #222; padding: 4px 8px; border-radius: 4px; border: 1px solid #333; display: flex; align-items: center; gap: 8px;">
                <label style="color: #aaa; font-size: 11px; white-space: nowrap; margin: 0;">📂 Preset:</label>
                <select id="load-preset-select" style="flex: 1; padding: 2px 4px; background: #111; color: #eee; border: 1px solid #444; font-size: 11px; height: 22px;">
                    <option value="">-- Chọn --</option>
                    ${this._getPresetOptions()}
                </select>
                <button type="button" id="btn-toggle-edit" class="outline ${this.isEditMode ? 'contrast' : 'secondary'}" 
                    style="font-size: 10px; padding: 0 6px; height: 22px; line-height: 20px; white-space:nowrap;">
                    ${this.isEditMode ? 'Stop' : 'Edit'}
                </button>
            </div>
        `;
    }

    /** @private */
    _renderFooter() {
        return `
            <div style="background: #222; padding: 10px; border-radius: 4px; margin-top: 20px;">
                <label style="margin-bottom: 5px;">Tên Cấu hình</label>
                <input type="text" name="preset_name" id="preset_name" placeholder="Ví dụ: Catalogue A4" style="width: 100%; margin-bottom: 10px;" required />
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="secondary outline" id="btn-reset-form" style="flex: 1; font-size: 12px;">🆕 Tạo mới</button>
                    <button type="submit" class="contrast" id="btn-save" style="flex: 2;">✅ Lưu Cấu Hình</button>
                </div>
            </div>
        `;
    }

    /** @private */
    _renderModal() {
        return `
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
        `;
    }

    /** @private */
    _renderStyles() {
        return `
            <style>
                .btn-edge { flex: 1; padding: 6px 4px; background: #222; border: 1px solid #444; color: #888; cursor: pointer; font-size: 11px; transition: all 0.2s; border-radius: 3px; }
                .btn-edge:hover { border-color: #666; }
                .btn-edge.active { background: #0088ff; border-color: #0099ff; color: #fff; font-weight: bold; }
            </style>
            <script>
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

    /** @private */
    _getPresetOptions() {
        const presets = dataStore.getPresets();
        return presets.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
    }

    handleModalConfirm() {
        const modal = document.getElementById('modal-add-field');
        if (!modal) return;

        const label = document.getElementById('new-field-label').value;
        const classification = document.getElementById('new-field-classification').value;
        const sectionId = modal.dataset.section;

        if (!label) { alert("Vui lòng nhập tên!"); return; }

        const fieldDef = ConfigEngine.createFieldDefinition({
            label: label,
            type: 'number',
            classification: classification,
            edge: 'dynamic'
        });

        const schema = BuiltinPresets[0];
        if (ConfigEngine.addField(schema, sectionId, fieldDef)) {
            modal.style.display = 'none';
            this.render();
        } else {
            alert("Lỗi: Không tìm thấy Section hợp lệ.");
        }
    }

    openAddFieldModal(sectionId) {
        const modal = document.getElementById('modal-add-field');
        if (modal) {
            modal.dataset.section = sectionId;
            document.getElementById('new-field-label').value = "";
            document.getElementById('new-field-classification').value = "ADDITIVE";
            modal.style.display = 'flex';
        }
    }
}
