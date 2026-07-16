import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInjectSchemaDocumentService } from './injectSchemaDocumentService.js';

describe('runInjectSchemaDocumentService', () => {
    it('sorts frames before computing schema changes and returns a normalized result', () => {
        const calls = {
            sortFrames: [],
            computeChanges: []
        };
        const frames = [{ id: 'f2' }, { id: 'f1' }];
        const sortedFrames = [{ id: 'f1' }, { id: 'f2' }];

        const result = runInjectSchemaDocumentService(
            { frames, targetType: 'le' },
            {
                layoutUtils: {
                    sortFrames(inputFrames) {
                        calls.sortFrames.push(inputFrames);
                        return sortedFrames;
                    }
                },
                schemaInjector: {
                    computeChanges(inputFrames, targetType) {
                        calls.computeChanges.push({ inputFrames, targetType });
                        return {
                            changes: [{ id: 'f1', plan: { mode: 'ATOMIC' } }],
                            orphans: [{ id: 'f2' }],
                            missedRequired: ['date.le']
                        };
                    }
                }
            }
        );

        assert.deepEqual(calls.sortFrames, [frames]);
        assert.deepEqual(calls.computeChanges, [{ inputFrames: sortedFrames, targetType: 'le' }]);
        assert.deepEqual(result, {
            changes: [{ id: 'f1', plan: { mode: 'ATOMIC' } }],
            orphans: [{ id: 'f2' }],
            missedRequired: ['date.le'],
            hasChanges: true,
            hasOrphans: true
        });
    });

    it('returns a clear no-op result when there is nothing to inject', () => {
        const result = runInjectSchemaDocumentService(
            { frames: [], targetType: 'tiec' },
            {
                layoutUtils: { sortFrames: () => [] },
                schemaInjector: {
                    computeChanges: () => ({
                        changes: [],
                        orphans: [],
                        missedRequired: []
                    })
                }
            }
        );

        assert.deepEqual(result, {
            changes: [],
            orphans: [],
            missedRequired: [],
            hasChanges: false,
            hasOrphans: false
        });
    });

    it('normalizes missing arrays from the schema injector', () => {
        const result = runInjectSchemaDocumentService(
            { frames: [{ id: 'f1' }], targetType: 'tiec' },
            {
                layoutUtils: { sortFrames: (frames) => frames },
                schemaInjector: {
                    computeChanges: () => ({})
                }
            }
        );

        assert.deepEqual(result, {
            changes: [],
            orphans: [],
            missedRequired: [],
            hasChanges: false,
            hasOrphans: false
        });
    });
});
