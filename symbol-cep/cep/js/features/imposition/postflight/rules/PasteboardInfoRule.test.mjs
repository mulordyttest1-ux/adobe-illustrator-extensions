import test from 'node:test';
import assert from 'node:assert/strict';

import {
    PasteboardInfoRule,
    buildPasteboardLegendPreview
} from './PasteboardInfoRule.js';

function encodeResponse(payload) {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

test('buildPasteboardLegendPreview interpolates normalized width and height', () => {
    const preview = buildPasteboardLegendPreview(
        {
            itemsProcessed: 4,
            finishSize: { width: 210, height: 297 }
        },
        {
            label: 'Preview',
            rawValues: {
                pasteboard_mode: 'custom'
            },
            info_template: '{count} tem - Kho {width}x{height}'
        }
    );

    assert.equal(preview, '4 tem - Kho 210x297');
});

test('buildPasteboardLegendPreview defaults legacy presets to the standard slug', () => {
    const preview = buildPasteboardLegendPreview(
        {
            itemsProcessed: 4,
            finishSize: { width: 210, height: 297 }
        },
        {
            label: 'Legacy Preview',
            info_template: '{count} tem - Kho {width}x{height}'
        },
        {
            now: new Date('2026-06-02T09:08:00')
        }
    );

    assert.match(preview, /^Legacy Preview \| 4 tem \| 210x297 \| 20260602 09:08/);
    assert.notEqual(preview, '4 tem - Kho 210x297');
});

test('PasteboardInfoRule falls back to bridge.eval and reports success details', async () => {
    const rule = new PasteboardInfoRule();
    const scripts = [];

    const result = await rule.run({
        bridge: {
            async eval(script) {
                scripts.push(script);
                return encodeResponse({ success: true });
            }
        },
        resultData: { itemsProcessed: 2, finishSize: { width: 90, height: 120 } },
        preset: {
            label: 'Eval Fallback',
            rawValues: {
                pasteboard_mode: 'custom'
            },
            info_template: '{count} tem - {width}x{height}'
        }
    });

    assert.equal(scripts.length, 1);
    assert.match(scripts[0], /Bridge\.drawPasteboardLegend/);
    assert.equal(result.status, 'success');
    assert.match(result.details.preview, /2 tem - 90x120/);
});

test('PasteboardInfoRule emits a clear payload in off mode', async () => {
    const rule = new PasteboardInfoRule();
    const hostCalls = [];

    const result = await rule.run({
        hostGateway: {
            async drawPasteboardLegend(payloadBase64) {
                hostCalls.push(JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8')));
                return encodeResponse({ success: true, cleared: true });
            }
        },
        resultData: { itemsProcessed: 2, finishSize: { width: 90, height: 120 } },
        preset: {
            label: 'Off',
            rawValues: {
                pasteboard_mode: 'off'
            },
            info_template: '{count} tem'
        }
    });

    assert.equal(result.status, 'success');
    assert.deepEqual(hostCalls, [{ mode: 'off', text: '' }]);
    assert.equal(result.details.mode, 'off');
    assert.equal(result.details.preview, '');
});

test('PasteboardInfoRule returns failed when the host bridge reports an error', async () => {
    const rule = new PasteboardInfoRule();

    const result = await rule.run({
        bridge: {
            async evalScript() {
                return encodeResponse({ success: false, error: 'legend failed' });
            }
        },
        resultData: { itemsProcessed: 3, finishSize: { width: 100, height: 100 } },
        preset: {
            label: 'Host Failure',
            rawValues: {
                pasteboard_mode: 'custom'
            },
            info_template: '{count} tem'
        }
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'legend failed');
});
