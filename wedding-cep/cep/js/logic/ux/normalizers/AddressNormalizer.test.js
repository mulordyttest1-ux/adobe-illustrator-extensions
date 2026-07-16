import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AddressNormalizer } from './AddressNormalizer.js';
import {
    applyAddressTitleCase,
    cleanupAddressPunctuation,
    normalizeAddressValue,
    uppercaseKnownAbbreviations
} from './addressNormalizationSupport.js';

describe('AddressNormalizer', () => {
    it('normalizes punctuation, spacing, and known abbreviations', () => {
        assert.deepEqual(AddressNormalizer.normalize(' tp hcm,,p 1- '), {
            value: 'TP HCM, P 1',
            applied: ['title_case', 'uppercase_abbr']
        });
    });

    it('skips abbreviation expansion when expandAbbr is false', () => {
        assert.deepEqual(AddressNormalizer.normalize('tp hcm, p 1', { expandAbbr: false }), {
            value: 'Tp Hcm, P 1',
            applied: ['title_case']
        });
    });

    it('keeps manual mode as a no-op', () => {
        assert.deepEqual(AddressNormalizer.normalize('tp hcm', { skipNormalize: true }), {
            value: 'tp hcm',
            applied: []
        });
    });

    it('preserves a clear POS 1 dash style', () => {
        assert.deepEqual(AddressNormalizer.normalize('thon a - xa b', {
            fieldKey: 'pos1.diachi'
        }), {
            value: 'Thon A - Xa B',
            applied: ['title_case']
        });
    });

    it('rewrites non-POS 1 addresses to match a comma-based POS 1', () => {
        assert.deepEqual(AddressNormalizer.normalize('thon a - xa b', {
            fieldKey: 'ceremony.diachi',
            formData: { 'pos1.diachi': 'Ap 1, Xa B' }
        }), {
            value: 'Thon A, Xa B',
            applied: ['title_case', 'canonical_separator']
        });
    });

    it('rewrites non-POS 1 addresses to match a dash-based POS 1', () => {
        assert.deepEqual(AddressNormalizer.normalize('thon a, xa b', {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Ap 1 - Xa B' }
        }), {
            value: 'Thon A - Xa B',
            applied: ['title_case', 'canonical_separator']
        });
    });

    it('falls back to commas when POS 1 separators are mixed', () => {
        assert.deepEqual(AddressNormalizer.normalize('thon a - xa b', {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Ap 1, Xa B - Tinh C' }
        }), {
            value: 'Thon A, Xa B',
            applied: ['title_case', 'canonical_separator']
        });
    });

    it('collapses ambiguous POS 1 dash forms to commas on blur', () => {
        assert.deepEqual(AddressNormalizer.normalize('thonA-tanLap', {
            fieldKey: 'pos1.diachi'
        }), {
            value: 'ThonA, TanLap',
            applied: ['title_case', 'canonical_separator']
        });
    });

    it('does not rewrite embedded hyphens such as number ranges', () => {
        const result = AddressNormalizer.normalize('12-14 nguyen hue - phuong 1', {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Ap 1, Xa B' }
        });

        assert.equal(result.value, '12-14 Nguyen Hue, Phuong 1');
        assert.equal(result.applied.includes('canonical_separator'), true);
    });

    it('does not rewrite embedded alphanumeric hyphens', () => {
        assert.deepEqual(AddressNormalizer.normalize('A1-B2', {
            fieldKey: 'pos1.diachi'
        }), {
            value: 'A1-B2',
            applied: []
        });
    });

    it('exposes helper behavior for punctuation cleanup and abbreviation uppercasing', () => {
        assert.equal(cleanupAddressPunctuation('kp 1,,p 2-'), 'kp 1, p 2');
        assert.equal(applyAddressTitleCase('nguyen hue, q 1'), 'Nguyen Hue, Q 1');
        assert.equal(uppercaseKnownAbbreviations('Ktx tp hcm', { KTX: 'Ky tuc xa', TP: 'Thanh pho', HCM: 'Ho Chi Minh' }), 'KTX TP HCM');
        assert.deepEqual(normalizeAddressValue('sn nguyen hue', {}, {
            abbreviations: { SN: 'So nha' },
            normalizeUnicode: (raw) => raw
        }), {
            value: 'SN Nguyen Hue',
            applied: ['title_case', 'uppercase_abbr']
        });
    });
});
