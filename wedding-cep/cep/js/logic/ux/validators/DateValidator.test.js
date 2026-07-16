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

    it('emits experience warnings for far-future and large date gaps', () => {
        const futureYear = new Date().getFullYear() + 3;
        const result = DateValidator.validateDateLogic({
            'date.tiec.ngay': '15',
            'date.tiec.thang': '12',
            'date.tiec.nam': String(futureYear),
            'date.le.ngay': '1',
            'date.le.thang': '11',
            'date.le.nam': String(futureYear)
        });

        assert.equal(result.valid, true);
        assert.deepEqual(result.warnings, [
            { type: 'far_future', message: `Năm ${futureYear} quá xa?`, severity: 'warning' },
            { type: 'gap_warn', message: 'Lễ cách Tiệc > 1 tháng?', severity: 'warning' }
        ]);
    });
});
