import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    bindVenueRefreshTriggers,
    createVenueContext,
    getCurrentHost,
    refreshVenueSections,
    updateHostFromLe,
    wireManualVenueCancellation
} from './formLogicSupport.js';

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

function createContextBuilder() {
    const hostOptions = ['Nh\u00e0 Trai', 'Nh\u00e0 G\u00e1i'];
    const leOptions = ['T\u00e2n H\u00f4n', 'Vu Quy'];
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
            'ceremony.host_type': { elements: createRadioGroup(hostOptions, 0) },
            'info.ten_le': { elements: createRadioGroup(leOptions, 0) },
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

describe('formLogicSupport', () => {
    it('creates the venue context and resolves the checked host with schema-backed defaults', () => {
        const builder = createContextBuilder();
        const context = createVenueContext(builder);

        assert.equal(context.hostValues.trai, 'Nh\u00e0 Trai');
        assert.equal(context.hostValues.gai, 'Nh\u00e0 G\u00e1i');
        assert.equal(getCurrentHost(context), 'Nh\u00e0 Trai');
    });

    it('wires le, host, address, and auto-toggle triggers through the shared helper seam', () => {
        const builder = createContextBuilder();
        const context = createVenueContext(builder);
        const calls = [];

        bindVenueRefreshTriggers({
            context,
            onLeChange: (value) => calls.push(['le', value]),
            onHostChange: (value) => calls.push(['host', value]),
            onAddressChange: () => calls.push(['address']),
            onAutoToggle: () => calls.push(['auto'])
        });

        const leVuQuy = context.leRef.elements[1];
        const hostGai = context.hostRef.elements[1];
        leVuQuy.dispatchEvent(new Event('change', { bubbles: true }));
        hostGai.dispatchEvent(new Event('change', { bubbles: true }));
        context.pos1Addr.dispatchEvent({ type: 'input', isTrusted: true });
        context.refs['ceremony.ten_auto'].dispatchEvent(new Event('change', { bubbles: true }));

        assert.deepEqual(calls, [
            ['le', 'Vu Quy'],
            ['host', 'Nh\u00e0 G\u00e1i'],
            ['address'],
            ['auto']
        ]);
    });

    it('updates host selection from le and refreshes auto venue sections without touching manual-off refs', () => {
        const builder = createContextBuilder();
        const context = createVenueContext(builder);
        const hostChangeCalls = [];

        context.refs['ceremony.host_type'].elements.forEach((radio) => {
            radio.addEventListener('change', () => hostChangeCalls.push(radio.value));
        });

        const changed = updateHostFromLe({
            leValue: 'Vu Quy',
            refs: context.refs,
            triggers: context.triggers,
            hostValues: context.hostValues,
            createChangeEvent: () => new Event('change', { bubbles: true })
        });

        assert.equal(changed, true);
        assert.equal(context.refs['ceremony.host_type'].elements[0].checked, false);
        assert.equal(context.refs['ceremony.host_type'].elements[1].checked, true);
        assert.deepEqual(hostChangeCalls, ['Nh\u00e0 G\u00e1i']);

        context.refs['venue.ten_auto'].checked = false;
        const addressCalls = [];
        refreshVenueSections({
            hostValue: 'Nh\u00e0 G\u00e1i',
            context,
            venueAutomation: {
                generateVenueName(value) {
                    return `T\u01b0 Gia ${value}`;
                }
            },
            onCeremonyAddressChanged: (value) => addressCalls.push(value)
        });

        assert.equal(context.refs['ceremony.ten'].value, 'T\u01b0 Gia Nh\u00e0 G\u00e1i');
        assert.equal(context.refs['ceremony.diachi'].value, '123 Le Loi');
        assert.equal(context.refs['venue.ten'].value, '');
        assert.deepEqual(addressCalls, ['123 Le Loi']);
    });

    it('cancels auto mode only for trusted manual input events', () => {
        const builder = createContextBuilder();
        const refs = builder.refs;

        wireManualVenueCancellation({
            refs,
            createChangeEvent: () => new Event('change', { bubbles: true })
        });

        refs['ceremony.ten'].dispatchEvent({ type: 'input', isTrusted: false });
        assert.equal(refs['ceremony.ten_auto'].checked, true);

        refs['ceremony.ten'].dispatchEvent({ type: 'input', isTrusted: true });
        assert.equal(refs['ceremony.ten_auto'].checked, false);
    });
});
