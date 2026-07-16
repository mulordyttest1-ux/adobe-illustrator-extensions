import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeBase64Utf8, parseBase64JsonUtf8 } from './bridge_codec.js';

if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
}

function encodeUtf8Base64(value) {
    return Buffer.from(value, 'utf8').toString('base64');
}

test('decodeBase64Utf8 preserves Vietnamese host strings', () => {
    const input = 'Layout Error: Không đủ chỗ trên khổ giấy để xếp.';
    const base64 = encodeUtf8Base64(input);

    assert.equal(decodeBase64Utf8(base64), input);
});

test('parseBase64JsonUtf8 parses UTF-8 encoded JSON payloads without mojibake', () => {
    const payload = {
        success: false,
        error: 'Layout Error: Không đủ chỗ trên khổ giấy để xếp.'
    };
    const base64 = encodeUtf8Base64(JSON.stringify(payload));

    assert.deepEqual(parseBase64JsonUtf8(base64), payload);
});
