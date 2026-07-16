import { ToolkitBridge } from './bridge.js';
import { createCepHost } from './cepHost.js';

function escapeForExtendScript(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function normalizeRootPath(rootPath) {
    return String(rootPath || '').replace(/[\\/]+$/, '');
}

function getNodeRequire() {
    if (typeof window !== 'undefined' && typeof window.require === 'function') {
        return window.require;
    }

    if (typeof globalThis !== 'undefined' && typeof globalThis.require === 'function') {
        return globalThis.require;
    }

    return null;
}

function resolveJsxRootPath(extensionRoot) {
    const wrapperJsxRootPath = `${extensionRoot}/app/jsx`;
    const legacyJsxRootPath = `${extensionRoot}/jsx`;
    const nodeRequire = getNodeRequire();

    if (!nodeRequire) {
        return wrapperJsxRootPath;
    }

    try {
        const fs = nodeRequire('fs');
        if (fs.existsSync(`${wrapperJsxRootPath}/host.jsx`)) {
            return wrapperJsxRootPath;
        }
    } catch {
        // Fall back to legacy layout if filesystem inspection is unavailable.
    }

    return legacyJsxRootPath;
}

function normalizeRuntimeMeta(data) {
    const loadedModules = Array.isArray(data?.loadedModules)
        ? data.loadedModules
            .map((entry) => ({ id: String(entry?.id || '').trim() }))
            .filter((entry) => entry.id)
        : [];
    const quarantinedModules = Array.isArray(data?.quarantinedModules)
        ? data.quarantinedModules
            .map((entry) => ({
                id: String(entry?.id || '').trim(),
                reason: String(entry?.reason || '').trim()
            }))
            .filter((entry) => entry.id)
        : [];

    return {
        loadedAtMs: Number(data?.loadedAtMs || 0),
        loadedModules,
        quarantinedModules,
        moduleCount: Number(data?.moduleCount || loadedModules.length + quarantinedModules.length),
        quarantinedCount: Number(data?.quarantinedCount || quarantinedModules.length)
    };
}

function buildHostRuntimeReloadScript(jsxRootPath, options = {}) {
    const payloadJson = JSON.stringify({
        jsxRootPath,
        registryFilePath: options.registryFilePath ? String(options.registryFilePath) : ''
    });

    return [
        '(function () {',
        `var jsxRootPath = '${escapeForExtendScript(jsxRootPath)}';`,
        `var payloadJson = '${escapeForExtendScript(payloadJson)}';`,
        'var hostEntryFile = new File(jsxRootPath + "/host.jsx");',
        'if (!hostEntryFile.exists) {',
        '    return "Toolkit host entry missing: " + hostEntryFile.fsName;',
        '}',
        '$.evalFile(hostEntryFile);',
        'if (typeof ToolkitHostRuntime === "undefined" || typeof ToolkitHostRuntime.reload !== "function") {',
        '    return "ToolkitHostRuntime.reload unavailable";',
        '}',
        'return ToolkitHostRuntime.reload(payloadJson);',
        '})()'
    ].join('');
}

function createDebugHost(rawHost, overrides = {}) {
    if (overrides.debugHost) {
        return overrides.debugHost;
    }

    return {
        evalScript(script) {
            return rawHost.evalScript(script);
        },
        getExtensionRootPath() {
            return rawHost.getExtensionRootPath();
        },
        runNodeScript(scriptPath, options = {}) {
            return rawHost.runNodeScript(scriptPath, options);
        }
    };
}

function resolvePanelMode(rawHost, overrides = {}) {
    if (overrides.panelMode === 'dev' || overrides.panelMode === 'work') {
        return overrides.panelMode;
    }

    if (!rawHost || typeof rawHost.getExtensionId !== 'function') {
        return 'work';
    }

    try {
        return rawHost.getExtensionId() === 'com.dinhson.toolkit.panel.dev' ? 'dev' : 'work';
    } catch {
        return 'work';
    }
}

function createHostRuntimeApi(rawHost, bridge, overrides = {}) {
    if (overrides.hostRuntime) {
        return overrides.hostRuntime;
    }

    return {
        async reload(options = {}) {
            const extensionRoot = normalizeRootPath(rawHost.getExtensionRootPath());
            const jsxRootPath = resolveJsxRootPath(extensionRoot);
            const script = buildHostRuntimeReloadScript(jsxRootPath, options);
            const result = await rawHost.evalScript(script);

            if (result !== 'TOOLKIT_HOST_RUNTIME_LOADED') {
                throw new Error(result || 'Toolkit host runtime reload failed');
            }

            return result;
        },

        async inspect() {
            const result = await bridge.inspectRuntime();
            if (!result.success) {
                throw new Error(result.message || 'Toolkit host runtime inspect failed');
            }

            return normalizeRuntimeMeta(result.data);
        }
    };
}

function resolveRawHost(overrides = {}) {
    if (overrides.rawHost) {
        return overrides.rawHost;
    }

    if (overrides.host) {
        return overrides.host;
    }

    return createCepHost(overrides.cepHostOverrides || {});
}

function resolveBridge(rawHost, overrides = {}) {
    if (overrides.bridge) {
        return overrides.bridge;
    }

    return new ToolkitBridge({
        host: rawHost,
        ...(overrides.bridgeOptions || {})
    });
}

function createHostFacadeApi(bridge) {
    return {
        get isConnected() {
            return bridge.isConnected;
        },

        async testConnection() {
            return bridge.testConnection();
        },

        async getExecutionContext() {
            const result = await bridge.inspectContext();
            if (!result.success || !result.data) {
                return {
                    hasActiveDocument: false,
                    selectionCount: 0
                };
            }

            return {
                hasActiveDocument: Boolean(result.data.hasActiveDocument),
                selectionCount: Number(result.data.selectionCount || 0)
            };
        },

        async runCommand(request) {
            return bridge.runCommand(request);
        }
    };
}

export function createHostFacade(overrides = {}) {
    const rawHost = resolveRawHost(overrides);
    const bridge = resolveBridge(rawHost, overrides);
    const panelMode = resolvePanelMode(rawHost, overrides);

    return {
        hostFacade: createHostFacadeApi(bridge),
        hostRuntime: createHostRuntimeApi(rawHost, bridge, overrides),
        debugHost: createDebugHost(rawHost, overrides),
        panelMode
    };
}

export const __private__ = {
    buildHostRuntimeReloadScript,
    normalizeRuntimeMeta,
    resolveJsxRootPath,
    resolvePanelMode
};
