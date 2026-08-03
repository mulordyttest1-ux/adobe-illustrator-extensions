import { impositionCopy } from './imposition_copy.js';

const CONTROL_PLACEHOLDERS = {
    ab_w: 'W',
    ab_h: 'H',
    finish_w: 'W',
    finish_h: 'H',
    safe_left: 'L',
    safe_right: 'R',
    safe_top: 'T',
    safe_bottom: 'B',
    sheet_m_left: 'L',
    sheet_m_right: 'R',
    sheet_m_top: 'T',
    sheet_m_bot: 'B',
    custom_rotate_angle: 'deg',
    mark_len: 'mm',
    mark_weight: 'pt'
};

function getFolderContent(folderApi) {
    return folderApi.element.querySelector('.tp-fldv_c') || folderApi.element;
}

function buildListOptions(field) {
    const options = {};
    (field.options || []).forEach((option) => {
        options[option.txt] = option.val;
    });
    return options;
}

function buildAriaLabel(field, fallback) {
    return (field && field.label) || fallback || '';
}

function getDisplayLabel(field) {
    return String((field && field.label) || '')
        .replace(/^_+\s*/, '')
        .trim();
}

function hasLongDenseLabel(field) {
    return getDisplayLabel(field).length > 28;
}

function findFieldInCollection(fields, fieldId) {
    if (!Array.isArray(fields)) return null;

    for (let index = 0; index < fields.length; index += 1) {
        const field = fields[index];
        if (field && field.id === fieldId) {
            return field;
        }
    }

    return null;
}

function findFieldInRows(rows, fieldId) {
    if (!Array.isArray(rows)) return null;

    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        if (!row || !row.fields) continue;

        const keys = Object.keys(row.fields);
        for (let fieldIndex = 0; fieldIndex < keys.length; fieldIndex += 1) {
            const field = row.fields[keys[fieldIndex]];
            if (field && field.id === fieldId) {
                return field;
            }
        }
    }

    return null;
}

function findFieldById(section, fieldId) {
    if (!section) return null;
    return findFieldInCollection(section.fields, fieldId)
        || findFieldInRows(section.rows, fieldId)
        || null;
}

export function getConfigControlPlaceholder(fieldId, fallback = '') {
    return CONTROL_PLACEHOLDERS[fieldId] || fallback;
}

