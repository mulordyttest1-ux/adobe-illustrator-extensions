/**
 * MODULE: DateGridDOM
 * LAYER: Components/Helpers
 * PURPOSE: DOM accessors, UI updaters, and state management for the DateGrid widget
 * DEPENDENCIES: None
 * SIDE EFFECTS: DOM (input values, class toggles, styles)
 * EXPORTS: DateGridDOM.getSolarState(), .getLunarState(), .updateLunarUI(), .updateSolarUI(), etc.
 */

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
        const ref = refs[key];
        if (ref) {
            if (ref.tagName === 'INPUT') {
                ref.value = String(value).padStart(2, '0');
            } else if (ref.el) {
                ref.el.textContent = value;
            }
        }
    },

    /**
     * Toggle row locked/unlocked state.
     * @param {Object} refs - Widget refs map
     * @param {string} baseKey - Date base key
     * @param {boolean} isLocked - Whether to lock
     */
    toggleRowState(refs, baseKey, isLocked) {
        ['.ngay', '.thang', '.ngay_al', '.thang_al'].forEach(s => {
            const el = refs[baseKey + s];
            if (el && !el.isComputed) {
                el.disabled = isLocked;
                if (isLocked) {
                    el.classList.add('date-input-disabled');
                    el.style.backgroundColor = '#f5f5f7';
                } else {
                    el.classList.remove('date-input-disabled');
                    el.style.backgroundColor = '#fff';
                }
            }
        });
    },

    /**
     * Update error state on an input element.
     * @param {HTMLElement} ref - Input element
     * @param {Array} warnings - Warning objects
     */
    updateErrorState(ref, warnings) {
        if (warnings && warnings.length > 0) {
            ref.classList.add('date-input-warning');
            ref.style.backgroundColor = '#ffe6e6';
            ref.title = warnings.map(w => w.message).join('\n');
            ref.dataset.hasError = "true";
        } else {
            ref.classList.remove('date-input-warning');
            ref.style.backgroundColor = 'transparent';
            ref.title = '';
            delete ref.dataset.hasError;
        }
    },

    /**
     * Collect current data from all refs.
     * @param {Object} refs - Widget refs map
     * @returns {Object} Key-value data
     */
    collectCurrentData(refs) {
        const data = {};
        Object.keys(refs).forEach(k => {
            const ref = refs[k];
            if (!ref) return;
            if (ref.tagName === 'INPUT' || ref.tagName === 'SELECT') {
                data[k] = ref.value;
            } else if (ref.isComputed) {
                if (ref.el && ref.el.textContent) {
                    data[k] = ref.el.textContent;
                } else if (ref.value !== undefined) {
                    data[k] = ref.value;
                }
            }
        });
        return data;
    },

    /**
     * Show logic feedback (yellow warnings).
     * @param {Object} refs - Widget refs map
     * @param {Object} result - Logic validation result
     */
    showLogicFeedback(refs, result) {
        this.clearLogicStyles(refs);
        if (result.warnings.length > 0) {
            Object.values(refs).forEach(el => {
                if (el && el.tagName === 'INPUT' && el.type === 'number') {
                    if (!el.dataset.hasError) {
                        el.classList.add('date-input-logic-warning');
                        el.style.backgroundColor = '#fff3cd';
                        el.dataset.logicStyle = "true";
                    }
                }
            });

            const firstMsg = result.warnings[0].message;
            const grid = refs['date.tiec.ngay']?.closest('.date-grid');
            if (grid) grid.title = "⚠️ LÚC NÀY: " + firstMsg;
            if (typeof showToast === 'function') showToast(firstMsg, 'warning');
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
                el.classList.remove('date-input-logic-warning');
                el.style.backgroundColor = 'transparent';
                delete el.dataset.logicStyle;

                if (checkTimeColorFn && (key.includes('.gio') || key.includes('.phut'))) {
                    const baseKey = key.substring(0, key.lastIndexOf('.'));
                    if (!checkedRows.has(baseKey)) {
                        checkTimeColorFn(baseKey);
                        checkedRows.add(baseKey);
                    }
                }
            }
        });
        const grid = refs['date.tiec.ngay']?.closest('.date-grid');
        if (grid) grid.title = "";
    }
};

