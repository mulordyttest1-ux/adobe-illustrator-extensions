/**
 * FormComponents.js
 * Chuyên trách xây dựng các nhóm UI (Layout & Rendering)
 * Sử dụng DomFactory để tạo element chi tiết.
 */
import { DomFactory } from '../helpers/DomFactory.js';

export class FormComponents {
    constructor(builder) {
        this.builder = builder;
    }

    // Proxy methods to builder (to keep code clean)
    _createPanel(title) { return DomFactory.createPanel(title); }
    _createRow() { return DomFactory.createRow(); }
    _createLabel(text) { return DomFactory.createLabel(text); }

    // Delegation to builder for complex inputs that need event binding
    _createInlineRadio(key, options, suffix) { return this.builder._createInlineRadio(key, options, suffix); }
    _createTextareaWithIdx(key, rows, hasIdx) { return this.builder._createTextareaWithIdx(key, rows, hasIdx); }
    _createInputWithAuto(key, hasAuto) { return this.builder._createInputWithAuto(key, hasAuto); }
    _createTextarea(key, rows) { return this.builder._createTextarea(key, rows); }

    // ===== GROUP 1: THÔNG TIN =====
    buildInfoGroup() {
        const panel = this._createPanel('📋 THÔNG TIN');
        const body = panel.querySelector('.compact-panel-body');

        // Row 1
        const row1 = this._createRow();

        // Radio Loại Lễ
        const leRadioGroup = this._createInlineRadio('info.ten_le', ['Tân Hôn', 'Thành Hôn', 'Vu Quy', 'Báo Hỷ']);
        row1.appendChild(leRadioGroup);
        body.appendChild(row1);

        // Row 2: Vị Thứ
        const row2 = this._createRow();
        const namLabel = DomFactory.createSpan('', 'width: auto; margin-right: 4px; font-weight: 600; color: #111;');
        row2.appendChild(namLabel);
        row2.appendChild(this._createInlineRadio('ui.vithu_nam', ['Trưởng Nam', 'Thứ Nam', 'Út Nam', 'Quý Nam', 'Ái Nam', '... Nam'], ''));

        row2.appendChild(DomFactory.createSeparator());

        const nuLabel = DomFactory.createSpan('', 'width: auto; margin-right: 4px; font-weight: 600; color: #111;');
        row2.appendChild(nuLabel);
        row2.appendChild(this._createInlineRadio('ui.vithu_nu', ['Trưởng Nữ', 'Thứ Nữ', 'Út Nữ', 'Quý Nữ', 'Ái Nữ', '... Nữ'], ''));

        body.appendChild(row2);
        this.builder.container.appendChild(panel);
    }

    // ===== GROUP 2: GIA ĐÌNH =====
    buildFamilyGroup() {
        const panel = this._createPanel('👨👩 GIA ĐÌNH');
        const header = panel.querySelector('.compact-panel-header');

        // Lock IDX
        const lockRef = DomFactory.createLabeledCheckbox('Lock IDX', true);
        lockRef.checkbox.addEventListener('change', () => {
            this.builder._idxLocked = lockRef.checkbox.checked;
            this.builder._updateIdxState();
        });
        header.appendChild(lockRef.element);

        const body = panel.querySelector('.compact-panel-body');
        const columnsWrapper = document.createElement('div');
        columnsWrapper.style.cssText = 'display: flex; gap: 4px;';

        const pos1Col = DomFactory.createColumn('POS 1');
        const pos2Col = DomFactory.createColumn('POS 2');

        const fields = [
            { label: 'Ông', key: 'ong', hasIdx: true, rows: 1 },
            { label: 'Bà', key: 'ba', hasIdx: true, rows: 1 },
            { label: 'Địa chỉ', key: 'diachi', hasIdx: false, rows: 2 },
            { label: 'Con', key: 'con_full', hasIdx: true, rows: 1 }
        ];

        fields.forEach(f => {
            // POS1
            const pos1Row = this._createRow();
            pos1Row.style.alignItems = 'flex-start';
            const lbl1 = this._createLabel(f.label);
            lbl1.style.marginTop = '4px';
            lbl1.style.width = '35px';
            pos1Row.appendChild(lbl1);
            pos1Row.appendChild(this._createTextareaWithIdx(`pos1.${f.key}`, f.rows, f.hasIdx));
            pos1Col.appendChild(pos1Row);

            // POS2
            const pos2Row = this._createRow();
            pos2Row.style.alignItems = 'flex-start';
            pos2Row.appendChild(this._createTextareaWithIdx(`pos2.${f.key}`, f.rows, f.hasIdx));
            pos2Col.appendChild(pos2Row);
        });

        columnsWrapper.appendChild(pos1Col);
        columnsWrapper.appendChild(pos2Col);
        body.appendChild(columnsWrapper);
        this.builder.container.appendChild(panel);
    }

