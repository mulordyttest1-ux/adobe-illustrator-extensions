import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolkitCatalog } from '../catalog/moduleCatalog.js';
import { createToolkitShell } from './toolkitShell.js';

class FakeClassList {
    constructor(owner) {
        this.owner = owner;
        this.tokens = new Set();
    }

    add(...tokens) {
        tokens.forEach((token) => {
            if (token) {
                this.tokens.add(token);
            }
        });
        this.owner._syncClassName();
    }

    replaceAll(value) {
        this.tokens = new Set(
            String(value || '')
                .split(/\s+/)
                .map((token) => token.trim())
                .filter(Boolean)
        );
        this.owner._syncClassName();
    }
}

class FakeElement {
    constructor(tagName, ownerDocument) {
        this.tagName = String(tagName || '').toUpperCase();
        this.ownerDocument = ownerDocument;
        this.children = [];
        this.parentNode = null;
        this.dataset = {};
        this.attributes = new Map();
        this.listeners = new Map();
        this.classList = new FakeClassList(this);
        this._className = '';
        this.hidden = false;
        this.textContent = '';
        this.title = '';
        this.value = '';
        this.tabIndex = 0;
        this.id = '';
    }

    _syncClassName() {
        this._className = Array.from(this.classList.tokens).join(' ');
    }

    set className(value) {
        this.classList.replaceAll(value);
    }

    get className() {
        return this._className;
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    replaceChildren(...children) {
        this.children = [];
        children.forEach((child) => {
            this.appendChild(child);
        });
    }

    addEventListener(type, handler) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(handler);
    }

    dispatch(type, event = {}) {
        const handlers = this.listeners.get(type) || [];
        handlers.forEach((handler) => handler(event));
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'id') {
            this.id = String(value);
            this.ownerDocument.registerElement(this);
        }
    }

    focus() {
        this.ownerDocument.activeElement = this;
    }

    closest(selector) {
        if (selector !== '[data-command-id]') {
            return null;
        }

        let current = this;
        while (current) {
            if (current.dataset && current.dataset.commandId) {
                return current;
            }
            current = current.parentNode;
        }
        return null;
    }
}

class FakeDocument {
    constructor() {
        this.activeElement = null;
        this.elementsById = new Map();
    }

    createElement(tagName) {
        return new FakeElement(tagName, this);
    }

    registerElement(element) {
        if (element.id) {
            this.elementsById.set(element.id, element);
        }
    }

    querySelector(selector) {
        if (!selector.startsWith('#')) {
            return null;
        }
        return this.elementsById.get(selector.slice(1)) || null;
    }
}

function createShellDocument() {
    const documentRef = new FakeDocument();
    [
        'toolkit-search',
        'toolkit-execution-summary',
        'dashboard-groups',
        'results-panel',
        'results-list',
        'results-count',
        'btn-reload-panel'
    ].forEach((id) => {
        const tagName = id === 'toolkit-search' ? 'input' : id === 'results-list' ? 'ul' : 'div';
        const element = documentRef.createElement(tagName);
        element.setAttribute('id', id);
        documentRef.registerElement(element);
    });

    return documentRef;
}

const MODULES = [
    {
        id: 'swap_selection_position_only',
        title: 'Swap Selection Position Only',
        buttonLabel: 'Swap Position Only',
        category: 'Daily Work',
        order: 10,
        aliases: ['swappos'],
        description: 'Swap the positions of two selected items.',
        favoriteRank: 0,
        requiresDocument: true,
        requiresSelection: true,
        successMessage: 'Done.',
        handler: 'swap_selection_position_only'
    },
    {
        id: 'add_camera_marks',
        title: 'Add Camera Marks',
        buttonLabel: 'Camera Marks',
        category: 'Cut Workflow',
        order: 10,
        aliases: ['camera'],
        description: 'Create camera marks.',
        favoriteRank: 0,
        requiresDocument: true,
        requiresSelection: false,
        successMessage: 'Done.',
        handler: 'add_camera_marks'
    }
];

test('createToolkitShell renders only command labels and keeps Daily Work first', () => {
    const documentRef = createShellDocument();
    const catalog = createToolkitCatalog(MODULES);
    const shell = createToolkitShell({
        documentRef,
        catalog,
        commandRunner: {
            async runManifest(manifest) {
                return { success: true, message: manifest.buttonLabel };
            }
        },
        reloadPanel: async () => { }
    });

    shell.renderInitial();

    const firstGroup = shell.elements.dashboardGroups.children[0];
    assert.equal(firstGroup.children[0].textContent, 'Daily Work');

    const firstCommandButton = firstGroup.children[1].children[0];
    assert.equal(firstCommandButton.children.length, 1);
    assert.equal(firstCommandButton.children[0].textContent, 'Swap Position Only');
});

test('createToolkitShell search keeps hidden fields searchable and renders compact result items', () => {
    const documentRef = createShellDocument();
    const catalog = createToolkitCatalog(MODULES, {
        loadedAtMs: 10,
        loadedModules: [{ id: 'swap_selection_position_only' }, { id: 'add_camera_marks' }],
        quarantinedModules: [{ id: 'swap_selection_position_only', reason: 'Quarantined for test.' }],
        moduleCount: 3,
        quarantinedCount: 1
    });
    const shell = createToolkitShell({
        documentRef,
        catalog,
        commandRunner: {
            async runManifest(manifest) {
                return { success: true, message: manifest.buttonLabel };
            }
        },
        reloadPanel: async () => { }
    });

    shell.renderInitial();
    shell.elements.searchInput.value = 'swappos';
    shell.elements.searchInput.dispatch('input', {
        target: shell.elements.searchInput
    });

    assert.equal(shell.elements.resultsPanel.hidden, false);
    assert.equal(shell.elements.resultsList.children.length, 1);

    const resultItem = shell.elements.resultsList.children[0];
    assert.equal(resultItem.children.length, 2);
    assert.equal(resultItem.children[0].textContent, 'Swap Position Only');
    assert.equal(resultItem.children[1].textContent, 'Quarantined for test.');
    assert.equal(shell.elements.resultsCount.textContent, '1');
    assert.equal(shell.elements.summary.textContent, 'Ready (1 quarantined).');
});

test('createToolkitShell reload button delegates to injected reload handler without forcing rebuild copy', async () => {
    const documentRef = createShellDocument();
    const catalog = createToolkitCatalog(MODULES);
    const calls = [];
    const shell = createToolkitShell({
        documentRef,
        catalog,
        commandRunner: {
            async runManifest(manifest) {
                return { success: true, message: manifest.buttonLabel };
            }
        },
        reloadPanel: async () => {
            calls.push('reloadPanel');
        }
    });

    shell.renderInitial();
    shell.elements.summary.textContent = 'Ready.';
    shell.elements.reloadButton.dispatch('click');
    await Promise.resolve();

    assert.deepEqual(calls, ['reloadPanel']);
    assert.equal(shell.elements.summary.textContent, 'Ready.');
});
