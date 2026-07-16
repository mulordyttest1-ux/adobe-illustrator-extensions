import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolkitBridge, __private__ } from './bridge.js';

function encodeObject(value) {
    const json = JSON.stringify(value);
    return Buffer.from(json, 'utf8').toString('base64');
}

test('ToolkitBridge decodes ExtendScript base64 JSON payloads', () => {
    const bridge = new ToolkitBridge({
        host: { isConnected: () => true, evalScript: async () => '' },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    const result = bridge.decodeResult(encodeObject({
        success: true,
        message: 'ok',
        data: { value: 1 }
    }));

    assert.deepEqual(result, {
        success: true,
        message: 'ok',
        data: { value: 1 }
    });
});

test('ToolkitBridge returns a normalized empty response when the host returns nothing', () => {
    const bridge = new ToolkitBridge({
        host: { isConnected: () => true, evalScript: async () => '' },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    assert.deepEqual(bridge.decodeResult(''), {
        success: false,
        message: 'Empty host response',
        errorCode: 'EMPTY_HOST_RESPONSE',
        data: null
    });
});

test('ToolkitBridge.inspectRuntime surfaces raw non-base64 host errors without throwing atob failures', async () => {
    const bridge = new ToolkitBridge({
        host: {
            isConnected: () => true,
            async evalScript() {
                return 'Toolkit host entry missing: C:/toolkit-wrapper/app/jsx/host.jsx';
            }
        },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    const result = await bridge.inspectRuntime();

    assert.deepEqual(result, {
        success: false,
        message: 'Toolkit host entry missing: C:/toolkit-wrapper/app/jsx/host.jsx',
        errorCode: 'TOOLKIT_HOST_RAW_RESPONSE',
        data: null
    });
});

test('ToolkitBridge returns a normalized malformed response when decoded payload is not JSON', async () => {
    const bridge = new ToolkitBridge({
        host: {
            isConnected: () => true,
            async evalScript() {
                return Buffer.from('not json', 'utf8').toString('base64');
            }
        },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    const result = await bridge.inspectRuntime();

    assert.deepEqual(result, {
        success: false,
        message: 'not json',
        errorCode: 'TOOLKIT_HOST_MALFORMED_RESPONSE',
        data: null
    });
});

test('ToolkitBridge wraps host calls with a bootstrap fallback when ToolkitBridge is missing', async () => {
    let receivedScript = '';
    const bridge = new ToolkitBridge({
        host: {
            isConnected: () => true,
            getExtensionRootPath: () => 'C:/toolkit-wrapper',
            async evalScript(script) {
                receivedScript = script;
                return encodeObject({
                    success: true,
                    message: 'ok',
                    errorCode: null,
                    data: {
                        loadedAtMs: 10,
                        loadedModules: [],
                        quarantinedModules: []
                    }
                });
            }
        },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    await bridge.inspectRuntime();

    assert.match(receivedScript, /typeof ToolkitBridge !== "undefined"/);
    assert.match(receivedScript, /extensionRoot \+ "\/app\/jsx"/);
    assert.match(receivedScript, /ToolkitHostRuntime\.reload\(""\)/);
});

test('resolveExtensionRootPath trims trailing separators and tolerates missing host support', () => {
    assert.equal(
        __private__.resolveExtensionRootPath({
            getExtensionRootPath() {
                return 'C:/toolkit-wrapper/';
            }
        }),
        'C:/toolkit-wrapper'
    );

    assert.equal(__private__.resolveExtensionRootPath({}), '');
});

test('ToolkitBridge returns a normalized error when CEP is disconnected', async () => {
    const bridge = new ToolkitBridge({
        host: { isConnected: () => false, evalScript: async () => '' },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    const result = await bridge.runCommand({ id: 'test_probe_command', payload: {} });

    assert.deepEqual(result, {
        success: false,
        message: 'CEP not connected',
        errorCode: 'CEP_NOT_CONNECTED',
        data: null
    });
});

test('ToolkitBridge.inspectRuntime decodes normalized runtime payloads', async () => {
    const bridge = new ToolkitBridge({
        host: {
            isConnected: () => true,
            async evalScript() {
                return encodeObject({
                    success: true,
                    message: 'ok',
                    errorCode: null,
                    data: {
                        loadedAtMs: 10,
                        loadedModules: [{ id: 'test_probe_command' }],
                        quarantinedModules: []
                    }
                });
            }
        },
        atob: (value) => Buffer.from(value, 'base64').toString('binary'),
        TextDecoder
    });

    const result = await bridge.inspectRuntime();

    assert.deepEqual(result, {
        success: true,
        message: 'ok',
        errorCode: null,
        data: {
            loadedAtMs: 10,
            loadedModules: [{ id: 'test_probe_command' }],
            quarantinedModules: []
        }
    });
});
