import { BuiltinPresets } from './builtin_presets.js';

export const DEFAULT_SCHEMA_ID = 'standard_imposition';

export const INVARIANT_FIELD_IDS = {
    opt_clone: true,
    opt_mod_layout_checkpoint: true
};

const INVARIANT_SUMMARY = [
    { id: 'pipeline_clone', label: '01. [Bắt buộc] Tạo bản sao (Isolation)', note: 'Luôn bật để giữ artwork gốc an toàn.' },
    { id: 'pipeline_resize_checkpoint', label: '04. Resize selection', note: 'Checkpoint nội bộ luôn chạy trước bước layout.' }
];

function cloneDeep(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function normalizePresetSchema(schema) {
    if (!schema || !schema.sections) return schema;

    const normalized = cloneDeep(schema);
    for (let i = 0; i < normalized.sections.length; i += 1) {
        const section = normalized.sections[i];
        if (!section || section.id !== 'sec_options') continue;

        if (Array.isArray(section.fields)) {
            section.fields = section.fields.filter(field => field && !INVARIANT_FIELD_IDS[field.id]);
        }

        section.readOnlySummary = cloneDeep(INVARIANT_SUMMARY);
    }

    return normalized;
}

export function getCanonicalSchema(schemaId = DEFAULT_SCHEMA_ID) {
    const match = (BuiltinPresets || []).find((preset) => preset.id === schemaId);
    return normalizePresetSchema(cloneDeep(match || BuiltinPresets[0] || null));
}

function buildMarginRow(extension) {
    const rowId = String(extension.id || '');
    const dynamicId = rowId.replace(/^row_dynamic_/, 'dynamic_');
    const classification = extension.classification || 'ADDITIVE';
    const fields = {};

    ['left', 'right', 'top', 'bottom'].forEach((edge) => {
        fields[edge] = {
            id: `${dynamicId}_${edge}`,
            type: 'number',
            default: 0,
            binding: {
                classification,
                edge
            }
        };
    });

    return {
        id: rowId,
        label: extension.label || rowId,
        classification,
        fields
    };
}

export function buildSchemaForDraft(draft) {
    const schema = getCanonicalSchema(draft && draft.schemaId);
    if (!schema || !Array.isArray(schema.sections)) {
        return schema;
    }

    schema.sections.forEach((section) => {
        if (!section) return;
        if (!Array.isArray(section.fields)) section.fields = [];
        if (!Array.isArray(section.rows)) section.rows = [];
    });

    const margins = schema.sections.find((section) => section.id === 'sec_margins');
    if (!margins) {
        return schema;
    }

    margins.rows = Array.isArray(margins.rows) ? margins.rows : [];
    const existingIds = new Set(margins.rows.map((row) => row && row.id));
    ((draft && draft.schemaExtensions && draft.schemaExtensions.marginRows) || []).forEach((extension) => {
        if (!extension || existingIds.has(extension.id)) return;
        margins.rows.push(buildMarginRow(extension));
    });

    return normalizePresetSchema(schema);
}

export function extractMarginRowExtensions(schema) {
    const section = (schema && schema.sections || []).find((entry) => entry && entry.id === 'sec_margins');
    return (section && section.rows || [])
        .filter((row) => row && String(row.id || '').indexOf('row_dynamic_') === 0)
        .map((row) => ({
            id: row.id,
            label: row.label || row.id,
            classification: row.classification || 'ADDITIVE'
        }));
}
