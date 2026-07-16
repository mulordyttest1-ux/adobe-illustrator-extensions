import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    bindTabClickHandlers,
    cleanupTabbedOverlays,
    getFirstTabId,
    resolveTabLoadContext,
    resolveTabbedDom,
    syncTabbedState
} from './tabbedPanelSupport.js';

class FakeClassList {
    constructor(element) {
        this.element = element;
    }

    toggle(className, force) {
        const current = new Set((this.element.className || '').split(/\s+/).filter(Boolean));
        const shouldAdd = force === undefined ? !current.has(className) : Boolean(force);

        if (shouldAdd) {
            current.add(className);
        } else {
            current.delete(className);
        }

        this.element.className = Array.from(current).join(' ');
    }
}

class FakeElement {
    constructor({ id = '', className = '', dataset = {}, ownerDocument = null } = {}) {
        this.id = id;
        this.className = className;
        this.dataset = { ...dataset };
        this.ownerDocument = ownerDocument;
        this.attributes = {};
        this.listeners = new Map();
        this.innerHTML = '';
        this.classList = new FakeClassList(this);
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name] ?? null;
    }

    removeAttribute(name) {
        delete this.attributes[name];
    }

    addEventListener(type, handler) {
        const current = this.listeners.get(type) || [];
        current.push(handler);
        this.listeners.set(type, current);
    }

    appendChild(child) {
        child.parentNode = this;
        return child;
    }

    removeChild(child) {
        child.parentNode = null;
        return child;
    }

    click() {
        const handlers = this.listeners.get('click') || [];
        handlers.forEach((handler) => handler({ target: this, currentTarget: this }));
    }
}

class FakeDocument {
    constructor({ tabs = [], panels = [], contentContainers = [] } = {}) {
        this._selectors = new Map([
            ['.ds-tab', tabs],
            ['.ds-tab-panel', panels]
        ]);
        this._elementsById = new Map();

        [...tabs, ...panels, ...contentContainers].forEach((element) => {
            element.ownerDocument = this;
            if (element.id) {
                this._elementsById.set(element.id, element);
            }
        });
    }

    querySelectorAll(selector) {
        return this._selectors.get(selector) || [];
    }

    getElementById(id) {
        return this._elementsById.get(id) || null;
    }

    getElementsByClassName(className) {
        return Array.from(this._elementsById.values())
            .filter((element) => String(element.className || '').split(/\s+/).includes(className));
    }
}

function createTabbedDocument() {
    const compactTab = new FakeElement({ className: 'ds-tab', dataset: { tab: 'compact' } });
    const schemaTab = new FakeElement({ className: 'ds-tab', dataset: { tab: 'schema' } });
    const compactPanel = new FakeElement({ id: 'tab-compact', className: 'ds-tab-panel' });
    const schemaPanel = new FakeElement({ id: 'tab-schema', className: 'ds-tab-panel' });
    const compactContent = new FakeElement({ id: 'compact-content' });
    const schemaContent = new FakeElement({ id: 'schema-content' });

    return {
        compactTab,
        schemaTab,
        compactPanel,
        schemaPanel,
        compactContent,
        schemaContent,
        document: new FakeDocument({
            tabs: [compactTab, schemaTab],
            panels: [compactPanel, schemaPanel],
            contentContainers: [compactContent, schemaContent]
        })
    };
}

describe('tabbedPanelSupport', () => {
    it('resolves tabbed DOM, binds tab clicks, and exposes the first tab id', () => {
        const { document, compactTab, schemaTab } = createTabbedDocument();
        const dom = resolveTabbedDom({
            tabsSelector: '.ds-tab',
            panelsSelector: '.ds-tab-panel',
            documentRef: document
        });
        const selections = [];

        bindTabClickHandlers({
            tabs: dom.tabs,
            onSelect: (tabId) => selections.push(tabId)
        });
        schemaTab.click();
        compactTab.click();

        assert.equal(dom.tabs.length, 2);
        assert.equal(dom.panels.length, 2);
        assert.equal(getFirstTabId(dom.tabs), 'compact');
        assert.deepEqual(selections, ['schema', 'compact']);
    });

    it('syncs active tab and panel state without touching unrelated ids', () => {
        const { compactTab, schemaTab, compactPanel, schemaPanel } = createTabbedDocument();

        syncTabbedState({
            tabs: [compactTab, schemaTab],
            panels: [compactPanel, schemaPanel],
            tabId: 'schema'
        });

        assert.equal(compactTab.className.includes('active'), false);
        assert.equal(schemaTab.className.includes('active'), true);
        assert.equal(schemaTab.getAttribute('aria-selected'), 'true');
        assert.equal(schemaPanel.className.includes('active'), true);
        assert.equal(compactPanel.className.includes('active'), false);
    });

    it('cleans transient autocomplete overlays before tab switches', () => {
        const { document } = createTabbedDocument();
        const body = new FakeElement({ id: 'body', ownerDocument: document });
        const input = new FakeElement({ id: 'wedding-autocomplete-pos1-diachi-1', ownerDocument: document });
        const list = new FakeElement({
            id: 'wedding-autocomplete-pos1-diachi-1__listbox',
            className: 'autocomplete-list',
            ownerDocument: document
        });

        document._elementsById.set(body.id, body);
        document._elementsById.set(input.id, input);
        document._elementsById.set(list.id, list);

        input.setAttribute('aria-expanded', 'true');
        input.setAttribute('aria-activedescendant', 'active-option');
        list.setAttribute('data-owner-id', input.id);
        body.appendChild(list);

        cleanupTabbedOverlays(document);

        assert.equal(input.getAttribute('aria-expanded'), 'false');
        assert.equal(input.getAttribute('aria-activedescendant'), null);
        assert.equal(list.parentNode, null);
    });

    it('resolves controller/content pairs and warns safely for missing load context', () => {
        const warnings = [];
        const { document, compactContent } = createTabbedDocument();
        const controller = { render() {} };

        assert.deepEqual(resolveTabLoadContext({
            tabId: 'compact',
            controllers: { compact: controller },
            documentRef: document,
            warn: (message) => warnings.push(message)
        }), {
            controller,
            contentContainer: compactContent
        });

        assert.equal(resolveTabLoadContext({
            tabId: 'schema',
            controllers: {},
            documentRef: document,
            warn: (message) => warnings.push(message)
        }), null);

        const missingContentDoc = new FakeDocument({
            tabs: [],
            panels: [],
            contentContainers: []
        });
        assert.equal(resolveTabLoadContext({
            tabId: 'compact',
            controllers: { compact: controller },
            documentRef: missingContentDoc,
            warn: (message) => warnings.push(message)
        }), null);

        assert.equal(warnings.some((message) => message.includes('No controller for tab: schema')), true);
        assert.equal(warnings.some((message) => message.includes('No content container for tab: compact')), true);
    });
});
