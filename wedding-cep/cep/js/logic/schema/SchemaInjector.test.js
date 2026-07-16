import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SchemaInjector } from './SchemaInjector.js';

describe('SchemaInjector', () => {
    it('reports missing required template fields from the real detected-key set', () => {
        const result = SchemaInjector.computeChanges([
            { id: 'f1', text: 'Tân Hôn' },
            { id: 'f2', text: 'Trưởng Nam' }
        ], 'tiec');

        assert.equal(result.changes.length >= 1, true);
        assert.deepEqual(
            new Set(result.missedRequired),
            new Set(['Ngày Tiệc', 'Giờ Tiệc', 'Vị Thứ POS2'])
        );
        assert.equal(result.missedRequired.includes('Loại Lễ'), false);
        assert.equal(result.missedRequired.includes('Vị Thứ POS1'), false);
    });

    it('reports a multi-number text frame as orphan when no schema can be inferred', () => {
        const result = SchemaInjector.computeChanges([
            { id: 'orphan-numbers', text: '15;12;21' }
        ], 'tiec');

        assert.equal(result.changes.length, 0);
        assert.deepEqual(result.orphans.map((frame) => frame.id), ['orphan-numbers']);
    });

    it('reports frames with leftover numeric tokens after valid replacements', () => {
        const result = SchemaInjector.computeChanges([
            { id: 'mixed-frame', text: '11h30 ma 99' }
        ], 'tiec');

        assert.equal(result.changes.length, 1);
        assert.deepEqual(result.orphans.map((frame) => frame.id), ['mixed-frame']);
    });

    it('does not report fully parsed date text as orphan', () => {
        const result = SchemaInjector.computeChanges([
            { id: 'date-frame', text: '15/12/2026' }
        ], 'tiec');

        assert.equal(result.changes.length, 1);
        assert.deepEqual(result.orphans, []);
    });
});
