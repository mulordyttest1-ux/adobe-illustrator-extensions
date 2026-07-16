import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    detectAddressSeparatorStyle,
    normalizeAmbiguousAddressComponentSeparators,
    normalizeAddressComponentSeparators,
    resolveCanonicalAddressSeparator
} from './addressSeparatorPolicy.js';

describe('addressSeparatorPolicy', () => {
    it('detects clear, mixed, and ambiguous separator styles', () => {
        assert.equal(detectAddressSeparatorStyle('Thon A, Xa B').style, 'comma');
        assert.equal(detectAddressSeparatorStyle('Thon A - Xa B').style, 'dash');
        assert.equal(detectAddressSeparatorStyle('Thon A, Xa B - Tinh C').style, 'mixed');
        assert.equal(detectAddressSeparatorStyle('ThonA-XaB').style, 'ambiguous');
    });

    it('rewrites component separators without touching embedded hyphen ranges', () => {
        assert.equal(
            normalizeAddressComponentSeparators('12-14 Nguyen Hue - Phuong 1, Tinh C', ', '),
            '12-14 Nguyen Hue, Phuong 1, Tinh C'
        );
        assert.equal(
            normalizeAmbiguousAddressComponentSeparators('ThonA-TanLap', ', '),
            'ThonA, TanLap'
        );
        assert.equal(
            normalizeAmbiguousAddressComponentSeparators('A1-B2', ', '),
            'A1-B2'
        );
    });

    it('resolves the canonical separator from POS 1 with comma fallback', () => {
        assert.equal(resolveCanonicalAddressSeparator({
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Thon A - Xa B' }
        }), ' - ');
        assert.equal(resolveCanonicalAddressSeparator({
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'ThonA-XaB' }
        }), ', ');
        assert.equal(resolveCanonicalAddressSeparator({
            fieldKey: 'pos1.diachi',
            currentValue: 'Thon A - Xa B',
            formData: {}
        }), ' - ');
    });
});
