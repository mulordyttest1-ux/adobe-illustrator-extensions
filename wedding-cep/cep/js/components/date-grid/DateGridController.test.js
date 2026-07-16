import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateGridController } from './DateGridController.js';
import { createInput } from './dateGridTestUtils.js';

function createRefs() {
    const refs = {};
    ['date.tiec', 'date.le', 'date.nhap'].forEach((baseKey) => {
        refs[`${baseKey}.ngay`] = createInput({ type: 'number', value: '05', dataset: { key: `${baseKey}.ngay`, baseKey, type: 'solar' } });
        refs[`${baseKey}.thang`] = createInput({ type: 'number', value: '06', dataset: { key: `${baseKey}.thang`, baseKey, type: 'solar' } });
        refs[`${baseKey}.ngay_al`] = createInput({ type: 'number', value: '10', dataset: { key: `${baseKey}.ngay_al`, baseKey, type: 'lunar' } });
        refs[`${baseKey}.thang_al`] = createInput({ type: 'number', value: '11', dataset: { key: `${baseKey}.thang_al`, baseKey, type: 'lunar' } });
        refs[`${baseKey}.gio`] = createInput({ type: 'number', value: '11', dataset: { key: `${baseKey}.gio`, baseKey, type: 'time' } });
        refs[`${baseKey}.phut`] = createInput({ type: 'number', value: '00', dataset: { key: `${baseKey}.phut`, baseKey, type: 'time' } });
    });
    refs['date.le_auto'] = createInput({ type: 'checkbox', checked: true });
    refs['date.nhap_auto'] = createInput({ type: 'checkbox', checked: true });
    return refs;
}

function createControllerDeps(overrides = {}) {
    const calls = {
        loadDatabase: 0,
        updateErrorState: [],
        updateLunarUI: [],
        updateSolarUI: [],
        updateComputedInfo: [],
        updateFieldSilently: [],
        toggleRowState: [],
        collectCurrentData: 0,
        showLogicFeedback: [],
        getSolarState: [],
        getLunarState: [],
        computeLunarFromSolar: [],
        computeSolarFromLunar: [],
        computeDependentDate: [],
        getStandardTime: [],
        isStandardTime: []
    };

    const dateGridDom = {
        updateErrorState(ref, warnings) {
            calls.updateErrorState.push({ ref, warnings });
        },
        getSolarState(refs, baseKey) {
            calls.getSolarState.push(baseKey);
            return overrides.getSolarState?.(refs, baseKey) || { d: '05', m: '06', y: 2026 };
        },
        getLunarState(refs, baseKey) {
            calls.getLunarState.push(baseKey);
            return overrides.getLunarState?.(refs, baseKey) || { d: '10', m: '11' };
        },
        updateLunarUI(refs, baseKey, lunar) {
            calls.updateLunarUI.push({ baseKey, lunar });
        },
        updateSolarUI(refs, baseKey, solar) {
            calls.updateSolarUI.push({ baseKey, solar });
        },
        updateComputedInfo(refs, baseKey, info) {
            calls.updateComputedInfo.push({ baseKey, info });
        },
        collectCurrentData() {
            calls.collectCurrentData += 1;
            return { ok: true };
        },
        showLogicFeedback(refs, result) {
            calls.showLogicFeedback.push(result);
        },
        toggleRowState(refs, baseKey, isLocked) {
            calls.toggleRowState.push({ baseKey, isLocked });
        },
        updateFieldSilently(refs, key, value) {
            calls.updateFieldSilently.push({ key, value });
            if (refs[key]) {
                refs[key].value = String(value);
            }
        }
    };

    const dateLogic = {
        computeLunarFromSolar(d, m, y) {
            calls.computeLunarFromSolar.push({ d, m, y });
            return overrides.computeLunarFromSolar?.(d, m, y) || { lunar_day: '10', lunar_month: '11' };
        },
        computeSolarFromLunar(d, m) {
            calls.computeSolarFromLunar.push({ d, m });
            return overrides.computeSolarFromLunar?.(d, m) || {
                solar: { day: '07', month: '08' },
                fullInfo: { thu: 'Thu Hai', year: 2026, lunar_year_txt: 'Binh Ngo' }
            };
        },
        computeDependentDate(d, m, offset) {
            calls.computeDependentDate.push({ d, m, offset });
            return overrides.computeDependentDate?.(d, m, offset) || { day: '06', month: '06', year: 2026 };
        },
        getStandardTime(baseKey) {
            calls.getStandardTime.push(baseKey);
            return overrides.getStandardTime?.(baseKey) || { h: '11', m: '00' };
        },
        isStandardTime(baseKey, h, m) {
            calls.isStandardTime.push({ baseKey, h, m });
            return overrides.isStandardTime?.(baseKey, h, m) ?? true;
        }
    };

    const inputEngine = {
        process(value, key) {
            return overrides.process?.(value, key) || { value, warnings: [] };
        },
        validateDateLogic(data) {
            return overrides.validateDateLogic?.(data) || { warnings: [] };
        }
    };

    const calendarEngine = {
        loadDatabase() {
            calls.loadDatabase += 1;
        }
    };

    return { calls, deps: { dateGridDom, dateLogic, inputEngine, calendarEngine } };
}

