import { DomFactory } from '../helpers/DomFactory.js';

export function getDocumentRef(deps = {}) {
    return deps.documentRef || globalThis.document;
}

export function resetSchemaRefs(refs = {}) {
    Object.keys(refs).forEach((key) => {
        delete refs[key];
    });
}

export function createSchemaWrapper(deps = {}) {
    const documentRef = getDocumentRef(deps);
    const wrapper = documentRef.createElement('div');
    wrapper.className = 'ds-flex-col ds-gap-md';
    wrapper.style.padding = '8px';
    return wrapper;
}

export function renderSchemaSection(section, deps = {}) {
    const panel = DomFactory.createPanel(section.title);
    const body = panel.querySelector('.compact-panel-body');

    appendCssText(panel.style, section.panelStyle);
    assignCssText(body.style, section.bodyStyle);

    section.blocks.forEach((block) => {
        body.appendChild(renderSchemaBlock(block, deps));
    });

    return panel;
}

export function renderSchemaBlock(block, deps = {}) {
    const documentRef = getDocumentRef(deps);

    if (block.kind === 'description') {
        const description = documentRef.createElement('div');
        assignCssText(description.style, block.style);
        description.textContent = block.text;
        return description;
    }

    if (block.kind === 'directButtons') {
        const container = documentRef.createElement('div');
        (block.buttons || []).forEach((buttonConfig) => {
            container.appendChild(createSchemaButton(buttonConfig, deps));
        });
        return container;
    }

    const container = documentRef.createElement('div');
    assignCssText(container.style, block.style);

    (block.buttons || []).forEach((buttonConfig) => {
        container.appendChild(createSchemaButton(buttonConfig, deps));
    });

    return container;
}

export function createSchemaButton(buttonConfig, deps = {}) {
    const refs = deps.refs || {};
    const button = DomFactory.createButton(buttonConfig.id, buttonConfig.label, buttonConfig.title);

    (buttonConfig.classNames || []).forEach((className) => button.classList.add(className));
    appendCssText(button.style, buttonConfig.style);

    Object.entries(buttonConfig.dataset || {}).forEach(([key, value]) => {
        button.dataset[key] = value;
    });

    refs[buttonConfig.id] = button;
    return button;
}

function appendCssText(styleTarget, value) {
    if (!value) {
        return;
    }

    styleTarget.cssText = `${styleTarget.cssText || ''}${value}`;
}

function assignCssText(styleTarget, value) {
    if (!value) {
        return;
    }

    styleTarget.cssText = value;
}
