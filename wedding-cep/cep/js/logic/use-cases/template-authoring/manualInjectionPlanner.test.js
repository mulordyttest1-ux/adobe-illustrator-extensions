import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildBulkInjectionPlans,
    buildCompoundInjectionPlans,
    buildDateClonePlans,
    buildSingleInjectionPlans
} from './manualInjectionPlanner.js';
import { IngestionSanitizer } from '../../pipeline/IngestionSanitizer.js';

function applyReplacementsSequentially(text, replacements) {
    return replacements.reduce((current, rep) => (
        current.slice(0, rep.start) + rep.val + current.slice(rep.end)
    ), text);
}

function createSanitizedFrame(id, originalText) {
    const frames = IngestionSanitizer.sanitizeFrames([{ id, text: originalText }]);
    return frames[0];
}

describe('manualInjectionPlanner', () => {
    it('builds DIRECT plans for single inject on every selected frame', () => {
        const frames = [{ id: 'f1' }, { id: 'f2' }];

        const result = buildSingleInjectionPlans({
            frames,
            schemaValue: '{pos1.ong}'
        });

        assert.equal(result.success, true);
        assert.deepEqual(result.plans, [
            {
                id: 'f1',
                plan: {
                    mode: 'DIRECT',
                    content: '{pos1.ong}',
                    meta: { action: 'clear' }
                }
            },
            {
                id: 'f2',
                plan: {
                    mode: 'DIRECT',
                    content: '{pos1.ong}',
                    meta: { action: 'clear' }
                }
            }
        ]);
    });

    it('builds compound plans with joined content and parsed keys', () => {
        const result = buildCompoundInjectionPlans({
            frames: [{ id: 'f1' }],
            schemaValue: '{pos1.con_full.ho_dau}|{pos1.con_full.ten}'
        });

        assert.equal(result.success, true);
        assert.deepEqual(result.keys, ['pos1.con_full.ho_dau', 'pos1.con_full.ten']);
        assert.equal(result.plans[0].plan.content, '{pos1.con_full.ho_dau} {pos1.con_full.ten}');
    });

    it('fails bulk inject when the frame count is not exactly four', () => {
        const result = buildBulkInjectionPlans({
            frames: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }],
            prefix: 'pos1'
        });

        assert.deepEqual(result, {
            success: false,
            reason: 'INVALID_FRAME_COUNT',
            frameCount: 3
        });
    });

    it('maps bulk inject frames top-down after sorting', () => {
        const sortedFrames = [
            { id: 'top' },
            { id: 'mid-a' },
            { id: 'mid-b' },
            { id: 'bottom' }
        ];

        const result = buildBulkInjectionPlans(
            {
                frames: [{ id: 'x' }, { id: 'y' }, { id: 'z' }, { id: 'w' }],
                prefix: 'pos2'
            },
            {
                layoutUtils: {
                    sortFrames: () => sortedFrames
                }
            }
        );

        assert.equal(result.success, true);
        assert.deepEqual(result.plans.map((plan) => plan.plan.content), [
            '{pos2.ongba}',
            '{pos2.ong}',
            '{pos2.ba}',
            '{pos2.diachi}'
        ]);
        assert.deepEqual(result.plans.map((plan) => plan.id), ['top', 'mid-a', 'mid-b', 'bottom']);
    });

    it('builds ATOMIC date clone plans for every date.tiec token found', () => {
        const result = buildDateClonePlans({
            frames: [
                {
                    id: 'f1',
                    text: 'Ngay {date.tiec.ngay}/{date.tiec.thang}'
                }
            ],
            targetMoc: 'nhap'
        });

        assert.equal(result.success, true);
        assert.equal(result.affectedCount, 1);
        assert.deepEqual(result.plans[0].plan.replacements.map((rep) => rep.start), [22, 5]);
        assert.deepEqual(result.plans[0].plan.replacements, [
            {
                start: 22,
                end: 39,
                val: '{date.nhap.thang}'
            },
            {
                start: 5,
                end: 21,
                val: '{date.nhap.ngay}'
            }
        ]);
        assert.equal(
            applyReplacementsSequentially(
                'Ngay {date.tiec.ngay}/{date.tiec.thang}',
                result.plans[0].plan.replacements
            ),
            'Ngay {date.nhap.ngay}/{date.nhap.thang}'
        );
    });

    it('maps venue tokens to ceremony tokens when cloning to le', () => {
        const text = 'Le tai {venue.ten} - {venue.diachi} ngay {date.tiec.ngay}';
        const result = buildDateClonePlans({
            frames: [{ id: 'f1', text }],
            targetMoc: 'le'
        });

        assert.equal(result.success, true);
        assert.equal(
            applyReplacementsSequentially(text, result.plans[0].plan.replacements),
            'Le tai {ceremony.ten} - {ceremony.diachi} ngay {date.le.ngay}'
        );
    });

    it('keeps venue tokens unchanged when cloning to nhap', () => {
        const text = 'Le tai {venue.ten} ngay {date.tiec.ngay}';
        const result = buildDateClonePlans({
            frames: [{ id: 'f1', text }],
            targetMoc: 'nhap'
        });

        assert.equal(result.success, true);
        assert.equal(
            applyReplacementsSequentially(text, result.plans[0].plan.replacements),
            'Le tai {venue.ten} ngay {date.nhap.ngay}'
        );
    });

    it('returns NO_DATE_TIEC_METADATA when there is no clone candidate', () => {
        const result = buildDateClonePlans({
            frames: [{ id: 'f1', text: 'Khong co metadata' }],
            targetMoc: 'nhap'
        });

        assert.deepEqual(result, {
            success: false,
            reason: 'NO_DATE_TIEC_METADATA'
        });
    });

    it('restores original indices from cleanMap before returning ATOMIC clone plans', () => {
        const originalText = '(\u200BNham ngay {date.tiec.ngay_al} thang{date.tiec.thang_al} nam{date.tiec.nam_al})';
        const sanitizedFrame = createSanitizedFrame('f-clean-map', originalText);

        const result = buildDateClonePlans({
            frames: [sanitizedFrame],
            targetMoc: 'nhap'
        });

        assert.equal(result.success, true);
        assert.equal(
            applyReplacementsSequentially(originalText, result.plans[0].plan.replacements).replace(/\u200B/g, ''),
            '(Nham ngay {date.nhap.ngay_al} thang{date.nhap.thang_al} nam{date.nhap.nam_al})'
        );
    });
});
