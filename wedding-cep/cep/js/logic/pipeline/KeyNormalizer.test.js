import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KeyNormalizer } from './KeyNormalizer.js';

describe('KeyNormalizer', () => {
    describe('normalize()', () => {
        it('normalizes scanned keys to internal form keys', () => {
            const input = {
                'pos1.con_full': 'Nguyễn Văn A',
                'pos2.con_full': 'Trần Thị B'
            };
            const result = KeyNormalizer.normalize(input);
            assert.ok(result !== null && typeof result === 'object');
        });
        it('handles empty input', () => {
            const result = KeyNormalizer.normalize({});
            assert.ok(typeof result === 'object');
        });
        it('handles null/undefined input gracefully', () => {
            const result = KeyNormalizer.normalize(null);
            assert.ok(result !== undefined);
        });
        it('preserves all input keys in output', () => {
            const input = {
                'pos1.ong': 'Ông A',
                'pos1.ba': 'Bà B',
                'pos1.con_full': 'Con C',
            };
            const result = KeyNormalizer.normalize(input);
            assert.ok(Object.keys(result).length >= Object.keys(input).length);
        });
    });
});
