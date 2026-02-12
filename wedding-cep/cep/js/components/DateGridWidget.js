/**
 * MODULE: DateGridWidget
 * LAYER: Components
 * PURPOSE: Mediator — init calendar, render view, bind events, orchestrate data flow
 * DEPENDENCIES: DateGridRenderer, DateLogic, DateGridDOM, CalendarEngine, InputEngine
 * SIDE EFFECTS: DOM (via DateGridDOM)
 * EXPORTS: DateGridWidget.create(), .triggerCompute(), .setChangeHandler()
 */
import { DateGridRenderer } from './DateGridRenderer.js';
import { DateGridDOM } from './helpers/DateGridDOM.js';
import { CalendarEngine } from '../logic/domain/calendar.js';
import { InputEngine } from '../logic/ux/InputEngine.js';
import { DateLogic } from '../logic/DateLogic.js';

export const DateGridWidget = {
    _refs: {},
    _onGlobalChange: null,

    create(container, dateConfigs, refs) {
        this._refs = refs || {};
        this._initEngines();
        const grid = DateGridRenderer.render(container, dateConfigs, this._refs);
        this._bindEvents();

        dateConfigs.forEach(config => {
            if (!config.key.includes('tiec')) {
                setTimeout(() => DateGridDOM.toggleRowState(this._refs, config.key, true), 0);
            }
        });

        return grid;
    },

    setChangeHandler(fn) {
        this._onGlobalChange = fn;
    },

    _initEngines() {
        if (typeof CalendarEngine !== 'undefined') {
            CalendarEngine.loadDatabase();
        }
    },

    _bindEvents() {
        Object.values(this._refs).forEach(ref => {
            if (ref.tagName === 'INPUT' && ref.type === 'number') {
                ref.addEventListener('blur', () => this._handleBlur(ref));
                ref.addEventListener('input', () => this._handleInput(ref));
            } else if (ref.tagName === 'INPUT' && ref.type === 'checkbox') {
                ref.addEventListener('change', () => {
                    const key = Object.keys(this._refs).find(k => this._refs[k] === ref);
                    if (key) {
                        const baseKey = key.replace('_auto', '');
                        DateGridDOM.toggleRowState(this._refs, baseKey, ref.checked);
                        if (ref.checked) this._syncFromMaster(baseKey);
                    }
                });
            }
        });
    },

    // --- Event Handlers ---

    _handleBlur(ref) {
        const key = ref.dataset.key;
        const baseKey = ref.dataset.baseKey;
        const type = ref.dataset.type;

        if (typeof InputEngine !== 'undefined') {
            const result = InputEngine.process(ref.value, key);
            if (result.value !== ref.value) ref.value = result.value;
            DateGridDOM.updateErrorState(ref, result.warnings);
        }

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

        if (typeof InputEngine !== 'undefined') {
            const currentData = DateGridDOM.collectCurrentData(this._refs);
            const logicResult = InputEngine.validateDateLogic(currentData);
            DateGridDOM.showLogicFeedback(this._refs, logicResult);
        }
    },

    _handleInput(ref) {
        const baseKey = ref.dataset.baseKey;
        const type = ref.dataset.type;
        const key = ref.dataset.key;

        if (baseKey === 'date.tiec' && type === 'solar') {
            this._syncDependentRows();
        }
        if (this._onGlobalChange) this._onGlobalChange(key, ref.value);
    },

    // --- Logic Helpers ---

    _syncDependentRows() {
        if (this._refs['date.le_auto']?.checked) this._syncFromMaster('date.le', 0);
        if (this._refs['date.nhap_auto']?.checked) this._syncFromMaster('date.nhap', -1);
    },

    _syncFromMaster(targetKey, offset = 0) {
        const tiecState = DateGridDOM.getSolarState(this._refs, 'date.tiec');
        const dependentResult = DateLogic.computeDependentDate(tiecState.d, tiecState.m, offset);

        if (dependentResult) {
            DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.ngay`, dependentResult.day);
            DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.thang`, dependentResult.month);

            const lunarResult = DateLogic.computeLunarFromSolar(dependentResult.day, dependentResult.month, dependentResult.year);
            if (lunarResult) DateGridDOM.updateLunarUI(this._refs, targetKey, lunarResult);

            const stdTime = DateLogic.getStandardTime(targetKey);
            if (stdTime) {
                DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.gio`, stdTime.h);
                DateGridDOM.updateFieldSilently(this._refs, `${targetKey}.phut`, stdTime.m);
                this._checkTimeColor(targetKey);
            }
        }
    },

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
    },

    // --- Public API ---

    triggerCompute() {
        const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];
        for (const baseKey of dateKeys) {
            const solarState = DateGridDOM.getSolarState(this._refs, baseKey);
            if (solarState.d && solarState.m) {
                const lunarResult = DateLogic.computeLunarFromSolar(solarState.d, solarState.m, solarState.y);
                if (lunarResult) DateGridDOM.updateLunarUI(this._refs, baseKey, lunarResult);
            }
            this._checkTimeColor(baseKey);
        }
    }
};

