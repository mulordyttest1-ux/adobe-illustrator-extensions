import { Pane } from 'tweakpane';
import { getEdgeLabel, getSectionTitle, impositionCopy } from './imposition_copy.js';
import {
    PASTEBOARD_MODE_CUSTOM,
    PASTEBOARD_MODE_OFF,
    PASTEBOARD_MODE_STANDARD,
    buildPasteboardLegendPreview,
    buildPasteboardTokenDescriptors,
    normalizePasteboardMode
} from './pasteboard_slug.js';

const EXPANDED_SECTIONS = {
    sec_artboard: true,
    sec_sheet_layout: true,
    sec_size: true,
    sec_margins: true,
    sec_resize_mode: false,
    sec_options: true,
    sec_output_save: true,
    sec_marks: false,
    pasteboard: true,
    schema: true
};

const PLACEHOLDERS = {
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
    mark_weight: 'pt',
    info_template: 'Mau tuy chinh'
};

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildListOptions(field) {
    const options = {};
    (field.options || []).forEach((option) => {
        options[option.txt] = option.val;
    });
    return options;
}

function getFolderContent(folderApi) {
    return folderApi.element.querySelector('.tp-fldv_c') || folderApi.element;
}

function getEdgePlaceholder(fieldId, edge) {
    return PLACEHOLDERS[fieldId] || getEdgeLabel(edge).charAt(0).toUpperCase();
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

function getControlPlaceholder(field) {
    if (!field) return '';
    return PLACEHOLDERS[field.id] || field.placeholder || '';
}

function isProtectedField(field) {
    return !!(field && field.protected);
}

function findFieldInCollection(fields, fieldId) {
    if (!Array.isArray(fields)) return null;

    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if (field && field.id === fieldId) {
            return field;
        }
    }

    return null;
}

function findFieldInRows(rows, fieldId) {
    if (!Array.isArray(rows)) return null;

    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || !row.fields) continue;

        const keys = Object.keys(row.fields);
        for (let j = 0; j < keys.length; j += 1) {
            const field = row.fields[keys[j]];
            if (field && field.id === fieldId) {
                return field;
            }
        }
    }

    return null;
}

