import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    createApplyFailureResult,
    createApplySuccessResult,
    createFrameCollectFailureResult,
    createNoFramesResult,
    createNoPlansResult
} from './strategyUpdateSupport.js';

describe('strategyUpdateSupport', () => {
    it('creates stable no-op and failure results for document sync update flow', () => {
        assert.deepEqual(createFrameCollectFailureResult(), {
            success: false,
            error: 'Collect failed'
        });
        assert.deepEqual(createNoFramesResult([]), {
            success: true,
            updated: 0,
            affected: [],
            message: 'No frames found',
            templateBindings: []
        });
        assert.equal(createNoFramesResult([{ id: 'frame-1' }]), null);
        assert.deepEqual(createNoPlansResult([], ['info.ten_le']), {
            success: true,
            updated: 0,
            affected: [],
            message: 'No changes needed',
            templateBindings: ['info.ten_le']
        });
        assert.equal(createNoPlansResult([{ id: 'frame-1', plan: { mode: 'REPLACE' } }], ['info.ten_le']), null);
        assert.deepEqual(createApplyFailureResult({ error: 'Apply failed hard' }), {
            success: false,
            error: 'Apply failed hard'
        });
        assert.deepEqual(createApplySuccessResult({
            updated: 2,
            affected: [{ id: 'frame-1' }],
            message: 'Applied'
        }, ['info.ten_le']), {
            success: true,
            updated: 2,
            affected: [{ id: 'frame-1' }],
            message: 'Applied',
            templateBindings: ['info.ten_le']
        });
    });
});
