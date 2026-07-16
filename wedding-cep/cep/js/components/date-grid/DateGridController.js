/**
 * MODULE: DateGridController
 * LAYER: Components/DateGrid
 * PURPOSE: Logic hub for DateGridWidget
 * DEPENDENCIES: DateLogic, DateGridDOM, CalendarEngine, InputEngine
 * SIDE EFFECTS: DOM manipulation (via DateGridDOM calls)
 * EXPORTS: DateGridController class
 */

import { DateGridDOM } from './DateGridDOM.js';
import { CalendarEngine, DateLogic } from '@wedding/domain';
import { InputEngine } from '../../logic/ux/InputEngine.js';
import {
    applyTimeStyle,
    DATE_GRID_ROW_KEYS,
    getCheckedDependentRows,
    getDependentOffset,
    shouldSyncFromMasterInput
} from './dateGridControllerSupport.js';

export class DateGridController {
    /**
     * @param {Object} refs - DOM references provided by DateGridWidget
     * @param {Function} onGlobalChange - Callback to notify parent (FormBuilder) of changes
     * @param {Object} deps - Narrow test seams for core collaborators
     */
    constructor(refs, onGlobalChange, deps = {}) {
        this._refs = refs || {};
        this._onGlobalChange = onGlobalChange || null;
        this._dateGridDom = deps.dateGridDom || DateGridDOM;
        this._dateLogic = deps.dateLogic || DateLogic;
        this._calendarEngine = deps.calendarEngine || CalendarEngine;
        this._inputEngine = deps.inputEngine || InputEngine;
        this._initEngines();
    }

    _initEngines() {
        if (typeof this._calendarEngine?.loadDatabase === 'function') {
            this._calendarEngine.loadDatabase();
        }
    }

    handleBlur(ref) {
        const key = ref.dataset.key;
        const baseKey = ref.dataset.baseKey;
        const type = ref.dataset.type;

        const result = this._inputEngine.process(ref.value, key);
        if (result.value !== ref.value) {
            ref.value = result.value;
        }
        this._dateGridDom.updateErrorState(ref, result.warnings);

        if (type === 'solar') {
            const solarState = this._dateGridDom.getSolarState(this._refs, baseKey);
            const lunarResult = this._dateLogic.computeLunarFromSolar(solarState.d, solarState.m, solarState.y);
            if (lunarResult) {
                this._dateGridDom.updateLunarUI(this._refs, baseKey, lunarResult);
                if (baseKey === 'date.tiec') {
                    this._syncDependentRows();
                }
            }
        } else if (type === 'lunar') {
            const lunarState = this._dateGridDom.getLunarState(this._refs, baseKey);
            const solarResult = this._dateLogic.computeSolarFromLunar(lunarState.d, lunarState.m);
            if (solarResult) {
                this._dateGridDom.updateSolarUI(this._refs, baseKey, solarResult.solar);
                this._dateGridDom.updateComputedInfo(this._refs, baseKey, solarResult.fullInfo);
                if (baseKey === 'date.tiec') {
                    this._syncDependentRows();
                }
            }
        } else if (type === 'time') {
            this._checkTimeColor(baseKey);
        }

        const currentData = this._dateGridDom.collectCurrentData(this._refs);
        const logicResult = this._inputEngine.validateDateLogic(currentData);
        this._dateGridDom.showLogicFeedback(this._refs, logicResult);
    }

    handleInput(ref) {
        const baseKey = ref.dataset.baseKey;
        const type = ref.dataset.type;
        const key = ref.dataset.key;

        if (shouldSyncFromMasterInput(baseKey, type)) {
            this._syncDependentRows();
        }

        if (this._onGlobalChange) {
            this._onGlobalChange(key, ref.value);
        }
    }

    handleCheckboxChange(ref, baseKey) {
        this._dateGridDom.toggleRowState(this._refs, baseKey, ref.checked);
        if (ref.checked) {
            this._syncFromMaster(baseKey, getDependentOffset(baseKey));
        }
    }

    _syncDependentRows() {
        getCheckedDependentRows(this._refs).forEach(({ baseKey, offset }) => {
            this._syncFromMaster(baseKey, offset);
        });
    }

    _syncFromMaster(targetKey, offset = 0) {
        const tiecState = this._dateGridDom.getSolarState(this._refs, 'date.tiec');
        const dependentResult = this._dateLogic.computeDependentDate(tiecState.d, tiecState.m, offset);

        if (!dependentResult) {
            return;
        }

        this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.ngay`, dependentResult.day);
        this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.thang`, dependentResult.month);

        const lunarResult = this._dateLogic.computeLunarFromSolar(
            dependentResult.day,
            dependentResult.month,
            dependentResult.year
        );
        if (lunarResult) {
            this._dateGridDom.updateLunarUI(this._refs, targetKey, lunarResult);
        }

        const stdTime = this._dateLogic.getStandardTime(targetKey);
        if (stdTime) {
            this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.gio`, stdTime.h);
            this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.phut`, stdTime.m);
            this._checkTimeColor(targetKey);
        }
    }

    _checkTimeColor(baseKey) {
        const hRef = this._refs[`${baseKey}.gio`];
        const mRef = this._refs[`${baseKey}.phut`];
        if (!hRef || !mRef) {
            return;
        }

        const isStd = this._dateLogic.isStandardTime(baseKey, hRef.value, mRef.value);
        applyTimeStyle(this._refs, baseKey, isStd);
    }

    triggerCompute() {
        for (const baseKey of DATE_GRID_ROW_KEYS) {
            const solarState = this._dateGridDom.getSolarState(this._refs, baseKey);
            if (solarState.d && solarState.m) {
                const lunarResult = this._dateLogic.computeLunarFromSolar(solarState.d, solarState.m, solarState.y);
                if (lunarResult) {
                    this._dateGridDom.updateLunarUI(this._refs, baseKey, lunarResult);
                }
            }
            this._checkTimeColor(baseKey);
        }
    }
}
