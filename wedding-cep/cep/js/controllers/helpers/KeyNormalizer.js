import { CalendarEngine } from '../../logic/domain/calendar.js';

/**
 * MODULE: KeyNormalizer
 * LAYER: Controller/Helpers
 * PURPOSE: Normalize scanned data keys (strip {} braces) and enrich with calendar/UX data
 * DEPENDENCIES: CalendarEngine
 * SIDE EFFECTS: None (pure transform)
 * EXPORTS: KeyNormalizer.normalize()
 */
export const KeyNormalizer = {
    /**
     * Normalize scanned data keys by stripping {} braces and enriching with computed data.
     * @param {Object} data - Raw scanned data
     * @returns {Object} Normalized data with clean keys
     */
    normalize(data) {
        if (!data || typeof data !== 'object') return data;

        const normalized = {};

        // 1. Clean keys: strip {} braces
        for (const key in data) {
            let cleanKey = key;
            if (cleanKey.startsWith('{') && cleanKey.endsWith('}')) {
                cleanKey = cleanKey.slice(1, -1);
            }
            normalized[cleanKey] = data[key];
        }

        // 2. Date enrichment via CalendarEngine
        this._enrichDates(normalized);

        // 3. Fallback inference (Moved logic here instead of global WeddingUXEngine)
        this._runInference(normalized);

        return normalized;
    },

    /**
     * Enrich date fields with computed lunar calendar data.
     * @param {Object} normalized - Data object to enrich in-place
     * @private
     */
    _enrichDates(normalized) {
        if (!CalendarEngine) {
            console.warn('[KeyNormalizer] CalendarEngine missing');
            return;
        }
        console.log('[KeyNormalizer] Enrich dates started');
        CalendarEngine.loadDatabase();

        const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];

        dateKeys.forEach(baseKey => {
            const d = normalized[`${baseKey}.ngay`];
            const m = normalized[`${baseKey}.thang`];
            // Use provided year or current year
            const y = normalized[`${baseKey}.nam`] || new Date().getFullYear();

            if (d && m) {
                try {
                    const dateObj = new Date(y, parseInt(m) - 1, parseInt(d));
                    if (isNaN(dateObj.getTime())) return;

                    const expanded = CalendarEngine.expandDate(dateObj);

                    normalized[`${baseKey}.ngay_al`] = expanded.ngay_al;
                    normalized[`${baseKey}.thang_al`] = expanded.thang_al;
                    normalized[`${baseKey}.nam_al`] = expanded.nam_al;
                    normalized[`${baseKey}.thu`] = expanded.thu;
                    normalized[`${baseKey}.nam_cung`] = expanded.nam; // Consistent naming
                    normalized[`${baseKey}.namyy`] = expanded.namyy;
                } catch {
                    // Fail silently for dates
                }
            }
        });
    },

    /**
     * Run UX inference engine for auto-fill logic.
     * @param {Object} normalized - Data object to enrich in-place
     * @private
     */
    _runInference(normalized) {
        // Simple fallback inference logic
        if (normalized['date.tiec.ngay'] && !normalized['date.tiec_auto']) {
            normalized['date.tiec_auto'] = true;
        }
    }
};


