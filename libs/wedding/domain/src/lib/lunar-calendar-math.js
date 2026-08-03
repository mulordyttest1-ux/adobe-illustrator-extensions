const PI = Math.PI;
const DEG_TO_RAD = PI / 180;
const VIETNAM_TIMEZONE = 7;
const MIN_SUPPORTED_YEAR = 1800;
const MAX_SUPPORTED_YEAR = 2199;

function integer(value) {
    return Math.floor(value);
}

export function isSupportedYear(year) {
    return Number.isInteger(year)
        && year >= MIN_SUPPORTED_YEAR
        && year <= MAX_SUPPORTED_YEAR;
}

export function julianDayFromDate(day, month, year) {
    const a = integer((14 - month) / 12);
    const adjustedYear = year + 4800 - a;
    const adjustedMonth = month + (12 * a) - 3;
    let julianDay = day
        + integer(((153 * adjustedMonth) + 2) / 5)
        + (365 * adjustedYear)
        + integer(adjustedYear / 4)
        - integer(adjustedYear / 100)
        + integer(adjustedYear / 400)
        - 32045;

    if (julianDay < 2299161) {
        julianDay = day
            + integer(((153 * adjustedMonth) + 2) / 5)
            + (365 * adjustedYear)
            + integer(adjustedYear / 4)
            - 32083;
    }

    return julianDay;
}

export function dateFromJulianDay(julianDay) {
    let a = julianDay;
    if (julianDay > 2299160) {
        const alpha = integer((julianDay - 1867216.25) / 36524.25);
        a = julianDay + 1 + alpha - integer(alpha / 4);
    }

    const b = a + 1524;
    const c = integer((b - 122.1) / 365.25);
    const d = integer(365.25 * c);
    const e = integer((b - d) / 30.6001);
    const day = integer(b - d - integer(30.6001 * e));
    const month = e < 14 ? e - 1 : e - 13;
    const year = month < 3 ? c - 4715 : c - 4716;

    return { day, month, year };
}

function newMoon(k) {
    const time = k / 1236.85;
    const time2 = time * time;
    const time3 = time2 * time;
    let julianDay = 2415020.75933
        + (29.53058868 * k)
        + (0.0001178 * time2)
        - (0.000000155 * time3);

    julianDay += 0.00033 * Math.sin(
        (166.56 + (132.87 * time) - (0.009173 * time2)) * DEG_TO_RAD
    );

    const meanSunAnomaly = (
        359.2242
        + (29.10535608 * k)
        - (0.0000333 * time2)
        - (0.00000347 * time3)
    ) * DEG_TO_RAD;
    const meanMoonAnomaly = (
        306.0253
        + (385.81691806 * k)
        + (0.0107306 * time2)
        + (0.00001236 * time3)
    ) * DEG_TO_RAD;
    const moonArgument = (
        21.2964
        + (390.67050646 * k)
        - (0.0016528 * time2)
        - (0.00000239 * time3)
    ) * DEG_TO_RAD;

    const correction = ((0.1734 - (0.000393 * time)) * Math.sin(meanSunAnomaly))
        + (0.0021 * Math.sin(2 * meanSunAnomaly))
        - (0.4068 * Math.sin(meanMoonAnomaly))
        + (0.0161 * Math.sin(2 * meanMoonAnomaly))
        - (0.0004 * Math.sin(3 * meanMoonAnomaly))
        + (0.0104 * Math.sin(2 * moonArgument))
        - (0.0051 * Math.sin(meanSunAnomaly + meanMoonAnomaly))
        - (0.0074 * Math.sin(meanSunAnomaly - meanMoonAnomaly))
        + (0.0004 * Math.sin((2 * moonArgument) + meanSunAnomaly))
        - (0.0004 * Math.sin((2 * moonArgument) - meanSunAnomaly))
        - (0.0006 * Math.sin((2 * moonArgument) + meanMoonAnomaly))
        + (0.0010 * Math.sin((2 * moonArgument) - meanMoonAnomaly))
        + (0.0005 * Math.sin((2 * meanMoonAnomaly) + meanSunAnomaly));

    const deltaTime = time < -11
        ? 0.001
            + (0.000839 * time)
            + (0.0002261 * time2)
            - (0.00000845 * time3)
            - (0.000000081 * time * time3)
        : -0.000278 + (0.000265 * time) + (0.000262 * time2);

    return julianDay + correction - deltaTime;
}

