import { DomFactory } from '../helpers/DomFactory.js';

export const INFO_LE_OPTIONS = Object.freeze([
    'T\u00e2n H\u00f4n',
    'Th\u00e0nh H\u00f4n',
    'Vu Quy',
    'B\u00e1o H\u1ef7'
]);

export const VITHU_NAM_OPTIONS = Object.freeze([
    'Tr\u01b0\u1edfng Nam',
    'Th\u1ee9 Nam',
    '\u00dat Nam',
    'Qu\u00fd Nam',
    '\u00c1i Nam',
    '... Nam'
]);

export const VITHU_NU_OPTIONS = Object.freeze([
    'Tr\u01b0\u1edfng N\u1eef',
    'Th\u1ee9 N\u1eef',
    '\u00dat N\u1eef',
    'Qu\u00fd N\u1eef',
    '\u00c1i N\u1eef',
    '... N\u1eef'
]);

export const FAMILY_FIELDS = Object.freeze([
    { label: '\u00d4ng', key: 'ong', hasIdx: true, rows: 2 },
    { label: 'B\u00e0', key: 'ba', hasIdx: true, rows: 2 },
    { label: '\u0110\u1ecba ch\u1ec9', key: 'diachi', hasIdx: false, rows: 2 },
    { label: 'Con', key: 'con_full', hasIdx: true, rows: 2 }
]);

export const DATE_GRID_CONFIGS = Object.freeze([
    { key: 'date.tiec', label: 'Ti\u1ec7c', standardType: 'TIEC' },
    { key: 'date.le', label: 'L\u1ec5', standardType: 'LE' },
    { key: 'date.nhap', label: 'Nh\u00e1p', standardType: 'NHAP' }
]);

export const DATE_ACTION_BUTTONS = Object.freeze([
    { id: 'btn-compact-swap', label: '\u{1F504} Swap', title: 'Ho\u00e1n \u0111\u1ed5i POS1 \u2194 POS2' },
    { id: 'btn-compact-scan', label: '\u{1F4E5} Scan', title: 'Qu\u00e9t t\u1eeb AI document' },
    { id: 'btn-compact-update', label: '\u{1F4E4} Update', title: 'C\u1eadp nh\u1eadt v\u00e0o AI document' }
]);

export function createFamilyFieldKeys(field) {
    return {
        pos1: `pos1.${field.key}`,
        pos2: `pos2.${field.key}`
    };
}

export function getDocumentRef(deps = {}) {
    return deps.document || document;
}

export function buildRankingRow({ createRow, createInlineRadio }) {
    const rankingRow = createRow();
    rankingRow.appendChild(DomFactory.createSpan('', 'width: auto; margin-right: 4px; font-weight: 600; color: #111;'));
    rankingRow.appendChild(createInlineRadio('ui.vithu_nam', VITHU_NAM_OPTIONS, '', { checkedIndex: -1 }));
    rankingRow.appendChild(DomFactory.createSeparator());
    rankingRow.appendChild(DomFactory.createSpan('', 'width: auto; margin-right: 4px; font-weight: 600; color: #111;'));
    rankingRow.appendChild(createInlineRadio('ui.vithu_nu', VITHU_NU_OPTIONS, '', { checkedIndex: -1 }));
    return rankingRow;
}

export function createDateGridConfigs(schema = {}) {
    const standardTimes = schema?.STANDARD_TIMES || {};

    return DATE_GRID_CONFIGS.map((config) => {
        const standardTime = standardTimes[config.standardType];
        return standardTime ? { ...config, standardTime } : { ...config };
    });
}

export function buildFamilyColumns({
    documentRef = getDocumentRef(),
    createRow,
    createLabel,
    createTextareaWithIdx
}) {
    const columnsWrapper = documentRef.createElement('div');
    columnsWrapper.style.cssText = 'display: flex; gap: 4px;';

    const pos1Col = DomFactory.createColumn('POS 1');
    const pos2Col = DomFactory.createColumn('POS 2');

    FAMILY_FIELDS.forEach((field) => {
        const keys = createFamilyFieldKeys(field);

        const pos1Row = createRow();
        pos1Row.style.alignItems = 'flex-start';
        const pos1Label = createLabel(field.label);
        pos1Label.style.marginTop = '4px';
        pos1Label.style.width = '35px';
        pos1Row.appendChild(pos1Label);
        pos1Row.appendChild(createTextareaWithIdx(keys.pos1, field.rows, field.hasIdx));
        pos1Col.appendChild(pos1Row);

        const pos2Row = createRow();
        pos2Row.style.alignItems = 'flex-start';
        pos2Row.appendChild(createTextareaWithIdx(keys.pos2, field.rows, field.hasIdx));
        pos2Col.appendChild(pos2Row);
    });

    columnsWrapper.appendChild(pos1Col);
    columnsWrapper.appendChild(pos2Col);
    return columnsWrapper;
}

export function buildVenueLayout({
    createRow,
    createLabel,
    createInlineRadio,
    createTextareaWithAuto,
    createTextarea
}) {
    const hostLabel = DomFactory.createSpan('Ch\u1ee7 ti\u1ec7c:', 'margin-left: auto; font-size: 9px; color: #666;');
    const hostRadio = createInlineRadio('ceremony.host_type', ['Nh\u00e0 Trai', 'Nh\u00e0 G\u00e1i']);
    hostRadio.style.marginLeft = '4px';

    const headerRow = createRow();
    headerRow.style.cssText = 'font-weight: 600; font-size: 9px; color: #666;';
    headerRow.innerHTML = '<span style="width:50px"></span><span style="flex:1;text-align:center">L\u1ec4</span><span style="flex:1;text-align:center">TI\u1ec6C</span>';

    const nameRow = createRow();
    nameRow.style.alignItems = 'flex-start';
    const nameLabel = createLabel('T\u00ean');
    nameLabel.style.marginTop = '4px';
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(createTextareaWithAuto('ceremony.ten', 2, true));
    nameRow.appendChild(createTextareaWithAuto('venue.ten', 2, true));

    const addressRow = createRow();
    addressRow.style.alignItems = 'flex-start';
    addressRow.appendChild(createLabel('\u0110\u1ecba ch\u1ec9'));
    addressRow.appendChild(createTextarea('ceremony.diachi', 2));
    addressRow.appendChild(createTextarea('venue.diachi', 2));

    return {
        headerNodes: [hostLabel, hostRadio],
        bodyRows: [headerRow, nameRow, addressRow]
    };
}

export function buildDateGroupLayout({
    documentRef = getDocumentRef(),
    schema = {},
    adapter,
    createButton
}) {
    const wrapper = documentRef.createElement('div');
    wrapper.style.cssText = 'display: flex; gap: 8px;';

    const dateCol = documentRef.createElement('div');
    dateCol.style.flex = '1';
    adapter.mountDateGrid(dateCol, createDateGridConfigs(schema));
    wrapper.appendChild(dateCol);

    const actionCol = documentRef.createElement('div');
    actionCol.style.cssText = 'display: flex; flex-direction: column; gap: 4px; width: 60px;';

    DATE_ACTION_BUTTONS.forEach((action) => {
        const button = createButton(action.id, action.label, action.title);
        actionCol.appendChild(button);
        adapter.registerButtonRef(action.id, button);
    });

    wrapper.appendChild(actionCol);
    return wrapper;
}
