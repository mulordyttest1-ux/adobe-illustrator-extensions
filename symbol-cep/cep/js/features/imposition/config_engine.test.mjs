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
