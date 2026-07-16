import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SchemaTabComponents } from './SchemaTabComponents.js';

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
        this.style = {};
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

function collectText(node) {
    return [node.textContent || '', ...node.children.map((child) => collectText(child))].join(' ');
}

describe('SchemaTabComponents', () => {
    it('renders the main schema tab sections and registers refs with stable ids', () => {
        globalThis.document = new FakeDocument();
        const container = new FakeElement('div', globalThis.document);
        container.appendChild(new FakeElement('span', globalThis.document));
        const refs = {
            stale: new FakeElement('button', globalThis.document)
        };

        const builder = new SchemaTabComponents(container, refs);
        builder.render();

        assert.equal(container.children.length, 1);
        assert.equal(container.children[0].tagName, 'DIV');
        assert.equal(refs.stale, undefined);
        assert.ok(refs['btn-inject-auto']);
        assert.ok(refs['btn-bulk-pos1']);
        assert.ok(refs['btn-single-pos1-ong']);
        assert.ok(refs['btn-single-venue-diachi']);
        assert.equal(refs['btn-date-clone-le'].dataset.cloneTarget, 'le');
        assert.equal(refs['btn-single-pos1-con_ho_ten'].dataset.schema, '{pos1.con_full.ho_dau}|{pos1.con_full.ten}');
        assert.equal(refs['btn-single-pos1-con_lot_ten'].dataset.schema, '{pos1.con_full.lot}|{pos1.con_full.ten}');
    });

    it('preserves primary button classes and renders all top-level panels', () => {
        globalThis.document = new FakeDocument();
        const container = new FakeElement('div', globalThis.document);
        const refs = {};

        new SchemaTabComponents(container, refs).render();

        const wrapper = container.children[0];
        assert.equal(wrapper.children.length, 6);
        assert.match(refs['btn-inject-auto'].className, /ds-btn-primary/);
        assert.match(refs['btn-bulk-pos1'].className, /ds-btn-primary/);
        assert.equal(refs['btn-single-pos1-con_ho_ten'].dataset.schema.includes('|'), true);
    });

    it('renders the bulk help text with the canonical top-down operator contract', () => {
        globalThis.document = new FakeDocument();
        const container = new FakeElement('div', globalThis.document);
        const refs = {};

        new SchemaTabComponents(container, refs).render();

        const text = collectText(container);
        assert.match(text, /Ông Bà \+ Ông \+ Bà \+ Đ\/C/);
        assert.doesNotMatch(text, /Đ\/C \+ Ông \+ Bà \+ Ông Bà/);
    });
});
