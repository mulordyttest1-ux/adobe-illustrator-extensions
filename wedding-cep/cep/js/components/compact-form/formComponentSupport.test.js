import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildDateGroupLayout,
    buildFamilyColumns,
    buildRankingRow,
    buildVenueLayout,
    DATE_ACTION_BUTTONS,
    DATE_GRID_CONFIGS,
    FAMILY_FIELDS,
    VITHU_NAM_OPTIONS,
    VITHU_NU_OPTIONS
} from './formComponentSupport.js';
import { FakeDocument, FakeElement } from '../date-grid/dateGridTestUtils.js';

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

describe('formComponentSupport', () => {
    it('builds the ranking row with the expected radio-group contract', () => {
        withFakeDocument(() => {
            const calls = [];
            const row = buildRankingRow({
                createRow: () => new FakeElement('div'),
                createInlineRadio: (key, options, suffix, config) => {
                    calls.push({ key, options, suffix, config });
                    return new FakeElement('div');
                }
            });

            assert.equal(row.children.length, 5);
            assert.deepEqual(calls, [
                { key: 'ui.vithu_nam', options: VITHU_NAM_OPTIONS, suffix: '', config: { checkedIndex: -1 } },
                { key: 'ui.vithu_nu', options: VITHU_NU_OPTIONS, suffix: '', config: { checkedIndex: -1 } }
            ]);
        });
    });

    it('builds mirrored family columns for POS1 and POS2', () => {
        withFakeDocument((document) => {
            const calls = [];
            const wrapper = buildFamilyColumns({
                documentRef: document,
                createRow: () => new FakeElement('div'),
                createLabel: (text) => {
                    const label = new FakeElement('span');
                    label.textContent = text;
                    return label;
                },
                createTextareaWithIdx: (key, rows, hasIdx) => {
                    calls.push({ key, rows, hasIdx });
                    return new FakeElement('div');
                }
            });

            assert.equal(wrapper.children.length, 2);
            assert.equal(calls.length, FAMILY_FIELDS.length * 2);
            assert.deepEqual(calls[0], { key: 'pos1.ong', rows: 2, hasIdx: true });
            assert.deepEqual(calls.at(-1), { key: 'pos2.con_full', rows: 2, hasIdx: true });
        });
    });

    it('builds venue and date layouts with stable adapter wiring', () => {
        withFakeDocument((document) => {
            const venueCalls = {
                radio: [],
                textareaAuto: [],
                textarea: []
            };
            const venueLayout = buildVenueLayout({
                createRow: () => new FakeElement('div'),
                createLabel: (text) => {
                    const label = new FakeElement('span');
                    label.textContent = text;
                    return label;
                },
                createInlineRadio: (key, options, suffix) => {
                    venueCalls.radio.push({ key, options, suffix });
                    return new FakeElement('div');
                },
                createTextareaWithAuto: (key, rows, hasAuto) => {
                    venueCalls.textareaAuto.push({ key, rows, hasAuto });
                    return new FakeElement('div');
                },
                createTextarea: (key, rows) => {
                    venueCalls.textarea.push({ key, rows });
                    return new FakeElement('div');
                }
            });
            const dateCalls = {
                mount: [],
                buttons: []
            };
            const dateLayout = buildDateGroupLayout({
                documentRef: document,
                adapter: {
                    mountDateGrid: (container, configs) => dateCalls.mount.push({ container, configs }),
                    registerButtonRef: (key, element) => dateCalls.buttons.push({ key, element })
                },
                createButton: (id, label, title) => {
                    const button = new FakeElement('button');
                    button.id = id;
                    button.textContent = label;
                    button.title = title;
                    return button;
                }
            });

            assert.equal(venueLayout.headerNodes.length, 2);
            assert.equal(venueLayout.bodyRows.length, 3);
            assert.deepEqual(venueCalls.radio, [
                { key: 'ceremony.host_type', options: ['Nhà Trai', 'Nhà Gái'], suffix: undefined }
            ]);
            assert.deepEqual(venueCalls.textareaAuto, [
                { key: 'ceremony.ten', rows: 2, hasAuto: true },
                { key: 'venue.ten', rows: 2, hasAuto: true }
            ]);
            assert.deepEqual(venueCalls.textarea, [
                { key: 'ceremony.diachi', rows: 2 },
                { key: 'venue.diachi', rows: 2 }
            ]);
            assert.equal(dateLayout.children.length, 2);
            assert.deepEqual(dateCalls.mount[0].configs, DATE_GRID_CONFIGS);
            assert.deepEqual(
                dateCalls.buttons.map((entry) => entry.key),
                DATE_ACTION_BUTTONS.map((action) => action.id)
            );
        });
    });
});
