import { Bridge } from './bridge.js';
import { createCepHost } from './cepHost.js';

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
        }
    };
}

function createResolvedRawHost(overrides = {}) {
    if (overrides.rawHost) {
        return overrides.rawHost;
    }

    if (overrides.host) {
        return overrides.host;
    }

    const createCepHostImpl = overrides.createCepHost || createCepHost;
    return createCepHostImpl(overrides.cepHostOverrides || {});
}

function createResolvedBridge(rawHost, overrides = {}) {
    if (overrides.bridge) {
        return overrides.bridge;
    }

    const BridgeCtor = overrides.BridgeCtor || Bridge;
    return new BridgeCtor({
        host: rawHost,
        ...(overrides.bridgeOptions || {})
    });
}

function createHostFacadeApi(rawHost, bridge) {
    return {
        get isConnected() {
            return bridge.isConnected;
        },

        async testConnection() {
            return bridge.testConnection();
        },

        async readExtensionText(relativePath, options = {}) {
            return rawHost.readExtensionText(relativePath, options);
        },

        async scanDocument(mode = 'auto') {
            return bridge.scanDocument(mode);
        },

        async collectFrames() {
            return bridge.collectFrames();
        },

        async applyPlan(plans) {
            return bridge.applyPlan(plans);
        },

        async readSelectionObjects(options = {}) {
            return bridge.readSelectionObjects(options);
        },

        async selectFramesById(request) {
            return bridge.selectFramesById(request);
        },

        async applyTextChanges(changes) {
            return bridge.applyTextChanges(changes);
        }
    };
}

export function createHostFacade(overrides = {}) {
    const rawHost = createResolvedRawHost(overrides);
    const bridge = createResolvedBridge(rawHost, overrides);

    return {
        hostFacade: createHostFacadeApi(rawHost, bridge),
        debugHost: createDebugHost(rawHost, overrides)
    };
}
