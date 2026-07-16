function createButton(config) {
    return Object.freeze({
        classNames: [],
        dataset: {},
        style: '',
        ...config
    });
}

const SINGLE_INJECT_FIELDS = Object.freeze([
    { suffix: 'ong', label: '{ong}', token: 'ong', actionKind: 'singleInject' },
    { suffix: 'ba', label: '{ba}', token: 'ba', actionKind: 'singleInject' },
    { suffix: 'ongba', label: '{ongba}', token: 'ongba', actionKind: 'singleInject' },
    { suffix: 'diachi', label: '{diachi}', token: 'diachi', actionKind: 'singleInject' },
    { suffix: 'vithu', label: '{vithu}', token: 'vithu', actionKind: 'singleInject' },
    { suffix: 'con_first', label: '{con_first}', token: 'con_first', actionKind: 'singleInject' },
    { suffix: 'con_full', label: '{con_full}', token: 'con_full', actionKind: 'singleInject' },
    { suffix: 'con_full_lot', label: '{....lot}', token: 'con_full.lot', actionKind: 'singleInject' },
    { suffix: 'con_full_ten', label: '{....ten}', token: 'con_full.ten', actionKind: 'singleInject' },
    { suffix: 'con_full_dau', label: '{....dau}', token: 'con_full.dau', actionKind: 'singleInject' },
    { suffix: 'con_ho_ten', label: '{ho+ten}', token: 'con_full.ho_dau|con_full.ten', actionKind: 'compoundInject' },
    { suffix: 'con_lot_ten', label: '{lot+ten}', token: 'con_full.lot|con_full.ten', actionKind: 'compoundInject' }
]);

function buildSchemaValue(prefix, token) {
    return token
        .split('|')
        .map((part) => `{${prefix}.${part}}`)
        .join('|');
}

function createSingleInjectButtons(prefix) {
    return SINGLE_INJECT_FIELDS.map((field) => {
        const schemaValue = buildSchemaValue(prefix, field.token);
        return createButton({
            id: `btn-single-${prefix}-${field.suffix}`,
            label: field.label,
            title: `Tiêm biến ${schemaValue}`,
            dataset: { schema: schemaValue },
            actionKind: field.actionKind
        });
    });
}

