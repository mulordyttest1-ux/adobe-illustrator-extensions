import test from 'node:test';
import assert from 'node:assert/strict';

import { ConfigEngine } from './config_engine.js';

test('compileRules keeps drawBorder metadata only for positive-offset matrix edges', () => {
    const schema = {
        sections: [
            {
                id: 'sec_margins',
                rows: [
                    {
                        id: 'row_safe',
                        classification: 'BASELINE',
                        fields: {
                            top: {
                                id: 'safe_top',
                                binding: { classification: 'BASELINE', edge: 'top' },
                                default: 0
                            }
                        }
                    }
                ]
            }
        ]
    };

    const rules = ConfigEngine.compileRules(schema, {
        safe_top: '10',
        row_safe_draw_border: true,
        row_safe_border_style: 'solid'
    });

    assert.equal(rules.length, 1);
    assert.equal(rules[0].edge, 'top');
    assert.equal(rules[0].val, 10);
    assert.equal(rules[0].drawBorder, true);
    assert.equal(rules[0].borderStyle, 'solid');
});

test('compileRules is pure and does not inject bindings into schema fields', () => {
    const schema = {
        id: 'test_schema',
        sections: [{
            id: 'sec_margins',
            fields: [{
                id: 'safe_top',
                type: 'number',
                default: 5,
                binding: {
                    classification: 'BASELINE',
                    edge: 'top'
                }
            }]
        }]
    };
    const before = JSON.parse(JSON.stringify(schema));

    const rules = ConfigEngine.compileRules(schema, { safe_top: '7' });

    assert.deepEqual(schema, before);
    assert.deepEqual(rules, [{
        id: 'safe_top',
        val: 7,
        type: 'BASELINE',
        edge: 'top'
    }]);
});

test('compileRules expands all edges and ignores binding=false fields', () => {
    const schema = {
        sections: [{
            id: 'sec',
            fields: [
                {
                    id: 'all_margin',
                    default: 2,
                    binding: {
                        classification: 'ADDITIVE',
                        edge: 'all'
                    }
                },
                {
                    id: 'display_only',
                    default: 99,
                    binding: false
                }
            ]
        }]
    };

    const rules = ConfigEngine.compileRules(schema, {
        all_margin: 3,
        display_only: 99
    });

    assert.deepEqual(rules.map((rule) => rule.edge), ['top', 'bottom', 'left', 'right']);
    assert.equal(rules.some((rule) => rule.id === 'display_only'), false);
});

test('compileRules uses dynamic row edge fallback when binding is omitted', () => {
    const schema = {
        sections: [{
            id: 'sec_margins',
            rows: [{
                id: 'row_dynamic_1',
                classification: 'STRUCTURAL',
                fields: {
                    top: {
                        id: 'dynamic_1_top',
                        default: 0
                    }
                }
            }]
        }]
    };

    const rules = ConfigEngine.compileRules(schema, {
        dynamic_1_top: '4',
        row_dynamic_1_draw_border: 'true'
    });

    assert.deepEqual(rules, [{
        id: 'dynamic_1_top',
        val: 4,
        type: 'STRUCTURAL',
        edge: 'top',
        drawBorder: true,
        borderStyle: 'dashed'
    }]);
});
