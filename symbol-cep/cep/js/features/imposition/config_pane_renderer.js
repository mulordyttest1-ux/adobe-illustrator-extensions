import { Pane } from 'tweakpane';
import { getEdgeLabel, getSectionTitle, impositionCopy } from './imposition_copy.js';
import {
    renderPasteboardSection,
    renderSchemaSection
} from './config_pane_special_sections.js';
import {
    getConfigSectionDescriptor,
    getRenderableConfigSectionDescriptors
} from './config_section_registry.js';
import {
    ConfigPaneControlAdapter,
    getConfigControlPlaceholder,
    normalizeConfigCheckboxValue
} from './config_pane_control_adapter.js';

const EXPANDED_SECTIONS = {
    sec_artboard: true,
    sec_sheet_layout: true,
    sec_size: true,
    sec_margins: true,
    sec_resize_mode: false,
    sec_options: true,
    sec_output_save: true,
    sec_marks: false,
    pasteboard: true,
    schema: true
};

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getFolderContent(folderApi) {
    return folderApi.element.querySelector('.tp-fldv_c') || folderApi.element;
}

function getEdgePlaceholder(fieldId, edge) {
    return getConfigControlPlaceholder(fieldId, getEdgeLabel(edge).charAt(0).toUpperCase());
}

export class ConfigPaneRenderer {
    constructor(tab) {
        this.tab = tab;
        this.host = null;
        this.pane = null;
        this.schema = null;
        this.state = {};
        this.folderMap = {};
        this.bindings = {};
        this.customControls = {};
        this.customRows = {};
        this.buttonObserver = null;
        this.controlAdapter = new ConfigPaneControlAdapter(this);
    }

    mount(container, schema, rawValues, tabState) {
        this.unmount();

        this.host = container;
        this.schema = schema;
        this.state = clone(rawValues) || {};
        this.folderMap = {};
        this.bindings = {};
        this.customControls = {};
        this.customRows = {};

        if (!container || !schema) return;

        const paneHost = document.createElement('div');
        paneHost.className = 'config-pane-host';
        container.appendChild(paneHost);

        this.pane = new Pane({
            container: paneHost,
            expanded: true
        });

        getRenderableConfigSectionDescriptors().forEach((descriptor) => {
            const section = (schema.sections || []).find((entry) => entry && entry.id === descriptor.id);
            if (section) {
                this._buildSection(section, descriptor);
            }
        });

        if (getConfigSectionDescriptor('pasteboard')) {
            renderPasteboardSection(this, schema);
        }

        if (tabState && tabState.isEditMode) {
            renderSchemaSection(this, schema);
        }

        this._syncConditionalVisibility();
        this._guardFormButtons(paneHost);
    }

    unmount() {
        if (this.pane) {
            this.pane.dispose();
        }

        if (this.host) {
            this.host.innerHTML = '';
        }

        this.pane = null;
        this.host = null;
        this.schema = null;
        this.folderMap = {};
        this.bindings = {};
        this.customControls = {};
        this.customRows = {};

        if (this.buttonObserver) {
            this.buttonObserver.disconnect();
            this.buttonObserver = null;
        }
    }

    readValues() {
        return clone(this.state) || {};
    }

    applyValues(rawValues) {
        this.state = clone(rawValues) || {};
        if (this.host && this.schema) {
            this.mount(this.host, this.schema, this.state, { isEditMode: this.tab && this.tab.isEditMode });
        }
    }

    _buildSection(section, descriptor = getConfigSectionDescriptor(section && section.id)) {
        const folder = this.pane.addFolder({
            title: getSectionTitle(section),
            expanded: !!EXPANDED_SECTIONS[section.id]
        });
        this.folderMap[section.id] = folder;

        const content = getFolderContent(folder);
        if (section.note || section.description) {
            content.appendChild(this._buildNote(section.note || section.description));
        }

        if (section.readOnlySummary && section.readOnlySummary.length) {
            content.appendChild(this._buildReadOnlySummary(section));
        }

        if (this._renderSpecialSection(folder, section, descriptor)) {
            return;
        }

        this.controlAdapter.renderStandardFields(folder, section.fields || []);
    }

    _renderSpecialSection(folder, section, descriptor = getConfigSectionDescriptor(section && section.id)) {
        if (!section || !section.id) return false;

        const renderers = {
            compact: () => {
                const compactIds = descriptor.fieldIds || [];
                this.controlAdapter.renderCompactFieldGroup(folder, section, compactIds);
                this.controlAdapter.renderRemainingStandardFields(folder, section, compactIds);
            },
            'sheet-layout': () => this._renderSheetLayout(folder, section),
            margins: () => this._renderMargins(folder, section),
            options: () => this.controlAdapter.renderDenseFieldList(
                folder,
                (section.fields || []).filter((field) => field.id !== 'info_template')
            ),
            dense: () => this.controlAdapter.renderDenseFieldList(folder, section.fields || [])
        };
        const renderer = descriptor && renderers[descriptor.adapter];
        if (!renderer) return false;

        renderer();
        return true;
    }

