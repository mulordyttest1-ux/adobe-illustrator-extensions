import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { wireSchemaActions } from './wireActions.js';

class FakeButton {
    constructor(dataset = {}) {
        this.dataset = dataset;
        this.handlers = new Map();
    }

    addEventListener(type, handler) {
        const current = this.handlers.get(type) || [];
        current.push(handler);
        this.handlers.set(type, current);
    }

    click() {
        const handlers = this.handlers.get('click') || [];
        handlers.forEach((handler) => handler({ target: this }));
    }
}

function createDeps(calls) {
    return {
        InjectSchemaAction: {
            execute(args) {
                calls.push(['autoInject', args]);
            }
        },
        ManualInjectAction: {
            injectBulk(args) {
                calls.push(['bulkInject', args]);
            },
            injectSingle(args) {
                calls.push(['singleInject', args]);
            },
            injectCompound(args) {
                calls.push(['compoundInject', args]);
            },
            injectDateClone(args) {
                calls.push(['dateClone', args]);
            }
        }
    };
}

describe('wireSchemaActions', () => {
    it('dispatches the right action for auto, bulk, single, compound, and clone buttons', () => {
        const calls = [];
        const bridge = { id: 'bridge' };
        const deps = createDeps(calls);
        const schemaRefs = {
            'btn-inject-auto': new FakeButton(),
            'btn-bulk-pos1': new FakeButton(),
            'btn-date-gio': new FakeButton({ schema: '{date.tiec.gio}' }),
            'btn-single-pos1-con_ho_ten': new FakeButton({ schema: '{pos1.con_full.ho_dau}|{pos1.con_full.ten}' }),
            'btn-date-clone-le': new FakeButton({ cloneTarget: 'le' })
        };

        wireSchemaActions({ schemaRefs, bridge }, deps);

        schemaRefs['btn-inject-auto'].click();
        schemaRefs['btn-bulk-pos1'].click();
        schemaRefs['btn-date-gio'].click();
        schemaRefs['btn-single-pos1-con_ho_ten'].click();
        schemaRefs['btn-date-clone-le'].click();

        assert.deepEqual(calls, [
            ['autoInject', { hostFacade: bridge, button: schemaRefs['btn-inject-auto'] }],
            ['bulkInject', { hostFacade: bridge, button: schemaRefs['btn-bulk-pos1'], prefix: 'pos1' }],
            ['singleInject', { hostFacade: bridge, button: schemaRefs['btn-date-gio'], schemaValue: '{date.tiec.gio}' }],
            ['compoundInject', { hostFacade: bridge, button: schemaRefs['btn-single-pos1-con_ho_ten'], schemaValue: '{pos1.con_full.ho_dau}|{pos1.con_full.ten}' }],
            ['dateClone', { hostFacade: bridge, button: schemaRefs['btn-date-clone-le'], targetMoc: 'le' }]
        ]);
    });

    it('ignores missing or unknown refs without throwing', () => {
        const calls = [];
        const bridge = { id: 'bridge' };
        const deps = createDeps(calls);

        assert.doesNotThrow(() => {
            wireSchemaActions(
                {
                    schemaRefs: {
                        unknown: new FakeButton(),
                        'btn-inject-auto': null
                    },
                    bridge
                },
                deps
            );
        });

        assert.deepEqual(calls, []);
    });
});
