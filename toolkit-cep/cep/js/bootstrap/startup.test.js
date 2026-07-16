import test from 'node:test';
import assert from 'node:assert/strict';
import { initToolkitApp } from './startup.js';

function createDocumentStub() {
    const elements = {
        'loading-overlay': {
            hidden: false,
            setAttribute(name, value) {
                this[name] = value;
            }
        },
        'toolkit-execution-summary': {
            innerHTML: '',
            textContent: ''
        }
    };

    return {
        readyState: 'complete',
        activeElement: null,
        addEventListener() { },
        getElementById(id) {
            return elements[id] || null;
        }
    };
}

function createFeedbackStub() {
    return {
        hidden: false,
        errors: [],
        hideLoading() {
            this.hidden = true;
        },
        showError(container, message) {
            this.errors.push({ container, message });
        },
        showToast() { }
    };
}

test('initToolkitApp reaches ready after host runtime inspect completes without proactive reload', async () => {
    const calls = [];
    const documentRef = createDocumentStub();
    const windowRef = {
        location: {
            reload() {
                calls.push('windowReload');
            }
        }
    };
    const feedback = createFeedbackStub();
    const runtimeState = {
        ready: false,
        shell: null,
        catalog: null,
        hostRuntime: null,
        services: null,
        lastResult: null,
        error: null
    };
    const catalog = {
        modules: [{ id: 'alpha_command', enabled: true }],
        enabledCount: 1,
        quarantinedCount: 0
    };
    const shell = {
        elements: {
            searchInput: { id: 'toolkit-search' }
        },
        renderInitial() {
            calls.push('renderInitial');
        },
        focusSearch() {
            documentRef.activeElement = this.elements.searchInput;
            calls.push('focusSearch');
        },
        updateCatalog() {
            calls.push('updateCatalog');
        }
    };

    await initToolkitApp({
        hostFacade: {},
        hostRuntime: {
            async reload() {
                throw new Error('reload should not run during startup');
            },
            async inspect() {
                calls.push('inspect');
                assert.equal(windowRef.__TOOLKIT_APP_READY__.phase, 'inspecting-host-runtime');
                return {
                    loadedAtMs: 100,
                    loadedModules: [{ id: 'alpha_command' }],
                    quarantinedModules: [],
                    moduleCount: 1,
                    quarantinedCount: 0
                };
            }
        },
        debugHost: {},
        runtimeState,
        documentRef,
        windowRef,
        UIFeedbackRef: feedback,
        loadCatalog(hostRuntimeMeta) {
            calls.push({ type: 'loadCatalog', hostRuntimeMeta });
            return catalog;
        },
        createCommandRunnerFn() {
            return {};
        },
        createToolkitShellFn(options) {
            calls.push({ type: 'createShell', catalog: options.catalog });
            return shell;
        }
    });

    assert.deepEqual(calls, [
        'inspect',
        {
            type: 'loadCatalog',
            hostRuntimeMeta: {
                loadedAtMs: 100,
                loadedModules: [{ id: 'alpha_command' }],
                quarantinedModules: [],
                moduleCount: 1,
                quarantinedCount: 0
            }
        },
        {
            type: 'createShell',
            catalog
        },
        'renderInitial',
        'focusSearch'
    ]);
    assert.equal(runtimeState.ready, true);
    assert.equal(runtimeState.catalog, catalog);
    assert.equal(runtimeState.hostRuntime.moduleCount, 1);
    assert.equal(typeof runtimeState.services.inspectAndSyncHostRuntime, 'function');
    assert.equal(typeof runtimeState.services.reloadAndSyncHostRuntime, 'function');
    assert.equal(typeof runtimeState.services.reloadPanel, 'function');
    assert.equal(windowRef.__TOOLKIT_APP_READY__.status, 'ready');
    assert.equal(windowRef.__TOOLKIT_APP_READY__.phase, 'ready');
    assert.equal(windowRef.__TOOLKIT_APP_READY__.hostRuntimeReady, true);
    assert.equal(windowRef.__TOOLKIT_APP_READY__.hostRuntimeHealthy, true);
    assert.equal(windowRef.__TOOLKIT_APP_READY__.searchFocused, true);
    assert.equal(feedback.hidden, true);
});

