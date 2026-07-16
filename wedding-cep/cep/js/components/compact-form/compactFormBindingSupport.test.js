import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    createBoundInputWithAuto,
    createBoundRadioGroup,
    createBoundTextarea,
    createBoundTextareaWithAuto,
    createBoundTextareaWithIdx,
    mountDateGridBinding,
    resolveBindingsRuntime,
    updateIdxInputState
} from './compactFormBindingSupport.js';

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
        this.dataset = {};
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
            radio.name = name;
            element.appendChild(radio);
            return radio;
        });
        return { element, inputs };
    },
    createTextareaWithIdx(rows = 1, hasIdx = false) {
        const element = new FakeElement({ className: 'compact-field-group' });
        const textarea = new FakeElement({ tagName: 'TEXTAREA', value: '' });
        textarea.rows = rows;
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
            const checkbox = new FakeElement({ tagName: 'INPUT', type: 'checkbox', className: 'compact-checkbox', checked: true });
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
            const checkbox = new FakeElement({ tagName: 'INPUT', type: 'checkbox', className: 'compact-checkbox', checked: true });
            element.appendChild(checkbox);
            result.checkbox = checkbox;
        }

        return result;
    },
    createTextarea(rows = 1) {
        const textarea = new FakeElement({ tagName: 'TEXTAREA', value: '' });
        textarea.rows = rows;
        return textarea;
    }
};

function createState() {
    return {
        refs: {},
        idxLocked: true,
        registerRef(key, value) {
            this.refs[key] = value;
        }
    };
}