function normalizeCheckboxValue(value) {
    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function findFieldById(section, fieldId) {
    if (!section) return null;

    return findFieldInCollection(section.fields, fieldId)
        || findFieldInRows(section.rows, fieldId)
        || null;
}

function getCompactFieldIds(sectionId) {
    if (sectionId === 'sec_artboard') return ['ab_w', 'ab_h'];
    if (sectionId === 'sec_size') return ['finish_w', 'finish_h'];
    return [];
}

function isCompactSection(sectionId) {
    return sectionId === 'sec_artboard' || sectionId === 'sec_size';
}

function getRemovableEntries(schema) {
    if (!schema || !schema.sections) return [];

    const entries = [];
    schema.sections.forEach((section) => {
        if (Array.isArray(section.fields)) {
            section.fields.forEach((field) => {
                if (field && field.id && !isProtectedField(field)) {
                    entries.push({
                        kind: 'field',
                        id: field.id,
                        label: field.label || field.id,
                        sectionTitle: getSectionTitle(section)
                    });
                }
            });
        }

        if (Array.isArray(section.rows)) {
            section.rows.forEach((row) => {
                if (row && row.id && String(row.id).indexOf('row_dynamic_') === 0) {
                    entries.push({
                        kind: 'row',
                        id: row.id,
                        label: row.label || row.id,
                        sectionTitle: getSectionTitle(section)
                    });
                }
            });
        }
    });

    return entries;
}

export class ConfigPaneRenderer {
    constructor(tab) {
        this.tab = tab;
        this.host = null;
        this.pane = null;
        this.schema = null;
        this.state = {};
        this.folderMap = {};
        this.bindings = {};
        this.customControls = {};
        this.customRows = {};
        this.buttonObserver = null;
    }

    mount(container, schema, rawValues, tabState) {
        this.unmount();

        this.host = container;
        this.schema = schema;
        this.state = clone(rawValues) || {};
        this.folderMap = {};
        this.bindings = {};
        this.customControls = {};
        this.customRows = {};

        if (!container || !schema) return;

        const paneHost = document.createElement('div');
        paneHost.className = 'config-pane-host';
        container.appendChild(paneHost);

        this.pane = new Pane({
            container: paneHost,
            expanded: true
        });

        schema.sections.forEach((section) => {
            this._buildSection(section);
        });

        this._buildPasteboardSection(schema);

        if (tabState && tabState.isEditMode) {
            this._buildSchemaSection(schema);
        }

        this._syncConditionalVisibility();
        this._guardFormButtons(paneHost);
    }

    unmount() {
        if (this.pane) {
            this.pane.dispose();
        }

        if (this.host) {
            this.host.innerHTML = '';
        }

        this.pane = null;
        this.host = null;
        this.schema = null;
        this.folderMap = {};
        this.bindings = {};
        this.customControls = {};
        this.customRows = {};

        if (this.buttonObserver) {
            this.buttonObserver.disconnect();
            this.buttonObserver = null;
        }
    }

    readValues() {
        return clone(this.state) || {};
    }

    applyValues(rawValues) {
        this.state = clone(rawValues) || {};
        if (this.host && this.schema) {
            this.mount(this.host, this.schema, this.state, { isEditMode: this.tab && this.tab.isEditMode });
        }
    }

    _buildSection(section) {
        const folder = this.pane.addFolder({
            title: getSectionTitle(section),
            expanded: !!EXPANDED_SECTIONS[section.id]
        });
        this.folderMap[section.id] = folder;

        const content = getFolderContent(folder);
        if (section.note || section.description) {
            content.appendChild(this._buildNote(section.note || section.description));
        }

        if (section.readOnlySummary && section.readOnlySummary.length) {
            content.appendChild(this._buildReadOnlySummary(section));
        }

        if (this._renderSpecialSection(folder, section)) {
            return;
        }

        this._renderStandardFields(folder, section.fields || []);
    }

    _renderSpecialSection(folder, section) {
        if (!section || !section.id) return false;

        if (isCompactSection(section.id)) {
            const compactIds = getCompactFieldIds(section.id);
            this._renderCompactFieldGroup(folder, section, compactIds);
            this._renderRemainingStandardFields(folder, section, compactIds);
            return true;
        }

        const handlers = {
            sec_sheet_layout: () => this._renderSheetLayout(folder, section),
            sec_margins: () => this._renderMargins(folder, section),
            sec_options: () => this._renderDenseFieldList(folder, (section.fields || []).filter((field) => field.id !== 'info_template')),
            sec_output_save: () => this._renderDenseFieldList(folder, section.fields || []),
            sec_resize_mode: () => this._renderDenseFieldList(folder, section.fields || []),
            sec_marks: () => this._renderDenseFieldList(folder, section.fields || [])
        };

        const handler = handlers[section.id];
        if (!handler) return false;

        handler();
        return true;
    }

    _renderCompactFieldGroup(folder, section, fieldIds) {
        if (!fieldIds || fieldIds.length === 0) return;

        const row = document.createElement('div');
        row.className = 'pane-inline-group';

        fieldIds.forEach((fieldId) => {
            const field = findFieldById(section, fieldId);
            if (!field) return;
            row.appendChild(this._buildCompactNumberControl(field, PLACEHOLDERS[fieldId] || field.label));
        });

        getFolderContent(folder).appendChild(row);
    }

    _renderRemainingStandardFields(folder, section, compactIds) {
        const fields = (section.fields || []).filter((field) => compactIds.indexOf(field.id) === -1);
        this._renderStandardFields(folder, fields);
    }

    _renderSheetLayout(folder, section) {
        const content = getFolderContent(folder);
        (section.rows || []).forEach((row) => {
            const block = document.createElement('div');
            block.className = 'pane-matrix-block';
            block.innerHTML = `<div class="pane-matrix-label">${escapeHtml(row.label || getSectionTitle({ id: 'sec_sheet_layout' }))}</div>`;

            const controls = document.createElement('div');
            controls.className = 'pane-inline-group pane-inline-group-4';

            ['left', 'right', 'top', 'bottom'].forEach((edge) => {
                const field = row.fields && row.fields[edge];
                if (!field) return;
                controls.appendChild(this._buildCompactNumberControl(field, getEdgePlaceholder(field.id, edge)));
            });

            block.appendChild(controls);
            content.appendChild(block);
        });
    }

    _renderMargins(folder, section) {
        const content = getFolderContent(folder);
        (section.rows || []).forEach((row) => {
            const block = document.createElement('div');
            block.className = 'pane-matrix-block';
            block.innerHTML = `<div class="pane-matrix-label">${escapeHtml(row.label || row.id)}</div>`;

            const controls = document.createElement('div');
            controls.className = 'pane-inline-group pane-inline-group-4';

            ['left', 'right', 'top', 'bottom'].forEach((edge) => {
                const field = row.fields && row.fields[edge];
                if (!field) return;
                controls.appendChild(this._buildCompactNumberControl(field, getEdgePlaceholder(field.id, edge)));
            });

            block.appendChild(controls);
            block.appendChild(this._buildBorderControls(row));
            content.appendChild(block);
        });
    }

    _renderStandardFields(folder, fields) {
        fields.forEach((field) => {
            if (!field || !field.id) return;

            const binding = this._createBinding(folder, field);
            if (!binding) return;

            if (field.id === 'custom_rotate_angle') {
                this.bindings.customRotateAngle = binding;
            }
            if (field.id === 'opt_custom_rotate') {
                this.bindings.customRotateToggle = binding;
                if (typeof binding.on === 'function') {
                    binding.on('change', () => this._syncConditionalVisibility());
                }
            }
        });
    }

    _renderDenseFieldList(folder, fields) {
        const content = getFolderContent(folder);
        const list = document.createElement('div');
        list.className = 'pane-setting-list';

        fields.forEach((field) => {
            if (!field || !field.id) return;
            list.appendChild(this._buildDenseFieldRow(field));
        });

        content.appendChild(list);
    }

    _buildDenseFieldRow(field) {
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
        const control = this._buildDenseControl(field);
        controlWrap.appendChild(control);

        row.appendChild(main);
        row.appendChild(controlWrap);

        this.customRows[field.id] = row;
        return row;
    }

    _buildDenseControl(field) {
        const displayLabel = getDisplayLabel(field) || field.id;

        if (field.type === 'checkbox') {
            return this._buildDenseCheckboxControl(field, displayLabel);
        }

        if (field.type === 'select' || field.type === 'radio') {
            return this._buildDenseSelectControl(field, displayLabel);
        }

        if (field.id === 'save_output_dir') {
            return this._buildDensePathControl(field, displayLabel);
        }

        return this._buildDenseInputControl(field, displayLabel);
    }

    _buildDenseCheckboxControl(field, displayLabel) {
        const wrap = document.createElement('label');
        wrap.className = 'pane-setting-toggle';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'pane-setting-checkbox';
        input.id = field.id;
        input.name = field.id;
        input.checked = normalizeCheckboxValue(this.state[field.id]);
        input.dataset.configControl = 'true';
        input.setAttribute('aria-label', buildAriaLabel(field, displayLabel));
        input.addEventListener('change', () => {
            this.state[field.id] = input.checked;
            this._syncConditionalVisibility();
        });

        wrap.appendChild(input);
        this.customControls[field.id] = input;
        return wrap;
    }

    _buildDenseSelectControl(field, displayLabel) {
        const select = document.createElement('select');
        select.id = field.id;
        select.name = field.id;
        select.className = 'pane-setting-select';
        select.dataset.configControl = 'true';
        select.setAttribute('aria-label', buildAriaLabel(field, displayLabel));
        (field.options || []).forEach((option) => {
            const opt = document.createElement('option');
            opt.value = option.val;
            opt.textContent = option.txt;
            select.appendChild(opt);
        });
        select.value = this.state[field.id] !== undefined && this.state[field.id] !== null
            ? String(this.state[field.id])
            : (field.default !== undefined ? String(field.default) : '');
        select.addEventListener('change', () => {
            this.state[field.id] = select.value;
        });
        this.customControls[field.id] = select;
        return select;
    }

    _buildDenseInputControl(field, displayLabel) {
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

        const placeholder = getControlPlaceholder(field);
        if (placeholder) {
            input.placeholder = placeholder;
        }

        input.value = this.state[field.id] !== undefined && this.state[field.id] !== null
            ? String(this.state[field.id])
            : '';

        input.addEventListener('input', () => {
            this.state[field.id] = input.value;
        });

        input.addEventListener('change', () => {
            this.state[field.id] = input.value;
        });

        this.customControls[field.id] = input;
        return input;
    }

    _buildDensePathControl(field, displayLabel) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pane-inline-group';

        const input = this._buildDenseInputControl(field, displayLabel);
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

    _createBinding(folder, field) {
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
            binding = folder.addBinding(this.state, field.id, params);
        } catch (error) {
            console.warn('[ConfigPaneRenderer] Failed to create binding:', field.id, error);
            return null;
        }

        this._decorateBinding(binding, field);
        return binding;
    }

    _decorateBinding(binding, field) {
        if (!binding || !binding.element) return;

        binding.element.dataset.fieldId = field.id;

        const control = binding.element.querySelector('input, select, textarea');
        if (!control) return;

        control.id = field.id;
        control.name = field.id;
        control.dataset.configControl = 'true';
        control.setAttribute('aria-label', buildAriaLabel(field, field.id));

        const placeholder = PLACEHOLDERS[field.id];
        if (placeholder && (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA')) {
            control.setAttribute('placeholder', placeholder);
        }

        const syncFromControl = () => {
            if (control.type === 'checkbox') {
                this.state[field.id] = !!control.checked;
                return;
            }

            this.state[field.id] = control.value;
        };

        control.addEventListener('input', syncFromControl);
        control.addEventListener('change', syncFromControl);
    }

    _buildCompactNumberControl(field, shortLabel) {
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
        input.value = this.state[field.id] !== undefined && this.state[field.id] !== null ? String(this.state[field.id]) : '';
        input.setAttribute('aria-label', buildAriaLabel(field, shortLabel));
        input.dataset.configControl = 'true';

        input.addEventListener('input', () => {
            this.state[field.id] = input.value;
        });

        input.addEventListener('change', () => {
            this.state[field.id] = input.value;
        });

        wrapper.appendChild(input);
        this.customControls[field.id] = input;
        return wrapper;
    }

    _buildBorderControls(row) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pane-inline-meta';

        const checkboxId = `${row.id}_draw_border`;
        const styleId = `${row.id}_border_style`;

        const checkboxWrap = document.createElement('label');
        checkboxWrap.className = 'pane-inline-check';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.name = checkboxId;
        checkbox.checked = normalizeCheckboxValue(this.state[checkboxId]);
        checkbox.dataset.configControl = 'true';
        checkbox.setAttribute('aria-label', impositionCopy.pane.border.toggleAria(row.label));
        checkbox.addEventListener('change', () => {
            this.state[checkboxId] = checkbox.checked;
        });

        const checkboxText = document.createElement('span');
        checkboxText.textContent = impositionCopy.pane.border.toggle;

        checkboxWrap.appendChild(checkbox);
        checkboxWrap.appendChild(checkboxText);

        const style = document.createElement('select');
        style.id = styleId;
        style.name = styleId;
        style.className = 'pane-inline-select';
        style.dataset.configControl = 'true';
        style.setAttribute('aria-label', impositionCopy.pane.border.styleAria(row.label));
        style.innerHTML = `
            <option value="solid">${impositionCopy.pane.border.styles.solid}</option>
            <option value="dashed">${impositionCopy.pane.border.styles.dashed}</option>
        `;
        style.value = this.state[styleId] || 'dashed';
        style.addEventListener('change', () => {
            this.state[styleId] = style.value;
        });

        wrapper.appendChild(checkboxWrap);
        wrapper.appendChild(style);

        this.customControls[checkboxId] = checkbox;
        this.customControls[styleId] = style;
        return wrapper;
    }

    _buildPasteboardModeControl(copy) {
        const label = document.createElement('label');
        label.className = 'pane-setting-label';
        label.setAttribute('for', 'pasteboard_mode');
        label.textContent = copy.modeLabel;

        const select = document.createElement('select');
        select.id = 'pasteboard_mode';
        select.name = 'pasteboard_mode';
        select.className = 'pane-setting-select pane-pasteboard-mode';
        select.dataset.configControl = 'true';
        select.innerHTML = `
            <option value="${PASTEBOARD_MODE_STANDARD}">${copy.modes.standard}</option>
            <option value="${PASTEBOARD_MODE_CUSTOM}">${copy.modes.custom}</option>
            <option value="${PASTEBOARD_MODE_OFF}">${copy.modes.off}</option>
        `;
        select.value = normalizePasteboardMode(this.state.pasteboard_mode);

        return { label, select };
    }

    _buildPasteboardSection(schema) {
        const optionsSection = (schema.sections || []).find((section) => section && section.id === 'sec_options');
        if (!optionsSection) return;

        const field = (optionsSection.fields || []).find((entry) => entry && entry.id === 'info_template');

        const folder = this.pane.addFolder({
            title: impositionCopy.pane.sectionTitles.pasteboard,
            expanded: !!EXPANDED_SECTIONS.pasteboard
        });
        this.folderMap.pasteboard = folder;

        const content = getFolderContent(folder);
        const copy = impositionCopy.pane.pasteboard;
        content.appendChild(this._buildNote(copy.note));

        const block = document.createElement('div');
        block.className = 'pane-pasteboard-block';

        const modeControl = this._buildPasteboardModeControl(copy);
        const modeLabel = modeControl.label;
        const modeSelect = modeControl.select;

        const preview = document.createElement('div');
        preview.className = 'pane-pasteboard-preview';
        preview.setAttribute('aria-live', 'polite');

        const customBlock = document.createElement('div');
        customBlock.className = 'pane-pasteboard-custom';
        customBlock.setAttribute('data-field-id', 'info_template');

        const textarea = document.createElement('textarea');
        textarea.id = 'info_template';
        textarea.name = 'info_template';
        textarea.className = 'pane-textarea-input';
        textarea.placeholder = PLACEHOLDERS.info_template;
        textarea.value = this.state.info_template || '';
        textarea.setAttribute('aria-label', (field && field.label) || impositionCopy.pane.pasteboardLabel);
        textarea.dataset.configControl = 'true';
        textarea.addEventListener('input', () => {
            this.state.info_template = textarea.value;
            refresh();
        });

        const tokenLabel = document.createElement('div');
        tokenLabel.className = 'pane-token-label';
        tokenLabel.textContent = copy.tokenLabel;

        const tokenList = document.createElement('div');
        tokenList.className = 'pane-token-list';
        buildPasteboardTokenDescriptors(schema).forEach((descriptor) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pane-token-chip';
            button.dataset.insertToken = descriptor.token;
            button.textContent = descriptor.label;
            button.title = descriptor.token;
            button.addEventListener('click', () => {
                this._insertPasteboardToken(textarea, descriptor.token);
                refresh();
            });
            tokenList.appendChild(button);
        });

        customBlock.appendChild(textarea);
        customBlock.appendChild(tokenLabel);
        customBlock.appendChild(tokenList);

        const refresh = () => {
            this.state.pasteboard_mode = normalizePasteboardMode(modeSelect.value);
            this.state.info_template = textarea.value;
            customBlock.classList.toggle('is-hidden', this.state.pasteboard_mode !== PASTEBOARD_MODE_CUSTOM);
            const previewText = this._buildPasteboardPreviewText();
            preview.textContent = previewText
                ? `${copy.previewLabel}: ${previewText}`
                : copy.emptyPreview;
        };

        modeSelect.addEventListener('change', refresh);

        block.appendChild(modeLabel);
        block.appendChild(modeSelect);
        block.appendChild(preview);
        block.appendChild(customBlock);
        content.appendChild(block);

        this.customControls.pasteboard_mode = modeSelect;
        this.customControls.info_template = textarea;
        refresh();
    }

    _insertPasteboardToken(textarea, token) {
        const current = textarea.value || '';
        const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : current.length;
        const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : start;

        textarea.value = current.slice(0, start) + token + current.slice(end);
        this.state.info_template = textarea.value;

        if (typeof textarea.focus === 'function') {
            textarea.focus();
        }

        if (typeof textarea.setSelectionRange === 'function') {
            const next = start + token.length;
            textarea.setSelectionRange(next, next);
        }
    }

    _buildPasteboardPreviewText() {
        return buildPasteboardLegendPreview(
            {
                itemsProcessed: 0
            },
            {
                label: this.state.preset_name || impositionCopy.pane.pasteboard.previewPresetName,
                rawValues: this.state,
                schema: this.schema,
                processingOptions: {
                    postflight: {
                        pasteboardMode: normalizePasteboardMode(this.state.pasteboard_mode),
                        pasteboardInfoTemplate: this.state.info_template || ''
                    }
                }
            }
        );
    }

    _buildSchemaSection(schema) {
        const folder = this.pane.addFolder({
            title: impositionCopy.pane.sectionTitles.schema,
            expanded: true
        });
        this.folderMap.schema = folder;

        const content = getFolderContent(folder);
        content.appendChild(this._buildNote(impositionCopy.pane.schema.note));

        const addBlock = document.createElement('div');
        addBlock.className = 'pane-schema-actions';
        (schema.sections || []).forEach((section) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pane-schema-btn';
            button.textContent = `+ ${getSectionTitle(section)}`;
            button.addEventListener('click', () => {
                this.tab.openAddFieldModal(section.id);
            });
            addBlock.appendChild(button);
        });
        content.appendChild(addBlock);

        const removable = getRemovableEntries(schema);
        if (removable.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'pane-schema-empty';
            empty.textContent = impositionCopy.pane.schema.empty;
            content.appendChild(empty);
            return;
        }

        removable.forEach((entry) => {
            const row = document.createElement('div');
            row.className = 'pane-schema-row';

            const text = document.createElement('span');
            text.className = 'pane-schema-label';
            text.textContent = `${entry.label} · ${entry.sectionTitle}`;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'pane-schema-remove';
            removeBtn.textContent = impositionCopy.pane.schema.remove;
            removeBtn.addEventListener('click', () => {
                if (entry.kind === 'row') {
                    this.tab.requestRemoveRow(entry.id, entry.label);
                    return;
                }
                this.tab.requestRemoveField(entry.id, entry.label);
            });

            row.appendChild(text);
            row.appendChild(removeBtn);
            content.appendChild(row);
        });
    }

    _buildReadOnlySummary(section) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pane-readonly-summary';
        wrapper.dataset.readonlySummary = section.id;

        const heading = document.createElement('div');
        heading.className = 'pane-readonly-heading';
        heading.textContent = impositionCopy.pane.readOnlyHeading;
        wrapper.appendChild(heading);

        (section.readOnlySummary || []).forEach((item) => {
            const row = document.createElement('div');
            row.className = 'pane-readonly-row';
            row.textContent = item.label;
            wrapper.appendChild(row);
        });

        return wrapper;
    }

    _buildNote(text) {
        const note = document.createElement('div');
        note.className = 'pane-section-note';
        note.textContent = text;
        return note;
    }

    _guardFormButtons(root) {
        if (!root) return;

        const apply = () => {
            root.querySelectorAll('button').forEach((button) => {
                if (button.type !== 'button') {
                    button.type = 'button';
                }
            });
        };

        apply();

        if (typeof MutationObserver === 'undefined') {
            return;
        }

        this.buttonObserver = new MutationObserver(() => {
            apply();
        });

        this.buttonObserver.observe(root, {
            childList: true,
            subtree: true
        });
    }

    _syncConditionalVisibility() {
        const rotateEnabled = normalizeCheckboxValue(this.state.opt_custom_rotate);
        if (this.bindings.customRotateAngle) {
            this.bindings.customRotateAngle.hidden = !rotateEnabled;
        }
        if (this.customRows.custom_rotate_angle) {
            this.customRows.custom_rotate_angle.classList.toggle('is-hidden', !rotateEnabled);
        }
    }
}
