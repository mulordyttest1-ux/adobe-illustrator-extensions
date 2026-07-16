/**
 * MODULE: BridgeCodec
 * LAYER: Infrastructure/Utility (L1)
 * PURPOSE: Decode Base64 responses from JSX using UTF-8-safe semantics.
 * DEPENDENCIES: Browser atob/TextDecoder globals
 * SIDE EFFECTS: None
 * EXPORTS: decodeBase64Utf8, parseBase64JsonUtf8
 */

function resolveAtob() {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        return window.atob.bind(window);
    }

    if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
        return globalThis.atob.bind(globalThis);
    }

    return null;
}

function resolveTextDecoder() {
    if (typeof globalThis !== 'undefined' && typeof globalThis.TextDecoder === 'function') {
        return globalThis.TextDecoder;
    }

    return null;
}

function binaryStringToBytes(binaryString) {
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function decodeWithPercentFallback(binaryString) {
    let encoded = '';
    for (let i = 0; i < binaryString.length; i += 1) {
        const hex = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
        encoded += '%' + hex;
    }
    return decodeURIComponent(encoded);
}

export function decodeBase64Utf8(base64Str) {
    if (!base64Str) {
        return '';
    }

    const atobImpl = resolveAtob();
    if (!atobImpl) {
        throw new Error('atob unavailable');
    }

    const binaryString = atobImpl(base64Str);
    const TextDecoderImpl = resolveTextDecoder();

    let decoded;
    if (TextDecoderImpl) {
        const decoder = new TextDecoderImpl('utf-8');
        decoded = decoder.decode(binaryStringToBytes(binaryString));
    } else {
        decoded = decodeWithPercentFallback(binaryString);
    }

    return decoded.replace(/^\uFEFF/, '').trim();
}

export function parseBase64JsonUtf8(base64Str) {
    return JSON.parse(decodeBase64Utf8(base64Str));
}
