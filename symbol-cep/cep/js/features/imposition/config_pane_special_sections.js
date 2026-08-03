import { getSectionTitle, impositionCopy } from './imposition_copy.js';
import {
    PASTEBOARD_MODE_CUSTOM,
    PASTEBOARD_MODE_OFF,
    PASTEBOARD_MODE_STANDARD,
    buildPasteboardLegendPreview,
    buildPasteboardTokenDescriptors,
    normalizePasteboardMode
} from './pasteboard_slug.js';

const PASTEBOARD_PLACEHOLDER = 'Mau tuy chinh';

function getFolderContent(folderApi) {
    return folderApi.element.querySelector('.tp-fldv_c') || folderApi.element;
}

function buildPasteboardPreviewText(renderer) {
    return buildPasteboardLegendPreview(
        {
            itemsProcessed: 0
        },
        {
            label: renderer.state.preset_name || impositionCopy.pane.pasteboard.previewPresetName,
            rawValues: renderer.state,
            schema: renderer.schema,
            processingOptions: {
                postflight: {
                    pasteboardMode: normalizePasteboardMode(renderer.state.pasteboard_mode),
                    pasteboardInfoTemplate: renderer.state.info_template || ''
                }
            }
        }
    );
}

function insertPasteboardToken(renderer, textarea, token) {
    const current = textarea.value || '';
    const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : current.length;
    const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : start;

    textarea.value = current.slice(0, start) + token + current.slice(end);
    renderer.state.info_template = textarea.value;

    if (typeof textarea.focus === 'function') {
        textarea.focus();
    }

    if (typeof textarea.setSelectionRange === 'function') {
        const next = start + token.length;
        textarea.setSelectionRange(next, next);
    }
}

function buildPasteboardModeControl(renderer, copy) {
    const label = document.createElement('label');
    label.className = 'pane-setting-label';
    label.setAttribute('for', 'pasteboard_mode');
    label.textContent = copy.modeLabel;

    const select = document.createElement('select');
    select.id = 'pasteboard_mode';
    select.name = 'pasteboard_mode';
    select.className = 'pane-setting-select pane-pasteboard-mode';
    select.dataset.configControl = 'true';
    select.innerHTML = `
        <option value="${PASTEBOARD_MODE_STANDARD}">${copy.modes.standard}</option>
        <option value="${PASTEBOARD_MODE_CUSTOM}">${copy.modes.custom}</option>
        <option value="${PASTEBOARD_MODE_OFF}">${copy.modes.off}</option>
    `;
    select.value = normalizePasteboardMode(renderer.state.pasteboard_mode);

    return { label, select };
}

export function renderPasteboardSection(renderer, schema) {
    const optionsSection = (schema.sections || []).find((section) => section && section.id === 'sec_options');
    if (!optionsSection) return;

    const field = (optionsSection.fields || []).find((entry) => entry && entry.id === 'info_template');
    const folder = renderer.pane.addFolder({
        title: impositionCopy.pane.sectionTitles.pasteboard,
        expanded: true
    });
    renderer.folderMap.pasteboard = folder;

    const content = getFolderContent(folder);
    const copy = impositionCopy.pane.pasteboard;
    content.appendChild(renderer._buildNote(copy.note));

    const block = document.createElement('div');
    block.className = 'pane-pasteboard-block';

    const modeControl = buildPasteboardModeControl(renderer, copy);
    const modeLabel = modeControl.label;
    const modeSelect = modeControl.select;

    const preview = document.createElement('div');
    preview.className = 'pane-pasteboard-preview';
    preview.setAttribute('aria-live', 'polite');

    const customBlock = document.createElement('div');
    customBlock.className = 'pane-pasteboard-custom';
    customBlock.setAttribute('data-field-id', 'info_template');

    const textarea = document.createElement('textarea');
    textarea.id = 'info_template';
    textarea.name = 'info_template';
    textarea.className = 'pane-textarea-input';
    textarea.placeholder = PASTEBOARD_PLACEHOLDER;
    textarea.value = renderer.state.info_template || '';
    textarea.setAttribute('aria-label', (field && field.label) || impositionCopy.pane.pasteboardLabel);
    textarea.dataset.configControl = 'true';

    const tokenLabel = document.createElement('div');
    tokenLabel.className = 'pane-token-label';
    tokenLabel.textContent = copy.tokenLabel;

    const tokenList = document.createElement('div');
    tokenList.className = 'pane-token-list';
    buildPasteboardTokenDescriptors(schema).forEach((descriptor) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pane-token-chip';
        button.dataset.insertToken = descriptor.token;
        button.textContent = descriptor.label;
        button.title = descriptor.token;
        button.addEventListener('click', () => {
            insertPasteboardToken(renderer, textarea, descriptor.token);
            refresh();
        });
        tokenList.appendChild(button);
    });

    customBlock.appendChild(textarea);
    customBlock.appendChild(tokenLabel);
    customBlock.appendChild(tokenList);

    const refresh = () => {
        renderer.state.pasteboard_mode = normalizePasteboardMode(modeSelect.value);
        renderer.state.info_template = textarea.value;
        customBlock.classList.toggle('is-hidden', renderer.state.pasteboard_mode !== PASTEBOARD_MODE_CUSTOM);
        const previewText = buildPasteboardPreviewText(renderer);
        preview.textContent = previewText
            ? `${copy.previewLabel}: ${previewText}`
            : copy.emptyPreview;
    };

    textarea.addEventListener('input', refresh);
    modeSelect.addEventListener('change', refresh);

    block.appendChild(modeLabel);
    block.appendChild(modeSelect);
    block.appendChild(preview);
    block.appendChild(customBlock);
    content.appendChild(block);

    renderer.customControls.pasteboard_mode = modeSelect;
    renderer.customControls.info_template = textarea;
    refresh();
}

function collectRemovableEntries(schema) {
    if (!schema || !schema.sections) return [];

    const entries = [];
    schema.sections.forEach((section) => {
        if (section.id === 'sec_margins' && Array.isArray(section.rows)) {
            section.rows.forEach((row) => {
                if (row && row.id && String(row.id).indexOf('row_dynamic_') === 0) {
                    entries.push({
                        kind: 'row',
                        id: row.id,
                        label: row.label || row.id,
                        sectionTitle: getSectionTitle(section)
                    });
                }
            });
        }
    });

    return entries;
}

export function renderSchemaSection(renderer, schema) {
    const folder = renderer.pane.addFolder({
        title: impositionCopy.pane.sectionTitles.schema,
        expanded: true
    });
    renderer.folderMap.schema = folder;

    const content = getFolderContent(folder);
    content.appendChild(renderer._buildNote(impositionCopy.pane.schema.note));

    const addBlock = document.createElement('div');
    addBlock.className = 'pane-schema-actions';
    (schema.sections || [])
        .filter((section) => section && section.id === 'sec_margins')
        .forEach((section) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pane-schema-btn';
            button.textContent = '+ Hàng biên';
            button.addEventListener('click', () => {
                renderer.tab.openAddFieldModal(section.id);
            });
            addBlock.appendChild(button);
        });
    content.appendChild(addBlock);

    const removable = collectRemovableEntries(schema);
    if (removable.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'pane-schema-empty';
        empty.textContent = impositionCopy.pane.schema.empty;
        content.appendChild(empty);
        return;
    }

    removable.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'pane-schema-row';

        const text = document.createElement('span');
        text.className = 'pane-schema-label';
        text.textContent = `${entry.label} · ${entry.sectionTitle}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'pane-schema-remove';
        removeBtn.textContent = impositionCopy.pane.schema.remove;
        removeBtn.addEventListener('click', () => {
            renderer.tab.requestRemoveRow(entry.id, entry.label);
        });

        row.appendChild(text);
        row.appendChild(removeBtn);
        content.appendChild(row);
    });
}
