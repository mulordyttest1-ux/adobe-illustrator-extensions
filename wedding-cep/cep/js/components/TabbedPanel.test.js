import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TabbedPanel } from './TabbedPanel.js';

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

    addEventListener(type, handler) {
        const current = this.listeners.get(type) || [];
        current.push(handler);
        this.listeners.set(type, current);
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

function flushAsyncWork() {
    return new Promise((resolve) => setImmediate(resolve));
}

const originalDocument = globalThis.document;
const originalWarn = console.warn;

afterEach(() => {
    globalThis.document = originalDocument;
    console.warn = originalWarn;
});

describe('TabbedPanel', () => {
    it('activates the first tab on init, lazy-loads it once, and updates active state on switch', async () => {
        const { document, compactTab, schemaTab, compactPanel, schemaPanel, compactContent, schemaContent } = createTabbedDocument();
        const events = [];
        globalThis.document = document;

        const panel = new TabbedPanel({
            controllers: {
                compact: {
                    render(container) {
                        events.push(['compact.render', container.id]);
                        container.innerHTML = 'compact-ready';
                    }
                },
                schema: {
                    async init(container) {
                        events.push(['schema.init', container.id]);
                        container.innerHTML = 'schema-ready';
                    }
                }
            },
            onTabChange(tabId) {
                events.push(['tabChange', tabId]);
            }
        });

        await flushAsyncWork();

        assert.equal(panel.getActiveTab(), 'compact');
        assert.equal(compactTab.className.includes('active'), true);
        assert.equal(compactTab.getAttribute('aria-selected'), 'true');
        assert.equal(compactPanel.className.includes('active'), true);
        assert.equal(compactContent.innerHTML, 'compact-ready');
        assert.equal(panel.isLoaded('compact'), true);
        assert.deepEqual(events, [
            ['compact.render', 'compact-content'],
            ['tabChange', 'compact']
        ]);

        panel.switchTo('schema');
        await flushAsyncWork();

        assert.equal(panel.getActiveTab(), 'schema');
        assert.equal(compactTab.className.includes('active'), false);
        assert.equal(schemaTab.className.includes('active'), true);
        assert.equal(schemaTab.getAttribute('aria-selected'), 'true');
        assert.equal(schemaPanel.className.includes('active'), true);
        assert.equal(schemaContent.innerHTML, 'schema-ready');
        assert.equal(panel.isLoaded('schema'), true);

        panel.switchTo('compact');
        await flushAsyncWork();

        assert.deepEqual(events, [
            ['compact.render', 'compact-content'],
            ['tabChange', 'compact'],
            ['schema.init', 'schema-content'],
            ['tabChange', 'schema'],
            ['tabChange', 'compact']
        ]);
    });

    it('reloads an already loaded tab by clearing the loaded marker first', async () => {
        const { document, compactContent } = createTabbedDocument();
        globalThis.document = document;
        let renderCount = 0;

        const panel = new TabbedPanel({
            controllers: {
                compact: {
                    render(container) {
                        renderCount += 1;
                        container.innerHTML = `render-${renderCount}`;
                    }
                }
            }
        });

        await flushAsyncWork();
        assert.equal(compactContent.innerHTML, 'render-1');
        assert.equal(panel.isLoaded('compact'), true);

        await panel.reload('compact');
        await flushAsyncWork();

        assert.equal(renderCount, 2);
        assert.equal(compactContent.innerHTML, 'render-2');
        assert.equal(panel.isLoaded('compact'), true);
    });

    it('runs overlay cleanup before switching to another tab', async () => {
        const { document } = createTabbedDocument();
        globalThis.document = document;
        const cleanupCalls = [];

        const panel = new TabbedPanel({
            cleanupOverlays(documentRef) {
                cleanupCalls.push(documentRef);
            },
            controllers: {
                compact: { render() {} },
                schema: { render() {} }
            }
        });

        await flushAsyncWork();
        panel.switchTo('schema');
        await flushAsyncWork();

        assert.equal(cleanupCalls.length, 2);
        assert.equal(cleanupCalls[0], document);
        assert.equal(cleanupCalls[1], document);
    });

    it('warns safely when there are no tabs, no controller, or no content container', async () => {
        const warnings = [];
        console.warn = (...args) => warnings.push(args.join(' '));

        globalThis.document = new FakeDocument();
        new TabbedPanel();

        const { document } = createTabbedDocument();
        globalThis.document = document;
        new TabbedPanel({ controllers: {} });
        await flushAsyncWork();

        const missingContentDoc = createTabbedDocument();
        globalThis.document = new FakeDocument({
            tabs: [missingContentDoc.compactTab, missingContentDoc.schemaTab],
            panels: [missingContentDoc.compactPanel, missingContentDoc.schemaPanel],
            contentContainers: []
        });
        new TabbedPanel({
            controllers: {
                compact: {
                    render() {}
                }
            }
        });
        await flushAsyncWork();

        assert.equal(warnings.some((line) => line.includes('No tabs found')), true);
        assert.equal(warnings.some((line) => line.includes('No controller for tab: compact')), true);
        assert.equal(warnings.some((line) => line.includes('No content container for tab: compact')), true);
    });

    it('renders an error alert when the tab controller throws', async () => {
        const { document, compactContent } = createTabbedDocument();
        globalThis.document = document;

        new TabbedPanel({
            controllers: {
                compact: {
                    async init() {
                        throw new Error('controller exploded');
                    }
                }
            }
        });

        await flushAsyncWork();

        assert.match(compactContent.innerHTML, /Lỗi tải module:/);
        assert.match(compactContent.innerHTML, /controller exploded/);
    });
});