describe('compactFormBindingSupport', () => {
    it('resolves runtime dependencies from overrides and instantiates the widget class once', () => {
        class FakeDateGridWidget {}

        const documentRef = { id: 'doc' };
        const setTimeoutFn = () => {};
        const runtime = resolveBindingsRuntime({
            document: documentRef,
            setTimeout: setTimeoutFn,
            domFactory: fakeDomFactory,
            addressService: { bind() {} },
            inputEngine: { process() {} },
            nameValidator: { suggestIdx() { return 0; } },
            uiFeedback: { showToast() {} },
            dateGridWidgetClass: FakeDateGridWidget
        });

        assert.equal(runtime.documentRef, documentRef);
        assert.equal(runtime.setTimeoutFn, setTimeoutFn);
        assert.equal(runtime.domFactory, fakeDomFactory);
        assert.ok(runtime.dateGridWidget instanceof FakeDateGridWidget);
    });

    it('updates idx field interactivity and binds textarea/input/radio behavior through the local helper seam', () => {
        const state = createState();
        const root = new FakeElement({ className: 'compact-root' });
        const changes = [];
        const scheduled = [];

        const radioGroup = createBoundRadioGroup({
            key: 'ceremony.host_type',
            options: ['Nha Trai', 'Nha Gai'],
            domFactory: fakeDomFactory,
            state,
            handleFieldChange: (key, value) => changes.push([key, value])
        });

        const textareaField = createBoundTextareaWithIdx({
            key: 'pos1.ong',
            rows: 1,
            hasIdx: true,
            domFactory: fakeDomFactory,
            state,
            tabIndex: 1,
            bindAddress() {},
            handleFieldChange: (key, value) => changes.push([key, value]),
            runInputNormalization: (element) => {
                element.value = `${element.value}-normalized`;
            },
            idxLocked: true,
            syncSuggestedIdx(textarea, idxInput) {
                idxInput.value = textarea.value.startsWith('ethnic') ? 5 : 0;
            }
        });

        const inputField = createBoundInputWithAuto({
            key: 'ceremony.ten',
            hasAuto: true,
            domFactory: fakeDomFactory,
            state,
            tabIndex: textareaField.nextTabIndex,
            bindAddress() {},
            handleFieldChange: (key, value) => changes.push([key, value]),
            runInputNormalization() {},
            setTimeoutFn: (callback, delay) => {
                scheduled.push({ callback, delay });
            }
        });

        const plainTextarea = createBoundTextarea({
            key: 'ceremony.diachi',
            rows: 2,
            domFactory: fakeDomFactory,
            state,
            tabIndex: inputField.nextTabIndex,
            bindAddress() {},
            handleFieldChange: (key, value) => changes.push([key, value]),
            runInputNormalization() {}
        });

        root.appendChild(textareaField.element);
        root.appendChild(inputField.element);
        root.appendChild(plainTextarea.textarea);

        updateIdxInputState({ root, idxLocked: true });
        const idxInput = state.refs['pos1.ong_idx'];
        assert.equal(idxInput.disabled, true);
        assert.equal(idxInput.tabIndex, -1);

        updateIdxInputState({ root, idxLocked: false });
        assert.equal(idxInput.disabled, false);
        assert.equal(idxInput.tabIndex, 0);

        const radio = state.refs['ceremony.host_type'].elements[1];
        radio.dispatchEvent({ type: 'change', isTrusted: true });

        const textarea = state.refs['pos1.ong'];
        textarea.value = 'ethnic';
        textarea.dispatchEvent({ type: 'input', isTrusted: true });
        textarea.dispatchEvent({ type: 'blur', isTrusted: true });

        const checkbox = state.refs['ceremony.ten_auto'];
        scheduled[0].callback();
        checkbox.checked = false;
        checkbox.dispatchEvent({ type: 'change', isTrusted: true });

        assert.equal(radioGroup.className, 'compact-radio-group');
        assert.equal(textareaField.nextTabIndex, 2);
        assert.equal(inputField.nextTabIndex, 3);
        assert.equal(plainTextarea.nextTabIndex, 4);
        assert.equal(idxInput.value, 5);
        assert.equal(scheduled[0].delay, 100);
        assert.deepEqual(changes.slice(0, 5), [
            ['ceremony.host_type', 'Nha Gai'],
            ['pos1.ong', 'ethnic'],
            ['ceremony.ten_auto', true],
            ['ceremony.ten_auto', false]
        ].slice(0, 4));
    });

    it('binds textarea fields with auto checkbox through the shared auto-field path', () => {
        const state = createState();
        const changes = [];
        const scheduled = [];

        const textareaField = createBoundTextareaWithAuto({
            key: 'venue.ten',
            rows: 2,
            hasAuto: true,
            domFactory: fakeDomFactory,
            state,
            tabIndex: 7,
            bindAddress() {},
            handleFieldChange: (key, value) => changes.push([key, value]),
            runInputNormalization() {},
            setTimeoutFn: (callback, delay) => {
                scheduled.push({ callback, delay });
            }
        });

        const textarea = state.refs['venue.ten'];
        const checkbox = state.refs['venue.ten_auto'];

        textarea.value = 'venue name';
        textarea.dispatchEvent({ type: 'input', isTrusted: true });
        scheduled[0].callback();
        checkbox.checked = false;
        checkbox.dispatchEvent({ type: 'change', isTrusted: true });

        assert.equal(textareaField.element.className, 'compact-field-group');
        assert.equal(textareaField.nextTabIndex, 8);
        assert.equal(textarea.rows, 2);
        assert.equal(scheduled[0].delay, 100);
        assert.deepEqual(changes, [
            ['venue.ten', 'venue name'],
            ['venue.ten_auto', true],
            ['venue.ten_auto', false]
        ]);
    });

    it('mounts the date-grid widget and binds its change handler through the same local seam', () => {
        const calls = [];
        const fakeWidget = {
            create(container, dateConfigs, refs) {
                calls.push(['create', container, dateConfigs, refs]);
            },
            setChangeHandler(handler) {
                calls.push(['setChangeHandler']);
                handler('date.tiec.ngay', '12');
            }
        };
        const refs = {};
        const changes = [];

        mountDateGridBinding({
            dateGridWidget: fakeWidget,
            container: { id: 'grid' },
            dateConfigs: [{ baseKey: 'date.tiec' }],
            refs,
            handleFieldChange: (key, value) => changes.push([key, value])
        });

        assert.deepEqual(calls[0], ['create', { id: 'grid' }, [{ baseKey: 'date.tiec' }], refs]);
        assert.deepEqual(calls[1], ['setChangeHandler']);
        assert.deepEqual(changes, [['date.tiec.ngay', '12']]);
    });
});
