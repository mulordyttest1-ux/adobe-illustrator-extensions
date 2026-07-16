import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Bridge } from './bridge.js';

function encodeBase64(value) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return Buffer.from(text, 'utf8').toString('base64');
}

function createAtob() {
    return (base64Str) => Buffer.from(base64Str, 'base64').toString('binary');
}

function createHost(overrides = {}) {
    const calls = [];
    const host = {
        isConnected: () => overrides.isConnected ?? true,
        evalScript: async (script) => {
            calls.push(script);
            if (typeof overrides.evalScript === 'function') {
                return overrides.evalScript(script);
            }
            return encodeBase64({ success: true });
        }
    };

    return { host, calls };
}

function createBridge(overrides = {}) {
    const { host, calls } = createHost(overrides);
    const consoleCalls = {
        log: [],
        error: []
    };
    const bridge = new Bridge({
        host,
        atob: overrides.atob || createAtob(),
        TextDecoder: overrides.TextDecoder || TextDecoder,
        console: overrides.console || {
            log: (...args) => consoleCalls.log.push(args),
            error: (...args) => consoleCalls.error.push(args)
        }
    });

    return { bridge, host, calls, consoleCalls };
}

describe('Bridge', () => {
    it('decodes base64 payloads and returns a structured error when decoding fails', () => {
        const successHarness = createBridge();
        const successPayload = successHarness.bridge._decodeResult(encodeBase64({ success: true, value: 1 }));
        assert.deepEqual(successPayload, { success: true, value: 1 });

        const failureHarness = createBridge({
            atob: () => {
                throw new Error('bad base64');
            }
        });
        const failurePayload = failureHarness.bridge._decodeResult('invalid');
        assert.deepEqual(failurePayload, {
            success: false,
            error: 'Decode failed: bad base64'
        });
    });

    it('returns true for a successful ping call', async () => {
        const { bridge, calls } = createBridge({
            evalScript: async () => encodeBase64({ message: 'Pong' })
        });

        const result = await bridge.call('ping');

        assert.equal(result, true);
        assert.deepEqual(calls, ['IllustratorBridge.ping()']);
    });

    it('escapes payloads correctly when building ExtendScript calls', async () => {
        const { bridge, calls } = createBridge();

        await bridge.call('updateCard', {
            text: `O'Hara \\\\ "quote"`
        });

        assert.equal(calls.length, 1);
        assert.match(calls[0], /IllustratorBridge\.updateCard\('/);
        assert.match(calls[0], /O\\'Hara/);
        assert.match(calls[0], /\\\\/);
        assert.match(calls[0], /quote/);
    });

    it('sanitizes frame data when scanning or collecting frames', async () => {
        const frameFactory = () => ({
            id: 'frame-1',
            text: 'A\u200BB',
            contents: 'C\u200BD',
            raw_content: 'E\u200BF',
            meta_keys: []
        });
        const { bridge, calls } = createBridge({
            evalScript: async (script) => {
                if (script.includes('scanWithMetadata')) {
                    return encodeBase64({ success: true, data: [frameFactory()] });
                }
                if (script.includes('collectFrames')) {
                    return encodeBase64({ success: true, data: [frameFactory()] });
                }
                return encodeBase64({ success: true });
            }
        });

        const scanResult = await bridge.scanDocument();
        const collectResult = await bridge.collectFrames();

        assert.equal(calls.length, 2);
        assert.equal(scanResult.data[0].text, 'AB');
        assert.equal(scanResult.data[0].contents, 'CD');
        assert.equal(scanResult.data[0].raw_content, 'E\u200BF');
        assert.ok(Array.isArray(scanResult.data[0]._cleanMap));
        assert.equal(collectResult.data[0].text, 'AB');
        assert.equal(collectResult.data[0].contents, 'CD');
    });

    it('maps host errors into a structured failure result', async () => {
        const { bridge } = createBridge({
            evalScript: async () => {
                throw new Error('ExtendScript blew up');
            }
        });

        const result = await bridge.call('updateCard', { ok: true });

        assert.deepEqual(result, {
            success: false,
            error: 'ExtendScript blew up'
        });
    });

    it('wraps selection requests in structured payloads', async () => {
        const { bridge, calls } = createBridge();

        await bridge.readSelectionObjects();
        await bridge.readSelectionObjects({ includeGeometry: true });
        await bridge.selectFramesById(['frame-1']);
        await bridge.selectFramesById({
            ids: ['frame-2'],
            source: 'live-selection'
        });

        assert.equal(calls.length, 4);
        assert.equal(calls[0], 'IllustratorBridge.readSelectionObjects()');
        assert.match(calls[1], /IllustratorBridge\.readSelectionObjects\('/);
        assert.match(calls[1], /includeGeometry/);
        assert.match(calls[2], /IllustratorBridge\.selectFramesById\('/);
        assert.match(calls[2], /frame-1/);
        assert.match(calls[3], /IllustratorBridge\.selectFramesById\('/);
        assert.match(calls[3], /frame-2/);
    });
});
