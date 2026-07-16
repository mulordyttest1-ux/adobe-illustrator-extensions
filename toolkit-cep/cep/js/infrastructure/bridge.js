function resolveAtob(atobOverride) {
    if (typeof atobOverride === 'function') {
        return atobOverride;
    }

    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        return window.atob.bind(window);
    }

    if (typeof globalThis.atob === 'function') {
        return globalThis.atob.bind(globalThis);
    }

    return null;
}

function resolveTextDecoder(TextDecoderOverride) {
    return TextDecoderOverride || globalThis.TextDecoder || null;
}

function createDisconnectedResult() {
    return {
        success: false,
        message: 'CEP not connected',
        errorCode: 'CEP_NOT_CONNECTED',
        data: null
    };
}

function createFailureResult(message, errorCode) {
    return {
        success: false,
        message,
        errorCode,
        data: null
    };
}

function normalizeRawHostMessage(value, fallbackMessage = 'Toolkit host error') {
    const message = String(value || '').replace(/\s+/g, ' ').trim();

    if (!message) {
        return fallbackMessage;
    }

    return message.length > 500
        ? `${message.slice(0, 497)}...`
        : message;
}

function isPrintableHostText(value) {
    const text = String(value || '');

    if (!text.trim()) {
        return false;
    }

    for (let index = 0; index < text.length; index += 1) {
        const charCode = text.charCodeAt(index);

        if (
            (charCode >= 0 && charCode <= 8) ||
            charCode === 11 ||
            charCode === 12 ||
            (charCode >= 14 && charCode <= 31)
        ) {
            return false;
        }
    }

    return true;
}

function looksLikeBase64Value(value) {
    const normalized = String(value || '').trim();

    if (!normalized || normalized.length % 4 !== 0) {
        return false;
    }

    return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

function normalizeHostResult(result) {
    if (!result || typeof result !== 'object') {
        return {
            success: false,
            message: 'Empty host response',
            errorCode: 'EMPTY_HOST_RESPONSE',
            data: null
        };
    }

    return {
        success: result.success !== false,
        message: result.message || '',
        errorCode: result.errorCode || null,
        data: typeof result.data === 'undefined' ? null : result.data
    };
}

function escapeForExtendScript(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}

function resolveExtensionRootPath(host) {
    if (!host || typeof host.getExtensionRootPath !== 'function') {
        return '';
    }

    try {
        return String(host.getExtensionRootPath() || '').replace(/[\\/]+$/, '');
    } catch {
        return '';
    }
}

function buildToolkitBridgeScript(functionName, payloadJson, extensionRootPath) {
    const hasPayload = typeof payloadJson === 'string';

    return [
        '(function () {',
        `var functionName = '${escapeForExtendScript(functionName)}';`,
        `var extensionRoot = '${escapeForExtendScript(extensionRootPath || '')}';`,
        hasPayload
            ? `var payloadJson = '${escapeForExtendScript(payloadJson)}';`
            : 'var payloadJson = "";',
        hasPayload
            ? 'var hasPayload = true;'
            : 'var hasPayload = false;',
        'var hostEntryFile = null;',
        'var jsxRootPath = "";',
        'var reloadResult = "";',
        'var ensureBridge = function () {',
        '    if (typeof ToolkitBridge !== "undefined" && typeof ToolkitBridge[functionName] === "function") {',
        '        return true;',
        '    }',
        '    if (extensionRoot) {',
        '        jsxRootPath = extensionRoot + "/app/jsx";',
        '        hostEntryFile = new File(jsxRootPath + "/host.jsx");',
        '        if (!hostEntryFile.exists) {',
        '            jsxRootPath = extensionRoot + "/jsx";',
        '            hostEntryFile = new File(jsxRootPath + "/host.jsx");',
        '        }',
        '        if (hostEntryFile.exists) {',
        '            $.evalFile(hostEntryFile);',
        '        }',
        '    }',
        '    if (typeof ToolkitBridge !== "undefined" && typeof ToolkitBridge[functionName] === "function") {',
        '        return true;',
        '    }',
        '    if (typeof ToolkitHostRuntime !== "undefined" && typeof ToolkitHostRuntime.reload === "function") {',
        '        try {',
        '            reloadResult = ToolkitHostRuntime.reload("");',
        '        } catch (reloadError) {',
        '            reloadResult = reloadError && reloadError.message ? reloadError.message : "Toolkit host runtime reload failed";',
        '        }',
        '    }',
        '    return typeof ToolkitBridge !== "undefined" && typeof ToolkitBridge[functionName] === "function";',
        '};',
        'if (!ensureBridge()) {',
        '    return "Toolkit bridge unavailable for " + functionName + (reloadResult ? ": " + reloadResult : "");',
        '}',
        'return hasPayload ? ToolkitBridge[functionName](payloadJson) : ToolkitBridge[functionName]();',
        '})()'
    ].join('');
}

export class ToolkitBridge {
    constructor({ host, atob, TextDecoder } = {}) {
        if (!host) {
            throw new Error('ToolkitBridge requires a CEP host adapter');
        }

        this.host = host;
        this._atob = resolveAtob(atob);
        this._TextDecoder = resolveTextDecoder(TextDecoder);
    }

    get isConnected() {
        return this.host.isConnected();
    }

    decodeResult(base64Value) {
        if (!base64Value) {
            return createFailureResult('Empty host response', 'EMPTY_HOST_RESPONSE');
        }

        if (!this._atob || !this._TextDecoder) {
            return createFailureResult('Base64 decode support unavailable', 'TOOLKIT_BRIDGE_DECODE_UNAVAILABLE');
        }

        if (!looksLikeBase64Value(base64Value)) {
            return createFailureResult(
                normalizeRawHostMessage(base64Value),
                'TOOLKIT_HOST_RAW_RESPONSE'
            );
        }

        let binaryString;

        try {
            binaryString = this._atob(base64Value);
        } catch {
            return createFailureResult(
                normalizeRawHostMessage(base64Value),
                'TOOLKIT_HOST_RAW_RESPONSE'
            );
        }

        const bytes = new Uint8Array(binaryString.length);
        for (let index = 0; index < binaryString.length; index += 1) {
            bytes[index] = binaryString.charCodeAt(index);
        }

        const decoder = new this._TextDecoder('utf-8');
        const jsonText = decoder.decode(bytes).replace(/^\uFEFF/, '').trim();

        try {
            return JSON.parse(jsonText);
        } catch {
            return createFailureResult(
                isPrintableHostText(jsonText)
                    ? normalizeRawHostMessage(jsonText, 'Malformed host response')
                    : 'Malformed host response',
                'TOOLKIT_HOST_MALFORMED_RESPONSE'
            );
        }
    }

    async call(functionName, payload) {
        if (!this.isConnected) {
            return createDisconnectedResult();
        }

        const payloadJson = typeof payload !== 'undefined'
            ? JSON.stringify(payload)
            : null;
        const script = buildToolkitBridgeScript(
            functionName,
            payloadJson,
            resolveExtensionRootPath(this.host)
        );

        try {
            const encodedResult = await this.host.evalScript(script);
            return normalizeHostResult(this.decodeResult(encodedResult));
        } catch (error) {
            return {
                success: false,
                message: error && error.message ? error.message : 'ExtendScript call failed',
                errorCode: 'TOOLKIT_BRIDGE_CALL_FAILED',
                data: null
            };
        }
    }

    async testConnection() {
        const result = await this.call('ping');
        return Boolean(result && result.success);
    }

    async inspectContext() {
        return await this.call('inspectContext');
    }

    async inspectRuntime() {
        return await this.call('inspectRuntime');
    }

    async runCommand(request) {
        return await this.call('runCommand', request);
    }
}

export const __private__ = {
    buildToolkitBridgeScript,
    resolveExtensionRootPath
};
