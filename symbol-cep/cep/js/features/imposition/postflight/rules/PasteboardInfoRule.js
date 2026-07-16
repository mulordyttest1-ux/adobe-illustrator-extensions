/**
 * MODULE: PasteboardInfoRule
 * LAYER: Domain Rule/Feature
 * PURPOSE: Render a text legend on the pasteboard based on execution results.
 */

import { parseBase64JsonUtf8 } from '../../bridge_codec.js';
import {
    buildInterpolationData,
    buildPasteboardLegendPayload,
    buildPasteboardLegendPreview,
    interpolateTemplate
} from '../../pasteboard_slug.js';

export {
    buildInterpolationData,
    buildPasteboardLegendPreview,
    interpolateTemplate
};

function encodePayload(value) {
    return btoa(unescape(encodeURIComponent(value)));
}

function parseBridgeResponse(bridgeResponseBase64) {
    try {
        return parseBase64JsonUtf8(bridgeResponseBase64);
    } catch {
        return {
            success: false,
            error: 'Failed to parse Bridge response for PasteboardInfoRule'
        };
    }
}

async function invokeBridge(bridge, script) {
    if (bridge && typeof bridge.evalScript === 'function') {
        return bridge.evalScript(script);
    }
    if (bridge && typeof bridge.eval === 'function') {
        return bridge.eval(script);
    }
    throw new Error('Bridge does not support evalScript/eval for postflight hooks.');
}

export class PasteboardInfoRule {
    /**
     * Run the rule
     * @param {Object} context - { bridge, resultData, preset }
     */
    async run({ bridge, hostGateway, resultData, preset }) {
        if (!preset) {
            console.log('[Postflight] PasteboardInfoRule skipped: preset is missing.');
            return {
                status: 'skipped',
                reason: 'missing_preset'
            };
        }

        const payload = buildPasteboardLegendPayload(resultData, preset);
        const base64Payload = encodePayload(JSON.stringify(payload));
        const bridgeResponseBase64 = hostGateway && typeof hostGateway.drawPasteboardLegend === 'function'
            ? await hostGateway.drawPasteboardLegend(base64Payload)
            : await invokeBridge(bridge, `Bridge.drawPasteboardLegend("${base64Payload}")`);
        const response = parseBridgeResponse(bridgeResponseBase64);

        if (!response.success) {
            console.warn("[Postflight] PasteboardInfoRule JSX Error:", response.error);
            return {
                status: 'failed',
                error: response.error || 'Bridge reported a postflight failure.'
            };
        }

        return {
            status: 'success',
            details: {
                mode: payload.mode,
                preview: payload.text
            }
        };
    }
}
