import test from 'node:test';
import assert from 'node:assert/strict';

import { UIFeedback } from '@shared/cep-ui';
import { impositionCopy } from '../../imposition_copy.js';
import { GarbageRule } from './GarbageRule.js';

function encodeResponse(payload) {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

async function captureToasts(runTest) {
    const originalShowToast = UIFeedback.showToast;
    const calls = [];
    UIFeedback.showToast = (message, tone) => {
        calls.push({ message, tone });
    };

    try {
        await runTest(calls);
    } finally {
        UIFeedback.showToast = originalShowToast;
    }
}

test('GarbageRule shows a readable toast when the garbage check bridge eval fails', async () => {
    await captureToasts(async (calls) => {
        const isSafe = await GarbageRule.run({
            bridge: {
                async eval() {
                    return 'EvalScript error: missing bridge endpoint';
                }
            }
        }, {});

        assert.equal(isSafe, false);
        assert.deepEqual(calls, [{
            message: impositionCopy.preflight.garbage.checkUnavailable,
            tone: 'error'
        }]);
    });
});

test('GarbageRule shows a readable toast when the garbage clear payload cannot be parsed', async () => {
    await captureToasts(async (calls) => {
        const isSafe = await GarbageRule.run({
            bridge: {
                async eval(script) {
                    if (script.indexOf('checkArtboardGarbage') !== -1) {
                        return encodeResponse({ success: true, hasGarbage: true, count: 2 });
                    }
                    if (script.indexOf('confirm(') !== -1) {
                        return 'true';
                    }
                    if (script.indexOf('clearArtboardGarbage') !== -1) {
                        return 'not-base64';
                    }
                    throw new Error(`Unexpected script: ${script}`);
                }
            }
        }, {});

        assert.equal(isSafe, false);
        assert.deepEqual(calls, [{
            message: impositionCopy.preflight.garbage.clearUnavailable,
            tone: 'error'
        }]);
    });
});
