const MARGIN_SECTION_ID = 'sec_margins';
const DYNAMIC_ROW_PREFIX = 'row_dynamic_';

function defaultIdFactory() {
    return Date.now();
}

export function createMarginRowDefinition({
    label,
    classification = 'ADDITIVE',
    idFactory = defaultIdFactory
} = {}) {
    const dynamicId = `dynamic_${idFactory()}`;
    const rowId = `${DYNAMIC_ROW_PREFIX}${dynamicId.slice('dynamic_'.length)}`;
    const row = {
        id: rowId,
        label: String(label || '').trim(),
        classification,
        fields: {}
    };

    ['left', 'right', 'top', 'bottom'].forEach((edge) => {
        row.fields[edge] = {
            id: `${dynamicId}_${edge}`,
            type: 'number',
            default: 0,
            binding: {
                classification,
                edge
            }
        };
    });

    return row;
}

function findMarginSection(schema) {
    return (schema && schema.sections || []).find((section) => section.id === MARGIN_SECTION_ID);
}

export function addMarginRow(schema, row) {
    const section = findMarginSection(schema);
    if (!section || !row || !row.id) {
        return false;
    }

    section.rows = Array.isArray(section.rows) ? section.rows : [];
    section.rows.push(row);
    return true;
}

export function removeMarginRow(schema, rowId) {
    if (!String(rowId || '').startsWith(DYNAMIC_ROW_PREFIX)) {
        return false;
    }

    const section = findMarginSection(schema);
    if (!section || !Array.isArray(section.rows)) {
        return false;
    }

    const nextRows = section.rows.filter((row) => !row || row.id !== rowId);
    if (nextRows.length === section.rows.length) {
        return false;
    }

    section.rows = nextRows;
    return true;
}

export const SchemaMutationService = {
    createMarginRowDefinition,
    addMarginRow,
    removeMarginRow
};
