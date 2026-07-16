export const DATE_GRID_ROW_KEYS = Object.freeze(['date.tiec', 'date.le', 'date.nhap']);

export function shouldSyncFromMasterInput(baseKey, type) {
    return baseKey === 'date.tiec' && type === 'solar';
}

export function getDependentOffset(baseKey) {
    return baseKey === 'date.le' ? 0 : -1;
}

export function getCheckedDependentRows(refs) {
    const rows = [];

    if (refs['date.le_auto']?.checked) {
        rows.push({ baseKey: 'date.le', offset: 0 });
    }

    if (refs['date.nhap_auto']?.checked) {
        rows.push({ baseKey: 'date.nhap', offset: -1 });
    }

    return rows;
}

export function applyTimeStyle(refs, baseKey, isStandard) {
    const hRef = refs[`${baseKey}.gio`];
    const mRef = refs[`${baseKey}.phut`];
    if (!hRef || !mRef) {
        return false;
    }

    [hRef, mRef].forEach((element) => {
        if (element.dataset.hasError || element.dataset.logicStyle) {
            return;
        }

        if (isStandard) {
            element.classList.remove('date-input-non-standard');
            element.classList.add('date-input-standard');
            element.style.backgroundColor = 'transparent';
            element.style.color = '#000';
            element.dataset.isStandard = 'true';
            return;
        }

        element.classList.remove('date-input-standard');
        element.classList.add('date-input-non-standard');
        element.style.backgroundColor = '#ffe6e6';
        element.style.color = '#c62828';
        delete element.dataset.isStandard;
    });

    return true;
}
