import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TemplatePlaceholderCodec } from './TemplatePlaceholderCodec.js';

describe('TemplatePlaceholderCodec', () => {
    it('finds placeholder keys with stable source ranges', () => {
        assert.deepEqual(TemplatePlaceholderCodec.findAll('A {pos1.ong} B {date.tiec.ngay}'), [
            {
                start: 2,
                end: 12,
                token: '{pos1.ong}',
                key: 'pos1.ong'
            },
            {
                start: 15,
                end: 31,
                token: '{date.tiec.ngay}',
                key: 'date.tiec.ngay'
            }
        ]);
    });

    it('unwraps placeholder tokens and leaves raw tokens alone', () => {
        assert.equal(TemplatePlaceholderCodec.unwrapToken('{pos1.ong}'), 'pos1.ong');
        assert.equal(TemplatePlaceholderCodec.unwrapToken('literal'), 'literal');
    });

    it('finds the first placeholder in mixed text', () => {
        assert.deepEqual(TemplatePlaceholderCodec.findFirst('Ngay {date.tiec.ngay}'), {
            start: 5,
            end: 21,
            token: '{date.tiec.ngay}',
            key: 'date.tiec.ngay'
        });
    });
});
