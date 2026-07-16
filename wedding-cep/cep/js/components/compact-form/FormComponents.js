/**
 * FormComponents.js
 * Builds the compact-form UI groups for the wedding workspace.
 */
import { DomFactory } from '../helpers/DomFactory.js';
import {
    buildDateGroupLayout,
    buildFamilyColumns,
    buildRankingRow,
    buildVenueLayout,
    INFO_LE_OPTIONS
} from './formComponentSupport.js';

export class FormComponents {
    constructor(options = {}) {
        this.container = options.container;
        this.adapter = options.adapter;
        this.schema = options.schema || {};
    }

    _createPanel(title) { return DomFactory.createPanel(title); }
    _createRow() { return DomFactory.createRow(); }
    _createLabel(text) { return DomFactory.createLabel(text); }

    _createInlineRadio(key, options, suffix, config) { return this.adapter.createInlineRadio(key, options, suffix, config); }
    _createTextareaWithIdx(key, rows, hasIdx) { return this.adapter.createTextareaWithIdx(key, rows, hasIdx); }
    _createInputWithAuto(key, hasAuto) { return this.adapter.createInputWithAuto(key, hasAuto); }
    _createTextareaWithAuto(key, rows, hasAuto) { return this.adapter.createTextareaWithAuto(key, rows, hasAuto); }
    _createTextarea(key, rows) { return this.adapter.createTextarea(key, rows); }

    buildInfoGroup() {
        const panel = this._createPanel('\u{1F4CB} TH\u00d4NG TIN');
        const body = panel.querySelector('.compact-panel-body');

        const titleRow = this._createRow();
        titleRow.appendChild(this._createInlineRadio('info.ten_le', INFO_LE_OPTIONS, undefined, { checkedIndex: -1 }));
        body.appendChild(titleRow);
        body.appendChild(buildRankingRow({
            createRow: () => this._createRow(),
            createInlineRadio: (key, options, suffix, config) => this._createInlineRadio(key, options, suffix, config)
        }));
        this.container.appendChild(panel);
    }

    buildFamilyGroup() {
        const panel = this._createPanel('\u{1F468}\u{1F469} GIA \u0110\u00ccNH');
        const header = panel.querySelector('.compact-panel-header');

        const lockRef = DomFactory.createLabeledCheckbox('Lock IDX', true);
        lockRef.checkbox.addEventListener('change', () => {
            this.adapter.setIdxLocked(lockRef.checkbox.checked);
        });
        header.appendChild(lockRef.element);

        const body = panel.querySelector('.compact-panel-body');
        body.appendChild(buildFamilyColumns({
            createRow: () => this._createRow(),
            createLabel: (text) => this._createLabel(text),
            createTextareaWithIdx: (key, rows, hasIdx) => this._createTextareaWithIdx(key, rows, hasIdx)
        }));
        this.container.appendChild(panel);
    }

    buildVenueGroup() {
        const panel = this._createPanel('\u{1F4CD} \u0110\u1ecaA \u0110I\u1ec2M');
        const header = panel.querySelector('.compact-panel-header');
        const body = panel.querySelector('.compact-panel-body');
        const layout = buildVenueLayout({
            createRow: () => this._createRow(),
            createLabel: (text) => this._createLabel(text),
            createInlineRadio: (key, options, suffix) => this._createInlineRadio(key, options, suffix),
            createTextareaWithAuto: (key, rows, hasAuto) => this._createTextareaWithAuto(key, rows, hasAuto),
            createTextarea: (key, rows) => this._createTextarea(key, rows)
        });

        layout.headerNodes.forEach((node) => header.appendChild(node));
        layout.bodyRows.forEach((row) => body.appendChild(row));

        this.container.appendChild(panel);
    }

    buildDateGroupWithActions() {
        const panel = this._createPanel('\u{1F4C6} TH\u1edcI GIAN');
        const body = panel.querySelector('.compact-panel-body');
        body.appendChild(buildDateGroupLayout({
            schema: this.schema,
            adapter: this.adapter,
            createButton: (id, label, title) => DomFactory.createButton(id, label, title)
        }));
        this.container.appendChild(panel);
    }
}
