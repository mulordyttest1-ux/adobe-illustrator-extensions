import test from 'node:test';
import assert from 'node:assert/strict';

import {
    addMarginRow,
    createMarginRowDefinition,
    removeMarginRow
} from './schema_mutation_service.js';

test('createMarginRowDefinition creates four edge fields for a dynamic margin row', () => {
    const row = createMarginRowDefinition({
        label: 'Cấn xé trên',
        classification: 'STRUCTURAL',
        idFactory: () => 123
    });

    assert.equal(row.id, 'row_dynamic_123');
    assert.equal(row.label, 'Cấn xé trên');
    assert.deepEqual(Object.keys(row.fields), ['left', 'right', 'top', 'bottom']);
    assert.equal(row.fields.top.binding.edge, 'top');
    assert.equal(row.fields.top.binding.classification, 'STRUCTURAL');
});

test('addMarginRow and removeMarginRow are restricted to dynamic rows in sec_margins', () => {
    const schema = {
        sections: [
            { id: 'sec_options', rows: [] },
            { id: 'sec_margins', rows: [] }
        ]
    };
    const row = createMarginRowDefinition({ label: 'Cấn xé trên', idFactory: () => 1 });

    assert.equal(addMarginRow(schema, row), true);
    assert.equal(schema.sections[1].rows.length, 1);
    assert.equal(removeMarginRow(schema, 'row_safe'), false);
    assert.equal(removeMarginRow(schema, row.id), true);
    assert.equal(schema.sections[1].rows.length, 0);
});
