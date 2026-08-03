/**
 * MODULE: DateGridDOM
 * LAYER: Components/DateGrid
 * PURPOSE: DOM accessors, UI updaters, and state management for the DateGrid widget
 * DEPENDENCIES: None
 * SIDE EFFECTS: DOM (input values, class toggles, styles)
 * EXPORTS: DateGridDOM.getSolarState(), .getLunarState(), .updateLunarUI(), .updateSolarUI(), etc.
 */
import { UIFeedback } from '@shared/cep-ui';
import {
    applyErrorVisual,
    applyLogicWarningVisual,
    canApplyLogicWarning,
    clearLogicWarningVisual,
    collectRefValue,
    findGridRoot,
    isYearAuto,
    isYearExplicit,
    markYearSource,
    toggleEditableRef,
    toggleYearInput,
    writeRefValue
} from './dateGridDomSupport.js';

function readDatasetNumber(dataset, key) {
    const value = dataset?.[key];
    return value === undefined || value === '' ? null : Number(value);
}

function readLunarMetadata(yearInput) {
    const dataset = yearInput?.dataset || {};
    return {
        lunarYear: readDatasetNumber(dataset, 'lunarYear'),
        lunarMonth: readDatasetNumber(dataset, 'lunarMonth'),
        lunarLeap: readDatasetNumber(dataset, 'lunarLeap')
    };
}

function buildSolarAnchor(solarState) {
    if (!solarState.d || !solarState.m || !solarState.y) {
        return null;
    }

    return {
        day: Number(solarState.d),
        month: Number(solarState.m),
        year: Number(solarState.y)
    };
}

function writeLunarMetadata(yearInput, lunar) {
    if (!yearInput?.dataset) {
        return;
    }

    yearInput.dataset.lunarYear = lunar.lunar_year === undefined
        ? ''
        : String(lunar.lunar_year);
    yearInput.dataset.lunarMonth = lunar.lunar_month === undefined
        ? ''
        : String(lunar.lunar_month);
    yearInput.dataset.lunarLeap = lunar.leap === undefined
        ? ''
        : String(lunar.leap);
}

