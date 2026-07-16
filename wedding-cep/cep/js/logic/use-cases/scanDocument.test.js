import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runScanDocument } from './scanDocument.js';

function createFrame(id, key, value, position) {
    return {
        id,
        top: position.top,
        left: position.left,
        meta_keys: [key],
        raw_content: `\u200B${value}\u200B`
    };
}

describe('runScanDocument', () => {
    it('delegates to the document-sync scan service seam when provided', () => {
        const calls = [];
        const frames = [createFrame('frame-1', '{info.ten_le}', 'Tân Hôn', { top: 100, left: 10 })];
        const schema = { STRUCTURE: [] };

        const result = runScanDocument(
            { frames, schema },
            {
                runScanDocumentService: (input, deps) => {
                    calls.push({ input, deps });
                    return {
                        data: { 'info.ten_le': 'Tân Hôn' },
                        count: 1
                    };
                }
            }
        );

        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0].input, { frames, schema });
        assert.equal(result.count, 1);
        assert.deepEqual(result.data, { 'info.ten_le': 'Tân Hôn' });
    });

    it('maps host-side invitation fields correctly when the groom side is explicit', () => {
        const schema = {
            TRIGGER_CONFIG: {
                'Vu Quy': 1,
                'Tân Hôn': 0
            }
        };
        const frames = [
            createFrame('frame-1', '{ceremony.host_type}', 'Nhà Trai', { top: 100, left: 10 }),
            createFrame('frame-2', '{pos1.vithu}', 'Kính mời nhà trai', { top: 90, left: 10 }),
            createFrame('frame-3', '{pos2.vithu}', 'Kính mời nhà gái', { top: 80, left: 10 })
        ];

        const result = runScanDocument({ frames, schema });

        assert.equal(result.data['ui.vithu_nam'], 'Kính mời nhà trai');
        assert.equal(result.data['ui.vithu_nu'], 'Kính mời nhà gái');
        assert.equal(result.count, Object.keys(result.data).length);
    });

    it('infers bride side from lễ cưới when host_type is not present', () => {
        const schema = {
            TRIGGER_CONFIG: {
                'Vu Quy': 1,
                'Tân Hôn': 0
            }
        };
        const frames = [
            createFrame('frame-1', '{info.ten_le}', 'Vu Quy', { top: 120, left: 10 }),
            createFrame('frame-2', '{pos1.vithu}', 'Thiệp bên cô dâu', { top: 110, left: 10 }),
            createFrame('frame-3', '{pos2.vithu}', 'Thiệp bên chú rể', { top: 100, left: 10 })
        ];

        const result = runScanDocument({ frames, schema });

        assert.equal(result.data['ui.vithu_nu'], 'Thiệp bên cô dâu');
        assert.equal(result.data['ui.vithu_nam'], 'Thiệp bên chú rể');
        assert.equal(result.count, Object.keys(result.data).length);
    });
});
