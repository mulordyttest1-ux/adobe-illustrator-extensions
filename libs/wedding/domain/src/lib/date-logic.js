/**
 * DateLogic - Pure Functional Core
 * 
 * Responsibilities:
 * - Date Conversion (Solar <-> Lunar)
 * - Time Standardization
 * - Logic Validation
 * 
 * Rules:
 * - NO DOM Access
 * - Input: Raw Values/State
 * - Output: Calculated Values/State
 */

import { CalendarEngine } from './calendar.js';
import { SmartYearResolver } from './smart-year.js';
import { TimeAutomation } from './time.js';



function getDateTimestamp(dateLike) {
    if (!dateLike) {
        return null;
    }

    const date = dateLike instanceof Date
        ? dateLike
        : new Date(dateLike.year, dateLike.month - 1, dateLike.day);

    return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function pickClosestCandidate(candidates, anchor) {
    if (!candidates.length) {
        return null;
    }

    const anchorTime = getDateTimestamp(anchor);
    if (anchorTime === null) {
        return candidates[0];
    }

    return candidates
        .slice()
        .sort((left, right) => (
            Math.abs(getDateTimestamp(left) - anchorTime)
            - Math.abs(getDateTimestamp(right) - anchorTime)
        ))[0];
}

function getLunarCandidatesNearToday(day, month, options = {}) {
    const today = options.today instanceof Date && !Number.isNaN(options.today.getTime())
        ? options.today
        : new Date();
    const baseYear = today.getFullYear();
    const leapValues = options.lunarLeap === undefined || options.lunarLeap === null
        ? [0, 1]
        : [options.lunarLeap ? 1 : 0];
    const candidates = [];

    for (const lunarYear of [baseYear - 1, baseYear, baseYear + 1, baseYear + 2]) {
        for (const leap of leapValues) {
            const solar = CalendarEngine.getSolarDate(day, month, lunarYear, leap);
            if (solar) {
                candidates.push({
                    ...solar,
                    lunar_year: lunarYear,
                    leap
                });
            }
        }
    }

    const todayTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    ).getTime();
    const future = candidates
        .filter((candidate) => getDateTimestamp(candidate) >= todayTime)
        .sort((left, right) => getDateTimestamp(left) - getDateTimestamp(right));

    return future[0] || candidates.sort(
        (left, right) => getDateTimestamp(left) - getDateTimestamp(right)
    )[0] || null;
}

export const DateLogic = {
    /**
     * Compute Lunar Date from Solar Date
     * @param {number} d - Day
     * @param {number} m - Month
     * @param {number} y - Year
     * @returns {object|null} { day, month, year, leap, thu, lunar_day, lunar_month, lunar_year_txt } or null
     */
    computeLunarFromSolar(d, m, y) {
        if (!d || !m || !y) return null;
        if (typeof CalendarEngine === 'undefined') return null;

        return CalendarEngine.getLunarDate(parseInt(d), parseInt(m), parseInt(y));
    },

    /**
     * Compute Solar Date from Lunar Date
     * @param {number} d - Luna Day
     * @param {number} m - Luna Month
     * @returns {object|null} { day, month, year } (Solar)
     */
    computeSolarFromLunar(d, m, solarYear, options = {}) {
        if (!d || !m || !solarYear) return null;
        if (typeof CalendarEngine === 'undefined') return null;

        const lunarDay = parseInt(d);
        const lunarMonth = parseInt(m);
        const knownLunarMonth = parseInt(options.lunarMonth);
        const hasKnownLunarIdentity = Number.isInteger(options.lunarYear)
            && knownLunarMonth === lunarMonth
            && options.lunarLeap !== undefined
            && options.lunarLeap !== null;
        let solar;

        if (hasKnownLunarIdentity) {
            solar = CalendarEngine.getSolarDate(
                lunarDay,
                lunarMonth,
                options.lunarYear,
                options.lunarLeap
            );
        } else if (options.autoYear) {
            solar = getLunarCandidatesNearToday(lunarDay, lunarMonth, {
                lunarLeap: options.lunarLeap,
                today: options.today
            });
        } else {
            solar = pickClosestCandidate(
                CalendarEngine.getSolarDateCandidatesInGregorianYear(
                    lunarDay,
                    lunarMonth,
                    parseInt(solarYear),
                    options.lunarLeap
                ),
                options.anchor
            );
        }

        if (solar) {
            // Need to re-calculate full lunar info to get "Thu", "Nam", etc.
            const fullInfo = CalendarEngine.getLunarDate(solar.day, solar.month, solar.year);
            return {
                solar: {
                    day: solar.day,
                    month: solar.month,
                    year: solar.year
                },
                fullInfo: fullInfo
            };
        }
        return null;
    },

    resolveSmartSolarYear(d, m, options = {}) {
        return SmartYearResolver.resolveSolarYear(d, m, options);
    },

    /**
     * Calculate synced date for dependent rows (Le, Nhap) based on Master (Tiec)
     * @param {number} masterD 
     * @param {number} masterM 
     * @param {number} offset - Days to add/subtract
     * @returns {object|null} { day, month, year }
     */
    computeDependentDate(masterD, masterM, offset = 0, masterYear = new Date().getFullYear()) {
        if (!masterD || !masterM) return null;

        // JavaScript Date handles overflow automatically (e.g., Jan 32 -> Feb 1)
        const date = new Date(
            parseInt(masterYear),
            parseInt(masterM) - 1,
            parseInt(masterD) + offset
        );

        return {
            day: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    },

    /**
     * Check if time is standard logic
     * @param {string} key - 'date.tiec', 'date.le', etc.
     * @param {string|number} h 
     * @param {string|number} m 
     * @returns {boolean}
     */
    isStandardTime(key, h, m) {
        if (typeof TimeAutomation === 'undefined') return false;
        return TimeAutomation.isStandardTime(key, h, m);
    },

    /**
     * Get Standard Time for a key
     * @param {string} key 
     * @returns {object|null} {h, m}
     */
    getStandardTime(key) {
        if (typeof TimeAutomation === 'undefined') return null;
        return TimeAutomation.STANDARD_TIMES[key] || null;
    }
};

