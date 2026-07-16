import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function readFile(path) {
    return fs.readFileSync(path, 'utf8');
}

const ACTION_TAB = 'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/js/features/imposition/action_tab.js';
const CONFIG_TAB = 'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/js/features/imposition/config_tab.js';
const WEDDING_SUITE_TAB = 'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js';
const BRIDGE_ADAPTER = 'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js';

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
