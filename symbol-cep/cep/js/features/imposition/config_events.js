/**
 * MODULE: ConfigEvents
 * LAYER: UI/Events (L6)
 * PURPOSE: Event binding and conditional evaluation for config form
 * DEPENDENCIES: ConfigPersistence, BuiltinPresets, ConfigEngine
 * SIDE EFFECTS: DOM event listeners
 * EXPORTS: ConfigEvents
 */

import { ConfigPersistence } from './config_persistence.js';
import { BuiltinPresets } from './builtin_presets.js';
import { ConfigEngine } from './schema_editor.js';

export const ConfigEvents = {

    /**
     * Bind all events on the config container using event delegation
     * @param {ConfigTab} tab - The ConfigTab instance (for state access)
     */
    bindEvents(tab) {
        tab.container.addEventListener('click', (e) => {
            this._handleClick(e, tab);
        });

        tab.container.addEventListener('submit', (e) => {
            if (e.target.id === 'config-form') {
                e.preventDefault();
                ConfigPersistence.handleSave(e.target, true, tab);
            }
        });

        tab.container.addEventListener('change', (e) => {
            if (e.target.id === 'load-preset-select' && e.target.value) {
                ConfigPersistence.loadPreset(e.target.value, tab);
            }
            this.evaluateConditionals();
        });

        this.evaluateConditionals();
    },

    /** @private */
    _handleClick(e, tab) {
        if (e.target.id === 'btn-toggle-edit') {
            tab.isEditMode = !tab.isEditMode;
            tab.render();
            return;
        }

        const addBtn = e.target.closest('.btn-add-field');
        if (addBtn) {
            tab.openAddFieldModal(addBtn.dataset.section);
            return;
        }

        if (e.target.id === 'btn-reset-form') {
            if (confirm("Xóa trắng form để tạo cấu hình mới?")) {
                tab.isEditMode = false;
                tab.render();
            }
            return;
        }

        const removeBtn = e.target.closest('.btn-remove-field');
        if (removeBtn) {
            this._handleRemoveField(removeBtn, tab);
            return;
        }

        if (e.target.id === 'btn-cancel-modal') {
            const modal = document.getElementById('modal-add-field');
            if (modal) modal.style.display = 'none';
            return;
        }

        if (e.target.id === 'btn-confirm-modal') {
            tab.handleModalConfirm();
            return;
        }

        if (e.target.id === 'btn-save') {
            const form = document.getElementById('config-form');
            if (form) ConfigPersistence.handleSave(form, true, tab);
        }
    },

    /** @private */
    _handleRemoveField(removeBtn, tab) {
        const fieldId = removeBtn.dataset.id;
        if (!confirm("Xóa trường này?")) return;

        const schema = BuiltinPresets[0];
        if (ConfigEngine.removeField(schema, fieldId)) {
            tab.render();
        }
    },

    /**
     * Evaluate 'showIf' conditions for all fields
     */
    evaluateConditionals() {
        if (!BuiltinPresets || !BuiltinPresets[0]) return;
        const schema = BuiltinPresets[0];

        schema.sections.forEach(sec => {
            if (sec.fields) sec.fields.forEach(f => this._checkField(f));
            if (sec.rows) {
                sec.rows.forEach(r => {
                    Object.values(r.fields).forEach(f => this._checkField(f));
                });
            }
        });
    },

    /** @private */
    _checkField(f) {
        if (!f.showIf) return;

        const parts = f.showIf.split('=');
        const targetId = parts[0];
        const targetVal = parts[1];

        const targetEl = document.getElementById(targetId);
        const currentVal = targetEl
            ? (targetEl.type === 'checkbox' ? targetEl.checked.toString() : targetEl.value)
            : null;

        const el = document.getElementById(f.id);
        if (!el) return;

        const wrapper = el.closest('div');
        if (!wrapper) return;

        if (currentVal === targetVal) {
            wrapper.style.display = '';
            wrapper.style.opacity = '1';
            wrapper.style.pointerEvents = 'auto';
        } else {
            wrapper.style.display = 'none';
        }
    }
};
