const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
    collectToolkitArchitectureViolations,
    runArchitectureCheck
} = require('./check_architecture_support.cjs');

function createValidPanelFiles() {
    return {
        'js/app.js': [
            "import { initToolkitApp } from './bootstrap/startup.js';",
            "import { registerToolkitTestApi } from './bootstrap/testApi.js';",
            "import { createHostFacade } from './infrastructure/hostFacade.js';"
        ].join('\n'),
        'js/bootstrap/readyState.js': 'windowRef.__TOOLKIT_APP_READY__ = {};',
        'js/bootstrap/testApi.js': 'windowOverride.__TOOLKIT_TEST_API__ = {};',
        'js/features/shell/toolkitShell.js': "import { createSearch } from '../catalog/search.js';",
        'js/features/catalog/moduleCatalog.js': "import { normalize } from './catalogNormalizer.js';",
        'js/features/run/commandRunner.js': 'export function run() {}'
    };
}

test('Toolkit architecture checker accepts the current repository', () => {
    const projectRoot = path.resolve(__dirname, '..');
    assert.deepEqual(runArchitectureCheck({ projectRoot }), []);
});

test('Toolkit architecture checker rejects composition, global, and layer drift', () => {
    const extraCompositionImport = createValidPanelFiles();
    extraCompositionImport['js/app.js'] += "\nimport { Bridge } from './bridge.js';";
    assert.match(
        collectToolkitArchitectureViolations({
            panelFiles: extraCompositionImport,
            moduleFiles: {}
        }).join('\n'),
        /expected only/
    );

    const unexpectedGlobal = createValidPanelFiles();
    unexpectedGlobal['js/features/run/commandRunner.js'] = 'window.LegacyRuntime = {};';
    assert.match(
        collectToolkitArchitectureViolations({
            panelFiles: unexpectedGlobal,
            moduleFiles: {}
        }).join('\n'),
        /unexpected app global LegacyRuntime/
    );

    const shellBridge = createValidPanelFiles();
    shellBridge['js/features/shell/toolkitShell.js'] = "import { Bridge } from '../../infrastructure/bridge.js';";
    assert.match(
        collectToolkitArchitectureViolations({
            panelFiles: shellBridge,
            moduleFiles: {}
        }).join('\n'),
        /shell must not import host infrastructure/
    );

    const catalogScan = createValidPanelFiles();
    catalogScan['js/features/catalog/moduleCatalog.js'] = "import fs from 'node:fs'; fs.readdirSync('modules');";
    assert.match(
        collectToolkitArchitectureViolations({
            panelFiles: catalogScan,
            moduleFiles: {}
        }).join('\n'),
        /must not scan the module filesystem/
    );

    const moduleShellImport = createValidPanelFiles();
    assert.match(
        collectToolkitArchitectureViolations({
            panelFiles: moduleShellImport,
            moduleFiles: {
                'modules/test_probe/run.jsx': '#include "../../js/features/shell/toolkitShell.js"'
            }
        }).join('\n'),
        /module must not depend/
    );
});
