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
    toggleEditableRef,
    writeRefValue
} from './dateGridDomSupport.js';

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
            y: new Date().getFullYear()
        };
    },

    /**
     * Get lunar date values from DOM.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @returns {{d: string, m: string}}
     */
    getLunarState(refs, baseKey) {
        return {
            d: refs[`${baseKey}.ngay_al`]?.value,
            m: refs[`${baseKey}.thang_al`]?.value
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
    },

    /**
     * Update computed info labels (thứ, năm, năm âm).
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @param {Object} lunar - Computed data
     */
    updateComputedInfo(refs, baseKey, lunar) {
        const thuRef = refs[`${baseKey}.thu`];
        const namRef = refs[`${baseKey}.nam`];
        const namyyRef = refs[`${baseKey}.namyy`];
        const namAlRef = refs[`${baseKey}.nam_al`];

        if (thuRef?.el) thuRef.el.textContent = lunar.thu || '';
        if (namRef?.el) namRef.el.textContent = String(lunar.year);
        if (namyyRef) namyyRef.value = String(lunar.year).slice(-2);
        if (namAlRef?.el) namAlRef.el.textContent = lunar.lunar_year_txt || '';
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

