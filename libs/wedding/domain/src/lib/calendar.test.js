import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CalendarEngine } from './calendar.js';

describe('CalendarEngine', () => {
    it('converts known modern Vietnamese calendar dates in UTC+7', () => {
        assert.deepEqual(
            CalendarEngine.getLunarDate(10, 2, 2024),
            {
                day: 10,
                month: 2,
                year: 2024,
                lunar_day: 1,
                lunar_month: 1,
                lunar_year: 2024,
                lunar_year_txt: 'Giáp Thìn',
                leap: 0,
                thu: 'Thứ Bảy'
            }
        );

        assert.deepEqual(
            CalendarEngine.getLunarDate(29, 1, 2025),
            {
                day: 29,
                month: 1,
                year: 2025,
                lunar_day: 1,
                lunar_month: 1,
                lunar_year: 2025,
                lunar_year_txt: 'Ất Tỵ',
                leap: 0,
                thu: 'Thứ Tư'
            }
        );
    });

    it('roundtrips solar and lunar dates without a runtime database', () => {
        const lunar = CalendarEngine.getLunarDate(17, 10, 2025);
        const solar = CalendarEngine.getSolarDate(
            lunar.lunar_day,
            lunar.lunar_month,
            lunar.lunar_year,
            lunar.leap
        );

        assert.deepEqual(solar, {
            day: 17,
            month: 10,
            year: 2025
        });
    });

    it('resolves a lunar date inside an explicit Gregorian year', () => {
        assert.deepEqual(
            CalendarEngine.getSolarDateInGregorianYear(1, 1, 2026),
            {
                day: 17,
                month: 2,
                year: 2026
            }
        );
    });

    it('returns both Gregorian candidates when a lunar date is ambiguous', () => {
        const candidates = CalendarEngine.getSolarDateCandidatesInGregorianYear(13, 11, 2026);

        assert.deepEqual(
            candidates.map(({ day, month, year }) => ({ day, month, year })),
            [
                { day: 1, month: 1, year: 2026 },
                { day: 21, month: 12, year: 2026 }
            ]
        );
    });

    it('rejects invalid solar and lunar inputs cleanly', () => {
        assert.equal(CalendarEngine.getLunarDate(31, 2, 2026), null);
        assert.equal(CalendarEngine.getSolarDate(31, 1, 2026), null);
        assert.equal(CalendarEngine.getSolarDateInGregorianYear(1, 13, 2026), null);
    });
});
