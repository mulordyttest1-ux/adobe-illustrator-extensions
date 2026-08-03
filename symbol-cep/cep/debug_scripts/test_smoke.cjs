const { E2ERunner } = require('../../../shared/testing/E2ERunner.cjs');
const { cleanupSmokeArtifact, cleanupSmokeOutput, decodeBase64Json, makeHostScenarioExpression, makePresetRoundtripExpression } = require('./smoke_support.cjs');

const smokePort = Number(process.env.SYMBOL_CEP_PORT || 9198);
const smokeProjectName = process.env.SYMBOL_CEP_PROJECT_NAME || 'Symbol CEP Test 2026';
const runner = new E2ERunner({ port: smokePort, projectName: smokeProjectName });
const { registerSymbolSmokeSuites } = require('./smoke_suites/smoke_manifest.cjs');

registerSymbolSmokeSuites({
    runner,
    cleanupSmokeArtifact,
    cleanupSmokeOutput,
    decodeBase64Json,
    makeHostScenarioExpression,
    makePresetRoundtripExpression
});

runner.run();
