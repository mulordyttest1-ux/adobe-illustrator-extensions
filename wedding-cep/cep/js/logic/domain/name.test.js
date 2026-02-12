import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NameAnalysis } from './name.js';

describe('NameAnalysis', () => {
    describe('splitFullName()', () => {
        it('splits 3-word name (auto mode)', () => {
            const r = NameAnalysis.splitFullName('Nguyễn Văn An', 0);
            assert.equal(r.ten, 'An');
            assert.equal(r.lot, 'Văn');
            assert.equal(r.ho_dau, 'Nguyễn');
            assert.equal(r.dau, 'A');
            assert.equal(r.full, 'Nguyễn Văn An');
        });
        it('splits 2-word name', () => {
            const r = NameAnalysis.splitFullName('Nguyễn An', 0);
            assert.equal(r.ten, 'An');
            assert.equal(r.ho_dau, 'Nguyễn');
        });
        it('splits single-word name', () => {
            const r = NameAnalysis.splitFullName('An', 0);
            assert.equal(r.ten, 'An');
            assert.equal(r.ho_dau, 'An');
        });
        it('handles custom index', () => {
            const r = NameAnalysis.splitFullName('Nguyễn Văn An', 1);
            assert.equal(r.ten, 'Nguyễn');
        });
        it('cleans extra whitespace', () => {
            const r = NameAnalysis.splitFullName('  Nguyễn   Văn   An  ', 0);
            assert.equal(r.full, 'Nguyễn Văn An');
            assert.equal(r.ten, 'An');
        });
        it('returns empty for null/undefined', () => {
            const r = NameAnalysis.splitFullName(null);
            assert.equal(r.ten, '');
            assert.equal(r.ho_dau, '');
        });
    });

    describe('enrichSplitNames()', () => {
        it('enriches packet with split name fields', () => {
            const packet = {
                'pos1.con_full': 'Nguyễn Văn An',
                'pos1.con_full_split_idx': 0,
            };
            const result = NameAnalysis.enrichSplitNames(packet);
            assert.equal(result['pos1.con_full.ten'], 'An');
            assert.equal(result['pos1.con_full.ho_dau'], 'Nguyễn');
            assert.equal(result['pos1.con_full.dau'], 'A');
        });
        it('handles packet without split_idx keys', () => {
            const packet = { 'pos1.ong': 'Ông A' };
            const result = NameAnalysis.enrichSplitNames(packet);
            assert.deepEqual(result, packet);
        });
        it('handles null packet', () => {
            assert.equal(NameAnalysis.enrichSplitNames(null), null);
        });
    });
});
