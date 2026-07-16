import test from 'node:test';
import assert from 'node:assert/strict';

import { PostflightOrchestrator, normalizeResultData } from './PostflightOrchestrator.js';

test('normalizeResultData hydrates width and height from legacy finishSize keys', () => {
    const normalized = normalizeResultData({
        itemsProcessed: 5,
        finishSize: { w: 210, h: 297 }
    });

    assert.equal(normalized.finishSize.width, 210);
    assert.equal(normalized.finishSize.height, 297);
});

test('registerRule rejects plugins without a run method', () => {
    const orchestrator = new PostflightOrchestrator();

    assert.throws(
        () => orchestrator.registerRule({}),
        /run\(\) method/
    );
});

test('runAll returns a postflight summary and keeps running after failures', async () => {
    const orchestrator = new PostflightOrchestrator();
    const seenWidths = [];

    orchestrator.registerRule({
        name: 'SuccessRule',
        async run(context) {
            seenWidths.push(context.resultData.finishSize.width);
            return { status: 'success' };
        }
    });
    orchestrator.registerRule({
        name: 'SkipRule',
        async run() {
            return { status: 'skipped', reason: 'not_enabled' };
        }
    });
    orchestrator.registerRule({
        name: 'FailRule',
        async run() {
            throw new Error('boom');
        }
    });
    orchestrator.registerRule({
        name: 'AfterFailureRule',
        async run() {
            return { status: 'success' };
        }
    });

    const summary = await orchestrator.runAll({
        resultData: { finishSize: { w: 100, h: 200 } }
    });

    assert.deepEqual(seenWidths, [100]);
    assert.equal(summary.successCount, 2);
    assert.equal(summary.skippedCount, 1);
    assert.equal(summary.failedCount, 1);
    assert.equal(summary.results.length, 4);
    assert.deepEqual(
        summary.results.map((item) => item.rule),
        ['SuccessRule', 'SkipRule', 'FailRule', 'AfterFailureRule']
    );
    assert.equal(summary.results[1].status, 'skipped');
    assert.equal(summary.results[2].status, 'failed');
    assert.equal(summary.results[2].error, 'boom');
});
