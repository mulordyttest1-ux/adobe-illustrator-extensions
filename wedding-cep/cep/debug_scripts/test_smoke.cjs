const { E2ERunner } = require('../../../shared/testing/E2ERunner.cjs');

const { readyDetailsExpression, readyExpression } = require('./smoke_helpers.cjs');
const { registerWeddingSmokeSuites } = require('./smoke_manifest.cjs');

const smokePort = Number(process.env.WEDDING_CEP_PORT || 9197);
const smokeProjectName = process.env.WEDDING_CEP_PROJECT_NAME || 'Wedding CEP Test 2026';

const runner = new E2ERunner({
    port: smokePort,
    projectName: smokeProjectName,
    readyExpression,
    readyDetailsExpression,
    readyTimeoutMs: 20000
});

registerWeddingSmokeSuites(runner);

runner.run();
