import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runScanDocumentService } from './scanDocumentService.js';

function createFrame(id, key, value, position) {
    return {
        id,
        top: position.top,
        left: position.left,
        meta_keys: [key],
        raw_content: `\u200B${value}\u200B`
    };
}

describe('runScanDocumentService', () => {
    it('scans date.tiec fragments from a single stateful frame that contains adjacent zero-width markers', () => {
        const frames = [
            {
                id: 'frame-date',
                top: 100,
                left: 10,
                meta_keys: ['{date.tiec.ngay}', '{date.tiec.thang}', '{date.tiec.nam}'],
                raw_content: '\u200B24\u200B.\u200B\u200B05\u200B.\u200B\u200B2026\u200B'
            }
        ];

        const result = runScanDocumentService({ frames });

        assert.equal(result.data['date.tiec.ngay'], '24');
        assert.equal(result.data['date.tiec.thang'], '05');
        assert.equal(result.data['date.tiec.nam'], '2026');
        assert.equal(result.data['date.tiec_auto'], true);
    });

    it('maps host-side invitation fields correctly when the groom side is explicit', () => {
        const schema = {
            TRIGGER_CONFIG: {
                'Vu Quy': 1,
                'Tan Hon': 0
            }
        };
        const frames = [
            createFrame('frame-1', '{ceremony.host_type}', 'Nha Trai', { top: 100, left: 10 }),
            createFrame('frame-2', '{pos1.vithu}', 'Kinh moi nha trai', { top: 90, left: 10 }),
            createFrame('frame-3', '{pos2.vithu}', 'Kinh moi nha gai', { top: 80, left: 10 })
        ];

        const result = runScanDocumentService({ frames, schema });

        assert.equal(result.data['ui.vithu_nam'], 'Kinh moi nha trai');
        assert.equal(result.data['ui.vithu_nu'], 'Kinh moi nha gai');
        assert.equal(result.count, Object.keys(result.data).length);
    });

    it('infers bride side from ten le when host_type is not present', () => {
        const schema = {
            TRIGGER_CONFIG: {
                'Vu Quy': 1,
                'Tan Hon': 0
            }
        };
        const frames = [
            createFrame('frame-1', '{info.ten_le}', 'Vu Quy', { top: 120, left: 10 }),
            createFrame('frame-2', '{pos1.vithu}', 'Thiep ben co dau', { top: 110, left: 10 }),
            createFrame('frame-3', '{pos2.vithu}', 'Thiep ben chu re', { top: 100, left: 10 })
        ];

        const result = runScanDocumentService({ frames, schema });

        assert.equal(result.data['ui.vithu_nu'], 'Thiep ben co dau');
        assert.equal(result.data['ui.vithu_nam'], 'Thiep ben chu re');
        assert.equal(result.count, Object.keys(result.data).length);
    });
});
