/**
 * CompactFormBuilder.js - Ultra Compact UI for Tab 2
 * 
 * REFACTORED (2026-01-28):
 * - Acts as Controller/Coordinator
 * - Delegates UI building to FormComponents
 * - Delegates Logic to FormLogic
 * - Delegates Autocomplete to AddressService
 */

import { DomFactory } from './helpers/DomFactory.js';
import { AddressService } from './modules/AddressService.js';
import { FormLogic } from './modules/FormLogic.js';
import { FormComponents } from './modules/FormComponents.js';
import { InputEngine } from '../logic/ux/InputEngine.js';
// import { DateGridWidget } from './DateGridWidget.js';

export class CompactFormBuilder {
    constructor(options = {}) {
        this.container = options.container;
        this.schema = options.schema || {};
        this.data = options.data || {};
        this.onChange = options.onChange || null;
        this.refs = {};
        this._tabIndex = 1; // Track tabindex
        this._idxLocked = true; // Lock idx by default

        // Initialize Modules
        if (typeof FormLogic !== 'undefined') {
            this.logic = new FormLogic(this);
        }
        if (typeof FormComponents !== 'undefined') {
            this.components = new FormComponents(this);
        }
    }

    build() {
        if (!this.container) return this;
        this.container.innerHTML = '';
        this._tabIndex = 1;

        if (!this.components) {
            // console.error('FormComponents module not loaded!');
            return this;
        }

        // Build all compact groups via Module
        this.components.buildInfoGroup();
        this.components.buildFamilyGroup();
        this.components.buildVenueGroup();
        this.components.buildDateGroupWithActions();

        // Apply initial lock state
        this._updateIdxState();

        // Setup Logic Trigger
        if (this.logic) {
            // Defer execution to ensure DOM is ready
            setTimeout(() => this.logic.setupAutoVenue(), 0);
        }


        return this;
    }

    // ===== DELEGATED HELPERS (Called by FormComponents) =====

    _createInlineRadio(key, options, suffix = '') {
        const { element: group, inputs } = DomFactory.createRadioGroup(key, options, suffix);

        this.refs[key] = { type: 'radio', elements: inputs };
        inputs.forEach(radio => {
            radio.addEventListener('change', () => this._handleChange(key, radio.value));
        });

        return group;
    }

    _createTextareaWithIdx(key, rows, hasIdx) {
        const { element: wrapper, textarea: ta, idx } = DomFactory.createTextareaWithIdx(rows, hasIdx);

        ta.tabIndex = this._tabIndex++;
        this.refs[key] = ta;

        ta.addEventListener('input', () => this._handleChange(key, ta.value));

        // Delegate to AddressService
        if (typeof AddressService !== 'undefined') {
            AddressService.bind(ta, key, (k, v) => this._handleChange(k, v), this.container, this.schema);
        }

        ta.addEventListener('blur', () => this._runInputNormalization(ta, key));

        if (hasIdx && idx) {
            idx.tabIndex = this._idxLocked ? -1 : this._tabIndex++;
            this.refs[`${key}_idx`] = idx;
        }

        return wrapper;
    }

    _createInputWithAuto(key, hasAuto) {
        const { element: wrapper, input: inp, checkbox: chk } = DomFactory.createInputWithAuto(hasAuto);

        inp.tabIndex = this._tabIndex++;
        this.refs[key] = inp;

        inp.addEventListener('input', () => this._handleChange(key, inp.value));

        if (chk) {
            this.refs[`${key}_auto`] = chk;
        }

        // Delegate to AddressService
        if (typeof AddressService !== 'undefined') {
            AddressService.bind(inp, key, (k, v) => this._handleChange(k, v), this.container, this.schema);
        }

        inp.addEventListener('blur', () => this._runInputNormalization(inp, key));

        return wrapper;
    }

