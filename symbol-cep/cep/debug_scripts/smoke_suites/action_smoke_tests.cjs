const { registerActionShellSmokeTests } = require('./action/action_shell_smoke_tests.cjs');
const { registerActionRunSmokeTests } = require('./action/action_run_smoke_tests.cjs');
const { registerActionSaveSmokeTests } = require('./action/action_save_smoke_tests.cjs');
const { registerActionFailureSmokeTests } = require('./action/action_failure_smoke_tests.cjs');

function registerActionSmokeTests(context) {
    registerActionShellSmokeTests(context);
    registerActionRunSmokeTests(context);
    registerActionSaveSmokeTests(context);
    registerActionFailureSmokeTests(context);
}

module.exports = { registerActionSmokeTests };
