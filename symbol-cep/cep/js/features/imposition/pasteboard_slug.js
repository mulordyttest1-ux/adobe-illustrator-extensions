export const PASTEBOARD_MODE_STANDARD = 'standard';
export const PASTEBOARD_MODE_CUSTOM = 'custom';
export const PASTEBOARD_MODE_OFF = 'off';

export const STANDARD_PASTEBOARD_TEMPLATE = '{preset_name} | {count} tem | {width}x{height} | {date} {time}\n{margin_summary}';

const EDGE_ORDER = ['top', 'bottom', 'left', 'right'];
const EDGE_LABELS = {
    top: 'Tren',
    bottom: 'Duoi',
    left: 'Trai',
    right: 'Phai'
};

const BASE_TOKENS = [
    { key: 'preset_name', label: 'Ten preset' },
    { key: 'count', label: 'So luong' },
    { key: 'width', label: 'Rong thanh pham' },
    { key: 'height', label: 'Cao thanh pham' },
    { key: 'date', label: 'Ngay' },
    { key: 'time', label: 'Gio' },
    { key: 'timestamp', label: 'Thoi gian' },
    { key: 'margin_summary', label: 'Tom tat bien' }
];

function hasOwn(target, key) {
    return !!target && Object.prototype.hasOwnProperty.call(target, key);
}

function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function getPostflight(preset) {
    const processingOptions = (preset && preset.processingOptions) || {};
    return processingOptions.postflight || {};
}

function getRawValues(preset) {
    return (preset && preset.rawValues) || {};
}

function getSchema(presetOrSchema) {
    if (!presetOrSchema) return null;
    if (presetOrSchema.sections) return presetOrSchema;
    return presetOrSchema.schema || null;
}

