import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    renderPasteboardSection,
    renderSchemaSection
} from './config_pane_special_sections.js';

const originalDocument = globalThis.document;

class FakeClassList {
    constructor() {
        this.values = new Set();
    }

    add(value) {
        this.values.add(value);
    }

    toggle(value, force) {
        if (force) {
            this.values.add(value);
        } else {
            this.values.delete(value);
        }
    }

    contains(value) {
        return this.values.has(value);
    }
}

class FakeElement {
    constructor(tagName) {
        this.tagName = String(tagName || '').toUpperCase();
        this.children = [];
        this.dataset = {};
        this.classList = new FakeClassList();
        this.listeners = {};
        this.attributes = {};
        this.value = '';
        this.textContent = '';
        this.className = '';
        this.selectionStart = 0;
        this.selectionEnd = 0;
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

    focus() {}

    setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
    }
}

function createPane() {
    const folders = [];
    return {
        folders,
        addFolder(options) {
            const content = new FakeElement('div');
            const folder = {
                options,
                content,
                element: {
                    querySelector() {
                        return content;
                    }
                }
            };
            folders.push(folder);
            return folder;
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

function createRenderer(overrides = {}) {
    return {
        pane: createPane(),
        folderMap: {},
        customControls: {},
        state: {
            pasteboard_mode: 'standard',
            info_template: ''
        },
        schema: null,
        tab: {
            openAddFieldModal() {},
            requestRemoveRow() {}
        },
        _buildNote(text) {
            const note = new FakeElement('div');
            note.textContent = text;
            return note;
        },
        ...overrides
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

describe('config pane special sections', () => {
    it('renders pasteboard controls and inserts schema tokens into the custom template', () => {
        const schema = {
            sections: [
                {
                    id: 'sec_options',
                    fields: [
                        {
                            id: 'info_template',
                            label: 'Custom template'
                        }
                    ]
                }
            ]
        };
        const renderer = createRenderer();
        renderer.schema = schema;

        renderPasteboardSection(renderer, schema);

        assert.equal(renderer.pane.folders.length, 1);
        assert.equal(renderer.folderMap.pasteboard, renderer.pane.folders[0]);
        assert.equal(renderer.customControls.pasteboard_mode.value, 'standard');
        assert.equal(renderer.customControls.info_template.value, '');

        const tokenButton = findElement(
            renderer.pane.folders[0].content,
            (element) => element.dataset && element.dataset.insertToken === '{preset_name}'
        );
        assert.ok(tokenButton);

        tokenButton.emit('click');
        assert.equal(renderer.customControls.info_template.value, '{preset_name}');
        assert.equal(renderer.state.info_template, '{preset_name}');
    });

    it('routes dynamic margin add and remove actions through the config tab facade', () => {
        const calls = [];
        const schema = {
            sections: [
                {
                    id: 'sec_margins',
                    title: 'Margins',
                    rows: [
                        {
                            id: 'row_dynamic_123',
                            label: 'Tear line',
                            fields: {}
                        }
                    ]
                }
            ]
        };
        const renderer = createRenderer({
            tab: {
                openAddFieldModal(sectionId) {
                    calls.push(['add', sectionId]);
                },
                requestRemoveRow(rowId, label) {
                    calls.push(['remove', rowId, label]);
                }
            }
        });

        renderSchemaSection(renderer, schema);

        const addButton = findElement(
            renderer.pane.folders[0].content,
            (element) => element.className === 'pane-schema-btn'
        );
        const removeButton = findElement(
            renderer.pane.folders[0].content,
            (element) => element.className === 'pane-schema-remove'
        );

        assert.ok(addButton);
        assert.ok(removeButton);
        addButton.emit('click');
        removeButton.emit('click');
        assert.deepEqual(calls, [
            ['add', 'sec_margins'],
            ['remove', 'row_dynamic_123', 'Tear line']
        ]);
    });
});
