import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StringUtils } from './string.js';

describe('StringUtils', () => {
    describe('clean()', () => {
        it('trims and collapses whitespace', () => {
            assert.equal(StringUtils.clean('  Nguyễn   Văn   A  '), 'Nguyễn Văn A');
        });
        it('returns empty for null/undefined', () => {
            assert.equal(StringUtils.clean(null), '');
            assert.equal(StringUtils.clean(undefined), '');
        });
        it('returns empty for non-string', () => {
            assert.equal(StringUtils.clean(123), '');
        });
        it('handles already-clean strings', () => {
            assert.equal(StringUtils.clean('Hello World'), 'Hello World');
        });
    });

    describe('toProperCase()', () => {
        it('capitalizes each word', () => {
            assert.equal(StringUtils.toProperCase('nguyễn văn a'), 'Nguyễn Văn A');
        });
        it('handles UPPERCASE input', () => {
            assert.equal(StringUtils.toProperCase('NGUYỄN VĂN A'), 'Nguyễn Văn A');
        });
        it('handles mixed case + extra spaces', () => {
            assert.equal(StringUtils.toProperCase('  ngUYễn   vĂn  a  '), 'Nguyễn Văn A');
        });
        it('returns empty for null', () => {
            assert.equal(StringUtils.toProperCase(null), '');
        });
    });

    describe('removeAccents()', () => {
        it('removes Vietnamese diacritics', () => {
            assert.equal(StringUtils.removeAccents('Nguyễn Văn A'), 'Nguyen Van A');
        });
        it('handles đ/Đ', () => {
            assert.equal(StringUtils.removeAccents('Đắk Lắk'), 'Dak Lak');
        });
        it('preserves non-Vietnamese text', () => {
            assert.equal(StringUtils.removeAccents('Hello World'), 'Hello World');
        });
        it('returns empty for null', () => {
            assert.equal(StringUtils.removeAccents(null), '');
        });
    });

    describe('isEmpty()', () => {
        it('returns true for empty string', () => {
            assert.equal(StringUtils.isEmpty(''), true);
        });
        it('returns true for whitespace-only', () => {
            assert.equal(StringUtils.isEmpty('   '), true);
        });
        it('returns false for non-empty', () => {
            assert.equal(StringUtils.isEmpty('hello'), false);
        });
        it('returns true for null/undefined', () => {
            assert.equal(StringUtils.isEmpty(null), true);
            assert.equal(StringUtils.isEmpty(undefined), true);
        });
    });
});
