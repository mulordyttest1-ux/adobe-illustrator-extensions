const assert = require('node:assert/strict');
const test = require('node:test');

const { registerSymbolSmokeSuites, symbolSmokeSuites } = require('./smoke_manifest.cjs');

test('Symbol smoke manifest preserves all 46 unique scenarios in suite order', () => {
    const names = [];
    registerSymbolSmokeSuites({
        runner: { addTest(name) { names.push(name); } },
        cleanupSmokeArtifact() {},
        makeHostScenarioExpression() { return ''; },
        makePresetRoundtripExpression() { return ''; }
    });

    assert.deepEqual(symbolSmokeSuites.map((suite) => suite.id), ['action', 'config', 'host', 'wedding_suite']);
    assert.equal(names.length, 46);
    assert.equal(new Set(names).size, 46);
});