test('initToolkitApp surfaces raw host startup failures in ready state and feedback', async () => {
    const documentRef = createDocumentStub();
    const windowRef = {};
    const feedback = createFeedbackStub();
    const runtimeState = {
        ready: false,
        shell: null,
        catalog: null,
        hostRuntime: null,
        services: null,
        lastResult: null,
        error: null
    };

    await initToolkitApp({
        hostFacade: {},
        hostRuntime: {
            async reload() {
                throw new Error('reload should not run during startup');
            },
            async inspect() {
                throw new Error('Toolkit host entry missing: C:/toolkit-wrapper/app/jsx/host.jsx');
            }
        },
        debugHost: {},
        runtimeState,
        documentRef,
        windowRef,
        UIFeedbackRef: feedback,
        loadCatalog() {
            return {
                modules: [],
                enabledCount: 0,
                quarantinedCount: 0
            };
        },
        createCommandRunnerFn() {
            return {};
        },
        createToolkitShellFn() {
            throw new Error('should not create shell');
        }
    });

    assert.equal(runtimeState.ready, false);
    assert.match(runtimeState.error.message, /Toolkit host entry missing: C:\/toolkit-wrapper\/app\/jsx\/host\.jsx/);
    assert.equal(windowRef.__TOOLKIT_APP_READY__.status, 'error');
    assert.equal(windowRef.__TOOLKIT_APP_READY__.phase, 'failed');
    assert.equal(documentRef.getElementById('loading-overlay').hidden, 'hidden');
    assert.equal(feedback.hidden, true);
    assert.equal(feedback.errors.length, 1);
    assert.match(feedback.errors[0].message, /Toolkit host entry missing: C:\/toolkit-wrapper\/app\/jsx\/host\.jsx/);
});

test('initToolkitApp uses page reload only for work mode', async () => {
    const calls = [];
    const documentRef = createDocumentStub();
    const windowRef = {
        location: {
            reload() {
                calls.push('windowReload');
            }
        }
    };
    const feedback = createFeedbackStub();
    const runtimeState = {
        ready: false,
        shell: null,
        catalog: null,
        hostRuntime: null,
        services: null,
        lastResult: null,
        error: null
    };

    await initToolkitApp({
        hostFacade: {},
        hostRuntime: {
            async reload() {
                calls.push('hostReload');
                return 'TOOLKIT_HOST_RUNTIME_LOADED';
            },
            async inspect() {
                return {
                    loadedAtMs: 10,
                    loadedModules: [{ id: 'alpha_command' }],
                    quarantinedModules: [],
                    moduleCount: 1,
                    quarantinedCount: 0
                };
            }
        },
        debugHost: {},
        panelMode: 'work',
        runtimeState,
        documentRef,
        windowRef,
        UIFeedbackRef: feedback,
        loadCatalog() {
            return {
                modules: [{ id: 'alpha_command', buttonLabel: 'Alpha', category: 'Daily Work', enabled: true, status: 'ready' }],
                enabledCount: 1,
                quarantinedCount: 0,
                lookup: new Map()
            };
        },
        createCommandRunnerFn() {
            return {};
        },
        createToolkitShellFn() {
            return {
                elements: {
                    searchInput: { id: 'toolkit-search' }
                },
                renderInitial() { },
                focusSearch() { },
                updateCatalog() { }
            };
        }
    });

    await runtimeState.services.reloadPanel();

    assert.deepEqual(calls, ['windowReload']);
});

test('initToolkitApp uses page reload only for dev mode too', async () => {
    const calls = [];
    const documentRef = createDocumentStub();
    const windowRef = {
        location: {
            reload() {
                calls.push('windowReload');
            }
        }
    };
    const feedback = createFeedbackStub();
    const runtimeState = {
        ready: false,
        shell: null,
        catalog: null,
        hostRuntime: null,
        services: null,
        lastResult: null,
        error: null
    };

    await initToolkitApp({
        hostFacade: {},
        hostRuntime: {
            async reload() {
                return 'TOOLKIT_HOST_RUNTIME_LOADED';
            },
            async inspect() {
                return {
                    loadedAtMs: 10,
                    loadedModules: [{ id: 'alpha_command' }],
                    quarantinedModules: [],
                    moduleCount: 1,
                    quarantinedCount: 0
                };
            }
        },
        debugHost: {},
        panelMode: 'dev',
        runtimeState,
        documentRef,
        windowRef,
        UIFeedbackRef: feedback,
        loadCatalog() {
            return {
                modules: [{ id: 'alpha_command', buttonLabel: 'Alpha', category: 'Daily Work', enabled: true, status: 'ready' }],
                enabledCount: 1,
                quarantinedCount: 0,
                lookup: new Map()
            };
        },
        createCommandRunnerFn() {
            return {};
        },
        createToolkitShellFn() {
            return {
                elements: {
                    searchInput: { id: 'toolkit-search' }
                },
                renderInitial() { },
                focusSearch() { },
                updateCatalog() { }
            };
        }
    });

    await runtimeState.services.reloadPanel();

    assert.deepEqual(calls, ['windowReload']);
});
