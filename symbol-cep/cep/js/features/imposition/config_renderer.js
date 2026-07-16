/**
 * MODULE: ConfigRenderer
 * LAYER: UI/Renderer (L6)
 * PURPOSE: Render HTML from schema definitions
 * DEPENDENCIES: None
 * SIDE EFFECTS: None
 * EXPORTS: ConfigRenderer
 */

const SECTION_HINTS = {
    sec_sheet_layout: 'Nhap theo mm cho phan bien giay hoac nhip may in.',
    sec_margins: 'Nhap theo mm cho tung canh. Gia tri 0 se bo qua canh do trong rule tuong ung.'
};

function renderFieldNote(field) {
    return field && field.note
        ? `<div class="field-note">${field.note}</div>`
        : '';
}

function renderSectionHint(section) {
    const text = (section && (section.note || section.description || SECTION_HINTS[section.id])) || '';
    return text ? `<div class="section-hint">${text}</div>` : '';
}

function getSectionClasses(section, isEditMode) {
    const classes = ['panel-card', 'panel-card-compact', 'form-section-card'];
    if (section && section.layout) classes.push(`section-layout-${section.layout}`);
    if (section && section.id) classes.push(`section-${section.id}`);
    if (isEditMode) classes.push('is-edit-mode');
    return classes.join(' ');
}

function getStackWrapperClass(section) {
    const classes = ['section-fields', 'compact-form-grid'];

    if (section && (section.id === 'sec_options' || section.id === 'sec_marks')) {
        classes.push('compact-form-grid-2');
    } else {
        classes.push('compact-form-grid-1');
    }

    return classes.join(' ');
}

function getFieldWrapperClasses(field, isEditMode) {
    const classes = ['field-wrapper'];
    if (field && field.type) classes.push(`field-type-${field.type}`);
    if (isEditMode) classes.push('field-wrapper-edit');

    if (field && (field.type === 'textarea' || field.type === 'radio' || field.type === 'edge_selector')) {
        classes.push('field-span-full');
    }

    return classes.join(' ');
}

