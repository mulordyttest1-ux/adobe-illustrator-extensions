import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInjectSchemaDocument } from './injectSchemaDocument.js';

describe('runInjectSchemaDocument', () => {
    it('delegates to the template-authoring inject document service seam when provided', () => {
        const calls = [];
        const frames = [{ id: 'f1' }];
        const serviceResult = {
            changes: [{ id: 'f1', plan: { mode: 'DIRECT' } }],
            orphans: [],
            missedRequired: [],
            hasChanges: true,
            hasOrphans: false
        };

        const result = runInjectSchemaDocument(
            { frames, targetType: 'nhap' },
            {
                runInjectSchemaDocumentService: (input, deps) => {
                    calls.push({ input, deps });
                    return serviceResult;
                }
            }
        );

        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0].input, { frames, targetType: 'nhap' });
        assert.equal(typeof calls[0].deps.runInjectSchemaDocumentService, 'function');
        assert.equal(result, serviceResult);
    });

    it('sorts frames before computing schema changes and returns a normalized result', () => {
        const calls = {
            sortFrames: [],
            computeChanges: []
        };
        const frames = [{ id: 'f2' }, { id: 'f1' }];
        const sortedFrames = [{ id: 'f1' }, { id: 'f2' }];

        const result = runInjectSchemaDocument(
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
        const result = runInjectSchemaDocument(
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
});