export const DateGridDOM = {
    /**
     * Get solar date values from DOM.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key (e.g. 'date.tiec')
     * @returns {{d: string, m: string, y: number}}
     */
    getSolarState(refs, baseKey) {
        return {
            d: refs[`${baseKey}.ngay`]?.value,
            m: refs[`${baseKey}.thang`]?.value,
            y: refs[`${baseKey}.nam`]?.value || String(new Date().getFullYear())
        };
    },

    /**
     * Get lunar date values from DOM.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @returns {{d: string, m: string, y: string}}
     */
    getLunarState(refs, baseKey) {
        const yearInput = refs[`${baseKey}.nam`];
        const solarState = this.getSolarState(refs, baseKey);
        return {
            d: refs[`${baseKey}.ngay_al`]?.value,
            m: refs[`${baseKey}.thang_al`]?.value,
            y: yearInput?.value || String(new Date().getFullYear()),
            ...readLunarMetadata(yearInput),
            anchor: buildSolarAnchor(solarState)
        };
    },

    /**
     * Update lunar date fields in DOM.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @param {Object} lunar - Lunar result from DateLogic
     */
    updateLunarUI(refs, baseKey, lunar) {
        this.updateFieldSilently(refs, `${baseKey}.ngay_al`, lunar.lunar_day);
        this.updateFieldSilently(refs, `${baseKey}.thang_al`, lunar.lunar_month);
        this.updateComputedInfo(refs, baseKey, lunar);
    },

    /**
     * Update solar date fields in DOM.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @param {Object} solar - Solar result {day, month}
     */
    updateSolarUI(refs, baseKey, solar) {
        this.updateFieldSilently(refs, `${baseKey}.ngay`, solar.day);
        this.updateFieldSilently(refs, `${baseKey}.thang`, solar.month);
        this.updateFieldSilently(refs, `${baseKey}.nam`, solar.year);
    },

    /**
     * Update computed info labels (thứ, năm, năm âm).
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @param {Object} lunar - Computed data
     */
    updateComputedInfo(refs, baseKey, lunar) {
        const thuRef = refs[`${baseKey}.thu`];
        const namyyRef = refs[`${baseKey}.namyy`];
        const namAlRef = refs[`${baseKey}.nam_al`];

        if (thuRef?.el) thuRef.el.textContent = lunar.thu || '';
        if (isYearAuto(refs, baseKey)) {
            this.updateFieldSilently(refs, `${baseKey}.nam`, lunar.year);
            if (!isYearExplicit(refs, baseKey)) {
                markYearSource(refs, baseKey, 'smart');
            }
        }
        const effectiveYear = refs[`${baseKey}.nam`]?.value || lunar.year;
        if (namyyRef) namyyRef.value = String(effectiveYear).slice(-2);
        if (namAlRef?.el) namAlRef.el.textContent = lunar.lunar_year_txt || '';

        writeLunarMetadata(refs[`${baseKey}.nam`], lunar);
    },

    /**
     * Update a field value without triggering events.
     * @param {Object} refs - Widget refs map
     * @param {string} key - Field key
     * @param {*} value - Value to set
     */
    updateFieldSilently(refs, key, value) {
        writeRefValue(refs[key], value);
    },

    /**
     * Toggle row locked/unlocked state.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @param {boolean} isLocked - Whether to lock
     */
    toggleRowState(refs, baseKey, isLocked) {
        ['.ngay', '.thang', '.ngay_al', '.thang_al'].forEach(s => {
            toggleEditableRef(refs[baseKey + s], isLocked);
        });
        const yearAutoRef = refs[`${baseKey}.nam_auto`];
        if (yearAutoRef) {
            yearAutoRef.disabled = isLocked;
        }
        toggleYearInput(refs, baseKey, isLocked || isYearAuto(refs, baseKey));
    },

    toggleYearState(refs, baseKey, isAutomatic) {
        toggleYearInput(refs, baseKey, isAutomatic);
    },

    isYearAuto(refs, baseKey) {
        return isYearAuto(refs, baseKey);
    },

    isYearExplicit(refs, baseKey) {
        return isYearExplicit(refs, baseKey);
    },

    markYearSource(refs, baseKey, source) {
        markYearSource(refs, baseKey, source);
    },

    getCurrentYear() {
        return new Date().getFullYear();
    },

    /**
     * Update error state on an input element.
     * @param {HTMLElement} ref - Input element
     * @param {Array} warnings - Warning objects
     */
    updateErrorState(ref, warnings) {
        applyErrorVisual(ref, warnings);
    },

    /**
     * Collect current data from all refs.
     * @param {Object} refs - Widget refs map
     * @returns {Object} Key-value data
     */
    collectCurrentData(refs) {
        const data = {};
        Object.keys(refs).forEach(k => {
            const value = collectRefValue(refs[k]);
            if (value !== undefined) {
                data[k] = value;
            }
        });
        return data;
    },

    /**
     * Show logic feedback (yellow warnings).
     * @param {Object} refs - Widget refs map
     * @param {Object} result - Logic validation result
     */
    showLogicFeedback(refs, result, deps = {}) {
        this.clearLogicStyles(refs);
        if (result.warnings.length > 0) {
            Object.values(refs).forEach(el => {
                if (canApplyLogicWarning(el)) {
                    applyLogicWarningVisual(el);
                }
            });

            const firstMsg = result.warnings[0].message;
            const grid = findGridRoot(refs);
            if (grid) grid.title = "⚠️ LÚC NÀY: " + firstMsg;
            const uiFeedback = deps.UIFeedback || UIFeedback;
            uiFeedback.showToast(firstMsg, 'warning');
        }
    },

    /**
     * Clear logic warning styles.
     * @param {Object} refs - Widget refs map
     * @param {Function} checkTimeColorFn - Callback for time color recheck
     */
    clearLogicStyles(refs, checkTimeColorFn) {
        const checkedRows = new Set();
        Object.entries(refs).forEach(([key, el]) => {
            if (el && el.dataset && el.dataset.logicStyle === "true") {
                clearLogicWarningVisual(el);

                if (checkTimeColorFn && (key.includes('.gio') || key.includes('.phut'))) {
                    const baseKey = key.substring(0, key.lastIndexOf('.'));
                    if (!checkedRows.has(baseKey)) {
                        checkTimeColorFn(baseKey);
                        checkedRows.add(baseKey);
                    }
                }
            }
        });
        const grid = findGridRoot(refs);
        if (grid) grid.title = "";
    }
};

