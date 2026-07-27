import test from 'node:test';
import assert from 'node:assert/strict';

import { ConfigDraftStore } from './config_draft_store.js';

test('ConfigDraftStore keeps current state separate from its clean baseline', () => {
    const store = new ConfigDraftStore({
        schema: { id: 'standard_imposition' },
        values: { finish_w: 90 },
        meta: { presetId: 'preset-1', presetName: 'Sample' }
    });

    assert.equal(store.isDirty(), false);
    store.setValues({ finish_w: 91 });

    assert.equal(store.isDirty(), true);
    assert.equal(store.getBaseline().values.finish_w, 90);
});

test('ConfigDraftStore snapshots are defensive copies', () => {
    const store = new ConfigDraftStore({
        schema: { id: 'standard_imposition' },
        values: { nested: { value: 1 } }
    });

    const snapshot = store.getSnapshot();
    snapshot.values.nested.value = 9;

    assert.equal(store.getValues().nested.value, 1);
});
