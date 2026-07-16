import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from './dateGridTestUtils.js';
import {
    applyTimeStyle,
    DATE_GRID_ROW_KEYS,
    getCheckedDependentRows,
    getDependentOffset,
    shouldSyncFromMasterInput
} from './dateGridControllerSupport.js';

describe('dateGridControllerSupport', () => {
    it('returns the checked dependent rows with the expected offsets', () => {
        const refs = {
            date_le_auto: createInput({ type: 'checkbox', checked: false })
        };
        refs['date.le_auto'] = createInput({ type: 'checkbox', checked: true });
        refs['date.nhap_auto'] = createInput({ type: 'checkbox', checked: false });

        assert.deepEqual(getCheckedDependentRows(refs), [{ baseKey: 'date.le', offset: 0 }]);
        refs['date.nhap_auto'].checked = true;
        assert.deepEqual(getCheckedDependentRows(refs), [
            { baseKey: 'date.le', offset: 0 },
            { baseKey: 'date.nhap', offset: -1 }
        ]);
    });

    it('applies non-standard and standard time styles while skipping blocked refs', () => {
        const refs = {
            'date.le.gio': createInput({ type: 'number', value: '13' }),
            'date.le.phut': createInput({ type: 'number', value: '15' }),
            'date.nhap.gio': createInput({ type: 'number', value: '11' }),
            'date.nhap.phut': createInput({ type: 'number', value: '00' })
        };
        refs['date.nhap.gio'].dataset.hasError = 'true';
        refs['date.nhap.phut'].dataset.logicStyle = 'true';

        assert.equal(applyTimeStyle(refs, 'date.le', false), true);
        assert.equal(refs['date.le.gio'].classList.contains('date-input-non-standard'), true);
        assert.equal(refs['date.le.gio'].style.backgroundColor, '#ffe6e6');
        assert.equal(refs['date.le.gio'].dataset.isStandard, undefined);

        assert.equal(applyTimeStyle(refs, 'date.le', true), true);
        assert.equal(refs['date.le.gio'].classList.contains('date-input-standard'), true);
        assert.equal(refs['date.le.gio'].style.color, '#000');
        assert.equal(refs['date.le.gio'].dataset.isStandard, 'true');

        assert.equal(applyTimeStyle(refs, 'date.nhap', false), true);
        assert.equal(refs['date.nhap.gio'].className, '');
        assert.equal(refs['date.nhap.phut'].className, '');
    });

    it('exposes the stable controller constants and gating helpers', () => {
        assert.deepEqual(DATE_GRID_ROW_KEYS, ['date.tiec', 'date.le', 'date.nhap']);
        assert.equal(shouldSyncFromMasterInput('date.tiec', 'solar'), true);
        assert.equal(shouldSyncFromMasterInput('date.le', 'solar'), false);
        assert.equal(getDependentOffset('date.le'), 0);
        assert.equal(getDependentOffset('date.nhap'), -1);
    });
});