    _renderSheetLayout(folder, section) {
        const content = getFolderContent(folder);
        (section.rows || []).forEach((row) => {
            const block = document.createElement('div');
            block.className = 'pane-matrix-block';
            block.innerHTML = `<div class="pane-matrix-label">${escapeHtml(row.label || getSectionTitle({ id: 'sec_sheet_layout' }))}</div>`;

            const controls = document.createElement('div');
            controls.className = 'pane-inline-group pane-inline-group-4';

            ['left', 'right', 'top', 'bottom'].forEach((edge) => {
                const field = row.fields && row.fields[edge];
                if (!field) return;
                controls.appendChild(this.controlAdapter.buildCompactNumberControl(
                    field,
                    getEdgePlaceholder(field.id, edge)
                ));
            });

            block.appendChild(controls);
            content.appendChild(block);
        });
    }

    _renderMargins(folder, section) {
        const content = getFolderContent(folder);
        (section.rows || []).forEach((row) => {
            const block = document.createElement('div');
            block.className = 'pane-matrix-block';
            block.innerHTML = `<div class="pane-matrix-label">${escapeHtml(row.label || row.id)}</div>`;

            const controls = document.createElement('div');
            controls.className = 'pane-inline-group pane-inline-group-4';

            ['left', 'right', 'top', 'bottom'].forEach((edge) => {
                const field = row.fields && row.fields[edge];
                if (!field) return;
                controls.appendChild(this.controlAdapter.buildCompactNumberControl(
                    field,
                    getEdgePlaceholder(field.id, edge)
                ));
            });

            block.appendChild(controls);
            block.appendChild(this._buildBorderControls(row));
            content.appendChild(block);
        });
    }

    _buildBorderControls(row) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pane-inline-meta';

        const checkboxId = `${row.id}_draw_border`;
        const styleId = `${row.id}_border_style`;

        const checkboxWrap = document.createElement('label');
        checkboxWrap.className = 'pane-inline-check';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.name = checkboxId;
        checkbox.checked = normalizeConfigCheckboxValue(this.state[checkboxId]);
        checkbox.dataset.configControl = 'true';
        checkbox.setAttribute('aria-label', impositionCopy.pane.border.toggleAria(row.label));
        checkbox.addEventListener('change', () => {
            this.state[checkboxId] = checkbox.checked;
        });

        const checkboxText = document.createElement('span');
        checkboxText.textContent = impositionCopy.pane.border.toggle;

        checkboxWrap.appendChild(checkbox);
        checkboxWrap.appendChild(checkboxText);

        const style = document.createElement('select');
        style.id = styleId;
        style.name = styleId;
        style.className = 'pane-inline-select';
        style.dataset.configControl = 'true';
        style.setAttribute('aria-label', impositionCopy.pane.border.styleAria(row.label));
        style.innerHTML = `
            <option value="solid">${impositionCopy.pane.border.styles.solid}</option>
            <option value="dashed">${impositionCopy.pane.border.styles.dashed}</option>
        `;
        style.value = this.state[styleId] || 'dashed';
        style.addEventListener('change', () => {
            this.state[styleId] = style.value;
        });

        wrapper.appendChild(checkboxWrap);
        wrapper.appendChild(style);

        this.customControls[checkboxId] = checkbox;
        this.customControls[styleId] = style;
        return wrapper;
    }

    _buildReadOnlySummary(section) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pane-readonly-summary';
        wrapper.dataset.readonlySummary = section.id;

        const heading = document.createElement('div');
        heading.className = 'pane-readonly-heading';
        heading.textContent = impositionCopy.pane.readOnlyHeading;
        wrapper.appendChild(heading);

        (section.readOnlySummary || []).forEach((item) => {
            const row = document.createElement('div');
            row.className = 'pane-readonly-row';
            row.textContent = item.label;
            wrapper.appendChild(row);
        });

        return wrapper;
    }

    _buildNote(text) {
        const note = document.createElement('div');
        note.className = 'pane-section-note';
        note.textContent = text;
        return note;
    }

    _guardFormButtons(root) {
        if (!root) return;

        const apply = () => {
            root.querySelectorAll('button').forEach((button) => {
                if (button.type !== 'button') {
                    button.type = 'button';
                }
            });
        };

        apply();

        if (typeof MutationObserver === 'undefined') {
            return;
        }

        this.buttonObserver = new MutationObserver(() => {
            apply();
        });

        this.buttonObserver.observe(root, {
            childList: true,
            subtree: true
        });
    }

    _syncConditionalVisibility() {
        const rotateEnabled = normalizeConfigCheckboxValue(this.state.opt_custom_rotate);
        if (this.bindings.customRotateAngle) {
            this.bindings.customRotateAngle.hidden = !rotateEnabled;
        }
        if (this.customRows.custom_rotate_angle) {
            this.customRows.custom_rotate_angle.classList.toggle('is-hidden', !rotateEnabled);
        }
    }
}
