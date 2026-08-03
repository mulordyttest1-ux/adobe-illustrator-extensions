import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VenueAutomation } from '@wedding/domain';
import { FormLogic } from './FormLogic.js';

class FakeControl {
    constructor({ value = '', checked = false } = {}) {
        this.value = value;
        this.checked = checked;
        this.listeners = new Map();
    }

    addEventListener(type, handler) {
        const current = this.listeners.get(type) || [];
        current.push(handler);
        this.listeners.set(type, current);
    }

    dispatchEvent(event) {
        const payload = {
            type: event?.type || 'change',
            target: this,
            currentTarget: this,
            isTrusted: event?.isTrusted ?? false,
            bubbles: event?.bubbles ?? false
        };

        if (event && typeof event === 'object') {
            Object.keys(event).forEach((key) => {
                if (!(key in payload)) {
                    payload[key] = event[key];
                }
            });
        }

        const handlers = this.listeners.get(payload.type) || [];
        handlers.forEach((handler) => handler(payload));
        return true;
    }
}

function createRadioGroup(values, checkedIndex = 0) {
    return values.map((value, index) => new FakeControl({
        value,
        checked: index === checkedIndex
    }));
}

function createBuilder() {
    const hostOptions = ['Nh\u00e0 Trai', 'Nh\u00e0 G\u00e1i'];
    const leOptions = ['T\u00e2n H\u00f4n', 'Vu Quy'];
    const hostElements = createRadioGroup(hostOptions, 0);
    const leElements = createRadioGroup(leOptions, 0);

    return {
        schema: {
            TRIGGER_CONFIG: {
                'T\u00e2n H\u00f4n': 0,
                'Vu Quy': 1
            },
            STRUCTURE: [
                {
                    items: [
                        { key: 'ceremony.host_type', options: hostOptions }
                    ]
                }
            ]
        },
        refs: {
            'ceremony.host_type': { elements: hostElements },
            'info.ten_le': { elements: leElements },
            'pos1.diachi': new FakeControl({ value: '123 Le Loi' }),
            'ceremony.ten_auto': new FakeControl({ checked: true }),
            'venue.ten_auto': new FakeControl({ checked: true }),
            'ceremony.ten': new FakeControl(),
            'venue.ten': new FakeControl(),
            'ceremony.diachi': new FakeControl(),
            'venue.diachi': new FakeControl()
        }
    };
}

describe('FormLogic', () => {
    it('auto-fills venue name and address from the current host selection', () => {
        const builder = createBuilder();
        const logic = new FormLogic(builder);

        logic.setupAutoVenue();

        assert.equal(
            builder.refs['ceremony.ten'].value,
            VenueAutomation.generateVenueName('Nh\u00e0 Trai')
        );
        assert.equal(
            builder.refs['venue.ten'].value,
            VenueAutomation.generateVenueName('Nh\u00e0 Trai')
        );
        assert.equal(builder.refs['ceremony.diachi'].value, '123 Le Loi');
        assert.equal(builder.refs['venue.diachi'].value, '123 Le Loi');
    });

    it('updates the host selection and venue labels when info.ten_le changes', () => {
        const builder = createBuilder();
        const logic = new FormLogic(builder);
        const hostTrai = builder.refs['ceremony.host_type'].elements[0];
        const hostGai = builder.refs['ceremony.host_type'].elements[1];
        const leTanHon = builder.refs['info.ten_le'].elements[0];
        const leVuQuy = builder.refs['info.ten_le'].elements[1];

        logic.setupAutoVenue();

        leTanHon.checked = false;
        leVuQuy.checked = true;
        leVuQuy.dispatchEvent(new Event('change', { bubbles: true }));

        assert.equal(hostTrai.checked, false);
        assert.equal(hostGai.checked, true);
        assert.equal(
            builder.refs['ceremony.ten'].value,
            VenueAutomation.generateVenueName('Nh\u00e0 G\u00e1i')
        );
        assert.equal(
            builder.refs['venue.ten'].value,
            VenueAutomation.generateVenueName('Nh\u00e0 G\u00e1i')
        );
    });

    it('cancels auto venue name only for trusted manual name input', () => {
        const builder = createBuilder();
        const logic = new FormLogic(builder);
        const checkbox = builder.refs['ceremony.ten_auto'];
        const input = builder.refs['ceremony.ten'];

        logic.setupAutoVenue();

        input.dispatchEvent({ type: 'input', isTrusted: false });
        assert.equal(checkbox.checked, true);

        input.dispatchEvent({ type: 'input', isTrusted: true });
        assert.equal(checkbox.checked, false);
    });

    it('cancels auto venue sync only for trusted manual address input', () => {
        const builder = createBuilder();
        const logic = new FormLogic(builder);
        const checkbox = builder.refs['ceremony.ten_auto'];
        const input = builder.refs['ceremony.diachi'];

        logic.setupAutoVenue();

        input.dispatchEvent({ type: 'input', isTrusted: false });
        assert.equal(checkbox.checked, true);

        input.dispatchEvent({ type: 'input', isTrusted: true });
        assert.equal(checkbox.checked, false);
    });

    it('re-runs ceremony address shaping when auto venue sync updates the source address', () => {
        const builder = createBuilder();
        const calls = [];
        const inputEngine = {
            process(...args) {
                calls.push(args);
                return { value: args[0], warnings: [], valid: true, applied: [] };
            }
        };
        const logic = new FormLogic(builder, { inputEngine });
        const sourceAddr = builder.refs['pos1.diachi'];

        logic.setupAutoVenue();
        calls.length = 0;

        sourceAddr.value = '456 Nguyen Hue';
        sourceAddr.dispatchEvent({ type: 'input', isTrusted: true });

        assert.equal(builder.refs['ceremony.diachi'].value, '456 Nguyen Hue');
        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0], ['456 Nguyen Hue', 'ceremony.diachi', {}, builder.schema]);
    });
});
