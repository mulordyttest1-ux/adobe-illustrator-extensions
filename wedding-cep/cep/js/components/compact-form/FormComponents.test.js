import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FormComponents } from './FormComponents.js';
import {
    DATE_ACTION_BUTTONS,
    DATE_GRID_CONFIGS,
    FAMILY_FIELDS,
    INFO_LE_OPTIONS,
    VITHU_NAM_OPTIONS,
    VITHU_NU_OPTIONS
} from './formComponentSupport.js';
import { FakeDocument, FakeElement } from '../date-grid/dateGridTestUtils.js';

if (!FakeElement.prototype.querySelector) {
    FakeElement.prototype.querySelector = function querySelector(selector) {
        const matches = (node) => {
            if (!(node instanceof FakeElement)) {
                return false;
            }

            if (selector.startsWith('.')) {
                return node.classList.contains(selector.slice(1));
            }
            if (selector.startsWith('#')) {
                return node.id === selector.slice(1);
            }
            return node.tagName === selector.toUpperCase();
        };

        const visit = (node) => {
            for (const child of node.children) {
                if (matches(child)) {
                    return child;
                }
                const nested = visit(child);
                if (nested) {
                    return nested;
                }
            }
            return null;
        };

        return visit(this);
    };
}

function withFakeDocument(callback) {
    const previousDocument = globalThis.document;
    const document = new FakeDocument();
    globalThis.document = document;

    try {
        callback(document);
    } finally {
        globalThis.document = previousDocument;
    }
}

function createAdapterSpy() {
    const calls = {
        createInlineRadio: [],
        createTextareaWithIdx: [],
        createInputWithAuto: [],
        createTextareaWithAuto: [],
        createTextarea: [],
        setIdxLocked: [],
        registerButtonRef: [],
        mountDateGrid: []
    };

    return {
        calls,
        adapter: {
            createInlineRadio(key, options, suffix, config) {
                calls.createInlineRadio.push({ key, options, suffix, config });
                return new FakeElement('div');
            },
            createTextareaWithIdx(key, rows, hasIdx) {
                calls.createTextareaWithIdx.push({ key, rows, hasIdx });
                return new FakeElement('div');
            },
            createInputWithAuto(key, hasAuto) {
                calls.createInputWithAuto.push({ key, hasAuto });
                return new FakeElement('div');
            },
            createTextareaWithAuto(key, rows, hasAuto) {
                calls.createTextareaWithAuto.push({ key, rows, hasAuto });
                return new FakeElement('div');
            },
            createTextarea(key, rows) {
                calls.createTextarea.push({ key, rows });
                return new FakeElement('div');
            },
            setIdxLocked(value) {
                calls.setIdxLocked.push(value);
            },
            registerButtonRef(key, element) {
                calls.registerButtonRef.push({ key, element });
            },
            mountDateGrid(container, configs) {
                calls.mountDateGrid.push({ container, configs });
            }
        }
    };
}

describe('FormComponents', () => {
    it('renders the info and family groups with the expected adapter contract', () => {
        withFakeDocument((document) => {
            const container = document.createElement('div');
            const { adapter, calls } = createAdapterSpy();
            const components = new FormComponents({ container, adapter });

            components.buildInfoGroup();
            components.buildFamilyGroup();

            assert.equal(container.children.length, 2);
            assert.deepEqual(calls.createInlineRadio, [
                { key: 'info.ten_le', options: INFO_LE_OPTIONS, suffix: undefined, config: { checkedIndex: -1 } },
                { key: 'ui.vithu_nam', options: VITHU_NAM_OPTIONS, suffix: '', config: { checkedIndex: -1 } },
                { key: 'ui.vithu_nu', options: VITHU_NU_OPTIONS, suffix: '', config: { checkedIndex: -1 } }
            ]);
            assert.equal(calls.createTextareaWithIdx.length, FAMILY_FIELDS.length * 2);

            const familyPanel = container.children[1];
            const familyHeader = familyPanel.querySelector('.compact-panel-header');
            const lockCheckbox = familyHeader.children[0].children[0];
            lockCheckbox.checked = false;
            lockCheckbox.dispatchEvent({ type: 'change' });

            assert.deepEqual(calls.setIdxLocked, [false]);
        });
    });

    it('can render the family group before the info group without changing field wiring', () => {
        withFakeDocument((document) => {
            const container = document.createElement('div');
            const { adapter, calls } = createAdapterSpy();
            const components = new FormComponents({ container, adapter });

            components.buildFamilyGroup();
            components.buildInfoGroup();

            assert.equal(container.children.length, 2);
            const familyPanel = container.children[0];
            const infoPanel = container.children[1];
            const familyHeader = familyPanel.querySelector('.compact-panel-header');
            const infoHeader = infoPanel.querySelector('.compact-panel-header');

            assert.equal(familyHeader.children.length > 0, true);
            assert.equal(familyHeader.children[0].querySelector('INPUT') instanceof FakeElement, true);
            assert.equal(infoHeader.children.length, 0);
            assert.equal(calls.createTextareaWithIdx.length, FAMILY_FIELDS.length * 2);
            assert.deepEqual(calls.createInlineRadio, [
                { key: 'info.ten_le', options: INFO_LE_OPTIONS, suffix: undefined, config: { checkedIndex: -1 } },
                { key: 'ui.vithu_nam', options: VITHU_NAM_OPTIONS, suffix: '', config: { checkedIndex: -1 } },
                { key: 'ui.vithu_nu', options: VITHU_NU_OPTIONS, suffix: '', config: { checkedIndex: -1 } }
            ]);
        });
    });

    it('renders the venue and date groups with stable field and action wiring', () => {
        withFakeDocument((document) => {
            const container = document.createElement('div');
            const { adapter, calls } = createAdapterSpy();
            const schema = {
                STANDARD_TIMES: {
                    TIEC: { h: '11', m: '00' }
                }
            };
            const components = new FormComponents({ container, adapter, schema });

            components.buildVenueGroup();
            components.buildDateGroupWithActions();

            assert.equal(calls.createInlineRadio[0].key, 'ceremony.host_type');
            assert.deepEqual(calls.createInputWithAuto, []);
            assert.deepEqual(calls.createTextareaWithAuto, [
                { key: 'ceremony.ten', rows: 2, hasAuto: true },
                { key: 'venue.ten', rows: 2, hasAuto: true }
            ]);
            assert.deepEqual(calls.createTextarea, [
                { key: 'ceremony.diachi', rows: 2 },
                { key: 'venue.diachi', rows: 2 }
            ]);
            assert.deepEqual(calls.mountDateGrid[0].configs, [
                { ...DATE_GRID_CONFIGS[0], standardTime: { h: '11', m: '00' } },
                { ...DATE_GRID_CONFIGS[1] },
                { ...DATE_GRID_CONFIGS[2] }
            ]);
            assert.deepEqual(
                calls.registerButtonRef.map((entry) => entry.key),
                DATE_ACTION_BUTTONS.map((action) => action.id)
            );
        });
    });
});
