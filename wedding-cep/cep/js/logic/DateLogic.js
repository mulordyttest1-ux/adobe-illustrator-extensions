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

import { CalendarEngine } from './domain/calendar.js';
import { TimeAutomation } from './domain/time.js';

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
    computeSolarFromLunar(d, m) {
        if (!d || !m) return null;
        if (typeof CalendarEngine === 'undefined') return null;

        // Note: CalendarEngine.getSolarDate might need year if not current year, 
        // but legacy code didn't pass it. Keeping legacy behavior.
        const solar = CalendarEngine.getSolarDate(parseInt(d), parseInt(m));

        if (solar) {
            // Need to re-calculate full lunar info to get "Thu", "Nam", etc.
            const fullInfo = CalendarEngine.getLunarDate(solar.day, solar.month, solar.year);
            return {
                solar: solar,
                fullInfo: fullInfo
            };
        }
        return null;
    },

    /**
     * Calculate synced date for dependent rows (Le, Nhap) based on Master (Tiec)
     * @param {number} masterD 
     * @param {number} masterM 
     * @param {number} offset - Days to add/subtract
     * @returns {object|null} { day, month, year }
     */
    computeDependentDate(masterD, masterM, offset = 0) {
        if (!masterD || !masterM) return null;

        const year = new Date().getFullYear();
        // JavaScript Date handles overflow automatically (e.g., Jan 32 -> Feb 1)
        const date = new Date(year, parseInt(masterM) - 1, parseInt(masterD) + offset);

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