function sunLongitude(julianDay) {
    const time = (julianDay - 2451545) / 36525;
    const time2 = time * time;
    const meanAnomaly = (
        357.52910
        + (35999.05030 * time)
        - (0.0001559 * time2)
        - (0.00000048 * time * time2)
    ) * DEG_TO_RAD;
    const meanLongitude = (
        280.46645
        + (36000.76983 * time)
        + (0.0003032 * time2)
    ) * DEG_TO_RAD;
    const longitudeCorrection = (
        (1.914600 - (0.004817 * time) - (0.000014 * time2))
        * Math.sin(meanAnomaly)
    ) + (
        (0.019993 - (0.000101 * time))
        * Math.sin(2 * meanAnomaly)
    ) + (0.000290 * Math.sin(3 * meanAnomaly));
    let longitude = meanLongitude + (longitudeCorrection * DEG_TO_RAD);

    longitude -= PI * 2 * integer(longitude / (PI * 2));
    return longitude;
}

function getNewMoonDay(k, timezone = VIETNAM_TIMEZONE) {
    return integer(newMoon(k) + 0.5 + (timezone / 24));
}

function getSunLongitude(dayNumber, timezone = VIETNAM_TIMEZONE) {
    return integer(
        (sunLongitude(dayNumber - 0.5 - (timezone / 24)) / PI) * 6
    );
}

function getLunarMonth11(year, timezone = VIETNAM_TIMEZONE) {
    const offset = julianDayFromDate(31, 12, year) - 2415021;
    const k = integer(offset / 29.530588853);
    let newMoonDay = getNewMoonDay(k, timezone);
    if (getSunLongitude(newMoonDay, timezone) >= 9) {
        newMoonDay = getNewMoonDay(k - 1, timezone);
    }
    return newMoonDay;
}

function getLeapMonthOffset(month11, timezone = VIETNAM_TIMEZONE) {
    const k = integer(0.5 + ((month11 - 2415021.076998695) / 29.530588853));
    let lastArc;
    let index = 1;
    let arc = getSunLongitude(getNewMoonDay(k + index, timezone), timezone);

    do {
        lastArc = arc;
        index += 1;
        arc = getSunLongitude(getNewMoonDay(k + index, timezone), timezone);
    } while (arc !== lastArc && index < 14);

    return index - 1;
}

export function solarToLunar(day, month, year, timezone = VIETNAM_TIMEZONE) {
    const dayNumber = julianDayFromDate(day, month, year);
    const k = integer((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timezone);
    if (monthStart > dayNumber) {
        monthStart = getNewMoonDay(k, timezone);
    }

    let month11 = getLunarMonth11(year, timezone);
    let nextMonth11 = month11;
    let lunarYear;
    if (month11 >= monthStart) {
        lunarYear = year;
        month11 = getLunarMonth11(year - 1, timezone);
    } else {
        lunarYear = year + 1;
        nextMonth11 = getLunarMonth11(year + 1, timezone);
    }

    const lunarDay = dayNumber - monthStart + 1;
    const difference = integer((monthStart - month11) / 29);
    let lunarMonth = difference + 11;
    let lunarLeap = 0;

    if ((nextMonth11 - month11) > 365) {
        const leapMonthDifference = getLeapMonthOffset(month11, timezone);
        if (difference >= leapMonthDifference) {
            lunarMonth = difference + 10;
            if (difference === leapMonthDifference) {
                lunarLeap = 1;
            }
        }
    }

    if (lunarMonth > 12) {
        lunarMonth -= 12;
    }
    if (lunarMonth >= 11 && difference < 4) {
        lunarYear -= 1;
    }

    return {
        day: lunarDay,
        month: lunarMonth,
        year: lunarYear,
        leap: lunarLeap
    };
}

export function lunarToSolar(
    lunarDay,
    lunarMonth,
    lunarYear,
    lunarLeap = 0
) {
    const timezone = VIETNAM_TIMEZONE;
    let month11;
    let nextMonth11;
    if (lunarMonth < 11) {
        month11 = getLunarMonth11(lunarYear - 1, timezone);
        nextMonth11 = getLunarMonth11(lunarYear, timezone);
    } else {
        month11 = getLunarMonth11(lunarYear, timezone);
        nextMonth11 = getLunarMonth11(lunarYear + 1, timezone);
    }

    const k = integer(0.5 + ((month11 - 2415021.076998695) / 29.530588853));
    let offset = lunarMonth - 11;
    if (offset < 0) {
        offset += 12;
    }

    if ((nextMonth11 - month11) > 365) {
        const leapOffset = getLeapMonthOffset(month11, timezone);
        let leapMonth = leapOffset - 2;
        if (leapMonth < 0) {
            leapMonth += 12;
        }

        if (lunarLeap && lunarMonth !== leapMonth) {
            return null;
        }
        if (lunarLeap || offset >= leapOffset) {
            offset += 1;
        }
    }

    const monthStart = getNewMoonDay(k + offset, timezone);
    return dateFromJulianDay(monthStart + lunarDay - 1);
}
