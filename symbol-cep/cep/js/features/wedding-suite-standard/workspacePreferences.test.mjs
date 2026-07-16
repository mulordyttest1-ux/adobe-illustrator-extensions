import test from 'node:test';
import assert from 'node:assert/strict';

import {
    loadWorkspacePreferences,
    normalizeWorkspacePreferences,
    saveWorkspacePreferences
} from './workspacePreferences.js';

function createStorage() {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        }
    };
}

test('normalizeWorkspacePreferences keeps only supported fields', () => {
    assert.deepEqual(
        normalizeWorkspacePreferences({
            lastSaveDirectory: 'C:/Output',
            lastSourceDirectory: 'C:/Inputs',
            ignored: true
        }),
        {
            lastSaveDirectory: 'C:/Output',
            lastSourceDirectory: 'C:/Inputs'
        }
    );
});

test('saveWorkspacePreferences persists last save directory and source directory', () => {
    const storage = createStorage();
    const result = saveWorkspacePreferences({
        lastSaveDirectory: 'C:/Output',
        lastSourceDirectory: 'C:/Inputs'
    }, storage);

    assert.deepEqual(result, {
        lastSaveDirectory: 'C:/Output',
        lastSourceDirectory: 'C:/Inputs'
    });
    assert.deepEqual(loadWorkspacePreferences(storage), result);
});
