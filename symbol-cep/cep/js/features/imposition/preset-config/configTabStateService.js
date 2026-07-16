import { hydratePreset } from '../processing_options.js';

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function readPaneFormState(paneRenderer) {
    if (!paneRenderer) return null;

    const paneValues = paneRenderer.readValues();
    if (!paneValues || Object.keys(paneValues).length === 0) {
        return null;
    }

    return paneValues;
}

function readElementValue(element, fallback) {
    if (!element) return fallback;
    return element.value || fallback;
}

export function resolveFormMetaValues(formRef, fallbackMeta) {
    const meta = fallbackMeta || {};
    if (formRef && formRef.elements) {
        return {
            presetId: formRef.elements.preset_id ? formRef.elements.preset_id.value : (meta.presetId || ''),
            presetName: formRef.elements.preset_name ? formRef.elements.preset_name.value : (meta.presetName || '')
        };
    }

    return {
        presetId: meta.presetId || '',
        presetName: meta.presetName || ''
    };
}

export function buildNormalizedConfigState({ rawValues = {}, formMeta = {}, activeSchema } = {}, overrides = {}) {
    const hydrate = overrides.hydratePreset || hydratePreset;
    const schema = overrides.schema || activeSchema;
    const hydrated = hydrate({
        id: formMeta.presetId || 'draft',
        label: formMeta.presetName || '',
        schemaId: 'embedded',
        schema,
        rawValues: rawValues || {}
    }, schema);

    return hydrated.rawValues;
}

export function captureConfigTabUiState({ paneRenderer, formMeta, selectedPresetId } = {}, overrides = {}) {
    const documentRef = overrides.document || document;
    const nextFormMeta = clone(formMeta) || { presetId: '', presetName: '' };
    const nextFormState = readPaneFormState(paneRenderer);
    const presetSelect = documentRef.getElementById('load-preset-select');
    const presetId = documentRef.getElementById('preset_id');
    const presetName = documentRef.getElementById('preset_name');
    nextFormMeta.presetId = readElementValue(presetId, nextFormMeta.presetId || '');
    nextFormMeta.presetName = readElementValue(presetName, nextFormMeta.presetName || '');

    return {
        formState: nextFormState,
        formMeta: nextFormMeta,
        selectedPresetId: readElementValue(presetSelect, selectedPresetId || '')
    };
}

export function restoreConfigTabUiState({ formMeta, selectedPresetId } = {}, overrides = {}) {
    const documentRef = overrides.document || document;
    const presetSelect = documentRef.getElementById('load-preset-select');
    const presetId = documentRef.getElementById('preset_id');
    const presetName = documentRef.getElementById('preset_name');

    if (presetSelect) presetSelect.value = selectedPresetId || '';
    if (presetId) presetId.value = (formMeta && formMeta.presetId) || '';
    if (presetName) presetName.value = (formMeta && formMeta.presetName) || '';
}

export function buildStorageWarningMarkup(overrides = {}) {
    const getStorageHealth = overrides.getStorageHealth || (() => ({ reason: 'ok', message: '' }));
    const health = getStorageHealth();
    if (!health || health.reason === 'ok' || !health.message) {
        return '';
    }

    return `
            <div data-storage-warning="${health.reason}" style="margin-bottom: 8px; padding: 7px 9px; border-radius: 4px; background: rgba(255, 193, 7, 0.12); border: 1px solid rgba(255, 193, 7, 0.45); color: #ffd36a; font-size: 11px;">
                ${health.message}
            </div>
        `;
}

export function buildPresetOptionsMarkup(overrides = {}) {
    const listPresets = overrides.listPresets || (() => []);
    return listPresets().map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join('');
}