export function normalizeConfigCheckboxValue(value) {
    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

export class ConfigPaneControlAdapter {
    constructor(context) {
        this.context = context;
    }

    syncConditionalVisibility() {
        const handler = this.context.syncConditionalVisibility || this.context._syncConditionalVisibility;
        if (typeof handler === 'function') {
            handler.call(this.context);
        }
    }

    renderCompactFieldGroup(folder, section, fieldIds) {
        if (!fieldIds || fieldIds.length === 0) return;

        const row = document.createElement('div');
        row.className = 'pane-inline-group';

        fieldIds.forEach((fieldId) => {
            const field = findFieldById(section, fieldId);
            if (!field) return;
            row.appendChild(this.buildCompactNumberControl(
                field,
                getConfigControlPlaceholder(fieldId, field.label)
            ));
        });

        getFolderContent(folder).appendChild(row);
    }

    renderRemainingStandardFields(folder, section, compactIds) {
        const fields = (section.fields || []).filter((field) => compactIds.indexOf(field.id) === -1);
        this.renderStandardFields(folder, fields);
    }

    renderStandardFields(folder, fields) {
        fields.forEach((field) => {
            if (!field || !field.id) return;

            const binding = this.createBinding(folder, field);
            if (!binding) return;

            if (field.id === 'custom_rotate_angle') {
                this.context.bindings.customRotateAngle = binding;
            }
            if (field.id === 'opt_custom_rotate') {
                this.context.bindings.customRotateToggle = binding;
                if (typeof binding.on === 'function') {
                    binding.on('change', () => this.syncConditionalVisibility());
                }
            }
        });
    }

    renderDenseFieldList(folder, fields) {
        const content = getFolderContent(folder);
        const list = document.createElement('div');
        list.className = 'pane-setting-list';

        fields.forEach((field) => {
            if (!field || !field.id) return;
            list.appendChild(this.buildDenseFieldRow(field));
        });

        content.appendChild(list);
    }

    buildDenseFieldRow(field) {
        const row = document.createElement('div');
        row.className = 'pane-setting-row';
        row.dataset.fieldId = field.id;
        if (hasLongDenseLabel(field)) {
            row.classList.add('pane-setting-row-long-label');
        }

        const main = document.createElement('div');
        main.className = 'pane-setting-main';

        const label = document.createElement('div');
        label.className = 'pane-setting-label';
        label.textContent = getDisplayLabel(field) || field.id;
        main.appendChild(label);

        if (field.note) {
            const note = document.createElement('div');
            note.className = 'pane-setting-note';
            note.textContent = field.note;
            main.appendChild(note);
        }

        const controlWrap = document.createElement('div');
        controlWrap.className = 'pane-setting-control';
        controlWrap.appendChild(this.buildDenseControl(field));

        row.appendChild(main);
        row.appendChild(controlWrap);

        this.context.customRows[field.id] = row;
        return row;
    }

    buildDenseControl(field) {
        const displayLabel = getDisplayLabel(field) || field.id;

        if (field.type === 'checkbox') {
            return this.buildDenseCheckboxControl(field, displayLabel);
        }
        if (field.type === 'select' || field.type === 'radio') {
            return this.buildDenseSelectControl(field, displayLabel);
        }
        if (field.id === 'save_output_dir') {
            return this.buildDensePathControl(field, displayLabel);
        }
        return this.buildDenseInputControl(field, displayLabel);
    }

    buildDenseCheckboxControl(field, displayLabel) {
        const wrap = document.createElement('label');
        wrap.className = 'pane-setting-toggle';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'pane-setting-checkbox';
        input.id = field.id;
        input.name = field.id;
        input.checked = normalizeConfigCheckboxValue(this.context.state[field.id]);
        input.dataset.configControl = 'true';
        input.setAttribute('aria-label', buildAriaLabel(field, displayLabel));
        input.addEventListener('change', () => {
            this.context.state[field.id] = input.checked;
            this.syncConditionalVisibility();
        });

        wrap.appendChild(input);
        this.context.customControls[field.id] = input;
        return wrap;
    }

    buildDenseSelectControl(field, displayLabel) {
        const select = document.createElement('select');
        select.id = field.id;
        select.name = field.id;
        select.className = 'pane-setting-select';
        select.dataset.configControl = 'true';
        select.setAttribute('aria-label', buildAriaLabel(field, displayLabel));
        (field.options || []).forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option.val;
            optionElement.textContent = option.txt;
            select.appendChild(optionElement);
        });
        select.value = this.context.state[field.id] !== undefined && this.context.state[field.id] !== null
            ? String(this.context.state[field.id])
            : (field.default !== undefined ? String(field.default) : '');
        select.addEventListener('change', () => {
            this.context.state[field.id] = select.value;
        });
        this.context.customControls[field.id] = select;
        return select;
    }

    buildDenseInputControl(field, displayLabel) {
        const input = document.createElement('input');
        input.type = field.type === 'number' ? 'number' : 'text';
        input.className = 'pane-setting-input';
        input.id = field.id;
        input.name = field.id;
        input.dataset.configControl = 'true';
        input.setAttribute('aria-label', buildAriaLabel(field, displayLabel));

        if (field.type === 'number') {
            input.step = field.step !== undefined ? String(field.step) : '0.1';
        }

        const placeholder = getConfigControlPlaceholder(field.id, field.placeholder || '');
        if (placeholder) {
            input.placeholder = placeholder;
        }

        input.value = this.context.state[field.id] !== undefined && this.context.state[field.id] !== null
            ? String(this.context.state[field.id])
            : '';

        const syncValue = () => {
            this.context.state[field.id] = input.value;
        };
        input.addEventListener('input', syncValue);
        input.addEventListener('change', syncValue);

        this.context.customControls[field.id] = input;
        return input;
    }

    buildDensePathControl(field, displayLabel) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pane-inline-group';

        const input = this.buildDenseInputControl(field, displayLabel);
        input.classList.add('pane-setting-input-path');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary outline pane-setting-action';
        button.dataset.configAction = 'pick-save-output-dir';
        button.textContent = impositionCopy.config.saveFolderButton;

        wrapper.appendChild(input);
        wrapper.appendChild(button);
        return wrapper;
    }

    createBinding(folder, field) {
        const params = {};
        if (field.label) params.label = field.label;

        if (field.type === 'number') {
            if (field.step !== undefined) params.step = Number(field.step);
        } else if (field.type === 'select' || field.type === 'radio') {
            params.options = buildListOptions(field);
        } else if (field.type === 'textarea') {
            return null;
        }

        let binding;
        try {
            binding = folder.addBinding(this.context.state, field.id, params);
        } catch (error) {
            console.warn('[ConfigPaneControlAdapter] Failed to create binding:', field.id, error);
            return null;
        }

        this.decorateBinding(binding, field);
        return binding;
    }

    decorateBinding(binding, field) {
        if (!binding || !binding.element) return;

        binding.element.dataset.fieldId = field.id;
        const control = binding.element.querySelector('input, select, textarea');
        if (!control) return;

        control.id = field.id;
        control.name = field.id;
        control.dataset.configControl = 'true';
        control.setAttribute('aria-label', buildAriaLabel(field, field.id));

        const placeholder = getConfigControlPlaceholder(field.id);
        if (placeholder && (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA')) {
            control.setAttribute('placeholder', placeholder);
        }

        const syncFromControl = () => {
            this.context.state[field.id] = control.type === 'checkbox'
                ? !!control.checked
                : control.value;
        };

        control.addEventListener('input', syncFromControl);
        control.addEventListener('change', syncFromControl);
    }

    buildCompactNumberControl(field, shortLabel) {
        const wrapper = document.createElement('label');
        wrapper.className = 'pane-inline-field';
        wrapper.setAttribute('data-field-id', field.id);

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'pane-inline-input';
        input.id = field.id;
        input.name = field.id;
        input.step = field.step !== undefined ? String(field.step) : '0.1';
        input.placeholder = shortLabel;
        input.value = this.context.state[field.id] !== undefined && this.context.state[field.id] !== null
            ? String(this.context.state[field.id])
            : '';
        input.setAttribute('aria-label', buildAriaLabel(field, shortLabel));
        input.dataset.configControl = 'true';

        const syncValue = () => {
            this.context.state[field.id] = input.value;
        };
        input.addEventListener('input', syncValue);
        input.addEventListener('change', syncValue);

        wrapper.appendChild(input);
        this.context.customControls[field.id] = input;
        return wrapper;
    }
}
