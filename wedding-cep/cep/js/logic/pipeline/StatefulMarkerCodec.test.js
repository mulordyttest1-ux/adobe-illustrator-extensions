import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StatefulMarkerCodec } from './StatefulMarkerCodec.js';

describe('StatefulMarkerCodec', () => {
    it('extracts values when stateful markers are adjacent around separators', () => {
        const values = StatefulMarkerCodec.extractValues(
            '\u200B24\u200B.\u200B\u200B05\u200B.\u200B\u200B2026\u200B'
        );

        assert.deepEqual(values, ['24', '05', '2026']);
    });

    it('extracts adjacent stateful values without a visible separator', () => {
        const matches = StatefulMarkerCodec.extractMatches('\u200B24\u200B\u200B05\u200B');

        assert.deepEqual(matches.map(match => match.inner), ['24', '05']);
        assert.deepEqual(matches.map(match => ({ start: match.start, end: match.end })), [
            { start: 0, end: 4 },
            { start: 4, end: 8 }
        ]);
    });

    it('keeps empty values as a canonical empty marker pair', () => {
        assert.equal(StatefulMarkerCodec.wrap(''), '\u200B\u200B');
        assert.deepEqual(StatefulMarkerCodec.extractValues('\u200B\u200B'), ['']);
    });

    it('extracts an empty stateful value in the middle without consuming the next field label', () => {
        const content = 'A:\u200BAlpha\u200B\nB:\u200B\u200B\nC:\u200BCharlie\u200B';
        const matches = StatefulMarkerCodec.extractMatches(content);

        assert.deepEqual(matches.map(match => match.inner), ['Alpha', '', 'Charlie']);
        assert.deepEqual(matches.map(match => content.slice(match.start, match.end)), [
            '\u200BAlpha\u200B',
            '\u200B\u200B',
            '\u200BCharlie\u200B'
        ]);
    });

    it('removes copied zero-width markers from user values before wrapping', () => {
        assert.equal(StatefulMarkerCodec.wrap('A\u200BB'), '\u200BAB\u200B');
    });

    it('preserves multiline content inside marker values', () => {
        const value = 'Dong 1\nDong 2';

        assert.deepEqual(StatefulMarkerCodec.extractValues(StatefulMarkerCodec.wrap(value)), [value]);
    });

    it('maps unmarked single-key content as the whole value', () => {
        assert.deepEqual(StatefulMarkerCodec.extractValuesForKeys('Nguyen Van A', ['pos1.ong']), ['Nguyen Van A']);
    });

    it('builds canonical stateful metadata', () => {
        assert.deepEqual(StatefulMarkerCodec.createMetadata(['pos1.ong']), {
            type: 'stateful',
            keys: ['pos1.ong'],
            mappings: []
        });
    });
});
