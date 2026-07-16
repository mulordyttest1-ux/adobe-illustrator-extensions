import { BuiltinPresets } from './builtin_presets.js';
import { PASTEBOARD_MODE_STANDARD, normalizePasteboardMode } from './pasteboard_slug.js';

const DEFAULT_SCHEMA_ID = 'standard_imposition';
const INVARIANT_SUMMARY = [
    { id: 'pipeline_clone', label: '01. [Bắt buộc] Tạo bản sao (Isolation)', note: 'Luôn bật để giữ artwork gốc an toàn.' },
    { id: 'pipeline_resize_checkpoint', label: '04. Resize selection', note: 'Checkpoint nội bộ luôn chạy trước bước layout.' }
];
const INVARIANT_FIELD_IDS = {
    opt_clone: true,
    opt_mod_layout_checkpoint: true
};
const LEGACY_OPTION_TO_RAW_FIELD = {
    cleanup: 'opt_cleanup',
    k100: 'opt_k100'
};
const PROCESSING_CHECKBOX_FIELD_IDS = [
    'opt_cleanup',
    'opt_k100',
    'opt_symbol_mode',
    'opt_layout_head_to_head',
    'opt_n_up',
    'opt_custom_rotate',
    'opt_draw_marks',
    'mark_style_hybrid'
];

