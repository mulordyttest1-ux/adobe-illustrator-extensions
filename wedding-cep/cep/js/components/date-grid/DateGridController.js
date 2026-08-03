/**
 * MODULE: DateGridController
 * LAYER: Components/DateGrid
 * PURPOSE: Logic hub for DateGridWidget
 * DEPENDENCIES: DateLogic, DateGridDOM, CalendarEngine, InputEngine
 * SIDE EFFECTS: DOM manipulation (via DateGridDOM calls)
 * EXPORTS: DateGridController class
 */

import { DateGridDOM } from './DateGridDOM.js';
import { DateLogic } from '@wedding/domain';
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
        this._inputEngine = deps.inputEngine || InputEngine;
    }

    _buildLunarConversionOptions(lunarState) {
        const currentMonth = Number(lunarState.m);
        const knownMonth = Number(lunarState.lunarMonth);
        const hasKnownMonth = Number.isInteger(knownMonth) && knownMonth === currentMonth;

        return {
            autoYear: this._dateGridDom.isYearAuto?.(this._refs, lunarState.baseKey) || false,
            lunarYear: hasKnownMonth ? lunarState.lunarYear : null,
            lunarMonth: hasKnownMonth ? lunarState.lunarMonth : null,
            lunarLeap: hasKnownMonth ? lunarState.lunarLeap : null,
            anchor: lunarState.anchor
        };
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

        if (type === 'solar' || type === 'year') {
            const lunarResult = this._recomputeDateRow(baseKey);
            if (lunarResult && baseKey === 'date.tiec') {
                this._syncDependentRows();
            }
        } else if (type === 'lunar') {
            const lunarState = this._dateGridDom.getLunarState(this._refs, baseKey);
            const solarResult = this._dateLogic.computeSolarFromLunar(
                lunarState.d,
                lunarState.m,
                lunarState.y,
                this._buildLunarConversionOptions({
                    ...lunarState,
                    baseKey
                })
            );
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

    handleYearAutoChange(ref, baseKey) {
        this._dateGridDom.toggleYearState(this._refs, baseKey, ref.checked);
        this._dateGridDom.markYearSource?.(
            this._refs,
            baseKey,
            ref.checked ? 'default' : 'manual'
        );
        if (ref.checked) {
            const currentYear = this._dateGridDom.getCurrentYear();
            this._dateGridDom.updateFieldSilently(this._refs, `${baseKey}.nam`, currentYear);
            const lunarResult = this._recomputeDateRow(baseKey);
            if (lunarResult && baseKey === 'date.tiec') {
                this._syncDependentRows();
            }
        }

        if (this._onGlobalChange) {
            this._onGlobalChange(`${baseKey}.nam_auto`, ref.checked);
            this._onGlobalChange(`${baseKey}.nam`, this._refs[`${baseKey}.nam`]?.value || '');
        }
    }

    _syncDependentRows() {
        getCheckedDependentRows(this._refs).forEach(({ baseKey, offset }) => {
            this._syncFromMaster(baseKey, offset);
        });
    }

    _syncFromMaster(targetKey, offset = 0) {
        const tiecState = this._dateGridDom.getSolarState(this._refs, 'date.tiec');
        const dependentResult = this._dateLogic.computeDependentDate(
            tiecState.d,
            tiecState.m,
            offset,
            tiecState.y
        );

        if (!dependentResult) {
            return;
        }

        this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.ngay`, dependentResult.day);
        this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.thang`, dependentResult.month);
        this._dateGridDom.updateFieldSilently(this._refs, `${targetKey}.nam`, dependentResult.year);

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
            this._recomputeDateRow(baseKey);
            this._checkTimeColor(baseKey);
        }
    }

    _recomputeDateRow(baseKey) {
        const solarState = this._dateGridDom.getSolarState(this._refs, baseKey);
        if (!solarState.d || !solarState.m || !solarState.y) {
            return null;
        }

        if (
            this._dateGridDom.isYearAuto?.(this._refs, baseKey)
            && !this._dateGridDom.isYearExplicit?.(this._refs, baseKey)
        ) {
            const smartYear = this._dateLogic.resolveSmartSolarYear?.(
                solarState.d,
                solarState.m
            );
            if (smartYear) {
                this._dateGridDom.updateFieldSilently(
                    this._refs,
                    `${baseKey}.nam`,
                    smartYear
                );
                this._dateGridDom.markYearSource?.(this._refs, baseKey, 'smart');
                solarState.y = smartYear;
            }
        }

        const lunarResult = this._dateLogic.computeLunarFromSolar(
            solarState.d,
            solarState.m,
            solarState.y
        );
        if (lunarResult) {
            this._dateGridDom.updateLunarUI(this._refs, baseKey, lunarResult);
        }
        return lunarResult;
    }
}
