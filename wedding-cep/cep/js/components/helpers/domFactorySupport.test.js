import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    createButtonElement,
    createColumnElement,
    createDebounced,
    createInputFieldGroup,
    createLabeledCheckboxParts,
    createPanelShell,
    createRadioGroupParts,
    createSelectElement,
    createTextareaFieldGroup,
    createTextareaWithAutoFieldGroup
} from './domFactorySupport.js';

class FakeTextNode {
    constructor(text) {
        this.textContent = text;
    }
}

class FakeElement {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName.toUpperCase();
        this.ownerDocument = ownerDocument;
        this.className = '';
        this.children = [];
        this.style = { cssText: '' };
        this.textContent = '';
        this.type = '';
        this.name = '';
        this.value = '';
        this.checked = false;
        this.rows = 0;
        this.title = '';
        this.id = '';
        this.min = '';
        this.max = '';
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    set innerHTML(value) {
        this._innerHTML = value;
    }

    get innerHTML() {
        return this._innerHTML || '';
    }
}

class FakeDocument {
    createElement(tagName) {
        return new FakeElement(tagName, this);
    }

    createTextNode(text) {
        return new FakeTextNode(text);
    }
}

const originalDocument = globalThis.document;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

afterEach(() => {
    globalThis.document = originalDocument;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
});

describe('domFactorySupport', () => {
    it('creates panel, radio, textarea, and input groups with the expected detached DOM structure', () => {
        globalThis.document = new FakeDocument();

        const panel = createPanelShell('Compact');
        const radios = createRadioGroupParts('hostType', ['Trai', 'Gai'], '_suffix');
        const textareaGroup = createTextareaFieldGroup(2, true);
        const textareaAutoGroup = createTextareaWithAutoFieldGroup(2, true);
        const inputGroup = createInputFieldGroup(true);

        assert.equal(panel.panel.className, 'compact-panel');
        assert.equal(panel.header.textContent, 'Compact');
        assert.equal(panel.body.className, 'compact-panel-body');

        assert.equal(radios.group.className, 'compact-radio-group');
        assert.equal(radios.inputs.length, 2);
        assert.equal(radios.inputs[0].name, 'hostType');
        assert.equal(radios.inputs[0].value, 'Trai_suffix');
        assert.equal(radios.inputs[0].checked, true);

        assert.equal(textareaGroup.element.className, 'compact-field-group');
        assert.equal(textareaGroup.textarea.rows, 2);
        assert.equal(textareaGroup.textarea.style.height, 'var(--compact-addr-h)');
        assert.equal(textareaGroup.idx.type, 'number');
        assert.equal(textareaGroup.idx.value, 0);

        assert.equal(textareaAutoGroup.element.className, 'compact-field-group');
        assert.equal(textareaAutoGroup.textarea.rows, 2);
        assert.equal(textareaAutoGroup.textarea.style.height, 'var(--compact-addr-h)');
        assert.equal(textareaAutoGroup.checkbox.type, 'checkbox');
        assert.equal(textareaAutoGroup.checkbox.checked, true);

        assert.equal(inputGroup.element.className, 'compact-field-group');
        assert.equal(inputGroup.input.type, 'text');
        assert.equal(inputGroup.checkbox.type, 'checkbox');
        assert.equal(inputGroup.checkbox.checked, true);
    });

    it('supports radio groups that intentionally start with no selection', () => {
        globalThis.document = new FakeDocument();

        const radios = createRadioGroupParts('requiredRadio', ['A', 'B'], '', { checkedIndex: -1 });

        assert.equal(radios.inputs[0].checked, false);
        assert.equal(radios.inputs[1].checked, false);
    });

    it('creates button, select, column, and labeled checkbox elements with stable defaults', () => {
        globalThis.document = new FakeDocument();

        const button = createButtonElement('btn-save', 'Save', 'Commit changes');
        const select = createSelectElement(['A', 'B'], '120px');
        const column = createColumnElement('Column');
        const labeledCheckbox = createLabeledCheckboxParts('Auto', false);

        assert.equal(button.id, 'btn-save');
        assert.match(button.className, /ds-btn-secondary/);
        assert.equal(button.title, 'Commit changes');

        assert.equal(select.className, 'compact-select');
        assert.equal(select.style.width, '120px');
        assert.deepEqual(select.children.map((child) => child.value), ['A', 'B']);

        assert.match(column.innerHTML, /Column/);
        assert.equal(labeledCheckbox.checkbox.checked, false);
        assert.equal(labeledCheckbox.wrapper.children[0], labeledCheckbox.checkbox);
        assert.equal(labeledCheckbox.wrapper.children[1].textContent, 'Auto');
    });

    it('debounces calls and preserves the latest context and arguments through injected timers', () => {
        const timers = new Map();
        let timerId = 0;
        const fakeTimers = {
            setTimeout(callback, delay) {
                timerId += 1;
                timers.set(timerId, { callback, delay });
                return timerId;
            },
            clearTimeout(id) {
                timers.delete(id);
            }
        };

        const calls = [];
        const debounced = createDebounced(function (...args) {
            calls.push({ context: this, args });
        }, 50, fakeTimers);

        const firstContext = { name: 'first' };
        const secondContext = { name: 'second' };

        debounced.call(firstContext, 'initial');
        debounced.call(secondContext, 'latest', 2);

        assert.equal(timers.size, 1);
        const timer = Array.from(timers.values())[0];
        assert.equal(timer.delay, 50);

        timer.callback();

        assert.equal(calls.length, 1);
        assert.equal(calls[0].context, secondContext);
        assert.deepEqual(calls[0].args, ['latest', 2]);
    });
});
