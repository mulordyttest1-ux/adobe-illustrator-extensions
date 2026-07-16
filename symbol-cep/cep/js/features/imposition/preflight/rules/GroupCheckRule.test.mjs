import test from 'node:test';
import assert from 'node:assert/strict';

import { UIFeedback } from '@shared/cep-ui';
import { impositionCopy } from '../../imposition_copy.js';
import { GroupCheckRule } from './GroupCheckRule.js';

if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
}

if (!globalThis.window) {
    globalThis.window = {};
}

if (typeof globalThis.window.btoa !== 'function') {
    globalThis.window.btoa = (value) => Buffer.from(value, 'utf8').toString('base64');
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

test('GroupCheckRule shows a readable toast when the group-check bridge eval fails', async () => {
    await captureToasts(async (calls) => {
        const isSafe = await GroupCheckRule.run({
            bridge: {
                async eval() {
                    return 'EvalScript error: missing dialog bridge';
                }
            }
        }, {});

        assert.equal(isSafe, false);
        assert.deepEqual(calls, [{
            message: impositionCopy.preflight.groupCheck.checkUnavailable,
            tone: 'error'
        }]);
    });
});

test('GroupCheckRule shows a readable toast when the group-check payload cannot be parsed', async () => {
    await captureToasts(async (calls) => {
        const isSafe = await GroupCheckRule.run({
            bridge: {
                async eval() {
                    return 'not-base64';
                }
            }
        }, {});

        assert.equal(isSafe, false);
        assert.deepEqual(calls, [{
            message: impositionCopy.preflight.groupCheck.checkUnavailable,
            tone: 'error'
        }]);
    });
});
