/* eslint-disable no-var */
/* global $ */
/**
 * MODULE: MarginEngine
 * LAYER: Domain/Logic (L1)
 * PURPOSE: Margin Rule Engine — compile rules from schema, calculate edge margins
 * DEPENDENCIES: None (pure math)
 * SIDE EFFECTS: None
 * EXPORTS: ImpositionDomain.createRulesFromPayload(), ImpositionDomain.calculateMargins()
 */
// Compatible with: ES3 (ExtendScript)

var ImpositionDomain = (typeof $ !== 'undefined' && $.global)
    ? ($.global.ImpositionDomain = $.global.ImpositionDomain || {})
    : (typeof ImpositionDomain !== 'undefined' ? ImpositionDomain : {});

(function (exports) {

    /**
     * Adapter: Convert payload to Margin Rules
     */
    exports.createRulesFromPayload = function (payload) {
        var rules = [];
        var raw = payload.rawValues || {};

        if (payload.schema && payload.schema.sections) {
            var sections = payload.schema.sections;
            for (var s = 0; s < sections.length; s++) {
                var sec = sections[s];
                _processSectionFields(sec, raw, rules);
                _processSectionRows(sec, raw, rules);
            }
        }

        return rules;
    };

    function _processSectionFields(sec, raw, rules) {
        if (!sec.fields) return;
        for (var i = 0; i < sec.fields.length; i++) {
            _processField(sec.fields[i], sec.id, raw, rules);
        }
    }

    function _processSectionRows(sec, raw, rules) {
        if (!sec.rows) return;
        for (var r = 0; r < sec.rows.length; r++) {
            var row = sec.rows[r];
            if (!row.fields) continue;
            for (var key in row.fields) {
                if (!Object.prototype.hasOwnProperty.call(row.fields, key)) continue;
                var f = row.fields[key];
                if (f.binding === undefined) {
                    f.binding = {
                        classification: row.classification,
                        edge: key
                    };
                }
                _processField(f, row.id, raw, rules);
            }
        }
    }

    function _processField(f, rowId, raw, rules) {
        if (!f.binding) return;
        var val = parseFloat(raw[f.id]) || 0;
        if (val <= 0) return;

        var borderKey = rowId + '_draw_border';
        var drawBorder = (raw[borderKey] === 'on' || raw[borderKey] === true);
        var borderStyle = raw[rowId + '_border_style'] || 'dashed';

        rules.push({
            edge: f.binding.edge,
            val: val,
            type: f.binding.classification,
            id: f.id,
            drawBorder: drawBorder,
            borderStyle: borderStyle
        });
    }

    /**
     * The Engine: Calculate final margins from Rules
     */
    exports.calculateMargins = function (ruleList) {
        var margins = { top: 0, bottom: 0, left: 0, right: 0 };
        var edges = ['top', 'bottom', 'left', 'right'];

        for (var i = 0; i < edges.length; i++) {
            margins[edges[i]] = _calculateEdgeMargin(ruleList, edges[i]);
        }

        return margins;
    };

    function _calculateEdgeMargin(ruleList, edge) {
        var edgeRules = [];
        for (var k = 0; k < ruleList.length; k++) {
            if (ruleList[k].edge === edge) edgeRules.push(ruleList[k]);
        }

        var maxBase = 0;
        for (var j = 0; j < edgeRules.length; j++) {
            var r = edgeRules[j];
            if ((r.type === 'BASELINE' || r.type === 'STRUCTURAL') && r.val > maxBase) {
                maxBase = r.val;
            }
        }

        var totalAdd = 0;
        for (var m = 0; m < edgeRules.length; m++) {
            if (edgeRules[m].type === 'ADDITIVE') {
                totalAdd += edgeRules[m].val;
            }
        }

        for (var n = 0; n < edgeRules.length; n++) {
            if (edgeRules[n].type === 'ABSOLUTE') {
                return edgeRules[n].val;
            }
        }

        return maxBase + totalAdd;
    }

})(ImpositionDomain);
