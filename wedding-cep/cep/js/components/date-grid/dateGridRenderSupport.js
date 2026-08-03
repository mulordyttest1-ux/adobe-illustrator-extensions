export const DATE_GRID_HEADER_LABELS = Object.freeze([
    '',
    'D\u01af\u01a0NG',
    '\u00c2M',
    'GI\u1edc',
    'N\u0102M | TH\u1ee8'
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

    const yearAuto = document.createElement('input');
    yearAuto.type = 'checkbox';
    yearAuto.checked = true;
    yearAuto.className = 'date-year-auto';
    yearAuto.dataset.role = 'year-auto';
    yearAuto.dataset.baseKey = baseKey;
    yearAuto.title = 'T\u1ef1 \u0111\u1ed9ng ch\u1ecdn n\u0103m s\u1eafp t\u1edbi';
    yearAuto.setAttribute('aria-label', `T\u1ef1 \u0111\u1ed9ng ch\u1ecdn n\u0103m s\u1eafp t\u1edbi cho ${baseKey}`);

    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.value = String(new Date().getFullYear());
    yearInput.dataset.yearSource = 'default';
    yearInput.disabled = true;
    yearInput.className = 'date-year-input date-input-disabled';
    yearInput.dataset.key = `${baseKey}.nam`;
    yearInput.dataset.baseKey = baseKey;
    yearInput.dataset.type = 'year';
    yearInput.min = '1800';
    yearInput.max = '2199';
    yearInput.title = 'B\u1ecf ch\u1ecdn \u00f4 t\u1ef1 \u0111\u1ed9ng \u0111\u1ec3 s\u1eeda n\u0103m';

    const thuSpan = document.createElement('span');
    const namAlSpan = document.createElement('span');

    infoCol.appendChild(yearAuto);
    infoCol.appendChild(yearInput);
    infoCol.appendChild(document.createTextNode(' | '));
    infoCol.appendChild(thuSpan);
    infoCol.appendChild(document.createTextNode(' | '));
    infoCol.appendChild(namAlSpan);

    refs[`${baseKey}.nam_auto`] = yearAuto;
    refs[`${baseKey}.nam`] = yearInput;
    refs[`${baseKey}.thu`] = { isComputed: true, el: thuSpan };
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
