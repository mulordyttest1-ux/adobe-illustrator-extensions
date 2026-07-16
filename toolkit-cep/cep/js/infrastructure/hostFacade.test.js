import test from 'node:test';
import assert from 'node:assert/strict';
import { createHostFacade, __private__ } from './hostFacade.js';

test('createHostFacade exposes a first-class hostRuntime reload seam', async () => {
    const evalCalls = [];
    let rootPathReads = 0;
    globalThis.require = (moduleId) => {
        if (moduleId === 'fs') {
            return {
                existsSync(targetPath) {
                    return targetPath === 'C:/toolkit-wrapper/app/jsx/host.jsx';
                }
            };
        }

        throw new Error(`Unexpected module: ${moduleId}`);
    };

    const { hostRuntime } = createHostFacade({
        rawHost: {
            isConnected() {
                return true;
            },
            async evalScript(script) {
                evalCalls.push(script);
                return 'TOOLKIT_HOST_RUNTIME_LOADED';
            },
            getExtensionRootPath() {
                rootPathReads += 1;
                return 'C:/toolkit-wrapper';
            },
            async runNodeScript() {
                return { code: 0 };
            }
        },
        bridge: {
            async inspectRuntime() {
                return {
                    success: true,
                    data: {
                        loadedAtMs: 100,
                        loadedModules: [{ id: 'test_probe_command' }],
                        quarantinedModules: [],
                        moduleCount: 1,
                        quarantinedCount: 0
                    }
                };
            }
        }
    });

    const result = await hostRuntime.reload({
        registryFilePath: 'C:/tmp/custom_registry.jsx'
    });

    assert.equal(result, 'TOOLKIT_HOST_RUNTIME_LOADED');
    assert.equal(rootPathReads, 1);
    assert.equal(evalCalls.length, 1);
    assert.match(evalCalls[0], /jsxRootPath = 'C:\/toolkit-wrapper\/app\/jsx'/);
    assert.match(evalCalls[0], /ToolkitHostRuntime\.reload\(payloadJson\)/);
    assert.match(evalCalls[0], /custom_registry\.jsx/);
    delete globalThis.require;
});

test('hostRuntime.reload fails when host entry is missing or runtime reload does not succeed', async () => {
    globalThis.require = (moduleId) => {
        if (moduleId === 'fs') {
            return {
                existsSync() {
                    return false;
                }
            };
        }

        throw new Error(`Unexpected module: ${moduleId}`);
    };

    const { hostRuntime } = createHostFacade({
        rawHost: {
            isConnected() {
                return true;
            },
            async evalScript() {
                return 'Toolkit host entry missing: C:/toolkit-cep/cep/jsx/host.jsx';
            },
            getExtensionRootPath() {
                return 'C:/toolkit-cep/cep';
            },
            async runNodeScript() {
                return { code: 0 };
            }
        },
        bridge: {
            async inspectRuntime() {
                return {
                    success: true,
                    data: {}
                };
            }
        }
    });

    await assert.rejects(
        () => hostRuntime.reload(),
        /Toolkit host entry missing/
    );

    delete globalThis.require;
});

test('hostRuntime.inspect normalizes runtime health payloads', async () => {
    const { hostRuntime } = createHostFacade({
        rawHost: {
            isConnected() {
                return true;
            },
            async evalScript() {
                return 'TOOLKIT_HOST_RUNTIME_LOADED';
            },
            getExtensionRootPath() {
                return 'C:/toolkit-cep/cep';
            },
            async runNodeScript() {
                return { code: 0 };
            }
        },
        bridge: {
            async inspectRuntime() {
                return {
                    success: true,
                    data: {
                        loadedAtMs: '42',
                        loadedModules: [{ id: 'test_probe_command' }, { id: '' }],
                        quarantinedModules: [{ id: 'broken', reason: 'Syntax error' }],
                        moduleCount: '2',
                        quarantinedCount: '1'
                    }
                };
            }
        }
    });

    const meta = await hostRuntime.inspect();

    assert.deepEqual(meta, {
        loadedAtMs: 42,
        loadedModules: [{ id: 'test_probe_command' }],
        quarantinedModules: [{ id: 'broken', reason: 'Syntax error' }],
        moduleCount: 2,
        quarantinedCount: 1
    });
});

test('hostRuntime.inspect surfaces normalized raw host failures from the bridge', async () => {
    const { hostRuntime } = createHostFacade({
        rawHost: {
            isConnected() {
                return true;
            },
            async evalScript() {
                return 'TOOLKIT_HOST_RUNTIME_LOADED';
            },
            getExtensionRootPath() {
                return 'C:/toolkit-cep/cep';
            },
            async runNodeScript() {
                return { code: 0 };
            }
        },
        bridge: {
            async inspectRuntime() {
                return {
                    success: false,
                    message: 'Toolkit host entry missing: C:/toolkit-wrapper/app/jsx/host.jsx',
                    errorCode: 'TOOLKIT_HOST_RAW_RESPONSE',
                    data: null
                };
            }
        }
    });

    await assert.rejects(
        () => hostRuntime.inspect(),
        /Toolkit host entry missing: C:\/toolkit-wrapper\/app\/jsx\/host\.jsx/
    );
});

test('buildHostRuntimeReloadScript includes host entry bootstrap and runtime reload call', () => {
    const script = __private__.buildHostRuntimeReloadScript('C:/toolkit-cep/cep/jsx', {
        registryFilePath: 'C:/tmp/registry.jsx'
    });

    assert.match(script, /\$\.evalFile\(hostEntryFile\)/);
    assert.match(script, /ToolkitHostRuntime\.reload\(payloadJson\)/);
    assert.match(script, /registry\.jsx/);
});

test('resolveJsxRootPath prefers the wrapper app jsx path when present', () => {
    globalThis.require = (moduleId) => {
        if (moduleId === 'fs') {
            return {
                existsSync(targetPath) {
                    return targetPath === 'C:/toolkit-wrapper/app/jsx/host.jsx';
                }
            };
        }

        throw new Error(`Unexpected module: ${moduleId}`);
    };

    assert.equal(
        __private__.resolveJsxRootPath('C:/toolkit-wrapper'),
        'C:/toolkit-wrapper/app/jsx'
    );

    delete globalThis.require;
});

test('resolveJsxRootPath falls back to the legacy jsx root when no wrapper app exists', () => {
    globalThis.require = (moduleId) => {
        if (moduleId === 'fs') {
            return {
                existsSync() {
                    return false;
                }
            };
        }

        throw new Error(`Unexpected module: ${moduleId}`);
    };

    assert.equal(
        __private__.resolveJsxRootPath('C:/toolkit-cep/cep'),
        'C:/toolkit-cep/cep/jsx'
    );

    delete globalThis.require;
});

test('resolvePanelMode treats the dev wrapper extension id as dev mode', () => {
    assert.equal(
        __private__.resolvePanelMode({
            getExtensionId() {
                return 'com.dinhson.toolkit.panel.dev';
            }
        }),
        'dev'
    );
});

test('resolvePanelMode defaults to work for the main toolkit wrapper', () => {
    assert.equal(
        __private__.resolvePanelMode({
            getExtensionId() {
                return 'com.dinhson.toolkit.panel';
            }
        }),
        'work'
    );
});
