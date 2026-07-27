function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function addSchemaFieldIds(schema, ids) {
    (schema && schema.fields || []).forEach((field) => {
        if (field && field.id) {
            ids.add(field.id);
        }
    });
}

function addRowStateIds(row, ids) {
    if (!row || !row.id) {
        return;
    }

    ids.add(`${row.id}_draw_border`);
    ids.add(`${row.id}_border_style`);

    Object.keys(row.fields || {}).forEach((edge) => {
        const field = row.fields[edge];
        if (field && field.id) {
            ids.add(field.id);
        }
    });
}

export function collectSchemaStateKeys(schema) {
    const ids = new Set([
        'preset_id',
        'preset_name',
        'pasteboard_mode'
    ]);

    (schema && schema.sections || []).forEach((section) => {
        addSchemaFieldIds(section, ids);
        (section.rows || []).forEach((row) => addRowStateIds(row, ids));
    });

    return ids;
}

export function normalizeRawValuesForSchema(rawValues, schema) {
    const source = rawValues || {};
    const allowed = collectSchemaStateKeys(schema);
    const normalized = {};

    Object.keys(source).forEach((key) => {
        if (allowed.has(key)) {
            normalized[key] = source[key];
        }
    });

    return normalized;
}

function buildDefaultRawValue(field) {
    if (!field) return '';
    if (field.type === 'checkbox') return !!field.default;
    if (
        (field.type === 'select' || field.type === 'radio') &&
        field.default === undefined &&
        Array.isArray(field.options) &&
        field.options.length > 0
    ) {
        return field.options[0].val;
    }
    return field.default !== undefined ? field.default : '';
}

export function buildDefaultConfigValues(schema, formMeta = {}) {
    const values = {
        preset_id: formMeta.presetId || '',
        preset_name: formMeta.presetName || '',
        pasteboard_mode: 'standard'
    };

    (schema && schema.sections || []).forEach((section) => {
        (section.fields || []).forEach((field) => {
            if (field && field.id && values[field.id] === undefined) {
                values[field.id] = buildDefaultRawValue(field);
            }
        });
        (section.rows || []).forEach((row) => {
            Object.keys(row && row.fields || {}).forEach((edge) => {
                const field = row.fields[edge];
                if (field && field.id && values[field.id] === undefined) {
                    values[field.id] = buildDefaultRawValue(field);
                }
            });
        });
    });

    return values;
}

export function normalizeConfigValuesForSchema(rawValues, schema, formMeta = {}) {
    const allowed = collectSchemaStateKeys(schema);
    const normalized = buildDefaultConfigValues(schema, formMeta);
    Object.keys(rawValues || {}).forEach((key) => {
        if (allowed.has(key)) {
            normalized[key] = rawValues[key];
        }
    });

    normalized.preset_id = formMeta.presetId || normalized.preset_id || '';
    normalized.preset_name = formMeta.presetName || normalized.preset_name || '';
    if (normalized.pasteboard_mode === undefined || normalized.pasteboard_mode === '') {
        normalized.pasteboard_mode = 'standard';
    }

    return normalized;
}

function sortValue(value) {
    if (Array.isArray(value)) {
        return value.map(sortValue);
    }

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((result, key) => {
                result[key] = sortValue(value[key]);
                return result;
            }, {});
    }

    return value;
}

export function buildConfigStateFingerprint({ schema, rawValues, formMeta } = {}) {
    return JSON.stringify(sortValue({
        schema: clone(schema) || null,
        rawValues: clone(rawValues) || {},
        formMeta: clone(formMeta) || {}
    }));
}
