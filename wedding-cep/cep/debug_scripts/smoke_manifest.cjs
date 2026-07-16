const { registerAutocompleteSmokeTests } = require('./smoke_suites/autocomplete_smoke_tests.cjs');
const { registerCoreSmokeTests } = require('./smoke_suites/core_smoke_tests.cjs');
const { registerDocumentSyncSmokeTests } = require('./smoke_suites/document_sync_smoke_tests.cjs');
const { registerNameSmokeTests } = require('./smoke_suites/name_smoke_tests.cjs');
const { registerRichTextSmokeTests } = require('./smoke_suites/rich_text_smoke_tests.cjs');
const { registerSchemaSmokeTests } = require('./smoke_suites/schema_smoke_tests.cjs');

const weddingSmokeSuites = [
    { id: 'core', register: registerCoreSmokeTests },
    { id: 'name', register: registerNameSmokeTests },
    { id: 'autocomplete', register: registerAutocompleteSmokeTests },
    { id: 'document_sync', register: registerDocumentSyncSmokeTests },
    { id: 'rich_text', register: registerRichTextSmokeTests },
    { id: 'schema', register: registerSchemaSmokeTests }
];

function registerWeddingSmokeSuites(runner) {
    for (const suite of weddingSmokeSuites) {
        suite.register(runner);
    }
}

module.exports = { registerWeddingSmokeSuites, weddingSmokeSuites };