function normalizeLineEndings(value) {
    return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function trimTrailingBlankLines(value) {
    return normalizeLineEndings(value)
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
        .replace(/\n+$/g, '')
        .trim();
}

function formatDateParts(now = new Date()) {
    const safeDate = now instanceof Date ? now : new Date(now);
    const year = safeDate.getFullYear();
    const month = pad2(safeDate.getMonth() + 1);
    const day = pad2(safeDate.getDate());
    const hour = pad2(safeDate.getHours());
    const minute = pad2(safeDate.getMinutes());

    return {
        date: `${year}${month}${day}`,
        time: `${hour}:${minute}`,
        timestamp: `${year}${month}${day} ${hour}:${minute}`
    };
}

function resolveFinishSize(resultData, preset, axis) {
    const finishSize = (resultData && resultData.finishSize) || {};
    const rawValues = getRawValues(preset);
    const geometry = (preset && preset.geometry && preset.geometry.finish) || {};
    const finishKey = axis === 'width' ? 'finish_w' : 'finish_h';
    const resultValue = finishSize[axis];
    const rawValue = rawValues[finishKey];
    const geometryValue = axis === 'width' ? geometry.w : geometry.h;

    if (hasValue(resultValue)) return resultValue;
    if (hasValue(rawValue)) return rawValue;
    if (hasValue(geometryValue)) return geometryValue;
    return '';
}

function getFieldValue(rawValues, field) {
    if (field && hasOwn(rawValues, field.id)) {
        return rawValues[field.id];
    }

    if (field && field.default !== undefined) {
        return field.default;
    }

    return '';
}

function formatTokenValue(value) {
    if (!hasValue(value)) return '';
    return String(value).trim();
}

function isPositiveValue(value) {
    if (!hasValue(value)) return false;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0;
}

function formatMarginValue(value) {
    const text = formatTokenValue(value);
    if (!text) return '';
    return /mm$/i.test(text) ? text : `${text}mm`;
}

function shouldCollectSection(section) {
    return section && (section.id === 'sec_sheet_layout' || section.id === 'sec_margins');
}

function getRowLabel(section, row) {
    if (row && row.label) return row.label;
    if (section && section.title) return section.title;
    if (row && row.id) return row.id;
    return 'Bien';
}

export function normalizePasteboardMode(value) {
    if (value === PASTEBOARD_MODE_CUSTOM || value === PASTEBOARD_MODE_OFF) {
        return value;
    }

    return PASTEBOARD_MODE_STANDARD;
}

export function resolvePasteboardMode(preset) {
    const rawValues = getRawValues(preset);
    const postflight = getPostflight(preset);
    const value = postflight.pasteboardMode || rawValues.pasteboard_mode || (preset && preset.pasteboard_mode);

    return normalizePasteboardMode(value);
}

export function getCustomPasteboardTemplate(preset) {
    const rawValues = getRawValues(preset);
    const postflight = getPostflight(preset);

    if (postflight.pasteboardInfoTemplate !== undefined && postflight.pasteboardInfoTemplate !== null) {
        return postflight.pasteboardInfoTemplate;
    }

    if (rawValues.info_template !== undefined && rawValues.info_template !== null) {
        return rawValues.info_template;
    }

    return (preset && preset.info_template) || '';
}

export function resolvePasteboardTemplate(preset) {
    const mode = resolvePasteboardMode(preset);

    if (mode === PASTEBOARD_MODE_OFF) {
        return '';
    }

    if (mode === PASTEBOARD_MODE_CUSTOM) {
        return getCustomPasteboardTemplate(preset);
    }

    return STANDARD_PASTEBOARD_TEMPLATE;
}

export function buildMarginTokenDescriptors(schemaLike) {
    const schema = getSchema(schemaLike);
    const descriptors = [];

    if (!schema || !Array.isArray(schema.sections)) {
        return descriptors;
    }

    schema.sections.forEach((section) => {
        if (!shouldCollectSection(section) || !Array.isArray(section.rows)) return;

        section.rows.forEach((row) => {
            if (!row || !row.fields) return;

            EDGE_ORDER.forEach((edge) => {
                const field = row.fields[edge];
                if (!field || !field.id) return;

                descriptors.push({
                    key: field.id,
                    token: `{${field.id}}`,
                    label: `${getRowLabel(section, row)} / ${EDGE_LABELS[edge] || edge}`,
                    groupId: row.id || field.id,
                    groupLabel: getRowLabel(section, row),
                    edge,
                    edgeLabel: EDGE_LABELS[edge] || edge,
                    field
                });
            });
        });
    });

    return descriptors;
}

export function buildPasteboardTokenDescriptors(schemaLike) {
    const base = BASE_TOKENS.map((entry) => ({
        ...entry,
        token: `{${entry.key}}`
    }));

    return base.concat(buildMarginTokenDescriptors(schemaLike));
}

export function buildMarginSummary(preset) {
    const rawValues = getRawValues(preset);
    const descriptors = buildMarginTokenDescriptors(preset);
    const groups = [];
    const groupById = {};

    descriptors.forEach((descriptor) => {
        const value = getFieldValue(rawValues, descriptor.field);
        if (!isPositiveValue(value)) return;

        if (!groupById[descriptor.groupId]) {
            groupById[descriptor.groupId] = {
                label: descriptor.groupLabel,
                parts: []
            };
            groups.push(groupById[descriptor.groupId]);
        }

        groupById[descriptor.groupId].parts.push(`${descriptor.edgeLabel} ${formatMarginValue(value)}`);
    });

    return groups
        .filter((group) => group.parts.length > 0)
        .map((group) => `${group.label}: ${group.parts.join(', ')}`)
        .join('; ');
}

export function buildInterpolationData(resultData, preset, options = {}) {
    const rawValues = getRawValues(preset);
    const dateParts = formatDateParts(options.now);
    const data = {
        preset_name: (preset && (preset.label || preset.name)) || rawValues.preset_name || 'Unknown',
        count: (resultData && (resultData.itemsProcessed || resultData.count)) || 0,
        width: resolveFinishSize(resultData, preset, 'width'),
        height: resolveFinishSize(resultData, preset, 'height'),
        date: dateParts.date,
        time: dateParts.time,
        timestamp: dateParts.timestamp,
        margin_summary: buildMarginSummary(preset)
    };

    buildMarginTokenDescriptors(preset).forEach((descriptor) => {
        data[descriptor.key] = formatTokenValue(getFieldValue(rawValues, descriptor.field));
    });

    return data;
}

export function interpolateTemplate(template, data) {
    return String(template || '').replace(/{([^{}]*)}/g, (match, key) => {
        return data && typeof data[key] !== 'undefined' ? data[key] : match;
    });
}

export function buildPasteboardLegendPreview(resultData, preset, options = {}) {
    if (!preset) return '';

    const mode = resolvePasteboardMode(preset);
    if (mode === PASTEBOARD_MODE_OFF) return '';

    const template = resolvePasteboardTemplate(preset);
    if (!String(template || '').trim()) return '';

    return trimTrailingBlankLines(interpolateTemplate(template, buildInterpolationData(resultData, preset, options)));
}

export function buildPasteboardLegendPayload(resultData, preset, options = {}) {
    const mode = preset ? resolvePasteboardMode(preset) : PASTEBOARD_MODE_OFF;
    const text = mode === PASTEBOARD_MODE_OFF ? '' : buildPasteboardLegendPreview(resultData, preset, options);

    if (!text) {
        return {
            mode: PASTEBOARD_MODE_OFF,
            text: ''
        };
    }

    return {
        mode,
        text
    };
}
