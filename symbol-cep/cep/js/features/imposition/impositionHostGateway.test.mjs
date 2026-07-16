import test from 'node:test';
import assert from 'node:assert/strict';

import { createImpositionHostGateway } from './impositionHostGateway.js';

test('createImpositionHostGateway dispatches saveActiveDocumentAfterImposition through Bridge namespace', async () => {
    const scripts = [];
    const gateway = createImpositionHostGateway({
        bridge: {
            eval(script) {
                scripts.push(script);
                return Promise.resolve('ok');
            }
        },
        csInterface: {
            evalScript(_script, callback) {
                callback('ok');
            }
        }
    });

    const result = await gateway.saveActiveDocumentAfterImposition('payload_base64');

    assert.equal(result, 'ok');
    assert.deepEqual(scripts, [
        '$.global.Bridge.saveActiveDocumentAfterImposition("payload_base64")'
    ]);
});

test('createImpositionHostGateway dispatches getActiveDocumentIdentity through Bridge namespace', async () => {
    const scripts = [];
    const gateway = createImpositionHostGateway({
        bridge: {
            eval(script) {
                scripts.push(script);
                return Promise.resolve('ok');
            }
        },
        csInterface: {
            evalScript(_script, callback) {
                callback('ok');
            }
        }
    });

    const result = await gateway.getActiveDocumentIdentity();

    assert.equal(result, 'ok');
    assert.deepEqual(scripts, [
        '$.global.Bridge.getActiveDocumentIdentity()'
    ]);
});
