import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    createSchemaButton,
    createSchemaWrapper,
    renderSchemaBlock,
    renderSchemaSection,
    resetSchemaRefs
} from './schemaTabRenderSupport.js';

class FakeClassList {
    constructor(element) {
        this.element = element;
    }

    add(...classNames) {
        const current = new Set((this.element.className || '').split(/\s+/).filter(Boolean));
        classNames.forEach((className) => current.add(className));
        this.element.className = Array.from(current).join(' ');
    }
}

class FakeElement {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName.toUpperCase();
        this.ownerDocument = ownerDocument;
        this.parentNode = null;
        this.children = [];
        this.className = '';
        this.style = { cssText: '' };
        this.dataset = {};
        this.id = '';
        this.textContent = '';
        this.classList = new FakeClassList(this);
    }

    appendChild(child) {
        child.parentNode = this;
        child.ownerDocument = this.ownerDocument;
        this.children.push(child);
        return child;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const matches = [];
        const isClassSelector = selector.startsWith('.');
        const target = isClassSelector ? selector.slice(1) : selector.toUpperCase();

        const visit = (node) => {
            node.children.forEach((child) => {
                if (isClassSelector) {
                    if ((child.className || '').split(/\s+/).includes(target)) {
                        matches.push(child);
                    }
                } else if (child.tagName === target) {
                    matches.push(child);
                }
                visit(child);
            });
        };

        visit(this);
        return matches;
    }

    set innerHTML(value) {
        this._innerHTML = value;
        this.children = [];
    }

    get innerHTML() {
        return this._innerHTML || '';
    }
}

class FakeDocument {
    createElement(tagName) {
        return new FakeElement(tagName, this);
    }
}

const originalDocument = globalThis.document;

afterEach(() => {
    globalThis.document = originalDocument;
});

describe('schemaTabRenderSupport', () => {
    it('resets stale refs and creates the schema wrapper shell', () => {
        globalThis.document = new FakeDocument();
        const refs = {
            stale: new FakeElement('button', globalThis.document),
            keep: new FakeElement('button', globalThis.document)
        };

        resetSchemaRefs(refs);
        const wrapper = createSchemaWrapper({ documentRef: globalThis.document });

        assert.deepEqual(Object.keys(refs), []);
        assert.equal(wrapper.className, 'ds-flex-col ds-gap-md');
        assert.equal(wrapper.style.padding, '8px');
    });

    it('renders schema buttons with refs, class names, styles, and dataset', () => {
        globalThis.document = new FakeDocument();
        const refs = {};

        const button = createSchemaButton({
            id: 'btn-schema-test',
            label: 'Schema',
            title: 'Inject schema',
            classNames: ['ds-btn-primary', 'schema-btn'],
            dataset: { schema: '{venue.ten}', cloneTarget: 'le' },
            style: 'flex: 1;'
        }, { refs });

        assert.equal(refs['btn-schema-test'], button);
        assert.match(button.className, /ds-btn-primary/);
        assert.match(button.className, /schema-btn/);
        assert.equal(button.dataset.schema, '{venue.ten}');
        assert.equal(button.dataset.cloneTarget, 'le');
        assert.match(button.style.cssText, /flex: 1;/);
    });

    it('renders description, direct button, and row blocks through one support seam', () => {
        globalThis.document = new FakeDocument();
        const refs = {};

        const descriptionBlock = renderSchemaBlock({
            kind: 'description',
            text: 'Schema hint',
            style: 'font-size: 10px;'
        }, { documentRef: globalThis.document, refs });
        const directButtonsBlock = renderSchemaBlock({
            kind: 'directButtons',
            style: 'display: none;',
            buttons: [
                {
                    id: 'btn-direct-b',
                    label: 'Direct',
                    title: 'Direct title',
                    classNames: [],
                    dataset: { cloneTarget: 'nhap' },
                    style: ''
                }
            ]
        }, { documentRef: globalThis.document, refs });
        const buttonRow = renderSchemaBlock({
            kind: 'row',
            style: 'display: flex;',
            buttons: [
                {
                    id: 'btn-block-a',
                    label: 'A',
                    title: 'A title',
                    classNames: [],
                    dataset: { schema: '{pos1.ong}' },
                    style: ''
                }
            ]
        }, { documentRef: globalThis.document, refs });

        assert.equal(descriptionBlock.textContent, 'Schema hint');
        assert.equal(descriptionBlock.style.cssText, 'font-size: 10px;');
        assert.equal(directButtonsBlock.children.length, 1);
        assert.equal(directButtonsBlock.style.cssText, '');
        assert.equal(refs['btn-direct-b'].dataset.cloneTarget, 'nhap');
        assert.equal(buttonRow.children.length, 1);
        assert.equal(refs['btn-block-a'].dataset.schema, '{pos1.ong}');
    });

    it('renders a section body with block content and panel/body styles', () => {
        globalThis.document = new FakeDocument();
        const refs = {};

        const panel = renderSchemaSection({
            title: 'Schema Tools',
            panelStyle: 'background: red;',
            bodyStyle: 'display: flex;',
            blocks: [
                {
                    kind: 'directButtons',
                    buttons: [
                        {
                            id: 'btn-direct-a',
                            label: 'A',
                            title: 'Direct button',
                            classNames: ['ds-btn-primary'],
                            dataset: { schema: '{info.ten_le}' },
                            style: 'width: 100%;'
                        }
                    ]
                }
            ]
        }, { documentRef: globalThis.document, refs });

        const body = panel.querySelector('.compact-panel-body');

        assert.equal(panel.style.cssText, 'background: red;');
        assert.equal(body.style.cssText, 'display: flex;');
        assert.equal(body.children.length, 1);
        assert.equal(refs['btn-direct-a'].dataset.schema, '{info.ten_le}');
    });
});
