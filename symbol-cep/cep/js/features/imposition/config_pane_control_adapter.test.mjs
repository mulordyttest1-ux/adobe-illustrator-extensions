import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigPaneControlAdapter } from './config_pane_control_adapter.js';

const originalDocument = globalThis.document;

class FakeClassList {
    constructor() {
        this.values = new Set();
    }

    add(value) {
        this.values.add(value);
    }
}

class FakeElement {
    constructor(tagName) {
        this.tagName = String(tagName || '').toUpperCase();
        this.children = [];
        this.dataset = {};
        this.listeners = {};
        this.attributes = {};
        this.classList = new FakeClassList();
        this.className = '';
        this.value = '';
        this.checked = false;
        this.textContent = '';
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    addEventListener(type, listener) {
        this.listeners[type] = listener;
    }

    emit(type) {
        if (this.listeners[type]) {
            this.listeners[type]();
        }
    }
}

function createFolder() {
    const content = new FakeElement('div');
    return {
        content,
        element: {
            querySelector() {
                return content;
            }
        }
    };
}

function findElement(root, predicate) {
    if (predicate(root)) return root;
    for (const child of root.children || []) {
        const found = findElement(child, predicate);
        if (found) return found;
    }
    return null;
}

function createContext(state = {}) {
    const visibilityCalls = [];
    return {
        state: { ...state },
        bindings: {},
        customControls: {},
        customRows: {},
        visibilityCalls,
        syncConditionalVisibility() {
            visibilityCalls.push('sync');
        }
    };
}

beforeEach(() => {
    globalThis.document = {
        createElement(tagName) {
            return new FakeElement(tagName);
        }
    };
});

afterEach(() => {
    if (originalDocument === undefined) {
        delete globalThis.document;
    } else {
        globalThis.document = originalDocument;
    }
});

describe('ConfigPaneControlAdapter', () => {
    it('renders dense checkbox/select/input controls and updates only injected state', () => {
        const context = createContext({
            opt_cleanup: true,
            output_format: 'pdf',
            copies: '2'
        });
        const adapter = new ConfigPaneControlAdapter(context);
        const folder = createFolder();

        adapter.renderDenseFieldList(folder, [
            { id: 'opt_cleanup', label: 'Cleanup', type: 'checkbox' },
            {
                id: 'output_format',
                label: 'Output',
                type: 'select',
                options: [
                    { txt: 'AI', val: 'ai' },
                    { txt: 'PDF', val: 'pdf' }
                ]
            },
            { id: 'copies', label: 'Copies', type: 'number', step: 1 }
        ]);

        assert.equal(context.customControls.opt_cleanup.checked, true);
        assert.equal(context.customControls.output_format.value, 'pdf');
        assert.equal(context.customControls.copies.value, '2');

        context.customControls.opt_cleanup.checked = false;
        context.customControls.opt_cleanup.emit('change');
        context.customControls.output_format.value = 'ai';
        context.customControls.output_format.emit('change');
        context.customControls.copies.value = '4';
        context.customControls.copies.emit('input');

        assert.equal(context.state.opt_cleanup, false);
        assert.equal(context.state.output_format, 'ai');
        assert.equal(context.state.copies, '4');
        assert.deepEqual(context.visibilityCalls, ['sync']);
    });

    it('renders compact fields from a section and tracks their controls by field id', () => {
        const context = createContext({ ab_w: '320', ab_h: '480' });
        const adapter = new ConfigPaneControlAdapter(context);
        const folder = createFolder();
        const section = {
            fields: [
                { id: 'ab_w', label: 'Width', type: 'number' },
                { id: 'ab_h', label: 'Height', type: 'number' }
            ]
        };

        adapter.renderCompactFieldGroup(folder, section, ['ab_w', 'ab_h']);

        const width = findElement(folder.content, (element) => element.id === 'ab_w');
        const height = findElement(folder.content, (element) => element.id === 'ab_h');
        assert.ok(width);
        assert.ok(height);
        assert.equal(width.value, '320');
        assert.equal(height.value, '480');

        width.value = '480';
        width.emit('input');
        assert.equal(context.state.ab_w, '480');
    });
});
