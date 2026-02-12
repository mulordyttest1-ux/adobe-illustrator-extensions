/**
 * MODULE: DomFactory
 * LAYER: Components/Helpers
 * PURPOSE: Pure stateless DOM element factory — creates panels, rows, inputs, selects, checkboxes
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (creates detached elements)
 * EXPORTS: DomFactory.createPanel(), .createRow(), .createLabel(), .createRadioGroup(), etc.
 */
export class DomFactory {
    /**
     * Create a panel with header and body
     * @param {string} title - Panel title
     * @returns {HTMLElement}
     */
    static createPanel(title) {
        const panel = document.createElement('div');
        panel.className = 'compact-panel';

        const header = document.createElement('div');
        header.className = 'compact-panel-header';
        header.textContent = title;
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'compact-panel-body';
        panel.appendChild(body);

        return panel;
    }

    /**
     * Create a row container
     * @returns {HTMLElement}
     */
    static createRow() {
        const row = document.createElement('div');
        row.className = 'compact-row';
        return row;
    }

    /**
     * Create a label
     * @param {string} text - Label text
     * @returns {HTMLElement}
     */
    static createLabel(text) {
        const lbl = document.createElement('span');
        lbl.className = 'compact-label';
        lbl.textContent = text;
        return lbl;
    }

    /**
     * Create inline radio group
     * @param {string} name - Radio group name
     * @param {string[]} options - Radio options
     * @param {string} suffix - Value suffix
     * @returns {{ element: HTMLElement, inputs: HTMLInputElement[] }}
     */
    static createRadioGroup(name, options, suffix = '') {
        const group = document.createElement('div');
        group.className = 'compact-radio-group';
        const inputs = [];

        options.forEach((opt, i) => {
            const lbl = document.createElement('label');
            lbl.className = 'compact-radio-item';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = suffix ? `${opt}${suffix}` : opt;
            if (i === 0) radio.checked = true;

            const txt = document.createElement('span');
            txt.textContent = opt;

            lbl.appendChild(radio);
            lbl.appendChild(txt);
            group.appendChild(lbl);
            inputs.push(radio);
        });

        return { element: group, inputs };
    }

    /**
     * Create textarea
     * @param {number} rows - Number of rows
     * @returns {HTMLTextAreaElement}
     */
    static createTextarea(rows = 1) {
        const ta = document.createElement('textarea');
        ta.className = 'compact-textarea';
        ta.rows = rows;
        ta.style.height = rows === 1 ? 'var(--compact-name-h)' : 'var(--compact-addr-h)';
        return ta;
    }

    /**
     * Create textarea with IDX input
     * @param {number} rows - Number of rows
     * @param {boolean} hasIdx - Include IDX input
     * @returns {{ element: HTMLElement, textarea: HTMLTextAreaElement, idx?: HTMLInputElement }}
     */
    static createTextareaWithIdx(rows = 1, hasIdx = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'compact-field-group';

        const ta = this.createTextarea(rows);
        wrapper.appendChild(ta);

        const result = { element: wrapper, textarea: ta };

        if (hasIdx) {
            const idx = document.createElement('input');
            idx.type = 'number';
            idx.className = 'compact-idx';
            idx.min = 0;
            idx.max = 9;
            idx.value = 0;
            wrapper.appendChild(idx);
            result.idx = idx;
        }

        return result;
    }

    /**
     * Create input with optional auto checkbox
     * @param {boolean} hasAuto - Include auto checkbox
     * @returns {{ element: HTMLElement, input: HTMLInputElement, checkbox?: HTMLInputElement }}
     */
    static createInputWithAuto(hasAuto = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'compact-field-group';

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'compact-input';
        wrapper.appendChild(inp);

        const result = { element: wrapper, input: inp };

        if (hasAuto) {
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.className = 'compact-checkbox';
            chk.checked = true;
            chk.title = 'Auto';
            wrapper.appendChild(chk);
            result.checkbox = chk;
        }

        return result;
    }

    /**
     * Create select dropdown
     * @param {string[]} options - Select options
     * @param {string} width - CSS width
     * @returns {HTMLSelectElement}
     */
    static createSelect(options, width = '80px') {
        const select = document.createElement('select');
        select.className = 'compact-select';
        select.style.width = width;

        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            select.appendChild(o);
        });

        return select;
    }

    /**
     * Create button
     * @param {string} id - Button ID
     * @param {string} label - Button label
     * @param {string} title - Tooltip
     * @returns {HTMLButtonElement}
     */
    static createButton(id, label, title = '') {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'ds-btn ds-btn-secondary';
        btn.style.cssText = 'font-size: 9px; padding: 4px; height: auto;';
        btn.textContent = label;
        if (title) btn.title = title;
        return btn;
    }

    /**
     * Create separator span
     * @param {string} text - Separator text
     * @returns {HTMLSpanElement}
     */
    static createSeparator(text = '|') {
        const sep = document.createElement('span');
        sep.textContent = text;
        sep.style.cssText = 'margin: 0 6px; color: #999;';
        return sep;
    }

    /**
     * Create styled span (for inline labels)
     * @param {string} text - Text content
     * @param {string} styles - CSS styles
     * @returns {HTMLSpanElement}
     */
    static createSpan(text, styles = '') {
        const span = document.createElement('span');
        span.textContent = text;
        if (styles) span.style.cssText = styles;
        return span;
    }

    /**
     * Create column container
     * @param {string} title - Column header text
     * @returns {HTMLElement}
     */
    static createColumn(title = '') {
        const col = document.createElement('div');
        col.className = 'compact-pos-column';
        col.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 2px;';

        if (title) {
            col.innerHTML = `<div style="font-size:9px;font-weight:600;color:#666;text-align:center;margin-bottom:2px;">${title}</div>`;
        }

        return col;
    }

    /**
     * Create checkbox with label
     * @param {string} labelText - Label text
     * @param {boolean} checked - Initial state
     * @returns {{ element: HTMLElement, checkbox: HTMLInputElement }}
     */
    static createLabeledCheckbox(labelText, checked = true) {
        const wrapper = document.createElement('label');
        wrapper.style.cssText = 'margin-left: auto; display: flex; align-items: center; gap: 3px; font-size: 9px; cursor: pointer;';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = checked;
        chk.style.margin = '0';

        wrapper.appendChild(chk);
        wrapper.appendChild(document.createTextNode(labelText));

        return { element: wrapper, checkbox: chk };
    }
    /**
     * Kỹ thuật Debounce: Chỉ chạy hàm func sau khi ngừng thao tác wait (ms)
     */
    static debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
}

