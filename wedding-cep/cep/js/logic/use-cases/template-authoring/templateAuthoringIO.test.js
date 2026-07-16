import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applySelectionPlans, fetchSelectedFrames } from './templateAuthoringIO.js';

describe('templateAuthoringIO', () => {
    it('returns normalized selected frames when bridge read succeeds', async () => {
        const result = await fetchSelectedFrames({
            bridge: {
                readSelectionObjects: async () => ({
                    success: true,
                    data: [{ id: 'f1' }]
                })
            }
        });

        assert.deepEqual(result, {
            success: true,
            frames: [{ id: 'f1' }]
        });
    });

    it('returns an apply failure when the bridge cannot write plans', async () => {
        const result = await applySelectionPlans({
            bridge: {
                applyPlan: async () => ({
                    success: false,
                    error: 'Bridge offline'
                })
            },
            plans: [{ id: 'f1' }]
        });

        assert.deepEqual(result, {
            success: false,
            error: 'Bridge offline'
        });
    });
});
