function registerHostSelectionSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Host lifecycle restores auto-group after selection is cleared',
        makeHostScenarioExpression('selection_cleared'),
        async (payload) => {
            const result = decodeBase64Json(payload);
    
            if (!result.success) {
                throw new Error(`Host scenario failed: ${JSON.stringify(result)}`);
            }
            if (!result.autoGroupName) {
                throw new Error(`Missing autoGroupName: ${JSON.stringify(result)}`);
            }
            if (!result.before || result.before.selectionCount !== 1 || result.before.selectedTypenames[0] !== 'GroupItem') {
                throw new Error(`Expected grouped selection before restore: ${JSON.stringify(result)}`);
            }
            if (!result.before.tempGroupExists) {
                throw new Error(`Temp auto-group was not created: ${JSON.stringify(result)}`);
            }
            if (!result.preRestore || result.preRestore.selectionCount !== 0) {
                throw new Error(`Selection was not cleared before restore: ${JSON.stringify(result)}`);
            }
            if (!result.restore || !result.restore.success) {
                throw new Error(`Restore failed unexpectedly: ${JSON.stringify(result)}`);
            }
            if (!result.after || result.after.tempGroupExists) {
                throw new Error(`Temp auto-group still exists after restore: ${JSON.stringify(result)}`);
            }
            if (result.after.selectionCount !== 2) {
                throw new Error(`Expected 2 loose items selected after restore: ${JSON.stringify(result)}`);
            }
            if (!result.after.selectedTypenames.every((type) => type === 'PathItem')) {
                throw new Error(`Unexpected selection types after restore: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerHostSelectionSmokeTests };
