import { parseBase64JsonUtf8 } from '../imposition/bridge_codec.js';

function encodeBridgePayload(value) {
    const payload = encodeURIComponent(String(value || ''));

    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(payload);
    }

    if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
        return globalThis.btoa(payload);
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(payload, 'utf8').toString('base64');
    }

    throw new Error('Base64 encoder unavailable');
}

function decodeBase64String(value) {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        return window.atob(value);
    }

    if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
        return globalThis.atob(value);
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(value, 'base64').toString('utf8');
    }

    throw new Error('Base64 decoder unavailable');
}

function parseBridgeResponse(resultRaw) {
    if (!resultRaw) {
        throw new Error('Empty host response');
    }

    if (typeof resultRaw === 'string' && (resultRaw.indexOf('EvalScript') === 0 || resultRaw.indexOf('ReferenceError') === 0)) {
        throw new Error(resultRaw);
    }

    try {
        return parseBase64JsonUtf8(resultRaw);
    } catch {
        return JSON.parse(decodeURIComponent(decodeBase64String(resultRaw)));
    }
}

function hasDialogError(result) {
    return !!(
        result &&
        typeof result === 'object' &&
        typeof result.err === 'number' &&
        result.err !== 0
    );
}

function getFirstPathEntry(value) {
    return Array.isArray(value) && value.length ? value[0] : '';
}

function normalizeCepSystemPath(value) {
    let normalized = String(value || '');

    if (normalized.indexOf('file:///') === 0) {
        normalized = normalized.slice('file:///'.length);
    } else if (normalized.indexOf('file://') === 0) {
        normalized = normalized.slice('file://'.length);
    }

    return normalized.replace(/\\/g, '/');
}

function resolveCsInterface(csFactory = null) {
    if (typeof csFactory === 'function') {
        return csFactory();
    }

    if (typeof CSInterface === 'undefined') {
        return null;
    }

    return new CSInterface();
}

function buildWeddingSuiteTemplatePath(extensionRoot) {
    const normalizedRoot = normalizeCepSystemPath(extensionRoot);
    return `${normalizedRoot}/wedding suite print template.ai`;
}

const SOURCE_FILE_TYPES = ['pdf'];
const SOURCE_FILE_PICKER_PREFIX = 'PDF (*.pdf)';
const SOURCE_FILE_PICKER_PROMPT = 'Open';

export async function invokeWeddingSuiteBridge(bridge, script) {
    const resultRaw = await bridge.eval(script);
    return parseBridgeResponse(resultRaw);
}

function buildHostCall(name, payload) {
    if (payload === undefined) {
        return `$.global.WeddingSuiteStandard.${name}()`;
    }

    return `$.global.WeddingSuiteStandard.${name}("${encodeBridgePayload(payload)}")`;
}

export function createWeddingSuiteBridgeAdapter(bridge) {
    return {
        async getActiveDocumentSourceInfo() {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('getActiveDocumentSourceInfo'));
        },

        async getActiveDocumentDirectory() {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('getActiveDocumentDirectory'));
        },

        async inspectSource(sourcePath) {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('inspectSource', sourcePath));
        },

        async buildJob(request) {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('buildJob', JSON.stringify(request || {})));
        },

        async inspectOpenOutput(outputPath) {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('inspectOpenOutput', outputPath));
        },

        async markOpenOutputDirty(outputPath) {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('markOpenOutputDirty', outputPath));
        },

        async ensureOutputOpen(outputPath) {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('ensureOutputOpen', outputPath));
        },

        async printQaCheck(outputPath) {
            return invokeWeddingSuiteBridge(bridge, buildHostCall('printQaCheck', outputPath));
        }
    };
}

function extractDialogPath(result) {
    if (!result) {
        return '';
    }

    if (hasDialogError(result)) {
        return '__PICKER_ERROR__';
    }

    if (typeof result === 'string') {
        return result;
    }

    const dataPath = getFirstPathEntry(result.data);
    if (dataPath) {
        return dataPath;
    }

    const filePath = getFirstPathEntry(result.files);
    if (filePath) {
        return filePath;
    }

    const arrayPath = getFirstPathEntry(result);
    if (arrayPath) {
        return arrayPath;
    }

    return '';
}

export function pickDirectory(initialPath = '') {
    if (!window.cep || !window.cep.fs || typeof window.cep.fs.showOpenDialogEx !== 'function') {
        return '';
    }

    try {
        const result = window.cep.fs.showOpenDialogEx(false, true, 'Chon thu muc luu', initialPath || '');
        return extractDialogPath(result);
    } catch (error) {
        console.warn('[WeddingSuiteStandard] Failed to open directory picker:', error);
        return '__PICKER_ERROR__';
    }
}

export function resolveWeddingSuiteTemplatePath(options = {}) {
    try {
        const cs = resolveCsInterface(options.csFactory);
        if (!cs || typeof cs.getSystemPath !== 'function' || typeof CSInterface === 'undefined') {
            return '';
        }

        return buildWeddingSuiteTemplatePath(cs.getSystemPath(CSInterface.EXTENSION));
    } catch (error) {
        console.warn('[WeddingSuiteStandard] Failed to resolve template path:', error);
        return '';
    }
}

export function pickSourceFile(initialPath = '') {
    if (!window.cep || !window.cep.fs || typeof window.cep.fs.showOpenDialogEx !== 'function') {
        return '__PICKER_UNAVAILABLE__';
    }

    const fsApi = window.cep.fs;
    const attempts = [
        function() {
            return fsApi.showOpenDialogEx(
                false,
                false,
                'Chon file nguon',
                initialPath || '',
                SOURCE_FILE_TYPES,
                SOURCE_FILE_PICKER_PREFIX,
                SOURCE_FILE_PICKER_PROMPT
            );
        },
        function() {
            return fsApi.showOpenDialogEx(
                false,
                false,
                'Chon file nguon',
                initialPath || '',
                SOURCE_FILE_TYPES
            );
        },
        function() {
            if (typeof fsApi.showOpenDialog !== 'function') {
                return '__PICKER_UNAVAILABLE__';
            }
            return fsApi.showOpenDialog(
                false,
                false,
                'Chon file nguon',
                initialPath || '',
                SOURCE_FILE_TYPES
            );
        }
    ];

    try {
        for (let index = 0; index < attempts.length; index += 1) {
            let result;
            try {
                result = attempts[index]();
            } catch (attemptError) {
                console.warn('[WeddingSuiteStandard] Source picker attempt failed:', attemptError);
                continue;
            }

            const path = extractDialogPath(result);
            if (path === '__PICKER_UNAVAILABLE__' || path === '__PICKER_ERROR__') {
                continue;
            }

            return path;
        }

        return '__PICKER_ERROR__';
    } catch (error) {
        console.warn('[WeddingSuiteStandard] Failed to open source picker:', error);
        return '__PICKER_ERROR__';
    }
}
