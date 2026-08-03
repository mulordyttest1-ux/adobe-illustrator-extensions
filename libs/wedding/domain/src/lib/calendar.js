import {
    isSupportedYear,
    lunarToSolar,
    solarToLunar
} from './lunar-calendar-math.js';

const WEEKDAYS = Object.freeze([
    'Ch\u1ee7 Nh\u1eadt',
    'Th\u1ee9 Hai',
    'Th\u1ee9 Ba',
    'Th\u1ee9 T\u01b0',
    'Th\u1ee9 N\u0103m',
    'Th\u1ee9 S\u00e1u',
    'Th\u1ee9 B\u1ea3y'
]);
const HEAVENLY_STEMS = Object.freeze([
    'Gi\u00e1p',
    '\u1ea4t',
    'B\u00ednh',
    '\u0110inh',
    'M\u1eadu',
    'K\u1ef7',
    'Canh',
    'T\u00e2n',
    'Nh\u00e2m',
    'Qu\u00fd'
]);
const EARTHLY_BRANCHES = Object.freeze([
    'T\u00fd',
    'S\u1eedu',
    'D\u1ea7n',
    'M\u00e3o',
    'Th\u00ecn',
    'T\u1ef5',
    'Ng\u1ecd',
    'M\u00f9i',
    'Th\u00e2n',
    'D\u1eadu',
    'Tu\u1ea5t',
    'H\u1ee3i'
]);

function parseInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function isValidSolarDate(day, month, year) {
    if (!isSupportedYear(year) || month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    const candidate = new Date(year, month - 1, day);
    return candidate.getFullYear() === year
        && candidate.getMonth() === month - 1
        && candidate.getDate() === day;
}

function lunarYearName(year) {
    return `${HEAVENLY_STEMS[(year + 6) % 10]} ${EARTHLY_BRANCHES[(year + 8) % 12]}`;
}

function normalizeSolarResult(lunarDay, lunarMonth, lunarYear, lunarLeap) {
    const solar = lunarToSolar(lunarDay, lunarMonth, lunarYear, lunarLeap);
    if (!solar || !isValidSolarDate(solar.day, solar.month, solar.year)) {
        return null;
    }

    const roundtrip = solarToLunar(solar.day, solar.month, solar.year);
    if (
        roundtrip.day !== lunarDay
        || roundtrip.month !== lunarMonth
        || roundtrip.year !== lunarYear
        || roundtrip.leap !== lunarLeap
    ) {
        return null;
    }

    return solar;
}

function getSolarDateCandidatesInGregorianYear(
    lunarDay,
    lunarMonth,
    gregorianYear,
    lunarLeap
) {
    const day = parseInteger(lunarDay);
    const month = parseInteger(lunarMonth);
    const year = parseInteger(gregorianYear);
    if (
        day === null
        || month === null
        || !isSupportedYear(year)
    ) {
        return [];
    }

    const leapValues = lunarLeap === undefined || lunarLeap === null
        ? [0, 1]
        : [lunarLeap ? 1 : 0];
    const candidates = [];
    const seen = new Set();

    for (const lunarYear of [year - 1, year, year + 1]) {
        for (const leap of leapValues) {
            const solar = normalizeSolarResult(day, month, lunarYear, leap);
            if (!solar || solar.year !== year) {
                continue;
            }

            const key = `${solar.day}-${solar.month}-${solar.year}-${lunarYear}-${leap}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            candidates.push({
                ...solar,
                lunar_year: lunarYear,
                leap
            });
        }
    }

    return candidates.sort((left, right) => (
        new Date(left.year, left.month - 1, left.day).getTime()
        - new Date(right.year, right.month - 1, right.day).getTime()
    ));
}

export const CalendarEngine = Object.freeze({
    getLunarDate(day, month, year) {
        const solarDay = parseInteger(day);
        const solarMonth = parseInteger(month);
        const solarYear = parseInteger(year);
        if (!isValidSolarDate(solarDay, solarMonth, solarYear)) {
            return null;
        }

        const lunar = solarToLunar(solarDay, solarMonth, solarYear);
        const date = new Date(solarYear, solarMonth - 1, solarDay);
        return {
            day: solarDay,
            month: solarMonth,
            year: solarYear,
            lunar_day: lunar.day,
            lunar_month: lunar.month,
            lunar_year: lunar.year,
            lunar_year_txt: lunarYearName(lunar.year),
            leap: lunar.leap,
            thu: WEEKDAYS[date.getDay()]
        };
    },

    getSolarDate(lunarDay, lunarMonth, lunarYear, lunarLeap = 0) {
        const day = parseInteger(lunarDay);
        const month = parseInteger(lunarMonth);
        const year = parseInteger(lunarYear);
        const leap = lunarLeap ? 1 : 0;
        if (
            !isSupportedYear(year)
            || day < 1
            || day > 30
            || month < 1
            || month > 12
        ) {
            return null;
        }

        return normalizeSolarResult(day, month, year, leap);
    },

    getSolarDateInGregorianYear(lunarDay, lunarMonth, gregorianYear, lunarLeap = 0) {
        const candidate = getSolarDateCandidatesInGregorianYear(
            lunarDay,
            lunarMonth,
            gregorianYear,
            lunarLeap
        )[0];

        return candidate
            ? {
                day: candidate.day,
                month: candidate.month,
                year: candidate.year
            }
            : null;
    },

    getSolarDateCandidatesInGregorianYear(lunarDay, lunarMonth, gregorianYear, lunarLeap) {
        return getSolarDateCandidatesInGregorianYear(
            lunarDay,
            lunarMonth,
            gregorianYear,
            lunarLeap
        );
    },

    expandDate(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return {};
        }

        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const result = {
            ngay: String(day).padStart(2, '0'),
            thang: String(month).padStart(2, '0'),
            nam: String(year),
            namyy: String(year).slice(-2),
            ngay_al: '',
            thang_al: '',
            nam_al: '',
            thu: ''
        };
        const lunar = this.getLunarDate(day, month, year);

        if (lunar) {
            result.ngay_al = String(lunar.lunar_day).padStart(2, '0');
            result.thang_al = String(lunar.lunar_month).padStart(2, '0');
            result.nam_al = lunar.lunar_year_txt;
            result.thu = lunar.thu;
        }
        return result;
    }
});
