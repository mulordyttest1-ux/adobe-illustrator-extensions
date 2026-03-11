/**
 * SchemaTabComponents.js
 * Chuyên trách xây dựng UI cho Tab 2 (Manual Schema Inject)
 */
import { DomFactory } from '../helpers/DomFactory.js';

export class SchemaTabComponents {
    constructor(container, refs = {}) {
        this.container = container; // Should be `#schema-tab-content`
        this.refs = refs;
    }

    render() {
        this.container.innerHTML = ''; // Clear loading state

        const wrapper = document.createElement('div');
        wrapper.className = 'ds-flex-col ds-gap-md';
        wrapper.style.padding = '8px';

        // 0. Nhóm Tiêm Tự Động Toàn Cục
        wrapper.appendChild(this._buildAutoInjectGroup());

        // 1. Nhóm Tiêm Cụm Tọa Độ
        wrapper.appendChild(this._buildBulkInjectGroup());

        // 2. Nhóm Tiêm Tay Ngày Tháng
        wrapper.appendChild(this._buildDateInjectGroup());

        // 3. Nhóm Tiêm Thủ Công POS 1
        wrapper.appendChild(this._buildSingleInjectGroup('POS 1 (Nhà Trai)', 'pos1', 'var(--ds-bg-secondary)'));

        // 4. Nhóm Tiêm Thủ Công POS 2
        wrapper.appendChild(this._buildSingleInjectGroup('POS 2 (Nhà Gái)', 'pos2', 'var(--ds-bg-secondary)'));

        // 5. Nhóm Thông Tin Tiệc
        wrapper.appendChild(this._buildVenueInjectGroup());

        this.container.appendChild(wrapper);
    }


    _buildAutoInjectGroup() {
        const panel = DomFactory.createPanel('🪄 Tiêm Tự Động Toàn Bộ');
        const body = panel.querySelector('.compact-panel-body');

        const btn = DomFactory.createButton('btn-inject-auto', '🪄 Tiêm Tự Động (Tên, Vị Thứ, Mốc Tiệc)', 'Tự quét text & Thay thế Schema Phổ Biến (Mặc định Thời Gian được gán Mốc Tiệc)');
        btn.classList.add('ds-btn-primary');
        btn.style.width = '100%';
        this.refs['btn-inject-auto'] = btn;

        body.appendChild(btn);
        return panel;
    }

    _buildBulkInjectGroup() {
        const panel = DomFactory.createPanel('🚀 Tiêm Nhanh (Theo tọa độ Y)');
        const body = panel.querySelector('.compact-panel-body');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.gap = '8px';

        const desc = document.createElement('div');
        desc.style.cssText = 'font-size: 10px; color: #666; font-style: italic;';
        desc.innerText = '* Bôi đen 4 dòng (Địa Chỉ + Ông + Bà + Ông Bà) trên AI, sau đó bấm nút để máy tự gán từ Trên -> Xuống.';
        body.appendChild(desc);

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '8px';

        const bulkPos1Btn = DomFactory.createButton('btn-bulk-pos1', '☄️ Tiêm Cụm POS 1', 'Gán {ongba}, {ong}, {ba}, {diachi} cho POS 1');
        bulkPos1Btn.classList.add('ds-btn-primary');
        bulkPos1Btn.style.flex = '1';
        this.refs['btn-bulk-pos1'] = bulkPos1Btn;

        const bulkPos2Btn = DomFactory.createButton('btn-bulk-pos2', '☄️ Tiêm Cụm POS 2', 'Gán {ongba}, {ong}, {ba}, {diachi} cho POS 2');
        bulkPos2Btn.classList.add('ds-btn-primary');
        bulkPos2Btn.style.flex = '1';
        this.refs['btn-bulk-pos2'] = bulkPos2Btn;

        btnRow.appendChild(bulkPos1Btn);
        btnRow.appendChild(bulkPos2Btn);
        body.appendChild(btnRow);

        return panel;
    }

