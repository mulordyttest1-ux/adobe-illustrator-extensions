export function getDocumentRef(documentOverride) {
    return documentOverride || document;
}

function applyElementConfig(element, config = {}) {
    const directAssignments = [
        ['className', 'className'],
        ['textContent', 'textContent'],
        ['id', 'id'],
        ['title', 'title'],
        ['type', 'type'],
        ['name', 'name'],
        ['value', 'value'],
        ['checked', 'checked'],
        ['rows', 'rows'],
        ['min', 'min'],
        ['max', 'max']
    ];

    directAssignments.forEach(([configKey, elementKey]) => {
        if (config[configKey] !== undefined && config[configKey] !== '') {
            element[elementKey] = config[configKey];
        }
    });

    if (config.style) {
        element.style.cssText = config.style;
    }
}

export function createElement(tagName, config = {}, deps = {}) {
    const documentRef = getDocumentRef(deps.document);
    const element = documentRef.createElement(tagName);
    applyElementConfig(element, config);
    return element;
}

export function appendChildren(parent, children = []) {
    children.forEach((child) => parent.appendChild(child));
    return parent;
}

export function createPanelShell(title, deps = {}) {
    const panel = createElement('div', { className: 'compact-panel' }, deps);
    const header = createElement('div', {
        className: 'compact-panel-header',
        textContent: title
    }, deps);
    const body = createElement('div', { className: 'compact-panel-body' }, deps);

    appendChildren(panel, [header, body]);
    return { panel, header, body };
}

function shouldCheckRadio(index, config = {}) {
    const checkedIndex = config.checkedIndex === undefined ? 0 : config.checkedIndex;
    return checkedIndex >= 0 && index === checkedIndex;
}

export function createRadioGroupParts(name, options, suffix = '', config = {}) {
    const group = createElement('div', { className: 'compact-radio-group' }, config);
    const inputs = options.map((opt, index) => {
        const label = createElement('label', { className: 'compact-radio-item' }, config);
        const radio = createElement('input', {
            type: 'radio',
            name,
            value: suffix ? `${opt}${suffix}` : opt,
            checked: shouldCheckRadio(index, config)
        }, config);
        const text = createElement('span', { textContent: opt }, config);

        appendChildren(label, [radio, text]);
        group.appendChild(label);
        return radio;
    });

    return { group, inputs };
}

export function createTextareaElement(rows = 1, deps = {}) {
    const textarea = createElement('textarea', {
        className: 'compact-textarea',
        rows
    }, deps);
    textarea.style.height = rows === 1 ? 'var(--compact-name-h)' : 'var(--compact-addr-h)';
    return textarea;
}

export function createTextareaFieldGroup(rows = 1, hasIdx = false, deps = {}) {
    const wrapper = createElement('div', { className: 'compact-field-group' }, deps);
    const textarea = createTextareaElement(rows, deps);
    const result = { element: wrapper, textarea };

    wrapper.appendChild(textarea);

    if (hasIdx) {
        const idx = createElement('input', {
            type: 'number',
            className: 'compact-idx',
            min: 0,
            max: 9,
            value: 0
        }, deps);
        wrapper.appendChild(idx);
        result.idx = idx;
    }

    return result;
}

function createAutoCheckbox(deps = {}) {
    return createElement('input', {
        type: 'checkbox',
        className: 'compact-checkbox',
        checked: true,
        title: 'Auto'
    }, deps);
}

export function createTextareaWithAutoFieldGroup(rows = 2, hasAuto = false, deps = {}) {
    const wrapper = createElement('div', { className: 'compact-field-group' }, deps);
    const textarea = createTextareaElement(rows, deps);
    const result = { element: wrapper, textarea };

    wrapper.appendChild(textarea);

    if (hasAuto) {
        const checkbox = createAutoCheckbox(deps);
        wrapper.appendChild(checkbox);
        result.checkbox = checkbox;
    }

    return result;
}

export function createInputFieldGroup(hasAuto = false, deps = {}) {
    const wrapper = createElement('div', { className: 'compact-field-group' }, deps);
    const input = createElement('input', {
        type: 'text',
        className: 'compact-input'
    }, deps);
    const result = { element: wrapper, input };

    wrapper.appendChild(input);

    if (hasAuto) {
        const checkbox = createAutoCheckbox(deps);
        wrapper.appendChild(checkbox);
        result.checkbox = checkbox;
    }

    return result;
}

export function createSelectElement(options, width = '80px', deps = {}) {
    const select = createElement('select', { className: 'compact-select' }, deps);
    select.style.width = width;

    options.forEach((opt) => {
        const option = createElement('option', {
            value: opt,
            textContent: opt
        }, deps);
        select.appendChild(option);
    });

    return select;
}

export function createButtonElement(id, label, title = '', deps = {}) {
    return createElement('button', {
        id,
        className: 'ds-btn ds-btn-secondary',
        style: 'font-size: 9px; padding: 4px; height: auto;',
        textContent: label,
        title
    }, deps);
}

export function createSeparatorElement(text = '|', deps = {}) {
    return createElement('span', {
        textContent: text,
        style: 'margin: 0 6px; color: #999;'
    }, deps);
}

export function createSpanElement(text, styles = '', deps = {}) {
    return createElement('span', {
        textContent: text,
        style: styles
    }, deps);
}

export function createColumnElement(title = '', deps = {}) {
    const column = createElement('div', {
        className: 'compact-pos-column',
        style: 'flex: 1; display: flex; flex-direction: column; gap: 2px;'
    }, deps);

    if (title) {
        column.innerHTML = `<div style="font-size:9px;font-weight:600;color:#666;text-align:center;margin-bottom:2px;">${title}</div>`;
    }

    return column;
}

export function createLabeledCheckboxParts(labelText, checked = true, deps = {}) {
    const documentRef = getDocumentRef(deps.document);
    const wrapper = createElement('label', {
        style: 'margin-left: auto; display: flex; align-items: center; gap: 3px; font-size: 9px; cursor: pointer;'
    }, deps);
    const checkbox = createElement('input', {
        type: 'checkbox',
        checked,
        style: 'margin: 0;'
    }, deps);
    const textNode = documentRef.createTextNode(labelText);

    appendChildren(wrapper, [checkbox, textNode]);
    return { wrapper, checkbox };
}

export function createDebounced(func, wait, timers = globalThis) {
    let timeout;
    return function (...args) {
        const context = this;
        timers.clearTimeout(timeout);
        timeout = timers.setTimeout(() => func.apply(context, args), wait);
    };
}
