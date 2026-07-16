export const DATE_GRID_HEADER_LABELS = Object.freeze([
    '',
    'D\u01af\u01a0NG',
    '\u00c2M',
    'GI\u1edc',
    ''
]);

export const DATE_GRID_PAIR_CONFIGS = Object.freeze([
    { field1: 'ngay', field2: 'thang', type: 'solar' },
    { field1: 'ngay_al', field2: 'thang_al', type: 'lunar' },
    { field1: 'gio', field2: 'phut', type: 'time' }
]);

export function createHeaderRow() {
    const header = document.createElement('div');
    header.className = 'date-grid-header';

    DATE_GRID_HEADER_LABELS.forEach((text) => {
        const item = document.createElement('div');
        if (text) {
            item.textContent = text;
            item.className = 'date-grid-header-item';
        }
        header.appendChild(item);
    });

    return header;
}

export function createLabelColumn(config, refs) {
    const labelCol = document.createElement('div');
    labelCol.className = 'date-label-col';
    const isMaster = config.key.includes('tiec');

    if (!isMaster) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.className = 'date-checkbox';
        refs[`${config.key}_auto`] = checkbox;
        labelCol.appendChild(checkbox);
    }

    const labelText = document.createElement('span');
    labelText.textContent = config.label;
    labelText.className = 'date-label-text';
    labelCol.appendChild(labelText);

    return labelCol;
}

export function createInfoColumn(baseKey, refs) {
    const infoCol = document.createElement('div');
    infoCol.className = 'date-info-col';

    const thuSpan = document.createElement('span');
    const namSpan = document.createElement('span');
    const namAlSpan = document.createElement('span');

    infoCol.appendChild(thuSpan);
    infoCol.appendChild(document.createTextNode(', '));
    infoCol.appendChild(namSpan);
    infoCol.appendChild(document.createTextNode(' | '));
    infoCol.appendChild(namAlSpan);

    refs[`${baseKey}.thu`] = { isComputed: true, el: thuSpan };
    refs[`${baseKey}.nam`] = { isComputed: true, el: namSpan };
    refs[`${baseKey}.namyy`] = { isComputed: true, value: '' };
    refs[`${baseKey}.nam_al`] = { isComputed: true, el: namAlSpan };

    return infoCol;
}

export function createPairConfigs() {
    return DATE_GRID_PAIR_CONFIGS;
}

export function createPairSeparator() {
    const separator = document.createElement('div');
    separator.style.width = '1px';
    separator.style.backgroundColor = '#eee';
    return separator;
}