    _buildDateInjectGroup() {
        const panel = DomFactory.createPanel('🗓 Tiêm Tay Ngày Tháng');
        const body = panel.querySelector('.compact-panel-body');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.gap = '6px';

        // Dòng 0: 2 nút Clone
        const cloneRow = document.createElement('div');
        cloneRow.style.display = 'flex';
        cloneRow.style.gap = '6px';

        const cloneLeBtn = DomFactory.createButton('btn-date-clone-le', '📋 Clone → Lễ', 'Đổi metadata tiec → le cho frames đang chọn');
        cloneLeBtn.style.flex = '1';
        cloneLeBtn.dataset.cloneTarget = 'le';
        this.refs['btn-date-clone-le'] = cloneLeBtn;

        const cloneNhapBtn = DomFactory.createButton('btn-date-clone-nhap', '📋 Clone → Nháp', 'Đổi metadata tiec → nhap cho frames đang chọn');
        cloneNhapBtn.style.flex = '1';
        cloneNhapBtn.dataset.cloneTarget = 'nhap';
        this.refs['btn-date-clone-nhap'] = cloneNhapBtn;

        cloneRow.appendChild(cloneLeBtn);
        cloneRow.appendChild(cloneNhapBtn);
        body.appendChild(cloneRow);

        // Dòng 1-2: Grid 5 cột — 10 nút date.tiec.*
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gap = '4px';

        const dateButtons = [
            { id: 'btn-date-gio', label: '{gio}', value: '{date.tiec.gio}' },
            { id: 'btn-date-phut', label: '{phut}', value: '{date.tiec.phut}' },
            { id: 'btn-date-thu', label: '{thu}', value: '{date.tiec.thu}' },
            { id: 'btn-date-ngay', label: '{ngay}', value: '{date.tiec.ngay}' },
            { id: 'btn-date-thang', label: '{thang}', value: '{date.tiec.thang}' },
            { id: 'btn-date-nam', label: '{nam}', value: '{date.tiec.nam}' },
            { id: 'btn-date-namyy', label: '{namyy}', value: '{date.tiec.namyy}' },
            { id: 'btn-date-ngay-al', label: '{ngay_al}', value: '{date.tiec.ngay_al}' },
            { id: 'btn-date-thang-al', label: '{thang_al}', value: '{date.tiec.thang_al}' },
            { id: 'btn-date-nam-al', label: '{nam_al}', value: '{date.tiec.nam_al}' }
        ];

        dateButtons.forEach(cfg => {
            const btn = DomFactory.createButton(cfg.id, cfg.label, `Tiêm ${cfg.value}`);
            btn.dataset.schema = cfg.value;
            this.refs[cfg.id] = btn;
            grid.appendChild(btn);
        });

        body.appendChild(grid);
        return panel;
    }

    _buildSingleInjectGroup(title, prefix, bgColor) {
        const panel = DomFactory.createPanel(`👤 Tiêm Đơn: ${title}`);
        if (bgColor) panel.style.backgroundColor = bgColor;

        const body = panel.querySelector('.compact-panel-body');

        // Tạo Grid 3 cột
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '4px';

        const buttons = [
            { id: `btn-single-${prefix}-ong`, label: '{ong}', value: `{${prefix}.ong}` },
            { id: `btn-single-${prefix}-ba`, label: '{ba}', value: `{${prefix}.ba}` },
            { id: `btn-single-${prefix}-ongba`, label: '{ongba}', value: `{${prefix}.ongba}` },
            { id: `btn-single-${prefix}-diachi`, label: '{diachi}', value: `{${prefix}.diachi}` },
            { id: `btn-single-${prefix}-vithu`, label: '{vithu}', value: `{${prefix}.vithu}` },
            { id: `btn-single-${prefix}-con_first`, label: '{con_first}', value: `{${prefix}.con_first}` },
            { id: `btn-single-${prefix}-con_full`, label: '{con_full}', value: `{${prefix}.con_full}` },
            { id: `btn-single-${prefix}-con_full_lot`, label: '{....lot}', value: `{${prefix}.con_full.lot}` },
            { id: `btn-single-${prefix}-con_full_ten`, label: '{....ten}', value: `{${prefix}.con_full.ten}` },
            { id: `btn-single-${prefix}-con_full_dau`, label: '{....dau}', value: `{${prefix}.con_full.dau}` },
            { id: `btn-single-${prefix}-con_ho_ten`, label: '{ho+ten}', value: `{${prefix}.con_full.ho_dau}|{${prefix}.con_full.ten}` },
            { id: `btn-single-${prefix}-con_lot_ten`, label: '{lot+ten}', value: `{${prefix}.con_full.lot}|{${prefix}.con_full.ten}` }
        ];

        buttons.forEach(btnConfig => {
            const btn = DomFactory.createButton(btnConfig.id, btnConfig.label, `Tiêm biến ${btnConfig.value}`);
            // Gán data-schema để Event Listener sau này dễ tái sử dụng
            btn.dataset.schema = btnConfig.value;
            this.refs[btnConfig.id] = btn;
            grid.appendChild(btn);
        });

        body.appendChild(grid);
        return panel;
    }

    _buildVenueInjectGroup() {
        const panel = DomFactory.createPanel('📍 Tiêm Đơn: Thông tin Tiệc & Lễ');
        const body = panel.querySelector('.compact-panel-body');

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '4px';

        const buttons = [
            { id: 'btn-single-venue-ten', label: 'Nơi Tiệc', value: '{venue.ten}' },
            { id: 'btn-single-venue-diachi', label: 'Đ/C Tiệc', value: '{venue.diachi}' },
            { id: 'btn-single-ceremony-ten', label: 'Nơi Lễ', value: '{ceremony.ten}' },
            { id: 'btn-single-ceremony-diachi', label: 'Đ/C Lễ', value: '{ceremony.diachi}' },
            { id: 'btn-single-info-ten_le', label: 'Loại Lễ', value: '{info.ten_le}' }
        ];

        buttons.forEach(btnConfig => {
            const btn = DomFactory.createButton(btnConfig.id, btnConfig.label, `Tiêm biến ${btnConfig.value}`);
            btn.dataset.schema = btnConfig.value;
            this.refs[btnConfig.id] = btn;
            grid.appendChild(btn);
        });

        body.appendChild(grid);
        return panel;
    }
}
