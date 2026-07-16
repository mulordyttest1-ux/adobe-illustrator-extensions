function createFieldDefinition(data) {
    const id = 'dynamic_' + Date.now();

    const field = {
        id,
        label: data.label,
        type: data.type || 'number',
        default: parseFloat(data.default) || 0
    };

    if (data.classification) {
        field.binding = {
            classification: data.classification,
            edge: data.edge === 'dynamic' ? null : data.edge,
            edge_dynamic: data.edge === 'dynamic'
        };
    }

    return field;
}

function addMatrixRow(section, fieldDef) {
    if (!section.rows) section.rows = [];

    const rowId = `row_${fieldDef.id}`;
    const classification = fieldDef.binding ? fieldDef.binding.classification : 'ADDITIVE';

    const newRow = {
        id: rowId,
        label: fieldDef.label,
        classification,
        fields: {}
    };

    ['left', 'right', 'top', 'bottom'].forEach((edge) => {
        newRow.fields[edge] = {
            id: `${fieldDef.id}_${edge}`,
            type: fieldDef.type,
            default: fieldDef.default || 0,
            binding: { classification, edge }
        };
    });

    section.rows.push(newRow);
    return true;
}

function addField(schema, sectionId, fieldDef) {
    const section = schema.sections.find((entry) => entry.id === sectionId);
    if (!section) return false;

    if (section.layout === 'matrix') {
        return addMatrixRow(section, fieldDef);
    }

    if (!section.fields) section.fields = [];
    section.fields.push(fieldDef);
    return true;
}

function removeFromFields(section, fieldId) {
    if (!section.fields) return false;
    const idx = section.fields.findIndex((field) => field.id === fieldId);
    if (idx < 0) return false;
    section.fields.splice(idx, 1);
    return true;
}

function findFieldEdge(fields, fieldId) {
    for (const edge in fields) {
        if (fields[edge].id === fieldId) return edge;
    }
    return null;
}

function removeFromMatrixRows(section, fieldId) {
    if (!section.rows) return false;

    for (let index = 0; index < section.rows.length; index += 1) {
        const edge = findFieldEdge(section.rows[index].fields, fieldId);
        if (edge) {
            delete section.rows[index].fields[edge];
            return true;
        }
    }

    return false;
}

function removeField(schema, fieldId) {
    for (let index = 0; index < schema.sections.length; index += 1) {
        const section = schema.sections[index];

        if (removeFromFields(section, fieldId)) return true;
        if (removeFromMatrixRows(section, fieldId)) return true;
    }
    return false;
}

export const SchemaMutationService = {
    createFieldDefinition,
    addField,
    removeField
};
