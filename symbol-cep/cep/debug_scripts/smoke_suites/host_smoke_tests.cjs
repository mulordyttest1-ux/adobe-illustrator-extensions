const { registerHostSelectionSmokeTests } = require('./host/host_selection_smoke_tests.cjs');
const { registerHostBorderSmokeTests } = require('./host/host_border_smoke_tests.cjs');
const { registerHostK100SmokeTests } = require('./host/host_k100_smoke_tests.cjs');
const { registerHostFailureSmokeTests } = require('./host/host_failure_smoke_tests.cjs');

function registerHostSmokeTests(context) {
    registerHostSelectionSmokeTests(context);
    registerHostBorderSmokeTests(context);
    registerHostK100SmokeTests(context);
    registerHostFailureSmokeTests(context);
}

module.exports = { registerHostSmokeTests };
