/**
 * Compile the config schema into host margin rules.
 *
 * This module is intentionally pure. The schema is operator state and must
 * never be modified just because a preset is being compiled.
 */
export const ConfigEngine = {
    compileRules,
    validateSchema
};

function createValueGetter(formData) {
    return (key) => {
        if (formData && typeof formData.get === 'function') {
            return formData.get(key);
        }

        return formData ? formData[key] : undefined;
    };
}

function resolveCheckbox(value) {
    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function resolveEdge(field, binding, getValue, fallbackEdge) {
    if (binding && binding.edge_dynamic) {
        const sourceId = binding.edge_source || `${field.id}_edge`;
        return getValue(sourceId) || binding.edge || fallbackEdge || null;
    }

    return (binding && binding.edge) || fallbackEdge || null;
}

function pushRule(rule, rules) {
    if (!rule.edge || rule.val <= 0) {
        return;
    }

    if (rule.edge === 'all') {
        ['top', 'bottom', 'left', 'right'].forEach((edge) => {
            rules.push({
                ...rule,
                id: `${rule.id}_${edge}`,
                edge
            });
        });
        return;
    }

    rules.push(rule);
}

function resolveClassification(field, row) {
    const binding = field.binding || null;
    return binding && binding.classification
        ? binding.classification
        : (row && row.classification);
}

function resolveFieldValue(field, getValue) {
    const parsedValue = Number.parseFloat(getValue(field.id));
    return Number.isNaN(parsedValue)
        ? Number.parseFloat(field.default) || 0
        : parsedValue;
}

function addRowMetadata(rule, row, getValue) {
    if (!row || !row.id) {
        return;
    }

    rule.drawBorder = resolveCheckbox(getValue(`${row.id}_draw_border`));
    rule.borderStyle = getValue(`${row.id}_border_style`) || 'dashed';
}

function compileField(field, context) {
    if (!field || !field.id || field.binding === false) {
        return;
    }

    const { getValue, rules, row, fallbackEdge } = context;
    const classification = resolveClassification(field, row);
    if (!classification) {
        return;
    }

    const rule = {
        id: field.id,
        val: resolveFieldValue(field, getValue),
        type: classification,
        edge: resolveEdge(field, field.binding || null, getValue, fallbackEdge)
    };
    addRowMetadata(rule, row, getValue);
    pushRule(rule, rules);
}

function compileRows(section, getValue, rules) {
    (section.rows || []).forEach((row) => {
        Object.keys(row.fields || {}).forEach((edge) => {
            compileField(row.fields[edge], { getValue, rules, row, fallbackEdge: edge });
        });
    });
}

function compileSections(section, getValue, rules) {
    (section.fields || []).forEach((field) => {
        compileField(field, { getValue, rules, row: null, fallbackEdge: null });
    });
    compileRows(section, getValue, rules);
}

function compileRules(configDef, formData) {
    if (!configDef || !Array.isArray(configDef.sections)) {
        return [];
    }

    const rules = [];
    const getValue = createValueGetter(formData);
    configDef.sections.forEach((section) => compileSections(section, getValue, rules));
    return rules;
}

function validateSchema(config) {
    return !!(
        config &&
        config.id &&
        config.name &&
        Array.isArray(config.sections)
    );
}
