import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildMarginSummary,
    buildPasteboardLegendPayload,
    buildPasteboardLegendPreview,
    buildPasteboardTokenDescriptors
} from './pasteboard_slug.js';

const schema = {
    sections: [
        {
            id: 'sec_sheet_layout',
            title: 'Bien giay',
            rows: [
                {
                    id: 'row_sheet_margin',
                    label: 'Bien giay',
                    fields: {
                        left: { id: 'sheet_m_left', default: 7 },
                        right: { id: 'sheet_m_right', default: 7 },
                        top: { id: 'sheet_m_top', default: 7 },
                        bottom: { id: 'sheet_m_bot', default: 7 }
                    }
                }
            ]
        },
        {
            id: 'sec_margins',
            title: 'Bien',
            rows: [
                {
                    id: 'row_safe',
                    label: 'Vung an toan',
                    fields: {
                        left: { id: 'safe_left', default: 7 },
                        right: { id: 'safe_right', default: 7 },
                        top: { id: 'safe_top', default: 7 },
                        bottom: { id: 'safe_bottom', default: 7 }
                    }
                },
                {
                    id: 'row_dynamic_1',
                    label: 'Can xe tren',
                    fields: {
                        left: { id: 'dynamic_1_left', default: 0 },
                        right: { id: 'dynamic_1_right', default: 0 },
                        top: { id: 'dynamic_1_top', default: 0 },
                        bottom: { id: 'dynamic_1_bottom', default: 0 }
                    }
                }
            ]
        }
    ]
};

test('buildPasteboardLegendPreview interpolates margin tokens and dynamic row tokens', () => {
    const preview = buildPasteboardLegendPreview(
        { itemsProcessed: 8, finishSize: { width: 90, height: 140 } },
        {
            label: 'Token Test',
            schema,
            rawValues: {
                pasteboard_mode: 'custom',
                info_template: 'safe {safe_top}/{safe_bottom}; can {dynamic_1_top}; sheet {sheet_m_top}',
                safe_top: '12',
                safe_bottom: '15',
                dynamic_1_top: '10',
                sheet_m_top: '7'
            }
        }
    );

    assert.equal(preview, 'safe 12/15; can 10; sheet 7');
});

test('buildMarginSummary groups positive margin values and skips zeros', () => {
    const summary = buildMarginSummary({
        schema,
        rawValues: {
            sheet_m_top: '7',
            sheet_m_bot: '0',
            sheet_m_left: '0',
            sheet_m_right: '7',
            safe_top: '12',
            safe_bottom: '15',
            safe_left: '0',
            safe_right: '7',
            dynamic_1_top: '10',
            dynamic_1_bottom: '0',
            dynamic_1_left: '0',
            dynamic_1_right: '0'
        }
    });

    assert.equal(summary, 'Bien giay: Tren 7mm, Phai 7mm; Vung an toan: Tren 12mm, Duoi 15mm, Phai 7mm; Can xe tren: Tren 10mm');
});

test('buildPasteboardTokenDescriptors exposes readable labels with technical tokens', () => {
    const tokens = buildPasteboardTokenDescriptors(schema);

    assert.ok(tokens.some((entry) => entry.label === 'Vung an toan / Tren' && entry.token === '{safe_top}'));
    assert.ok(tokens.some((entry) => entry.label === 'Can xe tren / Tren' && entry.token === '{dynamic_1_top}'));
});

test('buildPasteboardLegendPayload maps legacy missing mode to standard and off mode to clear', () => {
    const standardPayload = buildPasteboardLegendPayload(
        { itemsProcessed: 2, finishSize: { width: 90, height: 140 } },
        {
            label: 'Legacy',
            info_template: 'legacy custom text'
        },
        {
            now: new Date('2026-06-02T10:11:00')
        }
    );
    const offPayload = buildPasteboardLegendPayload(
        { itemsProcessed: 2, finishSize: { width: 90, height: 140 } },
        {
            label: 'Off',
            rawValues: {
                pasteboard_mode: 'off'
            }
        }
    );

    assert.equal(standardPayload.mode, 'standard');
    assert.match(standardPayload.text, /^Legacy \| 2 tem \| 90x140 \| 20260602 10:11/);
    assert.deepEqual(offPayload, { mode: 'off', text: '' });
});
