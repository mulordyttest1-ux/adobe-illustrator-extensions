import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DomFactory } from './DomFactory.js';

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

describe('DomFactory', () => {
    it('creates radio groups with the expected values and default checked state', () => {
        globalThis.document = new FakeDocument();

        const result = DomFactory.createRadioGroup('hostType', ['Trai', 'Gái'], '_suffix');

        assert.equal(result.element.className, 'compact-radio-group');
        assert.equal(result.inputs.length, 2);
        assert.equal(result.inputs[0].name, 'hostType');
        assert.equal(result.inputs[0].value, 'Trai_suffix');
        assert.equal(result.inputs[0].checked, true);
        assert.equal(result.inputs[1].checked, false);
        assert.equal(result.element.children.length, 2);
    });

    it('can create radio groups without a default checked item', () => {
        globalThis.document = new FakeDocument();

        const result = DomFactory.createRadioGroup('vithu', ['A', 'B'], '', { checkedIndex: -1 });

        assert.equal(result.inputs[0].checked, false);
        assert.equal(result.inputs[1].checked, false);
    });

    it('creates textarea and input wrappers with the expected helper refs', () => {
        globalThis.document = new FakeDocument();

        const textareaWithIdx = DomFactory.createTextareaWithIdx(2, true);
        const textareaWithAuto = DomFactory.createTextareaWithAuto(2, true);
        const inputWithAuto = DomFactory.createInputWithAuto(true);

        assert.equal(textareaWithIdx.element.className, 'compact-field-group');
        assert.equal(textareaWithIdx.textarea.rows, 2);
        assert.equal(textareaWithIdx.textarea.style.height, 'var(--compact-addr-h)');
        assert.equal(textareaWithIdx.idx.type, 'number');
        assert.equal(textareaWithIdx.idx.value, 0);

        assert.equal(textareaWithAuto.element.className, 'compact-field-group');
        assert.equal(textareaWithAuto.textarea.rows, 2);
        assert.equal(textareaWithAuto.textarea.style.height, 'var(--compact-addr-h)');
        assert.equal(textareaWithAuto.checkbox.type, 'checkbox');
        assert.equal(textareaWithAuto.checkbox.checked, true);

        assert.equal(inputWithAuto.element.className, 'compact-field-group');
        assert.equal(inputWithAuto.input.type, 'text');
        assert.equal(inputWithAuto.checkbox.type, 'checkbox');
        assert.equal(inputWithAuto.checkbox.checked, true);
    });

    it('creates buttons, selects, and labeled checkboxes with the expected defaults', () => {
        globalThis.document = new FakeDocument();

        const button = DomFactory.createButton('btn-save', 'Save', 'Commit changes');
        const select = DomFactory.createSelect(['A', 'B'], '120px');
        const labeledCheckbox = DomFactory.createLabeledCheckbox('Auto', false);

        assert.equal(button.id, 'btn-save');
        assert.match(button.className, /ds-btn-secondary/);
        assert.equal(button.title, 'Commit changes');

        assert.equal(select.className, 'compact-select');
        assert.equal(select.style.width, '120px');
        assert.deepEqual(select.children.map((child) => child.value), ['A', 'B']);

        assert.equal(labeledCheckbox.checkbox.checked, false);
        assert.equal(labeledCheckbox.element.children[0], labeledCheckbox.checkbox);
        assert.equal(labeledCheckbox.element.children[1].textContent, 'Auto');
    });

    it('debounces calls and preserves the latest context and arguments', () => {
        const timers = new Map();
        let timerId = 0;
        globalThis.setTimeout = (callback, delay) => {
            timerId += 1;
            timers.set(timerId, { callback, delay });
            return timerId;
        };
        globalThis.clearTimeout = (id) => {
            timers.delete(id);
        };

        const calls = [];
        const debounced = DomFactory.debounce(function (...args) {
            calls.push({ context: this, args });
        }, 50);

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
