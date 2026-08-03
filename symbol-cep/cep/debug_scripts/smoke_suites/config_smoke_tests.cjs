const { registerConfigDraftSmokeTests } = require('./config/config_draft_smoke_tests.cjs');
const { registerConfigPaneSmokeTests } = require('./config/config_pane_smoke_tests.cjs');
const { registerConfigMigrationSmokeTests } = require('./config/config_migration_smoke_tests.cjs');
const { registerConfigPostflightSmokeTests } = require('./config/config_postflight_smoke_tests.cjs');
const { registerConfigStorageSmokeTests } = require('./config/config_storage_smoke_tests.cjs');

function registerConfigSmokeTests(context) {
    registerConfigDraftSmokeTests(context);
    registerConfigPaneSmokeTests(context);
    registerConfigMigrationSmokeTests(context);
    registerConfigPostflightSmokeTests(context);
    registerConfigStorageSmokeTests(context);
}

module.exports = { registerConfigSmokeTests };
