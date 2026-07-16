import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateNormalizer } from './DateNormalizer.js';
import { extractDateNumber, normalizeDateValue, smartFixDateTypo } from './dateNormalizationSupport.js';

describe('DateNormalizer', () => {
    it('extracts day and hour numbers from typed text and pads single digits', () => {
        assert.deepEqual(DateNormalizer.normalize('ng\u00E0y 5', { type: 'day' }), {
            value: '05',
            applied: ['pad_zero']
        });
        assert.deepEqual(DateNormalizer.normalize('ngay 5', { type: 'day' }), {
            value: '05',
            applied: ['pad_zero']
        });
        assert.deepEqual(DateNormalizer.normalize('15h', { type: 'hour' }), {
            value: '15',
            applied: []
        });
        assert.deepEqual(DateNormalizer.normalize('gio 7', { type: 'hour' }), {
            value: '07',
            applied: ['pad_zero']
        });
    });

    it('applies smart typo recovery before zero padding for non-year fields', () => {
        assert.equal(smartFixDateTypo('1412', 12), '12');
        assert.deepEqual(DateNormalizer.normalize('131', { type: 'hour' }), {
            value: '01',
            applied: ['smart_typo_fix', 'pad_zero']
        });
    });

    it('keeps year values out of smart typo recovery and padding', () => {
        assert.deepEqual(DateNormalizer.normalize('20261', { type: 'year' }), {
            value: '20261',
            applied: []
        });
    });

    it('extracts supported shorthand and prefix-based time text consistently', () => {
        assert.equal(extractDateNumber('gi\u1EDD 7', 'hour'), '7');
        assert.equal(extractDateNumber('7 gi\u1EDD', 'hour'), '7');
        assert.deepEqual(normalizeDateValue('th 9', { type: 'month' }), {
            value: '09',
            applied: ['pad_zero']
        });
    });
});
