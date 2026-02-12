/**
 * ConfigEngine: Core logic for Data-Driven Configuration
 * 🛑 GOVERNANCE COMPLIANCE REQUIRED 🛑
 * Read .agent/naming_governance.md before modifying schema logic.
 *
 * Role:
 * 1. Validate Schema
 * 2. Compile Config + UserInput -> Margin Rules
 */

window.ConfigEngine = {
    /**
     * Compile Rules from a Config Definition and User Data
     * @param {Object} configDef - The JSON schema defining the tab/fields
     * @param {FormData|Object} formData - The User's input values (FormData or Plain Object)
     * @returns {Array} rules - List of MarginRule objects for JSX
     */
    compileRules: function (configDef, formData) {
        const rules = [];

        if (!configDef || !configDef.sections) return rules;

        // Helper to get value from FormData or Object
        const getValue = function (key) {
            if (formData && typeof formData.get === 'function') return formData.get(key);
            return formData[key]; // Assume plain object
        };

        // Iterate through all sections and fields
        configDef.sections.forEach(function (section) {

            // Helper: Process a single field
            const processField = function (field) {
                // Skip if no binding logic
                if (!field.binding) return;

                // Get User Value
                const rawVal = getValue(field.id);
                let val = parseFloat(rawVal);
                if (isNaN(val)) val = field.default || 0;

                // Generate Rule based on Binding Type
                if (field.binding.classification) {
                    const rule = {
                        id: field.id,
                        val: val,
                        type: field.binding.classification
                    };

                    // Determine Edge
                    if (field.binding.edge_dynamic) {
                        // 1. Explicit Source (e.g. "binding_edge")
                        const edgeSourceId = field.binding.edge_source || (field.id + '_edge');
                        const edgeVal = getValue(edgeSourceId);

                        if (edgeVal) rule.edge = edgeVal;

                        // Fallback: Check hardcoded edge in definition
                        if (!rule.edge && field.binding.edge) rule.edge = field.binding.edge;
                    } else {
                        // Hardcoded edge
                        rule.edge = field.binding.edge;
                    }

                    // Special Case: "ALL" edges (e.g. Safe Zone applied to all 4)
                    if (rule.edge === 'all') {
                        ['top', 'bottom', 'left', 'right'].forEach(function (e) {
                            rules.push({
                                id: rule.id + '_' + e,
                                val: rule.val,
                                type: rule.type,
                                edge: e
                            });
                        });
                    } else if (rule.edge) {
                        // Single Edge Rule
                        rules.push(rule);
                    }
                }
            };

            // 1. Process Standard Fields
            if (section.fields) {
                section.fields.forEach(processField);
            }

            // 2. Process Matrix Rows
            if (section.rows) {
                section.rows.forEach(function (row) {
                    if (row.fields) {
                        for (const key in row.fields) {
                            if (row.fields.hasOwnProperty(key)) {
                                const f = row.fields[key];
                                // PROACTIVE FIX: Infer Binding from Row Context if missing (and not explicitly disabled)
                                if (f.binding === undefined) {
                                    f.binding = {
                                        classification: row.classification,
                                        edge: key // 'left', 'top', 'right', 'bottom'
                                    };
                                }
                                processField(row.fields[key]);
                            }
                        }
                    }
                });
            }
        });

        console.log("Compiled Rules:", rules);
        return rules;
    },

    /**
     * Validate a Config Schema
     */
    validateSchema: function (config) {
        if (!config.id || !config.name || !config.sections) {
            console.error("Invalid Config Schema: Missing root properties");
            return false;
        }
        return true;
    },

    // --- Schema Manipulation (Phase 9) ---

    /**
     * Create a standardized field definition
     */
    createFieldDefinition: function (data) {
        // data: { label, type, classification, edge, sectionId... }
        const id = 'dynamic_' + Date.now(); // Simple ID generation

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
            if (data.edge === 'dynamic') {
                // For dynamic edges, we strictly rely on "Edge Select" logic
                // But for simplicity in phase 9, let's assume Additive/Structural often just overrides "Right" or "Left" fixedly?
                // No, requirement said "Wizard selects scope".
            }
        }

        return field;
    },

    /**
     * Add a Field to a Schema Section
     */
    addField: function (schema, sectionId, fieldDef) {
        const section = schema.sections.find(function (s) { return s.id === sectionId; });
        if (!section) return false;

        // Phase 11: Support Matrix Layout
        if (section.layout === 'matrix') {
            if (!section.rows) section.rows = [];

            // Create a new Row based on the Field Definition
            // The Wizard gave us a single fieldDef with Label, Type, Classification.
            // We expand this into a 4-edge Row.

            const rowId = 'row_' + fieldDef.id;
            const newRow = {
                id: rowId,
                label: fieldDef.label, // "Bù Xéo"
                classification: fieldDef.binding ? fieldDef.binding.classification : 'ADDITIVE',
                fields: {}
            };

            // Generate 4 fields for this row (Left, Right, Top, Bottom)
            ['left', 'right', 'top', 'bottom'].forEach(function (edge) {
                newRow.fields[edge] = {
                    id: fieldDef.id + '_' + edge, // unique id
                    type: fieldDef.type,
                    default: fieldDef.default || 0,
                    // Inherit binding? Yes, but specific edge.
                    // Actually, if it's dynamic, we might not need binding prop here if UI handles it?
                    // But ConfigEngine.compileRules needs it!
                    binding: {
                        classification: newRow.classification,
                        edge: edge
                    }
                };
            });

            section.rows.push(newRow);
            return true;
        }

        // Standard Stack/Grid Layout
        if (!section.fields) section.fields = [];
        section.fields.push(fieldDef);
        return true;
    },

    /**
     * Remove a Field from Schema
     */
    removeField: function (schema, fieldId) {
        for (let i = 0; i < schema.sections.length; i++) {
            const section = schema.sections[i];

            // Standard Layout
            if (section.fields) {
                const idx = section.fields.findIndex(function (f) { return f.id === fieldId });
                if (idx >= 0) {
                    section.fields.splice(idx, 1);
                    return true;
                }
            }

            // Matrix Layout
            if (section.rows) {
                for (let r = 0; r < section.rows.length; r++) {
                    const row = section.rows[r];
                    // row.fields is an object: { left: {...}, right: {...} }
                    // We need to find key where value.id === fieldId
                    let targetEdge = null;
                    for (const edge in row.fields) {
                        if (row.fields[edge].id === fieldId) {
                            targetEdge = edge;
                            break;
                        }
                    }

                    if (targetEdge) {
                        delete row.fields[targetEdge];
                        // Optional: If row has no fields left, remove row?
                        // For now keep it to act as placeholder or let user remove others.
                        return true;
                    }
                }
            }
        }
        return false;
    }
};
