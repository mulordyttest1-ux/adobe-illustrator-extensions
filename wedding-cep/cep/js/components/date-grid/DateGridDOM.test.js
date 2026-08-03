import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateGridDOM } from './DateGridDOM.js';
import { FakeDocument, createComputedRef, createInput } from './dateGridTestUtils.js';

function createRowRefs(baseKey) {
    const refs = {};
    ['ngay', 'thang', 'ngay_al', 'thang_al', 'gio', 'phut'].forEach((field) => {
        refs[`${baseKey}.${field}`] = createInput({
            type: 'number',
            dataset: {
                key: `${baseKey}.${field}`,
                baseKey,
                type: field.includes('_al') ? 'lunar' : field === 'gio' || field === 'phut' ? 'time' : 'solar'
            }
        });
    });
    refs[`${baseKey}.nam`] = createInput({
        type: 'number',
        value: '2026',
        dataset: { key: `${baseKey}.nam`, baseKey, type: 'year' }
    });
    refs[`${baseKey}.nam_auto`] = createInput({ type: 'checkbox', checked: true });
    refs[`${baseKey}.thu`] = createComputedRef();
    refs[`${baseKey}.namyy`] = { isComputed: true, value: '' };
    refs[`${baseKey}.nam_al`] = createComputedRef();
    return refs;
}

describe('DateGridDOM', () => {
    it('locks and unlocks a dependent row and updates fields silently', () => {
        const refs = createRowRefs('date.le');

        DateGridDOM.toggleRowState(refs, 'date.le', true);
        assert.equal(refs['date.le.ngay'].disabled, true);
        assert.equal(refs['date.le.ngay'].style.backgroundColor, '#f5f5f7');
        assert.equal(refs['date.le.ngay'].classList.contains('date-input-disabled'), true);

        DateGridDOM.toggleRowState(refs, 'date.le', false);
        assert.equal(refs['date.le.ngay'].disabled, false);
        assert.equal(refs['date.le.ngay'].style.backgroundColor, '#fff');
        assert.equal(refs['date.le.ngay'].classList.contains('date-input-disabled'), false);

        DateGridDOM.updateFieldSilently(refs, 'date.le.ngay', 3);
        assert.equal(refs['date.le.ngay'].value, '03');
    });

    it('writes computed info and shows warning feedback through the injected toast surface', () => {
        const document = new FakeDocument();
        const refs = {
            ...createRowRefs('date.tiec')
        };
        const grid = document.createElement('div');
        grid.className = 'date-grid';
        grid.appendChild(refs['date.tiec.ngay']);
        grid.appendChild(refs['date.tiec.thang']);
        grid.appendChild(refs['date.tiec.gio']);

        refs['date.tiec.thang'].dataset.hasError = 'true';
        const notifications = [];

        DateGridDOM.updateComputedInfo(refs, 'date.tiec', {
            thu: 'Thu Hai',
            year: 2026,
            lunar_year_txt: 'Binh Ngo',
            lunar_year: 2026,
            lunar_month: 11,
            leap: 0
        });

        assert.equal(refs['date.tiec.thu'].el.textContent, 'Thu Hai');
        assert.equal(refs['date.tiec.nam'].value, '2026');
        assert.equal(refs['date.tiec.namyy'].value, '26');
        assert.equal(refs['date.tiec.nam_al'].el.textContent, 'Binh Ngo');
        assert.equal(refs['date.tiec.nam'].dataset.lunarYear, '2026');
        assert.equal(refs['date.tiec.nam'].dataset.lunarMonth, '11');
        assert.equal(refs['date.tiec.nam'].dataset.lunarLeap, '0');

        DateGridDOM.showLogicFeedback(
            refs,
            { warnings: [{ message: 'Lech gio tieu chuan' }] },
            {
                UIFeedback: {
                    showToast(message, type) {
                        notifications.push({ message, type });
                    }
                }
            }
        );

        assert.equal(refs['date.tiec.ngay'].dataset.logicStyle, 'true');
        assert.equal(refs['date.tiec.ngay'].style.backgroundColor, '#fff3cd');
        assert.equal(refs['date.tiec.thang'].dataset.logicStyle, undefined);
        assert.match(grid.title, /Lech gio tieu chuan/);
        assert.deepEqual(notifications, [{ message: 'Lech gio tieu chuan', type: 'warning' }]);
    });

    it('clears logic styles and re-checks time color once per row when needed', () => {
        const refs = createRowRefs('date.le');
        refs['date.le.gio'].dataset.logicStyle = 'true';
        refs['date.le.phut'].dataset.logicStyle = 'true';
        refs['date.le.gio'].style.backgroundColor = '#fff3cd';
        refs['date.le.phut'].style.backgroundColor = '#fff3cd';

        const checkedRows = [];
        DateGridDOM.clearLogicStyles(refs, (baseKey) => checkedRows.push(baseKey));

        assert.equal(refs['date.le.gio'].dataset.logicStyle, undefined);
        assert.equal(refs['date.le.gio'].style.backgroundColor, 'transparent');
        assert.equal(refs['date.le.phut'].dataset.logicStyle, undefined);
        assert.deepEqual(checkedRows, ['date.le']);
    });
});
