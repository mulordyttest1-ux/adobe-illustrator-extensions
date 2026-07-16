import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SmartComplexStrategy } from './SmartComplexStrategy.js';

function applyReplacements(text, replacements) {
    return replacements.reduce((current, rep) => (
        current.slice(0, rep.start) + rep.val + current.slice(rep.end)
    ), text);
}

describe('SmartComplexStrategy', () => {
    it('updates stateful date fragments with the shared marker parser', () => {
        const content = '\u200B24\u200B.\u200B\u200B05\u200B.\u200B\u200B2026\u200B';
        const packet = {
            'date.tiec.ngay': '25',
            'date.tiec.thang': '\u200B06\u200B',
            'date.tiec.nam': '2027'
        };

        const plan = SmartComplexStrategy.analyze(content, packet, {
            type: 'stateful',
            keys: ['date.tiec.ngay', 'date.tiec.thang', 'date.tiec.nam'],
            mappings: []
        });

        assert.equal(plan.mode, 'ATOMIC');
        assert.equal(applyReplacements(content, plan.replacements), '\u200B25\u200B.\u200B06\u200B.\u200B2027\u200B');
    });

    it('treats copied zero-width markers in packet values as plain input noise', () => {
        const content = '\u200BOld\u200B';
        const plan = SmartComplexStrategy.analyze(content, { 'pos1.ong': 'A\u200BB' }, {
            type: 'stateful',
            keys: ['pos1.ong'],
            mappings: []
        });

        assert.equal(plan.mode, 'ATOMIC');
        assert.deepEqual(plan.replacements, [{
            start: 0,
            end: 5,
            val: '\u200BAB\u200B'
        }]);
    });

    it('normalizes an empty value to one canonical empty marker pair', () => {
        const content = '\u200BOld\u200B';
        const plan = SmartComplexStrategy.analyze(content, { 'pos1.ong': '' }, {
            type: 'stateful',
            keys: ['pos1.ong'],
            mappings: []
        });

        assert.equal(plan.mode, 'ATOMIC');
        assert.deepEqual(plan.replacements, [{
            start: 0,
            end: 5,
            val: '\u200B\u200B'
        }]);
    });

    it('updates a middle empty value without shifting later metadata ranges', () => {
        const content = 'A:\u200BAlpha\u200B\nB:\u200B\u200B\nC:\u200BCharlie\u200B';
        const plan = SmartComplexStrategy.analyze(content, {
            a: 'Alpha',
            b: 'Bravo',
            c: 'Delta'
        }, {
            type: 'stateful',
            keys: ['a', 'b', 'c'],
            mappings: []
        });

        assert.equal(plan.mode, 'ATOMIC');
        assert.equal(
            applyReplacements(content, plan.replacements),
            'A:\u200BAlpha\u200B\nB:\u200BBravo\u200B\nC:\u200BDelta\u200B'
        );
    });

    it('preserves and styles saint-name prefixes when replacing a marked value', () => {
        const content = '\u200BOld Name\u200B';
        const plan = SmartComplexStrategy.analyze(content, { 'pos1.con_full': 'te-r\u00ea-sa Nguy\u1ec5n Th\u1ecb An' }, {
            type: 'stateful',
            keys: ['pos1.con_full'],
            mappings: []
        });

        assert.equal(plan.mode, 'ATOMIC');
        assert.deepEqual(plan.replacements, [{
            start: 0,
            end: 10,
            val: '\u200Bte-r\u00ea-sa Nguy\u1ec5n Th\u1ecb An\u200B',
            styles: [{ start: 1, end: 9, baseline: 'superscript' }]
        }]);
    });

    it('returns a style-only plan when saint-name text is unchanged', () => {
        const content = '\u200Bterexa Nguy\u1ec5n Th\u1ecb An\u200B';
        const plan = SmartComplexStrategy.analyze(content, { 'pos1.con_full': 'terexa Nguy\u1ec5n Th\u1ecb An' }, {
            type: 'stateful',
            keys: ['pos1.con_full'],
            mappings: []
        });

        assert.equal(plan.mode, 'STYLE');
        assert.deepEqual(plan.styleRanges, [{ start: 1, end: 7, baseline: 'superscript' }]);
        assert.deepEqual(plan.resetRanges, [{ start: 1, end: content.length - 1, baseline: 'normal' }]);
    });
});
