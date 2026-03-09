/**
 * MODULE: ConfigEngine
 * LAYER: Core/Engine (L2)
 * PURPOSE: Compile config schema + user input into Margin Rules
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure compilation)
 * EXPORTS: ConfigEngine.compileRules(), .validateSchema()
 */

export const ConfigEngine = {};

(function (engine) {

    /**
     * Compile Rules from a Config Definition and User Data
     * @param {Object} configDef - The JSON schema defining the tab/fields
     * @param {FormData|Object} formData - The User's input values
     * @returns {Array} rules - List of MarginRule objects for JSX
     */
    engine.compileRules = function (configDef, formData) {
        const rules = [];
        if (!configDef || !configDef.sections) return rules;

        const getValue = _createValueGetter(formData);

        configDef.sections.forEach(function (section) {
            _compileSectionFields(section, getValue, rules);
            _compileSectionRows(section, getValue, rules);
        });

        console.log("Compiled Rules:", rules);
        return rules;
    };

    /**
     * Validate a Config Schema
     */
    engine.validateSchema = function (config) {
        if (!config.id || !config.name || !config.sections) {
            console.error("Invalid Config Schema: Missing root properties");
            return false;
        }
        return true;
    };

    // --- Private Helpers ---

    /**
     * Create a value getter function for FormData or plain object
     * @private
     */
    function _createValueGetter(formData) {
        return function (key) {
            if (formData && typeof formData.get === 'function') return formData.get(key);
            return formData[key];
        };
    }

    /**
     * Process standard fields in a section
     * @private
     */
    function _compileSectionFields(section, getValue, rules) {
        if (!section.fields) return;
        section.fields.forEach(field => _compileField(field, getValue, rules));
    }

    /**
     * Process matrix rows in a section
     * @private
     */
    function _compileSectionRows(section, getValue, rules) {
        if (!section.rows) return;
        section.rows.forEach(row => {
            if (!row.fields) return;
            for (const key in row.fields) {
                if (!Object.prototype.hasOwnProperty.call(row.fields, key)) continue;
                const f = row.fields[key];
                if (f.binding === undefined) {
                    f.binding = { classification: row.classification, edge: key };
                }
                _compileField(f, getValue, rules);
            }
        });
    }

    /**
     * Compile a single field into rules
     * @private
     */
    function _compileField(field, getValue, rules) {
        if (!field.binding || !field.binding.classification) return;

        const rawVal = getValue(field.id);
        let val = parseFloat(rawVal);
        if (isNaN(val)) val = field.default || 0;

        const rule = {
            id: field.id,
            val: val,
            type: field.binding.classification,
            edge: _resolveEdge(field, getValue)
        };

        if (rule.edge === 'all') {
            _expandAllEdges(rule, rules);
        } else if (rule.edge) {
            rules.push(rule);
        }
    }

    /**
     * Resolve the edge for a field (dynamic or static)
     * @private
     */
    function _resolveEdge(field, getValue) {
        if (field.binding.edge_dynamic) {
            const edgeSourceId = field.binding.edge_source || (field.id + '_edge');
            const edgeVal = getValue(edgeSourceId);
            return edgeVal || field.binding.edge || null;
        }
        return field.binding.edge;
    }

    /**
     * Expand an 'all' edge rule into 4 individual rules
     * @private
     */
    function _expandAllEdges(rule, rules) {
        ['top', 'bottom', 'left', 'right'].forEach(e => {
            rules.push({
                id: rule.id + '_' + e,
                val: rule.val,
                type: rule.type,
                edge: e
            });
        });
    }

})(ConfigEngine);
