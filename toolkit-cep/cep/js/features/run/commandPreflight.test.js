import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCommandPreflight } from './commandPreflight.js';

const MANIFEST = {
    requiresDocument: true,
    requiresSelection: true
};

test('evaluateCommandPreflight blocks when no document is active', () => {
    const result = evaluateCommandPreflight(MANIFEST, {
        hasActiveDocument: false,
        selectionCount: 0
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, 'REQUIRES_DOCUMENT');
});

test('evaluateCommandPreflight blocks when no selection is active', () => {
    const result = evaluateCommandPreflight(MANIFEST, {
        hasActiveDocument: true,
        selectionCount: 0
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, 'REQUIRES_SELECTION');
});
