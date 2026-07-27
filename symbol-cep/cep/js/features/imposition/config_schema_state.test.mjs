import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildConfigStateFingerprint,
    collectSchemaStateKeys,
    normalizeRawValuesForSchema
} from './config_schema_state.js';

test('normalizeRawValuesForSchema keeps canonical fields and removes stale removed fields', () => {
    const schema = {
        sections: [{
            fields: [{ id: 'opt_cleanup' }],
            rows: [{
                id: 'row_dynamic_1',
                fields: {
                    top: { id: 'dynamic_1_top' }
                }
            }]
        }]
    };

    assert.deepEqual(
        normalizeRawValuesForSchema({
            preset_name: 'Preset',
            opt_cleanup: true,
            dynamic_1_top: '3',
            removed_field: 'stale',
            opt_layout_head_to_head: true
        }, schema),
        {
            preset_name: 'Preset',
            opt_cleanup: true,
            dynamic_1_top: '3'
        }
    );
});

test('collectSchemaStateKeys includes row border controls and pasteboard mode', () => {
    const keys = collectSchemaStateKeys({
        sections: [{
            rows: [{
                id: 'row_dynamic_2',
                fields: {
                    bottom: { id: 'dynamic_2_bottom' }
                }
            }]
        }]
    });

    assert.equal(keys.has('pasteboard_mode'), true);
    assert.equal(keys.has('dynamic_2_bottom'), true);
    assert.equal(keys.has('row_dynamic_2_draw_border'), true);
    assert.equal(keys.has('row_dynamic_2_border_style'), true);
});

test('buildConfigStateFingerprint is stable for object key order', () => {
    const schema = { sections: [] };
    const first = buildConfigStateFingerprint({
        schema,
        rawValues: { b: 2, a: 1 },
        formMeta: { presetId: 'a', presetName: 'A' }
    });
    const second = buildConfigStateFingerprint({
        schema,
        rawValues: { a: 1, b: 2 },
        formMeta: { presetName: 'A', presetId: 'a' }
    });

    assert.equal(first, second);
});
