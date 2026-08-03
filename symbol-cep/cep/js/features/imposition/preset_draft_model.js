export const PRESET_DRAFT_MODEL_VERSION = 1;

const DYNAMIC_ROW_PREFIX = 'row_dynamic_';
const CLASSIFICATIONS = {
    BASELINE: true,
    STRUCTURAL: true,
    ADDITIVE: true
};

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeMarginRows(rows) {
    return (Array.isArray(rows) ? rows : [])
        .filter((row) => row && String(row.id || '').indexOf(DYNAMIC_ROW_PREFIX) === 0)
        .map((row) => ({
            id: String(row.id),
            label: String(row.label || row.id).trim(),
            classification: CLASSIFICATIONS[row.classification] ? row.classification : 'ADDITIVE'
        }));
}

export function createPresetDraft({
    id,
    label,
    schemaId = 'standard_imposition',
    schemaExtensions = {},
    values = {},
    createdAt = '',
    updatedAt = ''
} = {}) {
    const normalizedValues = clone(values) || {};
    delete normalizedValues.preset_id;
    delete normalizedValues.preset_name;

    return {
        modelVersion: PRESET_DRAFT_MODEL_VERSION,
        id: String(id),
        label: String(label),
        schemaId: String(schemaId),
        schemaExtensions: {
            marginRows: normalizeMarginRows(schemaExtensions.marginRows)
        },
        values: normalizedValues,
        createdAt: createdAt || '',
        updatedAt: updatedAt || ''
    };
}

export function isPresetDraft(value) {
    return !!(
        value &&
        value.modelVersion === PRESET_DRAFT_MODEL_VERSION &&
        value.id &&
        value.schemaId &&
        value.values &&
        value.schemaExtensions
    );
}

export function normalizePresetDraft(value) {
    if (!value) return null;

    return createPresetDraft({
        id: value.id,
        label: value.label,
        schemaId: value.schemaId,
        schemaExtensions: value.schemaExtensions,
        values: value.values,
        createdAt: value.createdAt,
        updatedAt: value.updatedAt
    });
}

export function clonePresetDraft(value) {
    return normalizePresetDraft(clone(value));
}
