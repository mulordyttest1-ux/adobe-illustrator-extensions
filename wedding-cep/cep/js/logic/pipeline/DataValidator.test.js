import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DataValidator } from './DataValidator.js';

describe('DataValidator', () => {
    it('extracts stateful date fragments correctly when zero-width markers are adjacent', () => {
        const validator = new DataValidator();
        const result = validator.analyze([
            {
                id: 'frame-date',
                meta_keys: ['date.tiec.ngay', 'date.tiec.thang', 'date.tiec.nam'],
                raw_content: '\u200B24\u200B.\u200B\u200B05\u200B.\u200B\u200B2026\u200B'
            }
        ]);

        assert.deepEqual(result.healthyMap, {
            'date.tiec.ngay': '24',
            'date.tiec.thang': '05',
            'date.tiec.nam': '2026'
        });
        assert.deepEqual(result.brokenList, []);
    });

    it('scans unmarked single-key frames as a whole value', () => {
        const validator = new DataValidator();
        const result = validator.analyze([
            {
                id: 'single-key',
                meta_keys: ['pos1.ong'],
                raw_content: 'Nguyen Van A'
            }
        ]);

        assert.deepEqual(result.healthyMap, {
            'pos1.ong': 'Nguyen Van A'
        });
        assert.deepEqual(result.brokenList, []);
    });
});
