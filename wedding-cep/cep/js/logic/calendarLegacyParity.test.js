import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CalendarEngine } from '@wedding/domain';

function parseLegacyCalendar(csvContent) {
    return csvContent
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((line) => {
            const [day, month, year, lunarDay, lunarMonth, lunarYearText] = line.split(',');
            return {
                day: Number(day),
                month: Number(month),
                year: Number(year),
                lunarDay: Number(lunarDay),
                lunarMonth: Number(lunarMonth),
                lunarYearText: lunarYearText.trim()
            };
        });
}

describe('calendar legacy parity', () => {
    it('matches every row from the retired runtime CSV', async () => {
        const fixtureUrl = new URL('../../data/ngay.csv', import.meta.url);
        const rows = parseLegacyCalendar(await readFile(fixtureUrl, 'utf8'));

        assert.equal(rows.length, 348);
        rows.forEach((expected) => {
            const actual = CalendarEngine.getLunarDate(
                expected.day,
                expected.month,
                expected.year
            );

            assert.equal(actual?.lunar_day, expected.lunarDay);
            assert.equal(actual?.lunar_month, expected.lunarMonth);
            assert.equal(actual?.lunar_year_txt, expected.lunarYearText);
        });
    });
});
