import test from 'node:test';
import assert from 'node:assert/strict';

import {
    confirmConfigTabModal,
    openConfigTabAddFieldModal,
    requestRemoveRowFromConfigTab
} from './configSchemaEditService.js';

test('requestRemoveRowFromConfigTab removes a dynamic margin row and prunes draft state', async () => {
    const schema = {
        sections: [
            {
                id: 'sec_margins',
                rows: [
                    { id: 'row_dynamic_1' },
                    { id: 'row_dynamic_2' }
                ]
            }
        ]
    };
    const calls = [];
    const tab = {
        getActiveSchema() {
            return schema;
        },
        pruneRemovedRowState(rowId) {
            calls.push(['prune', rowId]);
        },
        render() {
            calls.push('render');
        }
    };

    const result = await requestRemoveRowFromConfigTab(tab, 'row_dynamic_2', 'Row 2', {
        confirm: async () => true,
        schemaMutationService: {
            removeMarginRow(nextSchema, rowId) {
                nextSchema.sections[0].rows = nextSchema.sections[0].rows.filter((row) => row.id !== rowId);
                return true;
            }
        }
    });

    assert.equal(result, true);
    assert.deepEqual(calls, [
        ['prune', 'row_dynamic_2'],
        'render'
    ]);
    assert.deepEqual(schema.sections[0].rows, [{ id: 'row_dynamic_1' }]);
});

test('requestRemoveRowFromConfigTab rejects canonical rows', async () => {
    const schema = {
        sections: [
            {
                id: 'sec_margins',
                rows: [{ id: 'row_safe' }]
            }
        ]
    };
    const calls = [];
    const tab = {
        getActiveSchema() {
            return schema;
        },
        render() {
            calls.push('render');
        }
    };

    const result = await requestRemoveRowFromConfigTab(tab, 'row_safe', 'Row Safe', {
        confirm: async () => true,
        schemaMutationService: {
            removeMarginRow() {
                return false;
            }
        },
        showToast(message, type) {
            calls.push(['toast', message, type]);
        }
    });

    assert.equal(result, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'toast');
    assert.equal(calls[0][2], 'error');
});

test('confirmConfigTabModal creates a margin row, hides the modal, and re-renders', () => {
    const modal = { dataset: { section: 'sec_margins' }, style: { display: 'flex' } };
    const calls = [];
    const tab = {
        getActiveSchema() {
            return { sections: [{ id: 'sec_margins', rows: [] }] };
        },
        render() {
            calls.push('render');
        }
    };

    const result = confirmConfigTabModal(tab, {
        document: {
            getElementById(id) {
                if (id === 'modal-add-field') return modal;
                if (id === 'new-field-label') return { value: 'New Margin' };
                if (id === 'new-field-classification') return { value: 'ADDITIVE' };
                return null;
            }
        },
        schemaMutationService: {
            createMarginRowDefinition(payload) {
                calls.push(['createFieldDefinition', payload.label, payload.classification]);
                return { id: 'row_dynamic_1', fields: {} };
            },
            addMarginRow(schema, row) {
                calls.push(['addMarginRow', schema.sections.length, row.id]);
                schema.sections[0].rows.push(row);
                return true;
            }
        }
    });

    assert.equal(result, true);
    assert.equal(modal.style.display, 'none');
    assert.deepEqual(calls, [
        ['createFieldDefinition', 'New Margin', 'ADDITIVE'],
        ['addMarginRow', 1, 'row_dynamic_1'],
        'render'
    ]);
});

test('openConfigTabAddFieldModal primes the modal inputs and shows the dialog', () => {
    const modal = { dataset: {}, style: { display: 'none' } };
    const labelInput = { value: 'stale' };
    const classificationInput = { value: 'STRUCTURAL' };

    const result = openConfigTabAddFieldModal('sec_margins', {
        document: {
            getElementById(id) {
                if (id === 'modal-add-field') return modal;
                if (id === 'new-field-label') return labelInput;
                if (id === 'new-field-classification') return classificationInput;
                return null;
            }
        }
    });

    assert.equal(result, true);
    assert.equal(modal.dataset.section, 'sec_margins');
    assert.equal(labelInput.value, '');
    assert.equal(classificationInput.value, 'ADDITIVE');
    assert.equal(modal.style.display, 'flex');
});
