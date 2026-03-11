/**
 * MODULE: PasteboardInfoRule
 * LAYER: Domain Rule/Feature
 * PURPOSE: Render a text legend on the pasteboard based on execution results.
 */

export class PasteboardInfoRule {
    /**
     * Run the rule
     * @param {Object} context - { bridge, resultData, preset }
     */
    async run({ bridge, resultData, preset }) {
        // Opt-in Strict Mode: Skip if no template is defined
        if (!preset || !preset.info_template) {
            console.log("[Postflight] PasteboardInfoRule skipped: info_template is missing in preset.");
            return;
        }

        // Interpolation Logic (Supplant)
        const template = preset.info_template;

        // Prepare Data for interpolation
        const data = {
            preset_name: preset.name || 'Unknown',
            count: resultData.itemsProcessed || 0,
            width: resultData.finishSize ? resultData.finishSize.width : '?',
            height: resultData.finishSize ? resultData.finishSize.height : '?',
            timestamp: new Date().toLocaleTimeString()
        };

        // Regex Supplant (Safe ES3-compatible pattern replacement)
        const finalString = template.replace(/{([^{}]*)}/g, (match, key) => {
            return typeof data[key] !== 'undefined' ? data[key] : match;
        });

        // Push to JSX Bridge (Base64 encoded)
        const base64Payload = btoa(unescape(encodeURIComponent(finalString)));

        // We use the bridge instance to call the JSX endpoint
        const bridgeResponseBase64 = await bridge.evalScript(`Bridge.drawPasteboardLegend("${base64Payload}")`);

        try {
            const response = JSON.parse(atob(bridgeResponseBase64));
            if (!response.success) {
                console.warn("[Postflight] PasteboardInfoRule JSX Error:", response.error);
            }
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            console.error("[Postflight] Failed to parse Bridge response for PasteboardInfoRule");
        }
    }
}
