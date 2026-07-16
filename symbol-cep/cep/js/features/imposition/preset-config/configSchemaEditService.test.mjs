import test from 'node:test';
import assert from 'node:assert/strict';

import {
    confirmConfigTabModal,
    openConfigTabAddFieldModal,
    requestRemoveFieldFromConfigTab,
    requestRemoveRowFromConfigTab
} from './configSchemaEditService.js';

test('requestRemoveFieldFromConfigTab removes the field and re-renders on confirm', async () => {
    const calls = [];
    const tab = {
        getActiveSchema() {
            return { sections: [{ id: 'sec', fields: [] }] };
        },
        render() {
            calls.push('render');
        }
    };

    const result = await requestRemoveFieldFromConfigTab(tab, 'field_a', 'Field A', {
        confirm: async () => true,
        configEngine: {
            removeField(schema, fieldId) {
                calls.push(['removeField', schema.sections.length, fieldId]);
                return true;
            }
        }
    });

    assert.equal(result, true);
    assert.deepEqual(calls, [
        ['removeField', 1, 'field_a'],
        'render'
    ]);
});

test('requestRemoveRowFromConfigTab removes the row and re-renders on confirm', async () => {
    const schema = {
        sections: [
            {
                rows: [
                    { id: 'row_keep' },
                    { id: 'row_remove' }
                ]
            }
        ]
    };
    let renders = 0;
    const tab = {
        getActiveSchema() {
            return schema;
        },
        render() {
            renders += 1;
        }
    };

    const result = await requestRemoveRowFromConfigTab(tab, 'row_remove', 'Row Remove', {
        confirm: async () => true
    });

    assert.equal(result, true);
    assert.equal(renders, 1);
    assert.deepEqual(schema.sections[0].rows, [{ id: 'row_keep' }]);
});

test('confirmConfigTabModal creates a field, hides the modal, and re-renders', () => {
    const modal = { dataset: { section: 'sec_options' }, style: { display: 'flex' } };
    const calls = [];
    const tab = {
        getActiveSchema() {
            return { sections: [{ id: 'sec_options', fields: [] }] };
        },
        render() {
            calls.push('render');
        }
    };

    const result = confirmConfigTabModal(tab, {
        document: {
            getElementById(id) {
                if (id === 'modal-add-field') return modal;
                if (id === 'new-field-label') return { value: 'New Field' };
                if (id === 'new-field-classification') return { value: 'ADDITIVE' };
                return null;
            }
        },
        configEngine: {
            createFieldDefinition(payload) {
                calls.push(['createFieldDefinition', payload.label, payload.classification]);
                return { id: 'dynamic_1' };
            },
            addField(schema, sectionId, fieldDef) {
                calls.push(['addField', schema.sections.length, sectionId, fieldDef.id]);
                return true;
            }
        }
    });

    assert.equal(result, true);
    assert.equal(modal.style.display, 'none');
    assert.deepEqual(calls, [
        ['createFieldDefinition', 'New Field', 'ADDITIVE'],
        ['addField', 1, 'sec_options', 'dynamic_1'],
        'render'
    ]);
});

test('openConfigTabAddFieldModal primes the modal inputs and shows the dialog', () => {
    const modal = { dataset: {}, style: { display: 'none' } };
    const labelInput = { value: 'stale' };
    const classificationInput = { value: 'STRUCTURAL' };

    const result = openConfigTabAddFieldModal('sec_options', {
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
    assert.equal(modal.dataset.section, 'sec_options');
    assert.equal(labelInput.value, '');
    assert.equal(classificationInput.value, 'ADDITIVE');
    assert.equal(modal.style.display, 'flex');
});
