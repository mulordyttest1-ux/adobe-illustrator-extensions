const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
    collectSymbolArchitectureViolations,
    runArchitectureCheck
} = require('./check_architecture_support.cjs');

function createValidFiles() {
    return {
        'js/app.js': "import { bootSymbolApp } from './features/runtime/appBoot.js';\nbootSymbolApp();",
        'js/features/runtime/appBoot.js': 'window.Imposition = runtime;',
        'js/features/imposition/action_tab.js': "import { compile } from './processing_options.js';",
        'js/features/imposition/config_tab.js': 'export class ConfigTab {}',
        'js/features/wedding-suite-standard/WeddingSuiteTab.js': 'export class WeddingSuiteTab {}',
        'js/features/wedding-suite-standard/panelPolicy.js': "import { normalize } from './paperStockConfig.js';",
        'js/features/wedding-suite-standard/panelView.js': "import { escape } from './panelPolicy.js';"
    };
}

test('Symbol architecture checker accepts the current repository', () => {
    const projectRoot = path.resolve(__dirname, '..');
    assert.deepEqual(runArchitectureCheck({ projectRoot }), []);
});

test('Symbol architecture checker rejects composition, global, and layer drift', () => {
    const extraCompositionImport = createValidFiles();
    extraCompositionImport['js/app.js'] += "\nimport { Bridge } from './bridge.js';";
    assert.match(
        collectSymbolArchitectureViolations(extraCompositionImport).join('\n'),
        /expected only/
    );

    const unexpectedGlobal = createValidFiles();
    unexpectedGlobal['js/features/runtime/appBoot.js'] += '\nwindow.LegacyRuntime = {};';
    assert.match(
        collectSymbolArchitectureViolations(unexpectedGlobal).join('\n'),
        /unexpected app globals LegacyRuntime/
    );

    const directStorage = createValidFiles();
    directStorage['js/features/imposition/config_tab.js'] = 'window.localStorage.getItem("preset");';
    assert.match(
        collectSymbolArchitectureViolations(directStorage).join('\n'),
        /must not access localStorage directly/
    );

    const policyBridgeImport = createValidFiles();
    policyBridgeImport['js/features/wedding-suite-standard/panelPolicy.js'] = "import { Bridge } from '../../bridge.js';";
    assert.match(
        collectSymbolArchitectureViolations(policyBridgeImport).join('\n'),
        /forbidden import/
    );
});
