const assert = require('node:assert/strict');
const test = require('node:test');

const { smokeScenarioRegistry } = require('../smoke_registry.cjs');
const { runToolkitModuleSmokeSuites, toolkitModuleSmokeSuites } = require('./module_suite_manifest.cjs');

test('Toolkit module smoke manifest preserves every registered module scenario', async () => {
    const calls = [];
    const scenarioLookup = smokeScenarioRegistry.reduce((lookup, scenario) => {
        lookup[scenario.id] = scenario;
        return lookup;
    }, {});
    await runToolkitModuleSmokeSuites({
        scenarioLookup,
        selectedScenarioIds: {},
        results: {},
        runSelectedScenario(definition) { calls.push(definition.id); }
    });

    const expected = smokeScenarioRegistry.filter((scenario) => scenario.scope === 'module').map((scenario) => scenario.id);
    assert.deepEqual(toolkitModuleSmokeSuites.map((suite) => suite.id), [
        'text', 'cut_workflow', 'swap', 'recolor', 'rasterize', 'step_repeat', 'camera_marks'
    ]);
    assert.deepEqual(calls.sort(), expected.sort());
});