describe('DateGridController', () => {
    it('handles solar blur by updating lunar values and syncing dependent rows', () => {
        const refs = createRefs();
        const { calls, deps } = createControllerDeps();
        const controller = new DateGridController(refs, null, deps);

        controller.handleBlur(refs['date.tiec.ngay']);

        assert.equal(calls.loadDatabase, 1);
        assert.equal(calls.updateErrorState.length, 1);
        assert.deepEqual(
            calls.updateLunarUI.map((entry) => entry.baseKey),
            ['date.tiec', 'date.le', 'date.nhap']
        );
        assert.ok(calls.updateFieldSilently.some((entry) => entry.key === 'date.le.ngay'));
        assert.ok(calls.updateFieldSilently.some((entry) => entry.key === 'date.nhap.gio'));
        assert.equal(calls.collectCurrentData, 1);
        assert.equal(calls.showLogicFeedback.length, 1);
    });

    it('handles lunar blur by updating solar values and computed info', () => {
        const refs = createRefs();
        const { calls, deps } = createControllerDeps();
        const controller = new DateGridController(refs, null, deps);

        controller.handleBlur(refs['date.le.ngay_al']);

        assert.deepEqual(calls.updateSolarUI.map((entry) => entry.baseKey), ['date.le']);
        assert.deepEqual(calls.updateComputedInfo.map((entry) => entry.baseKey), ['date.le']);
    });

    it('syncs dependent rows and notifies the form on master solar input', () => {
        const refs = createRefs();
        const { deps } = createControllerDeps();
        const notifications = [];
        const controller = new DateGridController(refs, (key, value) => notifications.push({ key, value }), deps);
        let syncCalls = 0;
        controller._syncDependentRows = () => {
            syncCalls += 1;
        };

        controller.handleInput(refs['date.tiec.ngay']);

        assert.equal(syncCalls, 1);
        assert.deepEqual(notifications, [{ key: 'date.tiec.ngay', value: '05' }]);
    });

    it('locks rows and applies the correct dependent offset on checkbox changes', () => {
        const refs = createRefs();
        const { calls, deps } = createControllerDeps();
        const controller = new DateGridController(refs, null, deps);
        const syncCalls = [];
        controller._syncFromMaster = (baseKey, offset) => syncCalls.push({ baseKey, offset });

        controller.handleCheckboxChange({ checked: true }, 'date.nhap');
        controller.handleCheckboxChange({ checked: false }, 'date.le');

        assert.deepEqual(calls.toggleRowState, [
            { baseKey: 'date.nhap', isLocked: true },
            { baseKey: 'date.le', isLocked: false }
        ]);
        assert.deepEqual(syncCalls, [{ baseKey: 'date.nhap', offset: -1 }]);
    });

    it('does not override time styles when the field already has error or logic styling', () => {
        const refs = createRefs();
        refs['date.le.gio'].dataset.hasError = 'true';
        refs['date.le.phut'].dataset.logicStyle = 'true';
        refs['date.le.gio'].style.backgroundColor = '#111';
        refs['date.le.phut'].style.backgroundColor = '#222';
        const { deps } = createControllerDeps({
            isStandardTime() {
                return false;
            }
        });
        const controller = new DateGridController(refs, null, deps);

        controller._checkTimeColor('date.le');

        assert.equal(refs['date.le.gio'].className, '');
        assert.equal(refs['date.le.gio'].style.backgroundColor, '#111');
        assert.equal(refs['date.le.phut'].className, '');
        assert.equal(refs['date.le.phut'].style.backgroundColor, '#222');
    });

    it('triggerCompute recomputes all date rows and re-checks time color', () => {
        const refs = createRefs();
        const { calls, deps } = createControllerDeps();
        const controller = new DateGridController(refs, null, deps);
        const checkedKeys = [];
        controller._checkTimeColor = (baseKey) => {
            checkedKeys.push(baseKey);
        };

        controller.triggerCompute();

        assert.deepEqual(
            calls.updateLunarUI.map((entry) => entry.baseKey),
            ['date.tiec', 'date.le', 'date.nhap']
        );
        assert.deepEqual(checkedKeys, ['date.tiec', 'date.le', 'date.nhap']);
    });
});
