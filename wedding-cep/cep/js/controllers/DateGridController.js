/**
 * MODULE: DateGridController
 * LAYER: Controllers
 * PURPOSE: Logic hub for DateGridWidget — handles validation, lunar/solar sync, and computing standard time
 * DEPENDENCIES: DateLogic, DateGridDOM, CalendarEngine, InputEngine
 * SIDE EFFECTS: DOM manipulation (via DateGridDOM calls)
 * EXPORTS: DateGridController class
 */

import { DateGridDOM } from '../components/helpers/DateGridDOM.js';
import { CalendarEngine, DateLogic } from '@wedding/domain';
import { InputEngine } from '../logic/ux/InputEngine.js';

export class DateGridController {
    /**
     * @param {Object} refs - DOM references provided by DateGridWidget
     * @param {Function} onGlobalChange - Callback to notify parent (FormBuilder) of changes
     */
    constructor(refs, onGlobalChange) {
        this._refs = refs || {};
        this._onGlobalChange = onGlobalChange || null;
        this._initEngines();
    }

    _initEngines() {
        if (typeof CalendarEngine !== 'undefined') {
            CalendarEngine.loadDatabase();
        }
    }

    // --- Event Handlers (Called by Widget) ---

    handleBlur(ref) {
        const key = ref.dataset.key;
        const baseKey = ref.dataset.baseKey;
        const type = ref.dataset.type;

        // 1. Core Validation & UI Feedback (InputEngine)
        if (typeof InputEngine !== 'undefined') {
            const result = InputEngine.process(ref.value, key);
            if (result.value !== ref.value) ref.value = result.value;
            DateGridDOM.updateErrorState(ref, result.warnings);
        }

        // 2. Logic Syncing based on Field Type
        if (type === 'solar') {
            const solarState = DateGridDOM.getSolarState(this._refs, baseKey);
            const lunarResult = DateLogic.computeLunarFromSolar(solarState.d, solarState.m, solarState.y);
            if (lunarResult) {
                DateGridDOM.updateLunarUI(this._refs, baseKey, lunarResult);
                if (baseKey === 'date.tiec') this._syncDependentRows();
            }
        } else if (type === 'lunar') {
            const lunarState = DateGridDOM.getLunarState(this._refs, baseKey);
            const solarResult = DateLogic.computeSolarFromLunar(lunarState.d, lunarState.m);
            if (solarResult) {
                DateGridDOM.updateSolarUI(this._refs, baseKey, solarResult.solar);
                DateGridDOM.updateComputedInfo(this._refs, baseKey, solarResult.fullInfo);
                if (baseKey === 'date.tiec') this._syncDependentRows();
            }
        } else if (type === 'time') {
            this._checkTimeColor(baseKey);
        }

        // 3. Cross-field Logic Validation
        if (typeof InputEngine !== 'undefined') {
            const currentData = DateGridDOM.collectCurrentData(this._refs);
            const logicResult = InputEngine.validateDateLogic(currentData);
            DateGridDOM.showLogicFeedback(this._refs, logicResult);
        }
    }

    handleInput(ref) {
        const baseKey = ref.dataset.baseKey;
        const type = ref.dataset.type;
        const key = ref.dataset.key;

        // Sync when Master (Tiệc) Solar changes
        if (baseKey === 'date.tiec' && type === 'solar') {
            this._syncDependentRows(); // Tự động kéo Lễ / Nhập theo Tiệc
        }

        // Notify parent
        if (this._onGlobalChange) this._onGlobalChange(key, ref.value);
    }

    handleCheckboxChange(ref, baseKey) {
        DateGridDOM.toggleRowState(this._refs, baseKey, ref.checked);
        if (ref.checked) {
            this._syncFromMaster(baseKey, baseKey === 'date.le' ? 0 : -1);
        }
    }

    // --- Core Business Logic ---

    _syncDependentRows() {
        if (this._refs['date.le_auto']?.checked) this._syncFromMaster('date.le', 0);
        if (this._refs['date.nhap_auto']?.checked) this._syncFromMaster('date.nhap', -1);
    }

    _syncFromMaster(targetKey, offset = 0) {
        const tiecState = DateGridDOM.getSolarState(this._refs, 'date.tiec');
        const dependentResult = DateLogic.computeDependentDate(tiecState.d, tiecState.m, offset);

        if (dependentResult) {
            // Update Solar
            DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.ngay`, dependentResult.day);
            DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.thang`, dependentResult.month);

            // Sync Lunar
            const lunarResult = DateLogic.computeLunarFromSolar(dependentResult.day, dependentResult.month, dependentResult.year);
            if (lunarResult) DateGridDOM.updateLunarUI(this._refs, targetKey, lunarResult);

            // Sync Standard Time
            const stdTime = DateLogic.getStandardTime(targetKey);
            if (stdTime) {
                DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.gio`, stdTime.h);
                DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.phut`, stdTime.m);
                this._checkTimeColor(targetKey);
            }
        }
    }

    _checkTimeColor(baseKey) {
        const hRef = this._refs[`${baseKey}.gio`];
        const mRef = this._refs[`${baseKey}.phut`];
        if (!hRef || !mRef) return;

        const isStd = DateLogic.isStandardTime(baseKey, hRef.value, mRef.value);

        [hRef, mRef].forEach(el => {
            if (el.dataset.hasError) return;
            if (el.dataset.logicStyle) return;

            if (isStd) {
                el.classList.remove('date-input-non-standard');
                el.classList.add('date-input-standard');
                el.style.backgroundColor = 'transparent';
                el.style.color = '#000';
                el.dataset.isStandard = "true";
            } else {
                el.classList.remove('date-input-standard');
                el.classList.add('date-input-non-standard');
                el.style.backgroundColor = '#ffe6e6';
                el.style.color = '#c62828';
                delete el.dataset.isStandard;
            }
        });
    }

    // --- Public API (For External consumers like ScanAction via Widget) ---

    triggerCompute() {
        const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];
        for (const baseKey of dateKeys) {
            const solarState = DateGridDOM.getSolarState(this._refs, baseKey);
            if (solarState.d && solarState.m) {
                const lunarResult = DateLogic.computeLunarFromSolar(solarState.d, solarState.m, solarState.y);
                if (lunarResult) {
                    DateGridDOM.updateLunarUI(this._refs, baseKey, lunarResult);
                }
            }
            this._checkTimeColor(baseKey);
        }
    }
}
