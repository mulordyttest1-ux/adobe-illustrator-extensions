import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runApplyStrategyUpdate } from './applyStrategyUpdate.js';

describe('runApplyStrategyUpdate', () => {
    it('requires the canonical hostFacade input', async () => {
        await assert.rejects(
            () => runApplyStrategyUpdate({ bridge: {} }),
            { message: 'runApplyStrategyUpdate requires a hostFacade' }
        );
    });

    it('returns a structured error when collecting frames fails', async () => {
        const result = await runApplyStrategyUpdate(
            {
                hostFacade: {}
            },
            {
                collectFrames: async () => ({ success: false, error: 'Collect failed hard' })
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'Collect failed hard'
        });
    });

    it('returns a no-op success when there are no frames', async () => {
        const result = await runApplyStrategyUpdate(
            {
                hostFacade: {}
            },
            {
                collectFrames: async () => ({ success: true, data: [] })
            }
        );

        assert.deepEqual(result, {
            success: true,
            updated: 0,
            affected: [],
            message: 'No frames found',
            templateBindings: []
        });
    });

    it('returns a no-op success when every analyzed plan is SKIP', async () => {
        const planCalls = [];
        const result = await runApplyStrategyUpdate(
            {
                hostFacade: {}
            },
            {
                collectFrames: async () => ({
                    success: true,
                    data: [{ id: 'f1', raw_content: '{info.ten_le}', meta_keys: [] }]
                }),
                createOrchestrator: () => ({
                    planFrames: (frames, packet) => {
                        planCalls.push({ frames, packet });
                        return [];
                    }
                })
            }
        );

        assert.deepEqual(planCalls, [{
            frames: [{ id: 'f1', raw_content: '{info.ten_le}', meta_keys: [] }],
            packet: undefined
        }]);
        assert.deepEqual(result, {
            success: true,
            updated: 0,
            affected: [],
            message: 'No changes needed',
            templateBindings: ['info.ten_le']
        });
    });

    it('applies strategy plans and returns the bridge result shape with template bindings from source frames', async () => {
        const applyCalls = [];
        const planCalls = [];
        const bridge = { id: 'bridge-1' };

        const result = await runApplyStrategyUpdate(
            {
                hostFacade: bridge,
                packet: { ready: true }
            },
            {
                collectFrames: async () => ({
                    success: true,
                    data: [
                        {
                            id: 'f1',
                            raw_content: 'text one',
                            meta_keys: ['pos1.ong']
                        },
                        {
                            id: 'f2',
                            raw_content: 'Ngay vui {date.tiec.ngay}',
                            meta_keys: []
                        }
                    ]
                }),
                createOrchestrator: () => ({
                    planFrames: (frames, packet) => {
                        planCalls.push({ frames, packet });
                        return [{
                            id: 'f1',
                            plan: {
                                mode: 'REPLACE',
                                metadata: {
                                    type: 'stateful',
                                    keys: ['pos1.ong'],
                                    mappings: []
                                },
                                packet
                            }
                        }];
                    }
                }),
                applyPlan: async (inputBridge, plans) => {
                    applyCalls.push({ bridge: inputBridge, plans });
                    return {
                        success: true,
                        updated: 1,
                        affected: [{ id: 'f1' }],
                        message: 'Applied'
                    };
                }
            }
        );

        assert.deepEqual(planCalls, [{
            frames: [
                {
                    id: 'f1',
                    raw_content: 'text one',
                    meta_keys: ['pos1.ong']
                },
                {
                    id: 'f2',
                    raw_content: 'Ngay vui {date.tiec.ngay}',
                    meta_keys: []
                }
            ],
            packet: { ready: true }
        }]);
        assert.deepEqual(applyCalls, [{
            bridge,
            plans: [{
                id: 'f1',
                plan: {
                    mode: 'REPLACE',
                    metadata: {
                        type: 'stateful',
                        keys: ['pos1.ong'],
                        mappings: []
                    },
                    packet: { ready: true }
                }
            }]
        }]);
        assert.deepEqual(result, {
            success: true,
            updated: 1,
            affected: [{ id: 'f1' }],
            message: 'Applied',
            templateBindings: ['date.tiec.ngay', 'pos1.ong']
        });
    });
});
