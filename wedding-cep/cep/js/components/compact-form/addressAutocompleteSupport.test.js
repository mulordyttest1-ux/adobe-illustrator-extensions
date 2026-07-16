import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    applyActiveItem,
    closeAutocompleteLists,
    createAutocompleteItem,
    createAutocompleteList,
    ensureAutocompleteCombobox,
    getAutocompleteItems,
    handleAutocompleteKeydown,
    highlightMatch,
    isAddressField,
    positionAutocompleteList
} from './addressAutocompleteSupport.js';

class FakeClassList {
    constructor(element) {
        this.element = element;
        this._set = new Set();
    }

    add(...names) {
        names.forEach((name) => this._set.add(name));
        this._sync();
    }

    remove(...names) {
        names.forEach((name) => this._set.delete(name));
        this._sync();
    }

    contains(name) {
        return this._set.has(name);
    }

    setFromString(value = '') {
        this._set = new Set(String(value).split(/\s+/).filter(Boolean));
        this._sync();
    }

    _sync() {
        this.element.className = Array.from(this._set).join(' ');
    }
}

class FakeElement {
    constructor(documentRef, options = {}) {
        this.ownerDocument = documentRef;
        this.tagName = (options.tagName || 'DIV').toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.listeners = new Map();
        this.attributes = {};
        this.dataset = {};
        this.style = {};
        this.className = '';
        this.classList = new FakeClassList(this);
        this.id = options.id || '';
        this.innerHTML = '';
        this.value = options.value || '';
        this.rect = options.rect || { left: 0, top: 0, bottom: 0, width: 0 };

        if (options.className) {
            this.classList.setFromString(options.className);
        }
        if (this.id) {
            this.attributes.id = this.id;
        }
    }

    appendChild(child) {
        child.parentNode = this;
        child.ownerDocument = this.ownerDocument;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        this.children = this.children.filter((candidate) => candidate !== child);
        child.parentNode = null;
        return child;
    }

    contains(target) {
        if (!target) {
            return false;
        }

        if (target === this) {
            return true;
        }

        return this.children.some((child) => child.contains(target));
    }

    setAttribute(name, value) {
        const stringValue = String(value);
        this.attributes[name] = stringValue;

        if (name === 'id') {
            this.id = stringValue;
        }

        if (name === 'class') {
            this.classList.setFromString(stringValue);
        }

        if (name.startsWith('data-')) {
            const dataKey = name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
            this.dataset[dataKey] = stringValue;
        }
    }

    getAttribute(name) {
        if (name === 'id') {
            return this.id || null;
        }

        if (name === 'class') {
            return this.className || null;
        }

        return Object.prototype.hasOwnProperty.call(this.attributes, name)
            ? this.attributes[name]
            : null;
    }

    removeAttribute(name) {
        delete this.attributes[name];
        if (name === 'id') {
            this.id = '';
        }
        if (name === 'class') {
            this.classList.setFromString('');
        }
    }

    addEventListener(type, handler) {
        const handlers = this.listeners.get(type) || [];
        handlers.push(handler);
        this.listeners.set(type, handlers);
    }

    dispatchEvent(event = {}) {
        const payload = {
            type: event.type || 'click',
            target: event.target || this,
            currentTarget: this,
            defaultPrevented: false,
            preventDefault() {
                this.defaultPrevented = true;
            },
            ...event
        };
        const handlers = this.listeners.get(payload.type) || [];
        handlers.forEach((handler) => handler(payload));
        return !payload.defaultPrevented;
    }

    click() {
        this.dispatchEvent({ type: 'click' });
    }

    focus() {
        this.ownerDocument.activeElement = this;
    }

    scrollIntoView() {}

    getBoundingClientRect() {
        return this.rect;
    }

    getElementsByClassName(className) {
        const matches = [];

        const visit = (node) => {
            node.children.forEach((child) => {
                if (child.classList.contains(className)) {
                    matches.push(child);
                }
                visit(child);
            });
        };

        visit(this);
        return matches;
    }
}

class FakeDocument {
    constructor() {
        this.defaultView = {
            scrollX: 5,
            scrollY: 7
        };
        this.activeElement = null;
        this.body = new FakeElement(this, { tagName: 'BODY' });
    }

    createElement(tagName) {
        return new FakeElement(this, { tagName });
    }

    getElementById(id) {
        const visit = (node) => {
            if (node.id === id) {
                return node;
            }

            for (const child of node.children) {
                const resolved = visit(child);
                if (resolved) {
                    return resolved;
                }
            }

            return null;
        };

        return visit(this.body);
    }

