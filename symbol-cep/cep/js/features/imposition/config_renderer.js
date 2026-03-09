/**
 * MODULE: ConfigRenderer
 * LAYER: UI/Renderer (L6)
 * PURPOSE: Generate HTML from JSON Schema (field rendering)
 * DEPENDENCIES: None (pure DOM string generation)
 * SIDE EFFECTS: None
 * EXPORTS: ConfigRenderer
 */

export const ConfigRenderer = {

    /**
     * Generate full form body HTML from JSON Schema
     * @param {Object} schema - The preset schema definition
     * @param {boolean} isEditMode - Whether edit mode is active
     * @returns {string} HTML string
     */
    renderSchema(schema, isEditMode) {
        if (!schema.sections) return '';

        return schema.sections.map(section => {
            let fieldsHtml;

            if (section.layout === 'matrix') {
                fieldsHtml = this.renderMatrix(section, isEditMode);
            } else if (section.layout === 'stack') {
                fieldsHtml = section.fields.map(f => this.renderFieldStack(f, isEditMode)).join('');
            } else if (section.layout && section.layout.startsWith('grid-')) {
                const cols = section.layout.split('-')[1];
                fieldsHtml = `<div class="grid grid-${cols}" style="gap: 10px;">` +
                    section.fields.map(f => this.renderFieldGrid(f, isEditMode)).join('') +
                    `</div>`;
            } else if (section.layout === 'complex') {
                fieldsHtml = section.fields.map(f => this.renderFieldComplex(f)).join('');
            } else {
                fieldsHtml = section.fields.map(f => this.renderFieldStack(f, isEditMode)).join('');
            }

            const addBtn = isEditMode ?
                `<button type="button" class="btn-add-field outline" data-section="${section.id}" style="font-size:10px; padding:2px 5px; float:right;">＋ Add Field</button>` : '';

            return `
                    <div style="margin-bottom: 15px;">
                        ${section.title ? `<h4 style="margin: 0 0 5px 0; font-weight: normal; color: #bbb;">${section.title} ${addBtn}</h4>` : ''}
                        ${fieldsHtml}
                        <hr style="border-color: #444; margin: 10px 0;" />
                    </div>
                `;
        }).join('');
    },

    /**
     * Render a field as a grid cell (Label + Input)
     */
    renderFieldGrid(f, isEditMode) {
        const required = f.required ? 'required' : '';
        const step = f.step ? `step="${f.step}"` : '';
        const val = f.default !== undefined ? `value="${f.default}"` : '';
        const ph = f.placeholder ? `placeholder="${f.placeholder}"` : '';

        const removeBtn = (isEditMode && !f.protected) ?
            `<button type="button" class="btn-remove-field" data-id="${f.id}" style="color:red; background:none; border:none; font-size:10px; padding:0; float:right;">✕</button>` : '';

        return `
                <div style="position:relative;">
                    ${removeBtn}
                    <label style="font-size: 11px;">${f.label}</label>
                    <input type="${f.type}" name="${f.id}" id="${f.id}" ${step} ${val} ${ph} ${required} style="width:100%;">
                </div>
            `;
    },

    /**
     * Render a field as a stacked row (Checkbox, Select, Edge Selector, etc.)
     */
    renderFieldStack(f, isEditMode) {
        if (f.type === 'checkbox') {
            return this._renderCheckbox(f);
        }
        if (f.type === 'edge_selector') {
            return this._renderEdgeSelector(f);
        }
        if (f.type === 'select' && f.options) {
            return this._renderSelect(f);
        }
        return this.renderFieldGrid(f, isEditMode);
    },

    /** @private */
    _renderCheckbox(f) {
        const checked = f.default ? 'checked' : '';

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
    },

    /** @private */
    _renderEdgeSelector(f) {
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
    },

    /** @private */
    _renderSelect(f) {
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
    },

    /**
     * Render a Matrix layout (rows × columns table)
     */
    renderMatrix(section, isEditMode) {
        const colors = {
            'BASELINE': 'rgba(40, 167, 69, 0.15)',
            'STRUCTURAL': 'rgba(255, 193, 7, 0.15)',
            'ADDITIVE': 'rgba(0, 123, 255, 0.15)'
        };

        const headers = section.headers || ["Left", "Right", "Top", "Bottom"];
        const th = headers.map(h =>
            `<th style="font-size: 10px; color: #aaa; text-align: center; font-weight: normal; padding-bottom:5px;">${h}</th>`
        ).join('');

        const rowsHtml = section.rows.map(row =>
            this._renderMatrixRow(row, colors, isEditMode)
        ).join('');

        return `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                        <tr>
                            <th style="width: 25%;"></th>
                            ${th}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            `;
    },

    /** @private */
    _renderMatrixRow(row, colors, isEditMode) {
        const bg = colors[row.classification] || 'transparent';
        const edges = ['left', 'right', 'top', 'bottom'];

        const cells = edges.map(edge => {
            const field = row.fields[edge];
            if (!field) return `<td></td>`;

            const val = field.default !== undefined ? `value="${field.default}"` : '';
            const step = field.step ? `step="${field.step}"` : '';

            const removeBtn = (isEditMode && !field.protected) ?
                `<div style="position:absolute; right:0; top:0; cursor:pointer; color:red; font-size:8px; line-height:1;" data-id="${field.id}" class="btn-remove-field">✕</div>` : '';

            return `
                    <td style="padding: 2px; position: relative;">
                        ${removeBtn}
                        <input type="number" name="${field.id}" id="${field.id}" ${val} ${step} style="width: 100%; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid #444; color: #fff;">
                    </td>
                `;
        }).join('');

        const borderRow = this._renderBorderControl(row);

        return `
                <tr style="background: ${bg}; border-bottom: 2px solid #222;">
                    <td style="padding: 5px; font-size: 11px; white-space: nowrap;">
                        <strong style="color:#ddd;">${row.label}</strong>
                        ${isEditMode ? `<br><span style="font-size:9px; color:#888;">${row.classification}</span>` : ''}
                    </td>
                    ${cells}
                </tr>
                ${borderRow}
            `;
    },

    /** @private */
    _renderBorderControl(row) {
        const bcId = row.id + "_draw_border";
        const bcStyleId = row.id + "_border_style";
        const bcDefault = row.borderControl ? row.borderControl.default : false;
        const bcLabel = row.borderControl ? row.borderControl.label : "Vẽ viền (Draw Border)";

        return `
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
    },

    /**
     * Render Complex field (Checkbox + Sub-fields)
     */
    renderFieldComplex(f) {
        if (!f.subFields) return '';

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
};