    _createTextarea(key, rows) {
        const ta = DomFactory.createTextarea(rows);

        ta.tabIndex = this._tabIndex++;
        this.refs[key] = ta;

        ta.addEventListener('input', () => this._handleChange(key, ta.value));

        // Delegate to AddressService
        if (typeof AddressService !== 'undefined') {
            AddressService.bind(ta, key, (k, v) => this._handleChange(k, v), this.container, this.schema);
        }

        ta.addEventListener('blur', () => this._runInputNormalization(ta, key));

        return ta;
    }

    // ===== INTERNAL STATE MANAGEMENT =====

    _updateIdxState() {
        document.querySelectorAll('.compact-idx').forEach(idx => {
            idx.tabIndex = this._idxLocked ? -1 : 0;
            idx.disabled = this._idxLocked;
            idx.style.opacity = this._idxLocked ? '0.5' : '1';
            idx.style.pointerEvents = this._idxLocked ? 'none' : 'auto';
        });
    }

    _handleChange(key, value) {
        this.data[key] = value;
        if (this.onChange) this.onChange(key, value, this.data);
    }

    _runInputNormalization(element, key) {
        if (typeof InputEngine !== 'undefined') {
            const result = InputEngine.process(element.value, key, {}, this.schema);

            // 1. Cập nhật giá trị nếu có Normalize (Tự viết hoa, sửa lỗi spacing...)
            if (result.value !== element.value) {
                element.value = result.value;
                this._handleChange(key, result.value);
            }

            // 2. Xử lý hiển thị Lỗi/Cảnh báo
            if (result.warnings.length > 0) {
                // a. Hiệu ứng thị giác (Viền đỏ/vàng)
                const isError = result.warnings.some(w => w.severity === 'error');
                element.style.borderColor = isError ? '#e74c3c' : '#f1c40f'; // Đỏ hoặc Vàng
                element.style.backgroundColor = isError ? '#fff5f5' : '#fvfbf0'; // Nền nhạt

                // b. Tooltip (khi rê chuột vào)
                element.title = result.warnings.map(w => w.message).join('\n');

                // c. [FIX] HIỆN TOAST (Chỉ hiện lỗi đầu tiên để đỡ rối)
                if (typeof showToast === 'function') {
                    const firstMsg = result.warnings[0].message;
                    showToast(firstMsg, isError ? 'error' : 'warning');
                }
            } else {
                // Reset về trạng thái bình thường nếu hết lỗi
                element.style.borderColor = '';
                element.style.backgroundColor = '';
                element.title = '';
            }
        }
    }


    getData() {
        const data = {};
        Object.keys(this.refs).forEach(key => {
            const ref = this.refs[key];
            if (ref.type === 'radio') {
                const checked = ref.elements.find(r => r.checked);
                data[key] = checked ? checked.value : '';
            } else if (ref.type === 'checkbox') {
                data[key] = ref.checked;
            } else if (ref.isComputed) {
                if (ref.el) {
                    data[key] = ref.el.textContent || '';
                } else if (ref.value !== undefined) {
                    data[key] = ref.value || '';
                }
            } else if (ref.value !== undefined) {
                data[key] = ref.value || '';
            }
        });
        return data;
    }

    setData(data) {
        Object.keys(this.refs).forEach(key => {
            const ref = this.refs[key];
            const val = data[key];

            if (ref.type === 'radio') {
                if (val !== undefined) {
                    ref.elements.forEach(r => r.checked = r.value === val);
                }
            } else if (ref.type === 'checkbox') {
                if (val !== undefined) ref.checked = Boolean(val);
            } else if (ref.isComputed) {
                if (val !== undefined && val !== null) {
                    if (ref.el) {
                        ref.el.textContent = val;
                    } else if (ref.value !== undefined) {
                        ref.value = val;
                    }
                }
            } else {
                if (val !== undefined) ref.value = val;
            }
        });
        this.data = { ...this.data, ...data };
    }
}