    getElementsByClassName(className) {
        return this.body.getElementsByClassName(className);
    }
}

describe('addressAutocompleteSupport', () => {
    it('delegates address-field decisions to the shared field-type resolver contract', () => {
        const fieldTypeResolver = {
            isAddressField(key, schema, schemaUtils) {
                return schemaUtils.getType(key, schema) === 'address';
            }
        };

        assert.equal(isAddressField('venue.diachi', {}, fieldTypeResolver, { getType: () => 'name' }), false);
        assert.equal(isAddressField('venue.ten', {}, fieldTypeResolver, { getType: () => 'address' }), true);
    });

    it('keeps the runtime fallback behavior exposed by FieldTypeResolver', () => {
        const schemaUtils = {
            getType: () => null
        };

        assert.equal(isAddressField('venue.diachi', null, undefined, schemaUtils), true);
        assert.equal(isAddressField('venue.address', null, undefined, schemaUtils), true);
        assert.equal(isAddressField('venue.ten', null, undefined, schemaUtils), false);
    });

    it('highlights matches case-insensitively in rendered address text', () => {
        const html = highlightMatch('Phuong Tan Lap, Tinh Dak Lak', 'tan lap');

        assert.equal(html, 'Phuong <strong>Tan Lap</strong>, Tinh Dak Lak');
    });

    it('configures combobox/listbox semantics and active descendant state', () => {
        const documentRef = new FakeDocument();
        const input = documentRef.createElement('input');
        const { ownerId, listId } = ensureAutocompleteCombobox(input, 'pos1.diachi');
        const listContainer = createAutocompleteList(documentRef, input, { ownerId, listId });
        const selectedValues = [];

        documentRef.body.appendChild(input);
        documentRef.body.appendChild(listContainer);

        const optionOne = createAutocompleteItem({
            documentRef,
            optionId: `${listId}__option-0`,
            highlightedHtml: 'Tan Lap',
            finalValue: 'Tan Lap',
            onSelect: (value) => selectedValues.push(value)
        });
        const optionTwo = createAutocompleteItem({
            documentRef,
            optionId: `${listId}__option-1`,
            highlightedHtml: 'Lien Son Lak',
            finalValue: 'Lien Son Lak',
            onSelect: (value) => selectedValues.push(value)
        });

        listContainer.appendChild(optionOne);
        listContainer.appendChild(optionTwo);

        const nextFocus = applyActiveItem(getAutocompleteItems(documentRef, input), 0, input);

        assert.equal(input.getAttribute('role'), 'combobox');
        assert.equal(input.getAttribute('aria-controls'), listId);
        assert.equal(input.getAttribute('aria-expanded'), 'true');
        assert.equal(input.getAttribute('aria-activedescendant'), optionOne.id);
        assert.equal(listContainer.getAttribute('role'), 'listbox');
        assert.equal(optionOne.getAttribute('aria-selected'), 'true');
        assert.equal(optionTwo.getAttribute('aria-selected'), 'false');
        assert.equal(nextFocus, 0);

        optionOne.click();
        assert.deepEqual(selectedValues, ['Tan Lap']);
    });

    it('positions the popup relative to the input geometry instead of fixed viewport math', () => {
        const documentRef = new FakeDocument();
        const input = documentRef.createElement('input');
        const { ownerId, listId } = ensureAutocompleteCombobox(input, 'pos2.diachi');
        const listContainer = createAutocompleteList(documentRef, input, { ownerId, listId });

        input.rect = { left: 11, top: 22, bottom: 44, width: 133 };
        positionAutocompleteList(listContainer, input, documentRef.defaultView);

        assert.equal(listContainer.style.left, '16px');
        assert.equal(listContainer.style.top, '51px');
        assert.equal(listContainer.style.width, '133px');
    });

    it('closes open lists and resets combobox state for every owned input', () => {
        const documentRef = new FakeDocument();
        const inputOne = documentRef.createElement('input');
        const inputTwo = documentRef.createElement('input');
        const idsOne = ensureAutocompleteCombobox(inputOne, 'pos1.diachi');
        const idsTwo = ensureAutocompleteCombobox(inputTwo, 'ceremony.diachi');
        const listOne = createAutocompleteList(documentRef, inputOne, idsOne);
        const listTwo = createAutocompleteList(documentRef, inputTwo, idsTwo);

        documentRef.body.appendChild(inputOne);
        documentRef.body.appendChild(inputTwo);
        documentRef.body.appendChild(listOne);
        documentRef.body.appendChild(listTwo);
        inputOne.setAttribute('aria-expanded', 'true');
        inputOne.setAttribute('aria-activedescendant', 'first');
        inputTwo.setAttribute('aria-expanded', 'true');
        inputTwo.setAttribute('aria-activedescendant', 'second');

        closeAutocompleteLists(documentRef, inputOne);

        assert.equal(documentRef.getElementsByClassName('autocomplete-list').length, 0);
        assert.equal(inputOne.getAttribute('aria-expanded'), 'false');
        assert.equal(inputOne.getAttribute('aria-activedescendant'), null);
        assert.equal(inputTwo.getAttribute('aria-expanded'), 'false');
        assert.equal(inputTwo.getAttribute('aria-activedescendant'), null);
    });

    it('handles Arrow, Enter, Tab, and Escape with stable combobox state', () => {
        const documentRef = new FakeDocument();
        const input = documentRef.createElement('input');
        const { ownerId, listId } = ensureAutocompleteCombobox(input, 'pos1.diachi');
        const listContainer = createAutocompleteList(documentRef, input, { ownerId, listId });
        const selectedValues = [];
        let closeCount = 0;

        documentRef.body.appendChild(input);
        documentRef.body.appendChild(listContainer);

        listContainer.appendChild(createAutocompleteItem({
            documentRef,
            optionId: `${listId}__option-0`,
            highlightedHtml: 'Tan Lap',
            finalValue: 'Tan Lap',
            onSelect: (value) => selectedValues.push(value)
        }));
        listContainer.appendChild(createAutocompleteItem({
            documentRef,
            optionId: `${listId}__option-1`,
            highlightedHtml: 'Lien Son Lak',
            finalValue: 'Lien Son Lak',
            onSelect: (value) => selectedValues.push(value)
        }));

        let focus = handleAutocompleteKeydown({
            key: 'ArrowDown',
            preventDefault() {}
        }, getAutocompleteItems(documentRef, input), -1, {
            closeAllLists: () => {
                closeCount += 1;
            },
            input
        });

        assert.equal(focus, 0);
        assert.equal(input.getAttribute('aria-activedescendant'), `${listId}__option-0`);

        focus = handleAutocompleteKeydown({
            key: 'Enter',
            preventDefault() {}
        }, getAutocompleteItems(documentRef, input), focus, {
            closeAllLists: () => {
                closeCount += 1;
            },
            input
        });

        assert.equal(focus, -1);
        assert.deepEqual(selectedValues, ['Tan Lap']);

        focus = handleAutocompleteKeydown({
            key: 'Tab',
            preventDefault() {}
        }, [], -1, {
            closeAllLists: () => {
                closeCount += 1;
            },
            input
        });
        assert.equal(focus, -1);

        focus = handleAutocompleteKeydown({
            key: 'Escape',
            preventDefault() {}
        }, getAutocompleteItems(documentRef, input), 0, {
            closeAllLists: () => {
                closeCount += 1;
            },
            input
        });
        assert.equal(focus, -1);
        assert.equal(closeCount, 2);
    });

    it('commits the active autocomplete option as multiline with Alt+Enter', () => {
        const documentRef = new FakeDocument();
        const input = documentRef.createElement('input');
        const { ownerId, listId } = ensureAutocompleteCombobox(input, 'pos1.diachi');
        const listContainer = createAutocompleteList(documentRef, input, { ownerId, listId });
        const selectedValues = [];
        let prevented = false;

        documentRef.body.appendChild(input);
        documentRef.body.appendChild(listContainer);

        listContainer.appendChild(createAutocompleteItem({
            documentRef,
            optionId: `${listId}__option-0`,
            highlightedHtml: 'Phuong Buon Ma Thuot',
            finalValue: 'Phuong Buon Ma Thuot, Tinh Dak Lak',
            getFinalValue: (commitOptions = {}) => commitOptions.formatMode === 'multiline'
                ? 'Phuong Buon Ma Thuot\nTinh Dak Lak'
                : 'Phuong Buon Ma Thuot, Tinh Dak Lak',
            onSelect: (value) => selectedValues.push(value)
        }));

        const focus = handleAutocompleteKeydown({
            key: 'Enter',
            altKey: true,
            preventDefault() {
                prevented = true;
            }
        }, getAutocompleteItems(documentRef, input), 0, {
            closeAllLists() {},
            input
        });

        assert.equal(focus, -1);
        assert.equal(prevented, true);
        assert.deepEqual(selectedValues, ['Phuong Buon Ma Thuot\nTinh Dak Lak']);
    });
});
