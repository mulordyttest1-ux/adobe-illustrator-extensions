import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildJobSaveTargetKey,
    createJobSaveTargetStore,
    normalizeJobDocumentPath,
    normalizeJobSaveTargets
} from './jobSaveTargetStore.js';

function createStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test('normalizeJobDocumentPath normalizes CEP and Windows path variants', () => {
    assert.equal(
        normalizeJobDocumentPath('file:///C:\\Jobs\\Thiep.ai'),
        'c:/jobs/thiep.ai'
    );
});

test('buildJobSaveTargetKey uses preset id plus normalized document path', () => {
    assert.equal(
        buildJobSaveTargetKey('preset_a', 'C:\\Jobs\\Thiep.ai'),
        'preset_a::c:/jobs/thiep.ai'
    );
});

test('normalizeJobSaveTargets keeps valid entries and drops malformed ones', () => {
    const normalized = normalizeJobSaveTargets({
        targetsByKey: {
            valid: {
                presetId: 'preset_a',
                documentPath: 'C:/Jobs/Thiep.ai',
                targetPath: 'C:/Output/Bai in.ai',
                outputName: 'Bai in.ai'
            },
            missingTarget: {
                presetId: 'preset_b',
                documentPath: 'C:/Jobs/Missing.ai'
            }
        }
    });

    assert.deepEqual(Object.keys(normalized.targetsByKey), ['preset_a::c:/jobs/thiep.ai']);
    assert.equal(normalized.targetsByKey['preset_a::c:/jobs/thiep.ai'].outputName, 'Bai in.ai');
});

test('createJobSaveTargetStore remembers and resolves targets by preset id plus document path', () => {
    const storage = createStorage();
    const store = createJobSaveTargetStore(storage);

    store.remember({
        presetId: 'preset_a',
        documentPath: 'C:/Jobs/Thiep.ai',
        targetPath: 'C:/Output/Bai in.ai',
        outputDirectory: 'C:/Output',
        outputName: 'Bai in.ai',
        updatedAt: '2026-04-10T07:00:00.000Z'
    });

    assert.deepEqual(store.get('preset_a', 'C:\\Jobs\\Thiep.ai'), {
        jobKey: 'preset_a::c:/jobs/thiep.ai',
        presetId: 'preset_a',
        documentPath: 'C:/Jobs/Thiep.ai',
        targetPath: 'C:/Output/Bai in.ai',
        outputDirectory: 'C:/Output',
        outputName: 'Bai in.ai',
        updatedAt: '2026-04-10T07:00:00.000Z'
    });
    assert.equal(store.get('preset_a', 'C:/Jobs/Khac.ai'), null);
});
