import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateValidator } from './DateValidator.js';

describe('DateValidator', () => {
    it('validates individual day and month fields', () => {
        assert.deepEqual(DateValidator.validate('32', 'day'), {
            valid: false,
            warnings: [{ type: 'range', message: 'Ngày 1-31', severity: 'error' }]
        });
        assert.deepEqual(DateValidator.validate('12', 'month'), {
            valid: true,
            warnings: []
        });
    });

    it('validates the supported calendar year range', () => {
        assert.equal(DateValidator.validate('2199', 'year').valid, true);
        assert.equal(DateValidator.validate('1799', 'year').valid, false);
        assert.equal(DateValidator.validate('2200', 'year').valid, false);
    });

    it('flags impossible calendar dates before later logic checks', () => {
        const result = DateValidator.validateDateLogic({
            'date.tiec.ngay': '30',
            'date.tiec.thang': '2',
            'date.tiec.nam': '2026'
        });

        assert.equal(result.valid, false);
        assert.deepEqual(result.warnings, [
            { type: 'invalid_date', message: 'Ngày 30/2 không tồn tại!', severity: 'error' }
        ]);
    });

    it('flags impossible sequence when le happens after tiec', () => {
        const result = DateValidator.validateDateLogic({
            'date.tiec.ngay': '10',
            'date.tiec.thang': '5',
            'date.tiec.nam': '2026',
            'date.le.ngay': '11',
            'date.le.thang': '5',
            'date.le.nam': '2026'
        });

        assert.equal(result.valid, false);
        assert.deepEqual(result.warnings, [
            { type: 'logic_seq', message: 'Vô lý: Lễ diễn ra SAU Tiệc', severity: 'error' }
        ]);
    });

    it('warns when the wedding is more than three calendar months away', () => {
        const result = DateValidator.validateDateLogic({
            'date.tiec.ngay': '15',
            'date.tiec.thang': '12',
            'date.tiec.nam': '2026',
            'date.le.ngay': '1',
            'date.le.thang': '11',
            'date.le.nam': '2026'
        }, {
            today: new Date(2026, 6, 29)
        });

        assert.equal(result.valid, true);
        assert.deepEqual(result.warnings, [
            {
                type: 'future_over_3_months',
                message: 'CẢNH BÁO: Ngày Tiệc cách hiện tại hơn 3 tháng. Kiểm tra lại năm?',
                severity: 'warning'
            },
            { type: 'gap_warn', message: 'Lễ cách Tiệc > 1 tháng?', severity: 'warning' }
        ]);
    });

    it('does not warn at the three-month boundary and warns one day after it', () => {
        const today = new Date(2026, 6, 29);
        const atBoundary = DateValidator.validateDateLogic({
            'date.tiec.ngay': '29',
            'date.tiec.thang': '10',
            'date.tiec.nam': '2026'
        }, { today });
        const afterBoundary = DateValidator.validateDateLogic({
            'date.tiec.ngay': '30',
            'date.tiec.thang': '10',
            'date.tiec.nam': '2026'
        }, { today });

        assert.equal(
            atBoundary.warnings.some((warning) => warning.type === 'future_over_3_months'),
            false
        );
        assert.equal(
            afterBoundary.warnings.some((warning) => warning.type === 'future_over_3_months'),
            true
        );
    });

    it('clamps a three-month boundary to the last valid day of the month', () => {
        const today = new Date(2026, 0, 31);
        const atBoundary = DateValidator.validateDateLogic({
            'date.tiec.ngay': '30',
            'date.tiec.thang': '4',
            'date.tiec.nam': '2026'
        }, { today });
        const afterBoundary = DateValidator.validateDateLogic({
            'date.tiec.ngay': '1',
            'date.tiec.thang': '5',
            'date.tiec.nam': '2026'
        }, { today });

        assert.equal(
            atBoundary.warnings.some((warning) => warning.type === 'future_over_3_months'),
            false
        );
        assert.equal(
            afterBoundary.warnings.some((warning) => warning.type === 'future_over_3_months'),
            true
        );
    });
});