export const ConfigRenderer = {
    renderSchema(schema, isEditMode) {
        if (!schema.sections) return '';

        return schema.sections.map((section) => {
            let fieldsHtml;
            const summaryHtml = section.readOnlySummary ? this.renderReadOnlySummary(section.readOnlySummary, section.id) : '';
            const sectionHint = renderSectionHint(section);

            if (section.layout === 'matrix') {
                fieldsHtml = this.renderMatrix(section, isEditMode);
            } else if (section.layout === 'stack') {
                fieldsHtml = `<div class="${getStackWrapperClass(section)}">${section.fields.map((field) => this.renderFieldStack(field, isEditMode)).join('')}</div>`;
            } else if (section.layout && section.layout.indexOf('grid-') === 0) {
                const cols = section.layout.split('-')[1];
                fieldsHtml = `<div class="grid grid-${cols} compact-grid">${section.fields.map((field) => this.renderFieldGrid(field, isEditMode)).join('')}</div>`;
            } else if (section.layout === 'complex') {
                fieldsHtml = `<div class="section-fields">${section.fields.map((field) => this.renderFieldComplex(field)).join('')}</div>`;
            } else {
                fieldsHtml = `<div class="${getStackWrapperClass(section)}">${section.fields.map((field) => this.renderFieldStack(field, isEditMode)).join('')}</div>`;
            }

            const addBtn = isEditMode
                ? `<button type="button" class="btn-add-field outline btn-inline-small" data-section="${section.id}">+ Them truong</button>`
                : '';

            return `
                <section class="${getSectionClasses(section, isEditMode)}" data-section="${section.id}">
                    <div class="form-section-head">
                        ${section.title ? `<h4 class="form-section-title">${section.title}</h4>` : '<span></span>'}
                        ${addBtn}
                    </div>
                    ${sectionHint}
                    ${summaryHtml}
                    ${fieldsHtml}
                </section>
            `;
        }).join('');
    },

    renderFieldGrid(field, isEditMode) {
        const required = field.required ? 'required' : '';
        const step = field.step ? `step="${field.step}"` : '';
        const val = field.default !== undefined ? `value="${field.default}"` : '';
        const ph = field.placeholder ? `placeholder="${field.placeholder}"` : '';
        const removeBtn = (isEditMode && !field.protected)
            ? `<button type="button" class="btn-remove-field field-remove-chip" data-id="${field.id}" aria-label="Xoa truong ${field.label}" title="Xoa truong">Xoa</button>`
            : '';

        const inputHtml = field.type === 'textarea'
            ? `<textarea name="${field.id}" id="${field.id}" ${ph} ${required} class="panel-textarea">${field.default || ''}</textarea>`
            : `<input type="${field.type}" name="${field.id}" id="${field.id}" ${step} ${val} ${ph} ${required} class="panel-input">`;

        return `
            <div class="${getFieldWrapperClasses(field, isEditMode)}" data-field-wrapper="${field.id}">
                <div class="field-header">
                    <label class="panel-field-label" for="${field.id}">${field.label}</label>
                    ${removeBtn}
                </div>
                ${inputHtml}
                ${renderFieldNote(field)}
            </div>
        `;
    },

    renderFieldStack(field, isEditMode) {
        if (field.type === 'checkbox') {
            return this._renderCheckbox(field, isEditMode);
        }
        if (field.type === 'edge_selector') {
            return this._renderEdgeSelector(field);
        }
        if (field.type === 'select' && field.options) {
            return this._renderSelect(field, isEditMode);
        }
        if (field.type === 'radio' && field.options) {
            return this._renderRadioGroup(field, isEditMode);
        }
        return this.renderFieldGrid(field, isEditMode);
    },

    renderReadOnlySummary(items, sectionId) {
        if (!items || items.length === 0) return '';

        const rows = items.map((item) => `
            <div data-invariant-id="${item.id}" class="readonly-summary-row">
                <div class="readonly-summary-label">${item.label}</div>
                ${item.note ? `<div class="field-note">${item.note}</div>` : ''}
            </div>
        `).join('');

        return `
            <div data-readonly-summary="${sectionId}" class="readonly-summary-card">
                <div class="readonly-summary-heading">Luồng cố định</div>
                ${rows}
            </div>
        `;
    },

    _renderCheckbox(field, isEditMode) {
        const checked = field.default ? 'checked' : '';
        const removeBtn = (isEditMode && !field.protected)
            ? `<button type="button" class="btn-remove-field field-remove-chip" data-id="${field.id}" aria-label="Xoa truong ${field.label}" title="Xoa truong">Xoa</button>`
            : '';

        if (field.disabled) {
            return `
                <div class="${getFieldWrapperClasses(field, isEditMode)}" data-field-wrapper="${field.id}">
                    <div class="field-header compact-field-header">
                        <div class="checkbox-row checkbox-row-disabled">
                            <input type="checkbox" checked disabled />
                            <span class="checkbox-label">${field.label}</span>
                        </div>
                        ${removeBtn}
                    </div>
                    ${renderFieldNote(field)}
                </div>
            `;
        }

        return `
            <div class="${getFieldWrapperClasses(field, isEditMode)}" data-field-wrapper="${field.id}">
                <div class="field-header compact-field-header">
                    <div class="checkbox-row compact-checkbox-row">
                        <input type="checkbox" id="${field.id}" name="${field.id}" ${checked} />
                        <label for="${field.id}" class="checkbox-label">${field.label}</label>
                    </div>
                    ${removeBtn}
                </div>
                ${renderFieldNote(field)}
            </div>
        `;
    },

    _renderEdgeSelector(field) {
        const val = field.default || 'top,right,bottom,left';
        const has = (edge) => val.indexOf(edge) !== -1;

        return `
            <div class="${getFieldWrapperClasses(field, false)} edge-selector-wrapper" data-field-wrapper="${field.id}">
                <label class="panel-field-label" for="${field.id}">${field.label}</label>
                <div class="edge-button-row">
                    <button type="button" class="btn-edge ${has('left') ? 'active' : ''}" data-edge="left">L</button>
                    <button type="button" class="btn-edge ${has('right') ? 'active' : ''}" data-edge="right">R</button>
                    <button type="button" class="btn-edge ${has('top') ? 'active' : ''}" data-edge="top">T</button>
                    <button type="button" class="btn-edge ${has('bottom') ? 'active' : ''}" data-edge="bottom">B</button>
                </div>
                <input type="hidden" id="${field.id}" name="${field.id}" value="${val}" />
                ${renderFieldNote(field)}
            </div>
        `;
    },

    _renderSelect(field, isEditMode) {
        const opts = field.options.map((option) => {
            const selected = (field.default === option.val) ? 'selected' : '';
            return `<option value="${option.val}" ${selected}>${option.txt}</option>`;
        }).join('');

        return `
            <div class="${getFieldWrapperClasses(field, isEditMode)}" data-field-wrapper="${field.id}">
                <label class="panel-field-label" for="${field.id}">${field.label}</label>
                <select name="${field.id}" id="${field.id}" class="panel-select">${opts}</select>
                ${renderFieldNote(field)}
            </div>
        `;
    },

    _renderRadioGroup(field, isEditMode) {
        const items = field.options.map((option) => {
            const checked = (field.default === option.val) ? 'checked' : '';
            return `
                <div class="radio-row">
                    <input type="radio" id="${field.id}_${option.val}" name="${field.id}" value="${option.val}" ${checked}>
                    <label for="${field.id}_${option.val}" class="radio-label">${option.txt}</label>
                </div>
            `;
        }).join('');

        return `
            <div class="${getFieldWrapperClasses(field, isEditMode)}" data-field-wrapper="${field.id}">
                <label class="panel-field-label">${field.label}</label>
                <div class="radio-group-card compact-radio-group">
                    ${items}
                </div>
                ${renderFieldNote(field)}
            </div>
        `;
    },

    renderMatrix(section, isEditMode) {
        const colors = {
            BASELINE: 'rgba(40, 167, 69, 0.15)',
            STRUCTURAL: 'rgba(255, 193, 7, 0.15)',
            ADDITIVE: 'rgba(0, 123, 255, 0.15)'
        };

        const headers = section.headers || ['Left', 'Right', 'Top', 'Bottom'];
        const th = headers.map((header) =>
            `<th class="matrix-header-cell">${header}</th>`
        ).join('');

        const rowsHtml = section.rows.map((row) =>
            this._renderMatrixRow(row, colors, isEditMode)
        ).join('');

        return `
            <div class="matrix-shell">
                <table class="matrix-table compact-matrix-table">
                    <thead>
                        <tr>
                            <th class="matrix-header-label"></th>
                            ${th}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    },

    _renderMatrixRow(row, colors, isEditMode) {
        const bg = colors[row.classification] || 'transparent';
        const edges = ['left', 'right', 'top', 'bottom'];

        const cells = edges.map((edge) => {
            const field = row.fields[edge];
            if (!field) return '<td></td>';

            const val = field.default !== undefined ? `value="${field.default}"` : '';
            const step = field.step ? `step="${field.step}"` : '';
            const removeBtn = (isEditMode && !field.protected)
                ? `<button type="button" class="btn-remove-field field-remove-dot" data-id="${field.id}" aria-label="Xoa truong ${field.id}" title="Xoa truong">X</button>`
                : '';

            return `
                <td class="matrix-cell" data-field-wrapper="${field.id}">
                    ${removeBtn}
                    <input type="number" name="${field.id}" id="${field.id}" ${val} ${step} class="matrix-input">
                </td>
            `;
        }).join('');

        const borderRow = this._renderBorderControl(row);

        return `
            <tr style="background: ${bg}; border-bottom: 1px solid #222;">
                <td class="matrix-row-label">
                    <strong>${row.label}</strong>
                    ${isEditMode ? `<br><span class="matrix-row-type">${row.classification}</span>` : ''}
                </td>
                ${cells}
            </tr>
            ${borderRow}
        `;
    },

    _renderBorderControl(row) {
        const bcId = `${row.id}_draw_border`;
        const bcStyleId = `${row.id}_border_style`;
        const bcDefault = row.borderControl ? row.borderControl.default : false;
        const bcLabel = row.borderControl ? row.borderControl.label : 'Ve vien';

        return `
            <tr class="matrix-border-row">
                <td colspan="5">
                    <div class="matrix-border-controls compact-matrix-border-controls" data-field-wrapper="${bcId}">
                        <div class="checkbox-row compact-checkbox-row">
                            <input type="checkbox" id="${bcId}" name="${bcId}" ${bcDefault ? 'checked' : ''}>
                            <label for="${bcId}" class="checkbox-label">${bcLabel}</label>
                        </div>
                        <select name="${bcStyleId}" id="${bcStyleId}" class="panel-select panel-select-inline">
                            <option value="solid">Solid</option>
                            <option value="dashed" selected>Dashed</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    },

    renderFieldComplex(field) {
        if (!field.subFields) return '';

        const subHtml = field.subFields.map((subField) => {
            if (subField.type === 'select') {
                const opts = subField.options.map((option) => `<option value="${option.val}">${option.txt}</option>`).join('');
                return `<select name="${subField.id}" id="${subField.id}" class="panel-select panel-select-inline" style="width: ${subField.width || 'auto'};">${opts}</select>`;
            }
            if (subField.type === 'number') {
                return `<input type="number" name="${subField.id}" id="${subField.id}" placeholder="${subField.placeholder || ''}" class="panel-input" style="flex: 1;" step="0.1" value="10">`;
            }
            return '';
        }).join('');

        return `
            <div class="field-wrapper field-span-full" data-field-wrapper="${field.id}">
                <div class="checkbox-row compact-checkbox-row">
                    <input type="checkbox" id="${field.id}" name="${field.id}">
                    <label for="${field.id}" class="checkbox-label" style="min-width: 70px;">${field.label}</label>
                    ${subHtml}
                </div>
            </div>
        `;
    }
};
