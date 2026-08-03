import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateLogic } from './date-logic.js';

describe('DateLogic', () => {
    it('uses an explicit year for lunar-to-solar conversion', () => {
        assert.deepEqual(
            DateLogic.computeSolarFromLunar(1, 1, 2026).solar,
            {
                day: 17,
                month: 2,
                year: 2026
            }
        );
    });

    it('uses the master year when calculating dependent dates', () => {
        assert.deepEqual(
            DateLogic.computeDependentDate(1, 1, -1, 2026),
            {
                day: 31,
                month: 12,
                year: 2025
            }
        );
    });

    it('keeps the December lunar date near the displayed solar anchor', () => {
        assert.deepEqual(
            DateLogic.computeSolarFromLunar(13, 11, 2026, {
                anchor: { day: 21, month: 12, year: 2026 }
            }).solar,
            {
                day: 21,
                month: 12,
                year: 2026
            }
        );
    });

    it('preserves a known leap-month identity', () => {
        assert.deepEqual(
            DateLogic.computeSolarFromLunar(1, 5, 2028, {
                lunarYear: 2028,
                lunarMonth: 5,
                lunarLeap: 1
            }).solar,
            {
                day: 23,
                month: 6,
                year: 2028
            }
        );
    });

    it('resolves smart years from the next solar occurrence', () => {
        const today = new Date(2026, 6, 29);

        assert.equal(
            DateLogic.resolveSmartSolarYear(1, 1, { today }),
            2027
        );
        assert.equal(
            DateLogic.resolveSmartSolarYear(31, 12, { today }),
            2026
        );
    });

    it('roundtrips every supported solar date from 2026 through 2030', () => {
        for (let year = 2026; year <= 2030; year += 1) {
            for (let month = 1; month <= 12; month += 1) {
                const daysInMonth = new Date(year, month, 0).getDate();
                for (let day = 1; day <= daysInMonth; day += 1) {
                    const lunar = DateLogic.computeLunarFromSolar(day, month, year);
                    const anchor = { day, month, year };
                    const exact = DateLogic.computeSolarFromLunar(
                        lunar.lunar_day,
                        lunar.lunar_month,
                        year,
                        {
                            lunarYear: lunar.lunar_year,
                            lunarMonth: lunar.lunar_month,
                            lunarLeap: lunar.leap,
                            anchor
                        }
                    );
                    const anchored = DateLogic.computeSolarFromLunar(
                        lunar.lunar_day,
                        lunar.lunar_month,
                        year,
                        { anchor }
                    );

                    assert.deepEqual(exact.solar, anchor);
                    assert.deepEqual(anchored.solar, anchor);
                }
            }
        }
    });
});
