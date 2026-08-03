import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CompactFormState } from './CompactFormState.js';

class FakeControl {
    constructor(options = {}) {
        this.type = options.type || 'text';
        this.value = options.value ?? '';
        this.checked = options.checked ?? false;
        this.listeners = new Map();
        this.dispatches = [];
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
        this.dispatches.push(payload.type);
        const handlers = this.listeners.get(payload.type) || [];
        handlers.forEach((handler) => handler(payload));
        return true;
    }
}

describe('CompactFormState', () => {
    it('getData reads radio, checkbox, computed, and plain input refs', () => {
        const state = new CompactFormState();
        const computedEl = { textContent: 'Computed value' };

        state.registerRef('ceremony.host_type', {
            type: 'radio',
            elements: [
                new FakeControl({ value: 'Nhà Trai', checked: false }),
                new FakeControl({ value: 'Nhà Gái', checked: true })
            ]
        });
        state.registerRef('venue.ten_auto', Object.assign(new FakeControl({ type: 'checkbox', checked: true }), {
            type: 'checkbox'
        }));
        state.registerRef('computed.field', {
            isComputed: true,
            el: computedEl
        });
        state.registerRef('plain.field', new FakeControl({ value: 'Typed value' }));

        assert.deepEqual(state.getData(), {
            'ceremony.host_type': 'Nhà Gái',
            'venue.ten_auto': true,
            'computed.field': 'Computed value',
            'plain.field': 'Typed value'
        });
    });

    it('setData updates refs, dispatches the right events, and ignores undefined values', () => {
        const state = new CompactFormState({ data: { untouched: 'keep' } });
        const radioA = new FakeControl({ value: 'Trai', checked: true });
        const radioB = new FakeControl({ value: 'Gái', checked: false });
        const checkbox = Object.assign(new FakeControl({ type: 'checkbox', checked: false }), {
            type: 'checkbox'
        });
        const input = new FakeControl({ value: 'Old' });
        const computedEl = { textContent: 'Before' };

        state.registerRef('ceremony.host_type', {
            type: 'radio',
            elements: [radioA, radioB]
        });
        state.registerRef('venue.ten_auto', checkbox);
        state.registerRef('plain.field', input);
        state.registerRef('computed.field', { isComputed: true, el: computedEl });

        state.setData({
            'ceremony.host_type': 'Gái',
            'venue.ten_auto': true,
            'plain.field': 'Updated',
            'computed.field': 'After',
            skipped: undefined
        });

        assert.equal(radioA.checked, false);
        assert.equal(radioB.checked, true);
        assert.deepEqual(radioB.dispatches, ['change']);
        assert.equal(checkbox.checked, true);
        assert.deepEqual(checkbox.dispatches, ['change']);
        assert.equal(input.value, 'Updated');
        assert.deepEqual(input.dispatches, ['input']);
        assert.equal(computedEl.textContent, 'After');
        assert.equal(state.data.untouched, 'keep');
        assert.equal(state.data['plain.field'], 'Updated');
        assert.equal(state.data.skipped, undefined);
    });

    it('marks scanned years explicit and resets missing automatic years for inference', () => {
        const state = new CompactFormState();
        const yearInput = Object.assign(
            new FakeControl({ value: '2027' }),
            { dataset: { yearSource: 'explicit' } }
        );
        const yearAuto = Object.assign(
            new FakeControl({ type: 'checkbox', checked: true }),
            { type: 'checkbox' }
        );

        state.registerRef('date.tiec.nam', yearInput);
        state.registerRef('date.tiec.nam_auto', yearAuto);

        state.setData({ 'date.tiec.nam': '2026' });
        assert.equal(yearInput.dataset.yearSource, 'explicit');

        state.setData({});
        assert.equal(yearInput.dataset.yearSource, 'default');
    });
});
