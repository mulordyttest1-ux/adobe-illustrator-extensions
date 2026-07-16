import test from 'node:test';
import assert from 'node:assert/strict';

import { Bridge } from './bridge.js';

function createBridgeWithResult(result) {
    const calls = [];
    const originalCsInterface = globalThis.CSInterface;

    globalThis.CSInterface = class {
        getSystemPath() {
            return 'C:/CEP Extension';
        }

        evalScript(script, callback) {
            calls.push(script);
            callback(result);
        }
    };

    try {
        return {
            bridge: new Bridge(),
            calls,
            restore() {
                globalThis.CSInterface = originalCsInterface;
            }
        };
    } catch (error) {
        globalThis.CSInterface = originalCsInterface;
        throw error;
    }
}

test('Bridge reloadHostScripts evaluates the live-linked host composition root', async () => {
    const fixture = createBridgeWithResult('undefined');

    try {
        await fixture.bridge.reloadHostScripts();
        assert.equal(fixture.calls.length, 1);
        assert.match(fixture.calls[0], /C:\/CEP Extension\/jsx\/host\.jsx/);
    } finally {
        fixture.restore();
    }
});

test('Bridge reloadHostScripts rejects numbered ExtendScript errors', async () => {
    const fixture = createBridgeWithResult('Error 2: host include failed');

    try {
        await assert.rejects(
            fixture.bridge.reloadHostScripts(),
            /Error 2: host include failed/
        );
    } finally {
        fixture.restore();
    }
});
