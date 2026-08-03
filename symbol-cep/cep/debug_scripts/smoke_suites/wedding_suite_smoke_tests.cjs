const { registerWeddingSuitePanelSourceSmokeTests } = require('./wedding_suite/wedding_suite_panel_source_smoke_tests.cjs');
const { registerWeddingSuitePlanningSmokeTests } = require('./wedding_suite/wedding_suite_planning_smoke_tests.cjs');
const { registerWeddingSuiteQuickBuildSmokeTests } = require('./wedding_suite/wedding_suite_quick_build_smoke_tests.cjs');
const { registerWeddingSuiteOutputSmokeTests } = require('./wedding_suite/wedding_suite_output_smoke_tests.cjs');

function registerWeddingSuiteSmokeTests(context) {
    registerWeddingSuitePanelSourceSmokeTests(context);
    registerWeddingSuitePlanningSmokeTests(context);
    registerWeddingSuiteQuickBuildSmokeTests(context);
    registerWeddingSuiteOutputSmokeTests(context);
}

module.exports = { registerWeddingSuiteSmokeTests };
