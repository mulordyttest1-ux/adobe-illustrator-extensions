/**
 * MODULE: Bridge
 * LAYER: Infrastructure
 * PURPOSE: Communication layer for ExtendScript interop through the CEP host adapter
 * DEPENDENCIES: CEP host adapter, ingestion sanitizer
 * SIDE EFFECTS: Adobe CEP interop
 * EXPORTS: Bridge
 */
import { IngestionSanitizer } from '../logic/pipeline/IngestionSanitizer.js';

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

export class Bridge {
    constructor({ host, atob, TextDecoder, console: consoleImpl } = {}) {
        if (!host) {
            throw new Error('Bridge requires a CEP host adapter');
        }
        this.host = host;
        this._atob = resolveAtob(atob);
        this._TextDecoder = resolveTextDecoder(TextDecoder);
        this._console = consoleImpl || console;
    }

    get isConnected() {
        return this.host.isConnected();
    }

    _decodeResult(base64Str) {
        if (!base64Str) {
            return null;
        }

        try {
            if (!this._atob) {
                throw new Error('atob unavailable');
            }
            if (!this._TextDecoder) {
                throw new Error('TextDecoder unavailable');
            }

            this._console.log('[Bridge] Decoding Base64 (len):', base64Str.length);
            const binaryString = this._atob(base64Str);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const decoder = new this._TextDecoder('utf-8');
            let jsonStr = decoder.decode(bytes);
            jsonStr = jsonStr.replace(/^\uFEFF/, '').trim();

            const parsed = JSON.parse(jsonStr);
            this._console.log('[Bridge] Decoded JSON:', parsed);
            return parsed;
        } catch (error) {
            this._console.error('[Bridge] Decode failed:', error.message);
            return { success: false, error: 'Decode failed: ' + error.message };
        }
    }

    _escape(str) {
        if (typeof str !== 'string') {
            str = JSON.stringify(str);
        }
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    async call(fnName, data = {}) {
        if (!this.isConnected) {
            return { success: false, error: 'CEP not connected' };
        }

        if (fnName === 'ping') {
            const result = await this.host.evalScript('IllustratorBridge.ping()');
            const decoded = this._decodeResult(result);
            return Boolean(decoded && decoded.message === 'Pong');
        }

        const script = Object.keys(data).length > 0
            ? `IllustratorBridge.${fnName}('${this._escape(JSON.stringify(data))}')`
            : `IllustratorBridge.${fnName}()`;

        this._console.log('[Bridge] Calling JSX:', script);
        try {
            const result = await this.host.evalScript(script);
            this._console.log('[Bridge] JSX Result received (len):', result ? result.length : 0);
            const decoded = this._decodeResult(result);
            return decoded || { success: false, error: 'Empty response' };
        } catch (error) {
            this._console.error('[Bridge] EvalScript Error:', error.message);
            return { success: false, error: error.message || 'ExtendScript Error' };
        }
    }

    async testConnection() {
        return Boolean(await this.call('ping'));
    }

    async scanDocument(mode = 'auto') {
        const res = await this.call('scanWithMetadata', { mode });
        if (res && res.success && res.data) {
            res.data = IngestionSanitizer.sanitizeFrames(res.data);
        }
        return res;
    }

    async updateCard(data) {
        return this.call('updateCard', data);
    }

    async collectFrames() {
        const res = await this.call('collectFrames');
        if (res && res.success && res.data) {
            res.data = IngestionSanitizer.sanitizeFrames(res.data);
        }
        return res;
    }

    async applyPlan(plans) {
        return this.call('applyPlan', plans);
    }

    async readSelectionObjects(options = {}) {
        const request = options && typeof options === 'object' ? options : {};
        const res = await this.call('readSelectionObjects', request);
        if (res && res.success && res.data) {
            res.data = IngestionSanitizer.sanitizeFrames(res.data);
        }
        return res;
    }

    async selectFramesById(request) {
        const payload = Array.isArray(request)
            ? { ids: request, source: 'live-selection' }
            : request;
        return this.call('selectFramesById', payload);
    }

    async applyTextChanges(changes) {
        return this.call('applyTextChanges', changes);
    }
}
