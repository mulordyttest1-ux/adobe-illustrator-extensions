import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CompactFormBindings } from './CompactFormBindings.js';
import { CompactFormState } from './CompactFormState.js';
import { InputEngine } from '../../logic/ux/InputEngine.js';

class FakeElement {
    constructor(options = {}) {
        this.tagName = options.tagName || 'DIV';
        this.type = options.type || '';
        this.className = options.className || '';
        this.value = options.value ?? '';
        this.checked = options.checked ?? false;
        this.disabled = false;
        this.tabIndex = 0;
        this.style = {};
        this.title = '';
        this.children = [];
        this.listeners = new Map();
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    addEventListener(type, handler) {
        const current = this.listeners.get(type) || [];
        current.push(handler);
        this.listeners.set(type, current);
    }

    dispatchEvent(event) {
        const payload = {
            type: event?.type || 'input',
            target: this,
            currentTarget: this,
            isTrusted: event?.isTrusted ?? false,
            bubbles: event?.bubbles ?? false
        };
        const handlers = this.listeners.get(payload.type) || [];
        handlers.forEach((handler) => handler(payload));
        return true;
    }

    querySelectorAll(selector) {
        const className = selector.startsWith('.') ? selector.slice(1) : selector;
        const matches = [];

        const visit = (node) => {
            node.children.forEach((child) => {
                if ((child.className || '').split(/\s+/).includes(className)) {
                    matches.push(child);
                }
                visit(child);
            });
        };

        visit(this);
        return matches;
    }
}

const fakeDomFactory = {
    createRadioGroup(name, options, suffix = '') {
        const element = new FakeElement({ className: 'compact-radio-group' });
        const inputs = options.map((option, index) => {
            const radio = new FakeElement({
                tagName: 'INPUT',
                type: 'radio',
                value: suffix ? `${option}${suffix}` : option,
                checked: index === 0
            });
            element.appendChild(radio);
            return radio;
        });
        return { element, inputs };
    },
    createTextareaWithIdx(rows = 1, hasIdx = false) {
        const element = new FakeElement({ className: 'compact-field-group' });
        const textarea = new FakeElement({ tagName: 'TEXTAREA', value: '', rows });
        element.appendChild(textarea);
        const result = { element, textarea };

        if (hasIdx) {
            const idx = new FakeElement({ tagName: 'INPUT', type: 'number', className: 'compact-idx', value: 0 });
            element.appendChild(idx);
            result.idx = idx;
        }

        return result;
    },
    createInputWithAuto(hasAuto = false) {
        const element = new FakeElement({ className: 'compact-field-group' });
        const input = new FakeElement({ tagName: 'INPUT', type: 'text' });
        element.appendChild(input);
        const result = { element, input };

        if (hasAuto) {
            const checkbox = new FakeElement({
                tagName: 'INPUT',
                type: 'checkbox',
                className: 'compact-checkbox',
                checked: true
            });
            element.appendChild(checkbox);
            result.checkbox = checkbox;
        }

        return result;
    },
    createTextareaWithAuto(rows = 2, hasAuto = false) {
        const element = new FakeElement({ className: 'compact-field-group' });
        const textarea = new FakeElement({ tagName: 'TEXTAREA', value: '' });
        textarea.rows = rows;
        element.appendChild(textarea);
        const result = { element, textarea };

        if (hasAuto) {
            const checkbox = new FakeElement({
                tagName: 'INPUT',
                type: 'checkbox',
                className: 'compact-checkbox',
                checked: true
            });
            element.appendChild(checkbox);
            result.checkbox = checkbox;
        }

        return result;
    },
    createTextarea(rows = 1) {
        return new FakeElement({ tagName: 'TEXTAREA', value: '', rows });
    }
};

function createBindings(overrides = {}) {
    const notifications = [];
    const scheduled = [];
    const changes = [];
    const state = new CompactFormState({
        onChange: (key, value) => changes.push({ key, value })
    });
    const container = new FakeElement({ className: 'compact-root' });

    const bindings = new CompactFormBindings({
        container,
        state,
        schema: overrides.schema || {},
        domFactory: fakeDomFactory,
        addressService: overrides.addressService || {
            bind() {}
        },
        inputEngine: overrides.inputEngine || {
            process(value) {
                return { value, warnings: [] };
            }
        },
        nameValidator: overrides.nameValidator || {
            suggestIdx() {
                return 0;
            }
        },
        uiFeedback: overrides.uiFeedback || {
            showToast(message, type) {
                notifications.push({ message, type });
            }
        },
        setTimeout: overrides.setTimeout || ((callback, delay) => {
            scheduled.push({ callback, delay });
            return scheduled.length;
        })
    });

    return { bindings, state, container, notifications, scheduled, changes };
}

describe('CompactFormBindings', () => {
    it('normalizes on blur, updates field value, and shows warning feedback', () => {
        const { bindings, notifications, changes } = createBindings({
            inputEngine: {
                process() {
                    return {
                        value: 'Normalized value',
                        warnings: [{ severity: 'warning', message: 'Check spacing' }]
                    };
                }
            }
        });

        const textarea = bindings.createTextarea('ceremony.diachi', 2);
        textarea.value = 'raw';
        textarea.dispatchEvent({ type: 'input', isTrusted: true });
        textarea.dispatchEvent({ type: 'blur', isTrusted: true });

        assert.equal(textarea.value, 'Normalized value');
        assert.equal(textarea.style.borderColor, '#f1c40f');
        assert.equal(textarea.title, 'Check spacing');
        assert.deepEqual(notifications, [{ message: 'Check spacing', type: 'warning' }]);
        assert.deepEqual(changes.slice(-2), [
            { key: 'ceremony.diachi', value: 'raw' },
            { key: 'ceremony.diachi', value: 'Normalized value' }
        ]);
    });

    it('passes a live getFormData context into address service binding', () => {
        const bindCalls = [];
        const { bindings } = createBindings({
            addressService: {
                bind(...args) {
                    bindCalls.push(args);
                }
            }
        });

        const textarea = bindings.createTextarea('ceremony.diachi', 2);
        textarea.value = 'raw';

        assert.equal(bindCalls.length, 1);
        assert.equal(typeof bindCalls[0][5].getFormData, 'function');
        assert.equal(bindCalls[0][5].getFormData()['ceremony.diachi'], 'raw');
    });

    it('auto-detects idx only while idx lock is enabled', () => {
        const { bindings, state, container } = createBindings({
            nameValidator: {
                suggestIdx() {
                    return 5;
                }
            }
        });

        const field = bindings.createTextareaWithIdx('pos1.ong', 1, true);
        container.appendChild(field);
        const textarea = state.refs['pos1.ong'];
        const idx = state.refs['pos1.ong_idx'];

        textarea.value = 'ethnic name';
        textarea.dispatchEvent({ type: 'blur', isTrusted: true });

        assert.equal(idx.value, 5);
        assert.notEqual(idx.title, '');

        bindings.setIdxLocked(false);
        idx.value = 0;
        textarea.dispatchEvent({ type: 'blur', isTrusted: true });

        assert.equal(idx.value, 0);
        assert.equal(idx.disabled, false);
        assert.equal(idx.tabIndex, 0);
    });

    it('keeps the auto checkbox bootstrap callback and manual change wiring', () => {
        const { bindings, state, scheduled, changes } = createBindings();

        const wrapper = bindings.createTextareaWithAuto('ceremony.ten', 2, true);

        assert.equal(wrapper.children.length, 2);
        assert.equal(scheduled.length, 1);
        assert.equal(scheduled[0].delay, 100);
        assert.equal(state.refs['ceremony.ten'].tagName, 'TEXTAREA');
        assert.equal(state.refs['ceremony.ten'].rows, 2);

        scheduled[0].callback();

        const checkbox = state.refs['ceremony.ten_auto'];
        assert.equal(changes.at(-1).key, 'ceremony.ten_auto');
        assert.equal(changes.at(-1).value, true);

        checkbox.checked = false;
        checkbox.dispatchEvent({ type: 'change', isTrusted: true });

        assert.equal(changes.at(-1).key, 'ceremony.ten_auto');
        assert.equal(changes.at(-1).value, false);
    });

    it('normalizes other address fields against the current POS 1 separator on blur', () => {
        const { bindings } = createBindings({
            addressService: { bind() {} },
            inputEngine: InputEngine
        });

        const pos1 = bindings.createTextarea('pos1.diachi', 2);
        const ceremony = bindings.createTextarea('ceremony.diachi', 2);

        pos1.value = 'thon a, xa b';
        pos1.dispatchEvent({ type: 'input', isTrusted: true });
        pos1.dispatchEvent({ type: 'blur', isTrusted: true });
        assert.equal(pos1.value, 'Thon A, Xa B');

        ceremony.value = 'thon c - xa d';
        ceremony.dispatchEvent({ type: 'input', isTrusted: true });
        ceremony.dispatchEvent({ type: 'blur', isTrusted: true });
        assert.equal(ceremony.value, 'Thon C, Xa D');

        pos1.value = 'thon a - xa b';
        pos1.dispatchEvent({ type: 'input', isTrusted: true });
        pos1.dispatchEvent({ type: 'blur', isTrusted: true });
        assert.equal(pos1.value, 'Thon A - Xa B');

        ceremony.value = 'thon c, xa d';
        ceremony.dispatchEvent({ type: 'input', isTrusted: true });
        ceremony.dispatchEvent({ type: 'blur', isTrusted: true });
        assert.equal(ceremony.value, 'Thon C - Xa D');
    });
});
