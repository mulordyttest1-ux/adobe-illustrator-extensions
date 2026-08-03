import { buildSchemaForDraft } from './preset_schema_policy.js';
import { buildLegacyMirrors, buildProcessingOptions } from './legacy_preset_adapter.js';
import { normalizePresetDraft } from './preset_draft_model.js';

function deriveGeometry(values) {
    return {
        finish: {
            w: Number(values.finish_w) || 0,
            h: Number(values.finish_h) || 0
        },
        safe: [
            Number(values.safe_top) || 0,
            Number(values.safe_bottom) || 0,
            Number(values.safe_left) || 0,
            Number(values.safe_right) || 0
        ]
    };
}

export function toRuntimePreset(value) {
    const draft = normalizePresetDraft(value);
    if (!draft) return null;

    const schema = buildSchemaForDraft(draft);
    const rawValues = {
        ...draft.values,
        preset_id: draft.id,
        preset_name: draft.label
    };
    const processingOptions = buildProcessingOptions(rawValues, schema);
    const legacy = buildLegacyMirrors(processingOptions);

    return {
        id: draft.id,
        label: draft.label,
        schemaId: draft.schemaId,
        schema,
        rawValues,
        geometry: deriveGeometry(rawValues),
        processingOptions,
        options: legacy.options,
        info_template: legacy.info_template,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        modelVersion: draft.modelVersion,
        schemaExtensions: draft.schemaExtensions,
        values: draft.values
    };
}
