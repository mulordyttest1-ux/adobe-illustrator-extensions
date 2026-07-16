import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runManualInjectService } from './manualInjectService.js';

describe('runManualInjectService', () => {
    it('runs the single inject path through selection read, plan build, and apply', async () => {
        const calls = {
            fetchSelectedFrames: [],
            buildSingleInjectionPlans: [],
            applySelectionPlans: []
        };
        const bridge = { id: 'bridge' };
        const frames = [{ id: 'f1' }, { id: 'f2' }];

        const result = await runManualInjectService(
            { bridge, mode: 'single', schemaValue: '{pos1.ong}' },
            {
                fetchSelectedFrames: async (input) => {
                    calls.fetchSelectedFrames.push(input);
                    return { success: true, frames };
                },
                buildSingleInjectionPlans: (input) => {
                    calls.buildSingleInjectionPlans.push(input);
                    return {
                        success: true,
                        plans: frames.map((frame) => ({
                            id: frame.id,
                            plan: { mode: 'DIRECT', content: input.schemaValue }
                        }))
                    };
                },
                applySelectionPlans: async (input) => {
                    calls.applySelectionPlans.push(input);
                    return {
                        success: true,
                        affected: [{ id: 'f1' }, { id: 'f2' }]
                    };
                }
            }
        );

        assert.deepEqual(calls.fetchSelectedFrames, [{
            hostFacade: bridge,
            bridge
        }]);
        assert.deepEqual(calls.buildSingleInjectionPlans, [{
            frames,
            schemaValue: '{pos1.ong}'
        }]);
        assert.deepEqual(calls.applySelectionPlans, [{
            hostFacade: bridge,
            bridge,
            plans: [
                { id: 'f1', plan: { mode: 'DIRECT', content: '{pos1.ong}' } },
                { id: 'f2', plan: { mode: 'DIRECT', content: '{pos1.ong}' } }
            ]
        }]);
        assert.deepEqual(result, {
            success: true,
            count: 2,
            affected: [{ id: 'f1' }, { id: 'f2' }],
            keys: [],
            affectedCount: 2
        });
    });

    it('returns selection failures without trying to build or apply plans', async () => {
        const calls = {
            buildSingleInjectionPlans: 0,
            applySelectionPlans: 0
        };

        const result = await runManualInjectService(
            { bridge: {}, mode: 'single', schemaValue: '{pos1.ong}' },
            {
                fetchSelectedFrames: async () => ({
                    success: false,
                    reason: 'READ_FAILED',
                    error: 'Bridge offline'
                }),
                buildSingleInjectionPlans: () => {
                    calls.buildSingleInjectionPlans += 1;
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
        assert.equal(calls.buildSingleInjectionPlans, 0);
        assert.equal(calls.applySelectionPlans, 0);
    });

    it('returns planner failures with their reason and frame count', async () => {
        const result = await runManualInjectService(
            { bridge: {}, mode: 'bulk', prefix: 'pos1' },
            {
                fetchSelectedFrames: async () => ({
                    success: true,
                    frames: [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
                }),
                buildBulkInjectionPlans: () => ({
                    success: false,
                    reason: 'INVALID_FRAME_COUNT',
                    frameCount: 3
                })
            }
        );

        assert.deepEqual(result, {
            success: false,
            reason: 'INVALID_FRAME_COUNT',
            frameCount: 3
        });
    });

    it('returns structured apply failures', async () => {
        const result = await runManualInjectService(
            { bridge: {}, mode: 'compound', schemaValue: '{a}|{b}' },
            {
                fetchSelectedFrames: async () => ({
                    success: true,
                    frames: [{ id: 'f1' }]
                }),
                buildCompoundInjectionPlans: () => ({
                    success: true,
                    plans: [{ id: 'f1', plan: { mode: 'DIRECT', content: '{a} {b}' } }],
                    keys: ['a', 'b']
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
