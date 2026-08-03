import {
    collectSchemaStateKeys,
    normalizeRawValuesForSchema
} from './config_schema_state.js';
import { createPresetDraft, isPresetDraft, normalizePresetDraft } from './preset_draft_model.js';
import { extractMarginRowExtensions } from './preset_schema_policy.js';
import {
    getPresetDraftUnsupportedExtensions,
    isCanonicalPresetEntry
} from './preset_serializer.js';
import * as legacyAdapter from './legacy_preset_adapter.js';

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function listUnsupportedExtensions(schema) {
    const canonical = legacyAdapter.getCanonicalSchema();
    const canonicalSections = new Map((canonical.sections || []).map((section) => [section.id, section]));
    const issues = [];

    (schema && schema.sections || []).forEach((section) => {
        const base = canonicalSections.get(section && section.id);
        if (!base) {
            issues.push(`section:${section && section.id}`);
            return;
        }

        const baseFields = new Set((base.fields || []).map((field) => field && field.id));
        (section.fields || []).forEach((field) => {
            if (field && !baseFields.has(field.id)) {
                issues.push(`field:${section.id}/${field.id}`);
            }
        });

        (section.rows || []).forEach((row) => {
            if (row && String(row.id || '').indexOf('row_dynamic_') !== 0) {
                const baseRows = new Set((base.rows || []).map((entry) => entry && entry.id));
                if (!baseRows.has(row.id)) {
                    issues.push(`row:${section.id}/${row.id}`);
                }
            }
        });
    });

    return issues;
}

function buildDraftFromRuntimePreset(preset, schemaOverride) {
    const hydrated = legacyAdapter.hydratePreset(preset, schemaOverride);
    const schema = hydrated.schema;
    const allowedKeys = collectSchemaStateKeys(schema);
    const hydratedValues = normalizeRawValuesForSchema(hydrated.rawValues, schema);
    const values = {};

    Object.keys(hydratedValues).forEach((key) => {
        if (allowedKeys.has(key) && key !== 'preset_id' && key !== 'preset_name') {
            values[key] = hydratedValues[key];
        }
    });

    return {
        draft: createPresetDraft({
            id: hydrated.id || preset.id,
            label: hydrated.label || preset.label || preset.name,
            schemaId: schema.id || 'standard_imposition',
            schemaExtensions: {
                marginRows: extractMarginRowExtensions(schema)
            },
            values,
            createdAt: hydrated.createdAt || preset.createdAt,
            updatedAt: hydrated.updatedAt || preset.updatedAt
        }),
        unsupportedExtensions: listUnsupportedExtensions(schema),
        sourceVersion: 4
    };
}

export function migratePresetToDraft(preset, schemaOverride) {
    if (!preset) {
        return {
            success: false,
            draft: null,
            sourceVersion: 0,
            unsupportedExtensions: []
        };
    }

    if (isPresetDraft(preset) || isCanonicalPresetEntry(preset)) {
        const draft = normalizePresetDraft(preset);
        const unsupportedExtensions = getPresetDraftUnsupportedExtensions(preset);
        return {
            success: unsupportedExtensions.length === 0,
            draft,
            sourceVersion: 5,
            unsupportedExtensions
        };
    }

    const result = buildDraftFromRuntimePreset(preset, schemaOverride);
    return {
        ...result,
        success: result.unsupportedExtensions.length === 0
    };
}

export function toDraft(preset, schemaOverride) {
    return migratePresetToDraft(preset, schemaOverride).draft;
}

export function buildDraftFromConfig({ id, label, schema, rawValues, createdAt, updatedAt } = {}) {
    return buildDraftFromConfigResult({
        id,
        label,
        schema,
        rawValues,
        createdAt,
        updatedAt
    }).draft;
}

export function buildDraftFromConfigResult({ id, label, schema, rawValues, createdAt, updatedAt } = {}) {
    return migratePresetToDraft({
        id,
        label,
        schema,
        rawValues: clone(rawValues) || {},
        createdAt,
        updatedAt
    }, schema);
}
