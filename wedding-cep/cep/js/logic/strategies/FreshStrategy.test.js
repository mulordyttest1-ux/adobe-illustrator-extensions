import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FreshStrategy } from './FreshStrategy.js';

describe('FreshStrategy', () => {
    it('wraps fresh placeholder values through the shared marker codec', () => {
        const plan = FreshStrategy.analyze('{pos1.ong}', { 'pos1.ong': 'A\u200BB' }, null);

        assert.equal(plan.mode, 'ATOMIC');
        assert.deepEqual(plan.replacements, [{
            start: 0,
            end: 10,
            val: '\u200BAB\u200B',
            key: 'pos1.ong',
            priority: 1
        }]);
    });

    it('preserves and styles saint-name prefixes in fresh person-name placeholders', () => {
        const plan = FreshStrategy.analyze(
            '{pos1.con_full}',
            { 'pos1.con_full': 'te-r\u00ea-sa Nguy\u1ec5n Th\u1ecb An' },
            null
        );

        assert.equal(plan.mode, 'ATOMIC');
        assert.deepEqual(plan.replacements, [{
            start: 0,
            end: 15,
            val: '\u200Bte-r\u00ea-sa Nguy\u1ec5n Th\u1ecb An\u200B',
            key: 'pos1.con_full',
            priority: 1,
            styles: [{ start: 1, end: 9, baseline: 'superscript' }]
        }]);
    });
});
