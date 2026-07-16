import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInjectSchemaService } from './injectSchemaService.js';

describe('runInjectSchemaService', () => {
    it('reads the selection, computes inject changes, applies plans, and returns a normalized result', async () => {
        const calls = {
            fetchSelectedFrames: [],
            runInjectSchemaDocument: [],
            applySelectionPlans: []
        };
        const bridge = { id: 'bridge' };
        const frames = [{ id: 'f1' }, { id: 'f2' }];

        const result = await runInjectSchemaService(
            { bridge, targetType: 'le' },
            {
                fetchSelectedFrames: async (input) => {
                    calls.fetchSelectedFrames.push(input);
                    return { success: true, frames };
                },
                runInjectSchemaDocument: (input) => {
                    calls.runInjectSchemaDocument.push(input);
                    return {
                        changes: [{ id: 'f1', plan: { mode: 'ATOMIC' } }],
                        orphans: [{ id: 'f2' }],
                        missedRequired: ['date.le']
                    };
                },
                applySelectionPlans: async (input) => {
                    calls.applySelectionPlans.push(input);
                    return {
                        success: true,
                        updated: 1,
                        affected: [{ id: 'f1' }]
                    };
                }
            }
        );

        assert.deepEqual(calls.fetchSelectedFrames, [{
            hostFacade: bridge,
            bridge
        }]);
        assert.deepEqual(calls.runInjectSchemaDocument, [{
            frames,
            targetType: 'le'
        }]);
        assert.deepEqual(calls.applySelectionPlans, [{
            hostFacade: bridge,
            bridge,
            plans: [{ id: 'f1', plan: { mode: 'ATOMIC' } }]
        }]);
        assert.deepEqual(result, {
            success: true,
            changes: [{ id: 'f1', plan: { mode: 'ATOMIC' } }],
            orphans: [{ id: 'f2' }],
            missedRequired: ['date.le'],
            hasChanges: true,
            hasOrphans: true,
            count: 1,
            affected: [{ id: 'f1' }]
        });
    });

    it('returns selection failures without trying to compute inject changes', async () => {
        const calls = {
            runInjectSchemaDocument: 0,
            applySelectionPlans: 0
        };

        const result = await runInjectSchemaService(
            { bridge: {}, targetType: 'tiec' },
            {
                fetchSelectedFrames: async () => ({
                    success: false,
                    reason: 'READ_FAILED',
                    error: 'Bridge offline'
                }),
                runInjectSchemaDocument: () => {
                    calls.runInjectSchemaDocument += 1;
                },
                applySelectionPlans: async () => {
                    calls.applySelectionPlans += 1;
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            reason: 'READ_FAILED',
            error: 'Bridge offline'
        });
        assert.equal(calls.runInjectSchemaDocument, 0);
        assert.equal(calls.applySelectionPlans, 0);
    });

    it('returns a clear no-op result when there are no changes and no orphans', async () => {
        const result = await runInjectSchemaService(
            { bridge: {}, targetType: 'tiec' },
            {
                fetchSelectedFrames: async () => ({
                    success: true,
                    frames: [{ id: 'f1' }]
                }),
                runInjectSchemaDocument: () => ({
                    changes: [],
                    orphans: [],
                    missedRequired: []
                }),
                applySelectionPlans: async () => {
                    throw new Error('applySelectionPlans should not run for a no-op result');
                }
            }
        );

        assert.deepEqual(result, {
            success: true,
            changes: [],
            orphans: [],
            missedRequired: [],
            hasChanges: false,
            hasOrphans: false,
            count: 0,
            affected: []
        });
    });

    it('returns a structured apply failure when writing plans fails', async () => {
        const result = await runInjectSchemaService(
            { bridge: {}, targetType: 'tiec' },
            {
                fetchSelectedFrames: async () => ({
                    success: true,
                    frames: [{ id: 'f1' }]
                }),
                runInjectSchemaDocument: () => ({
                    changes: [{ id: 'f1', plan: { mode: 'ATOMIC' } }],
                    orphans: [],
                    missedRequired: ['date.tiec']
                }),
                applySelectionPlans: async () => ({
                    success: false,
                    error: 'Apply failed'
                })
            }
        );

        assert.deepEqual(result, {
            success: false,
            reason: 'APPLY_FAILED',
            error: 'Apply failed'
        });
    });
});