export const SCHEMA_TAB_SECTIONS = Object.freeze([
    {
        id: 'auto-inject',
        title: '🪄 Tiêm Tự Động Toàn Bộ',
        blocks: [
            {
                kind: 'directButtons',
                buttons: [
                    createButton({
                        id: 'btn-inject-auto',
                        label: '🪄 Tiêm Tự Động (Tên, Vị Thứ, Mốc Tiệc)',
                        title: 'Tự quét text & Thay thế Schema Phổ Biến (Mặc định Thời Gian được gán Mốc Tiệc)',
                        classNames: ['ds-btn-primary'],
                        style: 'width: 100%;',
                        actionKind: 'autoInject'
                    })
                ]
            }
        ]
    },
    {
        id: 'bulk-inject',
        title: '🚀 Tiêm Nhanh (Theo tọa độ Y)',
        bodyStyle: 'display: flex; flex-direction: column; gap: 8px;',
        blocks: [
            {
                kind: 'description',
                text: '* Bôi đen 4 dòng (Ông Bà + Ông + Bà + Đ/C) trên AI, sau đó bấm nút để máy tự gán từ Trên -> Xuống.',
                style: 'font-size: 10px; color: #666; font-style: italic;'
            },
            {
                kind: 'row',
                style: 'display: flex; gap: 8px;',
                buttons: [
                    createButton({
                        id: 'btn-bulk-pos1',
                        label: '☄️ Tiêm Cụm POS 1',
                        title: 'Gán {ongba}, {ong}, {ba}, {diachi} cho POS 1',
                        classNames: ['ds-btn-primary'],
                        style: 'flex: 1;',
                        actionKind: 'bulkInject',
                        prefix: 'pos1'
                    }),
                    createButton({
                        id: 'btn-bulk-pos2',
                        label: '☄️ Tiêm Cụm POS 2',
                        title: 'Gán {ongba}, {ong}, {ba}, {diachi} cho POS 2',
                        classNames: ['ds-btn-primary'],
                        style: 'flex: 1;',
                        actionKind: 'bulkInject',
                        prefix: 'pos2'
                    })
                ]
            }
        ]
    },
    {
        id: 'date-inject',
        title: '🗓 Tiêm Tay Ngày Tháng',
        bodyStyle: 'display: flex; flex-direction: column; gap: 6px;',
        blocks: [
            {
                kind: 'row',
                style: 'display: flex; gap: 6px;',
                buttons: [
                    createButton({
                        id: 'btn-date-clone-le',
                        label: '📋 Clone → Lễ',
                        title: 'Đổi metadata tiec → le cho frames đang chọn',
                        style: 'flex: 1;',
                        dataset: { cloneTarget: 'le' },
                        actionKind: 'dateClone'
                    }),
                    createButton({
                        id: 'btn-date-clone-nhap',
                        label: '📋 Clone → Nháp',
                        title: 'Đổi metadata tiec → nhap cho frames đang chọn',
                        style: 'flex: 1;',
                        dataset: { cloneTarget: 'nhap' },
                        actionKind: 'dateClone'
                    })
                ]
            },
            {
                kind: 'grid',
                style: 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;',
                buttons: [
                    createButton({ id: 'btn-date-gio', label: '{gio}', title: 'Tiêm {date.tiec.gio}', dataset: { schema: '{date.tiec.gio}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-phut', label: '{phut}', title: 'Tiêm {date.tiec.phut}', dataset: { schema: '{date.tiec.phut}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-thu', label: '{thu}', title: 'Tiêm {date.tiec.thu}', dataset: { schema: '{date.tiec.thu}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-ngay', label: '{ngay}', title: 'Tiêm {date.tiec.ngay}', dataset: { schema: '{date.tiec.ngay}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-thang', label: '{thang}', title: 'Tiêm {date.tiec.thang}', dataset: { schema: '{date.tiec.thang}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-nam', label: '{nam}', title: 'Tiêm {date.tiec.nam}', dataset: { schema: '{date.tiec.nam}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-namyy', label: '{namyy}', title: 'Tiêm {date.tiec.namyy}', dataset: { schema: '{date.tiec.namyy}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-ngay-al', label: '{ngay_al}', title: 'Tiêm {date.tiec.ngay_al}', dataset: { schema: '{date.tiec.ngay_al}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-thang-al', label: '{thang_al}', title: 'Tiêm {date.tiec.thang_al}', dataset: { schema: '{date.tiec.thang_al}' }, actionKind: 'singleInject' }),
                    createButton({ id: 'btn-date-nam-al', label: '{nam_al}', title: 'Tiêm {date.tiec.nam_al}', dataset: { schema: '{date.tiec.nam_al}' }, actionKind: 'singleInject' })
                ]
            }
        ]
    },
    {
        id: 'single-pos1',
        title: '👤 Tiêm Đơn: POS 1 (Nhà Trai)',
        panelStyle: 'background-color: var(--ds-bg-secondary);',
        blocks: [
            {
                kind: 'grid',
                style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;',
                buttons: createSingleInjectButtons('pos1')
            }
        ]
    },
    {
        id: 'single-pos2',
        title: '👤 Tiêm Đơn: POS 2 (Nhà Gái)',
        panelStyle: 'background-color: var(--ds-bg-secondary);',
        blocks: [
            {
                kind: 'grid',
                style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;',
                buttons: createSingleInjectButtons('pos2')
            }
        ]
    },
    {
        id: 'venue-inject',
        title: '📍 Tiêm Đơn: Thông tin Tiệc & Lễ',
        blocks: [
            {
                kind: 'grid',
                style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 4px;',
                buttons: [
                    createButton({
                        id: 'btn-single-venue-ten',
                        label: 'Nơi Tiệc',
                        title: 'Tiêm biến {venue.ten}',
                        dataset: { schema: '{venue.ten}' },
                        actionKind: 'singleInject'
                    }),
                    createButton({
                        id: 'btn-single-venue-diachi',
                        label: 'Đ/C Tiệc',
                        title: 'Tiêm biến {venue.diachi}',
                        dataset: { schema: '{venue.diachi}' },
                        actionKind: 'singleInject'
                    }),
                    createButton({
                        id: 'btn-single-ceremony-ten',
                        label: 'Nơi Lễ',
                        title: 'Tiêm biến {ceremony.ten}',
                        dataset: { schema: '{ceremony.ten}' },
                        actionKind: 'singleInject'
                    }),
                    createButton({
                        id: 'btn-single-ceremony-diachi',
                        label: 'Đ/C Lễ',
                        title: 'Tiêm biến {ceremony.diachi}',
                        dataset: { schema: '{ceremony.diachi}' },
                        actionKind: 'singleInject'
                    }),
                    createButton({
                        id: 'btn-single-info-ten_le',
                        label: 'Loại Lễ',
                        title: 'Tiêm biến {info.ten_le}',
                        dataset: { schema: '{info.ten_le}' },
                        actionKind: 'singleInject'
                    })
                ]
            }
        ]
    }
]);

function flattenButtons(sections) {
    return sections.flatMap((section) =>
        section.blocks.flatMap((block) => block.buttons || [])
    );
}

export const SCHEMA_TAB_BUTTONS_BY_ID = Object.freeze(
    Object.fromEntries(
        flattenButtons(SCHEMA_TAB_SECTIONS).map((button) => [button.id, button])
    )
);