    // ===== GROUP 3: VENUE =====
    buildVenueGroup() {
        const panel = this._createPanel('📍 ĐỊA ĐIỂM');
        const header = panel.querySelector('.compact-panel-header');

        header.appendChild(DomFactory.createSpan('Chủ tiệc:', 'margin-left: auto; font-size: 9px; color: #666;'));
        const hostRadio = this._createInlineRadio('ceremony.host_type', ['Nhà Trai', 'Nhà Gái']);
        hostRadio.style.marginLeft = '4px';
        header.appendChild(hostRadio);

        const body = panel.querySelector('.compact-panel-body');

        // Header
        const headerRow = this._createRow();
        headerRow.style.cssText = 'font-weight: 600; font-size: 9px; color: #666;';
        headerRow.innerHTML = '<span style="width:50px"></span><span style="flex:1;text-align:center">LỄ</span><span style="flex:1;text-align:center">TIỆC</span>';
        body.appendChild(headerRow);

        // Row 1
        const row1 = this._createRow();
        row1.appendChild(this._createLabel('Tên'));
        row1.appendChild(this._createInputWithAuto('ceremony.ten', true));
        row1.appendChild(this._createInputWithAuto('venue.ten', true));
        body.appendChild(row1);

        // Row 2
        const row2 = this._createRow();
        row2.style.alignItems = 'flex-start';
        row2.appendChild(this._createLabel('Địa chỉ'));
        row2.appendChild(this._createTextarea('ceremony.diachi', 2));
        row2.appendChild(this._createTextarea('venue.diachi', 2));
        body.appendChild(row2);

        this.builder.container.appendChild(panel);
    }

    // ===== GROUP 4: DATE & ACTIONS =====
    buildDateGroupWithActions() {
        const panel = this._createPanel('📅 THỜI GIAN');
        const body = panel.querySelector('.compact-panel-body');
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; gap: 8px;';

        const dateCol = document.createElement('div');
        dateCol.style.flex = '1';
        if (typeof DateGridWidget !== 'undefined') {
            const dateConfigs = [
                { key: 'date.tiec', label: 'Tiệc' },
                { key: 'date.le', label: 'Lễ' },
                { key: 'date.nhap', label: 'Nháp' }
            ];
            DateGridWidget.create(dateCol, dateConfigs, this.builder.refs);
            DateGridWidget.setChangeHandler((key, val) => this.builder._handleChange(key, val));
        }
        wrapper.appendChild(dateCol);

        const actionCol = document.createElement('div');
        actionCol.style.cssText = 'display: flex; flex-direction: column; gap: 4px; width: 60px;';
        const actions = [
            { id: 'btn-compact-swap', label: '🔄 Swap', title: 'Hoán đổi POS1 ↔ POS2' },
            { id: 'btn-compact-scan', label: '📥 Scan', title: 'Quét từ AI document' },
            { id: 'btn-compact-update', label: '📤 Update', title: 'Cập nhật vào AI document' }
        ];

        actions.forEach(act => {
            const btn = DomFactory.createButton(act.id, act.label, act.title);
            actionCol.appendChild(btn);
            this.builder.refs[act.id] = btn;
        });

        wrapper.appendChild(actionCol);
        body.appendChild(wrapper);
        this.builder.container.appendChild(panel);
    }
}

