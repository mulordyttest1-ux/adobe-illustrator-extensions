function registerConfigPostflightSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Pasteboard preview resolves width and height from normalized result data',
        `
            (function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.normalizePostflightResultData !== 'function' || typeof debug.previewPasteboardLegend !== 'function') {
                    return { reason: 'missing_postflight_debug' };
                }
    
                const normalized = debug.normalizePostflightResultData({
                    itemsProcessed: 4,
                    finishSize: { w: 210, h: 297 }
                });
                const preview = debug.previewPasteboardLegend(normalized, {
                    label: 'Preview',
                    info_template: '{count} tem - Kho {width}x{height}'
                });
    
                return {
                    normalized,
                    preview
                };
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Postflight debug setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.normalized || !result.normalized.finishSize || result.normalized.finishSize.width !== 210 || result.normalized.finishSize.height !== 297) {
                throw new Error(`finishSize was not normalized correctly: ${JSON.stringify(result)}`);
            }
            if (!result.preview || !result.preview.includes('4 tem') || !result.preview.includes('210x297')) {
                throw new Error(`Pasteboard preview did not interpolate width/height: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Postflight hook summary is observable after the engine-success path runs',
        `
            (async function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.simulatePostflightSuccess !== 'function' || typeof debug.getLastPostflightSummary !== 'function') {
                    return { reason: 'missing_postflight_summary_debug' };
                }
    
                const hostCalls = [];
                const fakeHostGateway = {
                    drawPasteboardLegend: async (payloadBase64) => {
                        hostCalls.push({
                            name: 'drawPasteboardLegend',
                            payloadBase64
                        });
                        return btoa(JSON.stringify({ success: true }));
                    }
                };
    
                const summary = await debug.simulatePostflightSuccess(
                    {
                        itemsProcessed: 3,
                        finishSize: { w: 120, h: 180 }
                    },
                    {
                        label: 'Smoke Postflight',
                        info_template: '{count} tem - {width}x{height}'
                    },
                    fakeHostGateway
                );
    
                return {
                    summary,
                    latest: debug.getLastPostflightSummary(),
                    hostCalls
                };
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Postflight summary debug setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.summary || result.summary.successCount !== 1 || result.summary.failedCount !== 0) {
                throw new Error(`Unexpected postflight summary: ${JSON.stringify(result)}`);
            }
            if (!result.latest || result.latest.successCount !== 1) {
                throw new Error(`Latest postflight summary was not retained: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.hostCalls) || result.hostCalls.length !== 1) {
                throw new Error(`Postflight hook did not invoke the host gateway exactly once: ${JSON.stringify(result)}`);
            }
            if (result.hostCalls[0].name !== 'drawPasteboardLegend' || !result.hostCalls[0].payloadBase64) {
                throw new Error(`PasteboardInfoRule did not emit the expected host gateway call: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerConfigPostflightSmokeTests };
