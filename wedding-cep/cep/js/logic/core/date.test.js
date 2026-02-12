import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateUtils } from './date.js';

describe('DateUtils', () => {
    describe('parseDate()', () => {
        it('parses valid YYYY-MM-DD', () => {
            const d = DateUtils.parseDate('2026-10-20');
            assert.ok(d instanceof Date);
            assert.equal(d.getFullYear(), 2026);
            assert.equal(d.getMonth(), 9);
            assert.equal(d.getDate(), 20);
        });
        it('returns null for invalid date (Feb 30)', () => {
            assert.equal(DateUtils.parseDate('2026-02-30'), null);
        });
        it('returns null for wrong format', () => {
            assert.equal(DateUtils.parseDate('20/10/2026'), null);
        });
        it('returns null for null/empty', () => {
            assert.equal(DateUtils.parseDate(null), null);
            assert.equal(DateUtils.parseDate(''), null);
        });
        it('parses single-digit month/day', () => {
            const d = DateUtils.parseDate('2026-1-5');
            assert.ok(d instanceof Date);
            assert.equal(d.getMonth(), 0);
            assert.equal(d.getDate(), 5);
        });
    });

    describe('formatDate()', () => {
        it('formats as DD/MM/YYYY by default', () => {
            const d = new Date(2026, 9, 20);
            assert.equal(DateUtils.formatDate(d), '20/10/2026');
        });
        it('formats with custom pattern', () => {
            const d = new Date(2026, 0, 5);
            assert.equal(DateUtils.formatDate(d, 'DD-MM-YYYY'), '05-01-2026');
        });
        it('supports YY pattern', () => {
            const d = new Date(2026, 9, 20);
            assert.equal(DateUtils.formatDate(d, 'DD/MM/YY'), '20/10/26');
        });
        it('returns empty for invalid date', () => {
            assert.equal(DateUtils.formatDate(null), '');
            assert.equal(DateUtils.formatDate(new Date('invalid')), '');
        });
    });

    describe('getDayOfWeek()', () => {
        it('returns Vietnamese day name', () => {
            const d = new Date(2026, 9, 20);
            assert.equal(DateUtils.getDayOfWeek(d), 'Thứ Ba');
        });
        it('returns Chủ Nhật for Sunday', () => {
            const d = new Date(2026, 9, 25);
            assert.equal(DateUtils.getDayOfWeek(d), 'Chủ Nhật');
        });
        it('returns empty for invalid', () => {
            assert.equal(DateUtils.getDayOfWeek(null), '');
        });
    });

    describe('getDiffDays()', () => {
        it('calculates positive diff', () => {
            const d1 = new Date(2026, 9, 20);
            const d2 = new Date(2026, 9, 25);
            assert.equal(DateUtils.getDiffDays(d1, d2), 5);
        });
        it('calculates negative diff', () => {
            const d1 = new Date(2026, 9, 25);
            const d2 = new Date(2026, 9, 20);
            assert.equal(DateUtils.getDiffDays(d1, d2), -5);
        });
        it('returns 0 for same date', () => {
            const d = new Date(2026, 9, 20);
            assert.equal(DateUtils.getDiffDays(d, d), 0);
        });
        it('returns 0 for invalid input', () => {
            assert.equal(DateUtils.getDiffDays(null, new Date()), 0);
        });
    });

    describe('addDays()', () => {
        it('adds positive days', () => {
            const result = DateUtils.addDays(new Date(2026, 9, 20), 5);
            assert.equal(result.getDate(), 25);
        });
        it('subtracts negative days', () => {
            const result = DateUtils.addDays(new Date(2026, 9, 20), -5);
            assert.equal(result.getDate(), 15);
        });
        it('crosses month boundary', () => {
            const result = DateUtils.addDays(new Date(2026, 9, 30), 5);
            assert.equal(result.getMonth(), 10);
            assert.equal(result.getDate(), 4);
        });
        it('returns null for invalid', () => {
            assert.equal(DateUtils.addDays(null, 5), null);
        });
    });
});
