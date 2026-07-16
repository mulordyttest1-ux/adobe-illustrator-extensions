import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function readFile(path) {
    return fs.readFileSync(path, 'utf8');
}

const ACTION_TAB = new URL('../imposition/action_tab.js', import.meta.url);
const CONFIG_TAB = new URL('../imposition/config_tab.js', import.meta.url);
const WEDDING_SUITE_TAB = new URL('../wedding-suite-standard/WeddingSuiteTab.js', import.meta.url);
const BRIDGE_ADAPTER = new URL('../wedding-suite-standard/bridgeAdapter.js', import.meta.url);

test('feature coordinators do not import the concrete dataStore or reach into localStorage directly', () => {
    const actionTab = readFile(ACTION_TAB);
    const configTab = readFile(CONFIG_TAB);
    const weddingSuiteTab = readFile(WEDDING_SUITE_TAB);

    assert.doesNotMatch(actionTab, /from '\.\/data_store\.js'/);
    assert.doesNotMatch(configTab, /localStorage/);
    assert.doesNotMatch(weddingSuiteTab, /localStorage/);
});

test('Wedding Suite bridge adapter no longer patches live host functions at runtime', () => {
    const bridgeAdapter = readFile(BRIDGE_ADAPTER);

    assert.doesNotMatch(bridgeAdapter, /_buildJobPatchVersion/);
    assert.doesNotMatch(bridgeAdapter, /_baseBuildJob/);
    assert.doesNotMatch(bridgeAdapter, /patchVersion/);
});
