function registerHostFailureSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Host lifecycle fails safe when auto-group name is missing',
        makeHostScenarioExpression('missing_group'),
        async (payload) => {
            const result = decodeBase64Json(payload);
    
            if (!result.success) {
                throw new Error(`Host scenario failed: ${JSON.stringify(result)}`);
            }
            if (!result.before || result.before.selectionCount !== 1 || result.before.selectedTypenames[0] !== 'GroupItem') {
                throw new Error(`Expected grouped selection before failure test: ${JSON.stringify(result)}`);
            }
            if (!result.restore || result.restore.success !== false) {
                throw new Error(`Expected restore to fail for missing group: ${JSON.stringify(result)}`);
            }
            if (!result.after || result.after.selectionCount !== 1 || result.after.selectedTypenames[0] !== 'PathItem') {
                throw new Error(`Selection changed unexpectedly after missing-group failure: ${JSON.stringify(result)}`);
            }
            if (!result.after.tempGroupExists) {
                throw new Error(`Real auto-group should remain after missing-group failure: ${JSON.stringify(result)}`);
            }
            if (!result.selectionUntouchedOnFailure) {
                throw new Error(`Selection was not preserved on failure: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerHostFailureSmokeTests };
