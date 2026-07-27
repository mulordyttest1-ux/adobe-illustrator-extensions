import { clonePresetDraft, normalizePresetDraft } from './preset_draft_model.js';

export const PRESET_STORAGE_VERSION = 5;

export function getPresetDraftUnsupportedExtensions(value) {
    const extensions = value && value.schemaExtensions;
    if (!extensions || typeof extensions !== 'object' || Array.isArray(extensions)) {
        return ['schemaExtensions'];
    }

    const issues = Object.keys(extensions)
        .filter((key) => key !== 'marginRows')
        .map((key) => `extension:${key}`);

    (Array.isArray(extensions.marginRows) ? extensions.marginRows : []).forEach((row) => {
        if (!row || String(row.id || '').indexOf('row_dynamic_') !== 0) {
            issues.push(`row:${row && row.id ? row.id : 'unknown'}`);
        }
        if (row && row.classification && !['BASELINE', 'STRUCTURAL', 'ADDITIVE'].includes(row.classification)) {
            issues.push(`row_classification:${row.id}`);
        }
    });

    return issues;
}

export function serializePresetDraft(value) {
    if (getPresetDraftUnsupportedExtensions(value).length > 0) {
        return null;
    }

    const draft = normalizePresetDraft(value);
    if (!draft || !draft.id || !draft.label) {
        return null;
    }

    return clonePresetDraft(draft);
}

export function isCanonicalPresetEntry(value) {
    return !!(
        value &&
        value.modelVersion === 1 &&
        value.values &&
        value.schemaExtensions &&
        Array.isArray(value.schemaExtensions.marginRows)
    );
}
