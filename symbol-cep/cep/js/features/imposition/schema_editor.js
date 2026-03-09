/**
 * MODULE: SchemaEditor
 * LAYER: Core/Utility (L2)
 * PURPOSE: Schema manipulation — add/remove fields dynamically
 * DEPENDENCIES: None (pure object manipulation)
 * SIDE EFFECTS: None (mutates passed schema objects)
 * EXPORTS: ConfigEngine.createFieldDefinition, .addField, .removeField
 */

import { ConfigEngine } from './config_engine.js';

(function (engine) {

    /**
     * Create a standardized field definition from wizard data
     * @param {Object} data - {label, type, classification, edge}
     * @returns {Object} field definition
     */
    engine.createFieldDefinition = function (data) {
        const id = 'dynamic_' + Date.now();

        const field = {
            id: id,
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
    };

    /**
     * Add a Field to a Schema Section
     * @param {Object} schema - The full schema object
     * @param {string} sectionId - Target section ID
     * @param {Object} fieldDef - Field definition (from createFieldDefinition)
     * @returns {boolean} success
     */
    engine.addField = function (schema, sectionId, fieldDef) {
        const section = schema.sections.find(s => s.id === sectionId);
        if (!section) return false;

        if (section.layout === 'matrix') {
            return _addMatrixRow(section, fieldDef);
        }

        // Standard Stack/Grid Layout
        if (!section.fields) section.fields = [];
        section.fields.push(fieldDef);
        return true;
    };

    /**
     * Add a matrix row from a field definition
     * @private
     */
    function _addMatrixRow(section, fieldDef) {
        if (!section.rows) section.rows = [];

        const rowId = 'row_' + fieldDef.id;
        const classification = fieldDef.binding ? fieldDef.binding.classification : 'ADDITIVE';

        const newRow = {
            id: rowId,
            label: fieldDef.label,
            classification: classification,
            fields: {}
        };

        ['left', 'right', 'top', 'bottom'].forEach(edge => {
            newRow.fields[edge] = {
                id: fieldDef.id + '_' + edge,
                type: fieldDef.type,
                default: fieldDef.default || 0,
                binding: { classification: classification, edge: edge }
            };
        });

        section.rows.push(newRow);
        return true;
    }

    /**
     * Remove a Field from Schema by ID
     * @param {Object} schema - The full schema object
     * @param {string} fieldId - Field ID to remove
     * @returns {boolean} success
     */
    engine.removeField = function (schema, fieldId) {
        for (let i = 0; i < schema.sections.length; i++) {
            const section = schema.sections[i];

            if (_removeFromFields(section, fieldId)) return true;
            if (_removeFromMatrixRows(section, fieldId)) return true;
        }
        return false;
    };

    /**
     * Try removing from standard fields array
     * @private
     */
    function _removeFromFields(section, fieldId) {
        if (!section.fields) return false;
        const idx = section.fields.findIndex(f => f.id === fieldId);
        if (idx < 0) return false;
        section.fields.splice(idx, 1);
        return true;
    }

    /**
     * Try removing from matrix row fields
     * @private
     */
    function _removeFromMatrixRows(section, fieldId) {
        if (!section.rows) return false;

        for (let r = 0; r < section.rows.length; r++) {
            const edge = _findFieldEdge(section.rows[r].fields, fieldId);
            if (edge) {
                delete section.rows[r].fields[edge];
                return true;
            }
        }
        return false;
    }

    /**
     * Find which edge key contains the target field ID
     * @private
     */
    function _findFieldEdge(fields, fieldId) {
        for (const edge in fields) {
            if (fields[edge].id === fieldId) return edge;
        }
        return null;
    }

})(ConfigEngine);

export { ConfigEngine };
