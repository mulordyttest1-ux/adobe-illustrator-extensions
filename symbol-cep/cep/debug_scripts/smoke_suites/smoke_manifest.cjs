const { registerActionSmokeTests } = require('./action_smoke_tests.cjs');
const { registerConfigSmokeTests } = require('./config_smoke_tests.cjs');
const { registerHostSmokeTests } = require('./host_smoke_tests.cjs');
const { registerWeddingSuiteSmokeTests } = require('./wedding_suite_smoke_tests.cjs');

const symbolSmokeSuites = [
    { id: 'action', register: registerActionSmokeTests },
    { id: 'config', register: registerConfigSmokeTests },
    { id: 'host', register: registerHostSmokeTests },
    { id: 'wedding_suite', register: registerWeddingSuiteSmokeTests }
];

function registerSymbolSmokeSuites(context) {
    for (const suite of symbolSmokeSuites) {
        suite.register(context);
    }
}

module.exports = { registerSymbolSmokeSuites, symbolSmokeSuites };