function cloneDeep(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function hasOwn(target, key) {
    return !!target && Object.prototype.hasOwnProperty.call(target, key);
}

function hasMeaningfulValue(value) {
    return value !== undefined && value !== null && value !== '';
}

function isChecked(value) {
    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function pickFieldDefault(field, fallbackValue) {
    if (field && field.default !== undefined) {
        return field.default;
    }

    return fallbackValue;
}

function findDefaultInFieldList(fields, fieldId, fallbackValue) {
    if (!fields) {
        return null;
    }

    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if (field && field.id === fieldId) {
            return pickFieldDefault(field, fallbackValue);
        }
    }

    return null;
}

function findDefaultInRowFields(rowFields, fieldId, fallbackValue) {
    if (!rowFields) {
        return null;
    }

    const keys = Object.keys(rowFields);
    for (let i = 0; i < keys.length; i += 1) {
        const field = rowFields[keys[i]];
        if (field && field.id === fieldId) {
            return pickFieldDefault(field, fallbackValue);
        }
    }

    return null;
}

function findFieldDefault(schema, fieldId, fallbackValue) {
    if (!schema || !schema.sections) return fallbackValue;

    for (let i = 0; i < schema.sections.length; i += 1) {
        const section = schema.sections[i];
        const fieldMatch = findDefaultInFieldList(section && section.fields, fieldId, fallbackValue);

        if (fieldMatch !== null) {
            return fieldMatch;
        }

        if (section && section.rows) {
            for (let j = 0; j < section.rows.length; j += 1) {
                const row = section.rows[j];
                const rowMatch = findDefaultInRowFields(row && row.fields, fieldId, fallbackValue);
                if (rowMatch !== null) {
                    return rowMatch;
                }
            }
        }
    }

    return fallbackValue;
}

function resolveSchema(schemaId, embeddedSchema, schemaOverride) {
    if (schemaOverride && schemaOverride.sections) return schemaOverride;
    if (embeddedSchema && embeddedSchema.sections) return embeddedSchema;

    if (BuiltinPresets && BuiltinPresets.length > 0) {
        for (let i = 0; i < BuiltinPresets.length; i += 1) {
            if (BuiltinPresets[i].id === schemaId) {
                return BuiltinPresets[i];
            }
        }
        return BuiltinPresets[0];
    }

    return null;
}

function buildDefaultRawValue(field) {
    if (!field) return '';

    if (field.type === 'checkbox') {
        return !!field.default;
    }

    if ((field.type === 'select' || field.type === 'radio') && field.default === undefined && Array.isArray(field.options) && field.options.length > 0) {
        return field.options[0].val;
    }

    if (field.default !== undefined) {
        return field.default;
    }

    return '';
}

// eslint-disable-next-line complexity
function traverseSchemaFields(schema, callback) {
    if (!schema || !schema.sections) return;

    for (let i = 0; i < schema.sections.length; i += 1) {
        const section = schema.sections[i];

        if (section && Array.isArray(section.fields)) {
            for (let j = 0; j < section.fields.length; j += 1) {
                callback(section.fields[j], section);
            }
        }

        if (section && Array.isArray(section.rows)) {
            for (let j = 0; j < section.rows.length; j += 1) {
                const row = section.rows[j];
                if (!row || !row.fields) continue;

                const keys = Object.keys(row.fields);
                for (let k = 0; k < keys.length; k += 1) {
                    callback(row.fields[keys[k]], section, row);
                }
            }
        }
    }
}

function buildSchemaDefaultRawValues(schema) {
    const rawValues = {};

    traverseSchemaFields(schema, (field) => {
        if (!field || !field.id) return;
        if (hasOwn(rawValues, field.id)) return;
        rawValues[field.id] = buildDefaultRawValue(field);
    });

    return rawValues;
}

// eslint-disable-next-line complexity
function mergePresetSection(baseSection, overlaySection) {
    if (!baseSection) {
        return cloneDeep(overlaySection);
    }

    const mergedSection = cloneDeep(baseSection);
    const existingFieldIds = {};
    const existingRowIds = {};

    if (!Array.isArray(mergedSection.fields)) mergedSection.fields = [];
    if (!Array.isArray(mergedSection.rows)) mergedSection.rows = [];

    for (let i = 0; i < mergedSection.fields.length; i += 1) {
        const field = mergedSection.fields[i];
        if (field && field.id) {
            existingFieldIds[field.id] = true;
        }
    }

    for (let i = 0; i < mergedSection.rows.length; i += 1) {
        const row = mergedSection.rows[i];
        if (row && row.id) {
            existingRowIds[row.id] = true;
        }
    }

    if (overlaySection && Array.isArray(overlaySection.fields)) {
        for (let i = 0; i < overlaySection.fields.length; i += 1) {
            const field = overlaySection.fields[i];
            if (!field || !field.id || INVARIANT_FIELD_IDS[field.id] || existingFieldIds[field.id]) continue;
            mergedSection.fields.push(cloneDeep(field));
            existingFieldIds[field.id] = true;
        }
    }

    if (overlaySection && Array.isArray(overlaySection.rows)) {
        for (let i = 0; i < overlaySection.rows.length; i += 1) {
            const row = overlaySection.rows[i];
            if (!row || !row.id || existingRowIds[row.id]) continue;
            mergedSection.rows.push(cloneDeep(row));
            existingRowIds[row.id] = true;
        }
    }

    return mergedSection;
}

function mergePresetSchema(presetSchema, canonicalSchema) {
    if (!presetSchema || !presetSchema.sections) {
        return cloneDeep(canonicalSchema);
    }

    if (!canonicalSchema || !canonicalSchema.sections) {
        return normalizePresetSchema(presetSchema);
    }

    const merged = cloneDeep(canonicalSchema);
    const sectionIndices = {};

    for (let i = 0; i < merged.sections.length; i += 1) {
        const section = merged.sections[i];
        if (section && section.id) {
            sectionIndices[section.id] = i;
        }
    }

    for (let i = 0; i < presetSchema.sections.length; i += 1) {
        const overlaySection = presetSchema.sections[i];
        if (!overlaySection || !overlaySection.id) continue;

        if (sectionIndices[overlaySection.id] === undefined) {
            merged.sections.push(cloneDeep(overlaySection));
            continue;
        }

        const baseIndex = sectionIndices[overlaySection.id];
        merged.sections[baseIndex] = mergePresetSection(merged.sections[baseIndex], overlaySection);
    }

    return normalizePresetSchema(merged);
}

function resolveBooleanValue(source, key, fallbackValue) {
    if (!hasOwn(source, key)) return !!fallbackValue;
    return isChecked(source[key]);
}

function resolveNumberValue(source, key, fallbackValue) {
    if (!hasOwn(source, key) || source[key] === '' || source[key] === null || source[key] === undefined) {
        return fallbackValue;
    }
    return toNumber(source[key], fallbackValue);
}

function resolveTextValue(source, key, fallbackValue, preserveBlank) {
    if (!hasOwn(source, key) || source[key] === undefined || source[key] === null) {
        return fallbackValue;
    }

    if (source[key] === '' && !preserveBlank) {
        return fallbackValue;
    }

    return source[key];
}

function buildDefaultProcessingOptions(schema) {
    return {
        cleanup: Boolean(findFieldDefault(schema, 'opt_cleanup', true)),
        k100: Boolean(findFieldDefault(schema, 'opt_k100', true)),
        output: {
            mode: findFieldDefault(schema, 'opt_symbol_mode', true) ? 'symbol' : 'group'
        },
        layout: {
            mode: findFieldDefault(schema, 'opt_n_up', true) ? 'nup' : 'single',
            headToHead: Boolean(findFieldDefault(schema, 'opt_layout_head_to_head', false)),
            align: findFieldDefault(schema, 'align_position', 'tl')
        },
        rotate: {
            enabled: Boolean(findFieldDefault(schema, 'opt_custom_rotate', false)),
            angle: toNumber(findFieldDefault(schema, 'custom_rotate_angle', 0), 0)
        },
        marks: {
            enabled: Boolean(findFieldDefault(schema, 'opt_draw_marks', true)),
            length: toNumber(findFieldDefault(schema, 'mark_len', 5), 5),
            weight: toNumber(findFieldDefault(schema, 'mark_weight', 0.5), 0.5),
            hybrid: Boolean(findFieldDefault(schema, 'mark_style_hybrid', true))
        },
        postflight: {
            pasteboardMode: PASTEBOARD_MODE_STANDARD,
            pasteboardInfoTemplate: findFieldDefault(schema, 'info_template', '')
        },
        invariants: {
            clone: true,
            resizeCheckpoint: true
        }
    };
}

function applyLegacyMirrorsToRawValues(rawValues, preset) {
    const safePreset = preset || {};
    const legacyOptions = safePreset.options || {};

    const optionKeys = Object.keys(LEGACY_OPTION_TO_RAW_FIELD);
    for (let i = 0; i < optionKeys.length; i += 1) {
        const optionKey = optionKeys[i];
        if (!hasOwn(legacyOptions, optionKey)) continue;
        rawValues[LEGACY_OPTION_TO_RAW_FIELD[optionKey]] = !!legacyOptions[optionKey];
    }

    if (safePreset.info_template !== undefined && safePreset.info_template !== null) {
        rawValues.info_template = safePreset.info_template;
    }
}

// eslint-disable-next-line complexity
function applyProcessingOptionsToRawValues(rawValues, processingOptions) {
    const opts = processingOptions || {};
    const output = opts.output || {};
    const layout = opts.layout || {};
    const rotate = opts.rotate || {};
    const marks = opts.marks || {};
    const postflight = opts.postflight || {};

    rawValues.opt_cleanup = !!opts.cleanup;
    rawValues.opt_k100 = !!opts.k100;
    rawValues.opt_symbol_mode = output.mode !== 'group';
    rawValues.opt_n_up = layout.mode !== 'single';
    rawValues.opt_layout_head_to_head = !!layout.headToHead;
    rawValues.align_position = hasMeaningfulValue(layout.align) ? layout.align : rawValues.align_position;
    rawValues.opt_custom_rotate = !!rotate.enabled;
    rawValues.custom_rotate_angle = hasMeaningfulValue(rotate.angle) ? rotate.angle : 0;
    rawValues.opt_draw_marks = !!marks.enabled;
    rawValues.mark_len = hasMeaningfulValue(marks.length) ? marks.length : rawValues.mark_len;
    rawValues.mark_weight = hasMeaningfulValue(marks.weight) ? marks.weight : rawValues.mark_weight;
    rawValues.mark_style_hybrid = !!marks.hybrid;
    rawValues.info_template = hasMeaningfulValue(postflight.pasteboardInfoTemplate) || postflight.pasteboardInfoTemplate === ''
        ? postflight.pasteboardInfoTemplate
        : rawValues.info_template;
    rawValues.pasteboard_mode = hasMeaningfulValue(postflight.pasteboardMode)
        ? normalizePasteboardMode(postflight.pasteboardMode)
        : normalizePasteboardMode(rawValues.pasteboard_mode);
}

// eslint-disable-next-line complexity
function applyGeometryFallbacks(rawValues, preset) {
    if (!preset || !preset.geometry) return;

    if (preset.geometry.finish) {
        if (!hasMeaningfulValue(rawValues.finish_w)) {
            rawValues.finish_w = preset.geometry.finish.w || '';
        }
        if (!hasMeaningfulValue(rawValues.finish_h)) {
            rawValues.finish_h = preset.geometry.finish.h || '';
        }
    }

    if (Array.isArray(preset.geometry.safe)) {
        const safe = preset.geometry.safe;
        if (!hasMeaningfulValue(rawValues.safe_top)) rawValues.safe_top = safe[0] || 0;
        if (!hasMeaningfulValue(rawValues.safe_bottom)) rawValues.safe_bottom = safe[1] || 0;
        if (!hasMeaningfulValue(rawValues.safe_left)) rawValues.safe_left = safe[2] || 0;
        if (!hasMeaningfulValue(rawValues.safe_right)) rawValues.safe_right = safe[3] || 0;
    }
}

function buildLegacyProcessingSource(preset, schema) {
    const safePreset = preset || {};

    if (safePreset.processingOptions) {
        const source = buildSchemaDefaultRawValues(schema);
        applyLegacyMirrorsToRawValues(source, safePreset);

        if (safePreset.rawValues) {
            Object.keys(safePreset.rawValues).forEach((key) => {
                source[key] = safePreset.rawValues[key];
            });
        }

        applyProcessingOptionsToRawValues(source, safePreset.processingOptions);
        return source;
    }

    if (safePreset.rawValues) {
        const source = cloneDeep(safePreset.rawValues);

        for (let i = 0; i < PROCESSING_CHECKBOX_FIELD_IDS.length; i += 1) {
            const fieldId = PROCESSING_CHECKBOX_FIELD_IDS[i];
            if (!hasOwn(source, fieldId)) {
                source[fieldId] = false;
            }
        }

        if (!hasOwn(source, 'info_template') && safePreset.info_template !== undefined && safePreset.info_template !== null) {
            source.info_template = safePreset.info_template;
        }

        return source;
    }

    const source = buildSchemaDefaultRawValues(schema);
    applyLegacyMirrorsToRawValues(source, safePreset);
    return source;
}

function buildHydratedRawValues(preset, schema, processingOptions) {
    const rawValues = buildSchemaDefaultRawValues(schema);
    const safePreset = preset || {};

    if (safePreset.rawValues) {
        Object.keys(safePreset.rawValues).forEach((key) => {
            rawValues[key] = safePreset.rawValues[key];
        });
    }

    applyLegacyMirrorsToRawValues(rawValues, safePreset);
    applyGeometryFallbacks(rawValues, safePreset);
    applyProcessingOptionsToRawValues(rawValues, processingOptions);

    rawValues.preset_id = safePreset.id || rawValues.preset_id || '';
    rawValues.preset_name = safePreset.label || safePreset.name || rawValues.preset_name || '';

    return rawValues;
}

export function getCanonicalSchema(schemaId = DEFAULT_SCHEMA_ID) {
    const resolved = resolveSchema(schemaId, null, null);
    return normalizePresetSchema(resolved);
}

export function getPresetSchema(preset, schemaOverride) {
    const safePreset = preset || {};
    const canonical = schemaOverride && schemaOverride.sections
        ? normalizePresetSchema(schemaOverride)
        : getCanonicalSchema(safePreset.schemaId || DEFAULT_SCHEMA_ID);

    return mergePresetSchema(safePreset.schema, canonical);
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

export function serializeFormState(form) {
    const snapshot = {};
    if (!form || !form.elements) return snapshot;

    const radioGroups = {};
    const elements = Array.from(form.elements);

    for (let i = 0; i < elements.length; i += 1) {
        const element = elements[i];
        if (!element || !element.name || element.disabled) continue;

        if (element.type === 'radio') {
            if (radioGroups[element.name]) continue;
            radioGroups[element.name] = true;
            snapshot[element.name] = form.elements[element.name].value || '';
            continue;
        }

        if (element.type === 'checkbox') {
            snapshot[element.name] = !!element.checked;
            continue;
        }

        snapshot[element.name] = element.value;
    }

    return snapshot;
}

export function buildProcessingOptions(rawValues, schema) {
    const safeRaw = rawValues || {};
    const resolvedSchema = schema && schema.sections ? schema : getCanonicalSchema(DEFAULT_SCHEMA_ID);
    const defaults = buildDefaultProcessingOptions(resolvedSchema);

    return {
        cleanup: resolveBooleanValue(safeRaw, 'opt_cleanup', defaults.cleanup),
        k100: resolveBooleanValue(safeRaw, 'opt_k100', defaults.k100),
        output: {
            mode: resolveBooleanValue(safeRaw, 'opt_symbol_mode', defaults.output.mode === 'symbol') ? 'symbol' : 'group'
        },
        layout: {
            mode: resolveBooleanValue(safeRaw, 'opt_n_up', defaults.layout.mode === 'nup') ? 'nup' : 'single',
            headToHead: resolveBooleanValue(safeRaw, 'opt_layout_head_to_head', defaults.layout.headToHead),
            align: resolveTextValue(safeRaw, 'align_position', defaults.layout.align, false)
        },
        rotate: {
            enabled: resolveBooleanValue(safeRaw, 'opt_custom_rotate', defaults.rotate.enabled),
            angle: resolveNumberValue(safeRaw, 'custom_rotate_angle', defaults.rotate.angle)
        },
        marks: {
            enabled: resolveBooleanValue(safeRaw, 'opt_draw_marks', defaults.marks.enabled),
            length: resolveNumberValue(safeRaw, 'mark_len', defaults.marks.length),
            weight: resolveNumberValue(safeRaw, 'mark_weight', defaults.marks.weight),
            hybrid: resolveBooleanValue(safeRaw, 'mark_style_hybrid', defaults.marks.hybrid)
        },
        postflight: {
            pasteboardMode: normalizePasteboardMode(resolveTextValue(safeRaw, 'pasteboard_mode', defaults.postflight.pasteboardMode, false)),
            pasteboardInfoTemplate: resolveTextValue(safeRaw, 'info_template', defaults.postflight.pasteboardInfoTemplate, true)
        },
        invariants: {
            clone: true,
            resizeCheckpoint: true
        }
    };
}

export function buildLegacyMirrors(processingOptions) {
    const opts = processingOptions || {};

    return {
        options: {
            clone: !!(opts.invariants && opts.invariants.clone),
            cleanup: !!opts.cleanup,
            k100: !!opts.k100
        },
        info_template: (opts.postflight && opts.postflight.pasteboardInfoTemplate) || ''
    };
}

export function hydratePreset(preset, schemaOverride) {
    if (!preset) return preset;

    const schema = getPresetSchema(preset, schemaOverride);
    const processingSource = buildLegacyProcessingSource(preset, schema);
    const processingOptions = buildProcessingOptions(processingSource, schema);
    const legacy = buildLegacyMirrors(processingOptions);
    const rawValues = buildHydratedRawValues(preset, schema, processingOptions);

    return {
        ...preset,
        schemaId: preset.schemaId || (schema && schema.id) || DEFAULT_SCHEMA_ID,
        schema,
        rawValues,
        processingOptions,
        options: legacy.options,
        info_template: legacy.info_template
    };
}
