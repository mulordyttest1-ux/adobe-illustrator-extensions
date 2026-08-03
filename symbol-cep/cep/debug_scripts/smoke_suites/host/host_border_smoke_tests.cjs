function registerHostBorderSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Host does not draw border when offset is zero',
        makeHostScenarioExpression('border_zero_offset'),
        async (payload) => {
            const result = decodeBase64Json(payload);

            if (!result.success) {
                throw new Error(`Host border scenario failed: ${JSON.stringify(result)}`);
            }
            if (result.borderFound) {
                throw new Error(`Zero-offset rule should not create visible border: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Host keeps single-edge border output free of surrounding guide rectangle',
        makeHostScenarioExpression('single_edge_border'),
        async (payload) => {
            const result = decodeBase64Json(payload);

            if (!result.success) {
                throw new Error(`Single-edge border scenario failed: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.borderNames) || result.borderNames.length !== 1 || result.borderNames[0] !== 'Border_safe_top') {
                throw new Error(`Expected exactly one top border: ${JSON.stringify(result)}`);
            }
            if ((result.pathNames || []).includes('Guide_Safe_Zone')) {
                throw new Error(`Unexpected aggregate safe-zone rectangle in single-edge border output: ${JSON.stringify(result)}`);
            }
            if ((result.pathNames || []).includes('Guide_Finish')) {
                throw new Error(`Unexpected finish guide rectangle in single-edge border output: ${JSON.stringify(result)}`);
            }
            if ((result.pathNames || []).includes('Guide_safe_top')) {
                throw new Error(`Unexpected duplicate top guide when visible border is enabled: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerHostBorderSmokeTests };
