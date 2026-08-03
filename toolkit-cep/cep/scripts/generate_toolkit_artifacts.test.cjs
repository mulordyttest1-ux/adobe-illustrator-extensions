const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    collectModuleDefinitions,
    renderCatalogSource,
    renderDispatchSource,
    renderRegistrySource
} = require('./generate_toolkit_artifacts.cjs');

function writeModule(rootDir, moduleId, manifest) {
    const moduleDir = path.join(rootDir, 'modules', moduleId);
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(moduleDir, 'run.jsx'), '// module');
}

function writeRequestAdapter(rootDir, moduleId, source = 'export async function prepareRequest() { return { payload: {} }; }') {
    fs.writeFileSync(path.join(rootDir, 'modules', moduleId, 'request.js'), source);
}

function createProjectFixture() {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-artifacts-'));
    fs.mkdirSync(path.join(projectRoot, 'modules'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'jsx'), { recursive: true });
    return projectRoot;
}

test('collectModuleDefinitions validates module metadata and normalizes aliases', () => {
    const projectRoot = createProjectFixture();
    writeModule(projectRoot, 'alpha_command', {
        id: 'alpha_command',
        title: 'Alpha Command',
        buttonLabel: 'Alpha Command',
        category: 'Alpha',
        order: 20,
        aliases: ['sel', 'summary', 'SEL'],
        description: 'Describe the alpha command.',
        favoriteRank: 2,
        requiresDocument: true,
        requiresSelection: true,
        successMessage: 'Summary complete.'
    });

    const definitions = collectModuleDefinitions({ projectRoot });
    assert.equal(definitions.length, 1);
    assert.deepEqual(definitions[0].aliases, ['sel', 'summary']);
    assert.equal(definitions[0].handler, 'alpha_command');
    assert.equal(definitions[0].jsxRelativeRunPath, '../modules/alpha_command/run.jsx');
});

test('rendered artifacts separate panel catalog from host registry and dispatch', () => {
    const projectRoot = createProjectFixture();
    writeModule(projectRoot, 'test_probe_command', {
        id: 'test_probe_command',
        title: 'Test Probe Command',
        buttonLabel: 'Test Probe Command',
        category: 'Alpha',
        order: 10,
        aliases: ['ping'],
        description: 'Probe the host.',
        favoriteRank: 1,
        requiresDocument: false,
        requiresSelection: false,
        successMessage: 'Ready.'
    });

    const definitions = collectModuleDefinitions({ projectRoot });
    const catalogSource = renderCatalogSource(definitions);
    const registrySource = renderRegistrySource(definitions);
    const dispatchSource = renderDispatchSource(definitions);

    assert.match(catalogSource, /GENERATED_TOOLKIT_MODULES/);
    assert.match(catalogSource, /"handler": "test_probe_command"/);
    assert.match(registrySource, /ToolkitGeneratedModuleRegistry/);
    assert.match(registrySource, /"\.\.\/modules\/test_probe_command\/run\.jsx"/);
    assert.match(dispatchSource, /QUARANTINED_TOOLKIT_COMMAND/);
    assert.doesNotMatch(dispatchSource, /#include/);
});

test('optional request adapters are generated into a separate panel registry', () => {
    const projectRoot = createProjectFixture();
    writeModule(projectRoot, 'place_all_pdf_pages', {
        id: 'place_all_pdf_pages',
        title: 'Place All PDF Pages',
        buttonLabel: 'Place All PDF Pages',
        category: 'Daily Work',
        order: 15,
        aliases: ['pdf'],
        description: 'Place all PDF pages.',
        favoriteRank: 0,
        requiresDocument: true,
        requiresSelection: false,
        successMessage: ''
    });
    writeRequestAdapter(projectRoot, 'place_all_pdf_pages');

    const definitions = collectModuleDefinitions({ projectRoot });
    const requestSource = require('./generate_toolkit_artifacts.cjs')
        .renderRequestRegistrySource(definitions);

    assert.equal(definitions[0].requestRelativePath, '../modules/place_all_pdf_pages/request.js');
    assert.match(requestSource, /GENERATED_TOOLKIT_REQUEST_ADAPTERS/);
    assert.match(requestSource, /place_all_pdf_pages/);
    assert.match(requestSource, /prepareRequest as requestAdapter0/);
});

test('collectModuleDefinitions rejects duplicate ids', () => {
    const projectRoot = createProjectFixture();
    const manifest = {
        id: 'duplicate_command',
        title: 'Duplicate',
        buttonLabel: 'Duplicate',
        category: 'Test',
        order: 0,
        aliases: ['dup'],
        description: 'Duplicate id.',
        favoriteRank: 0,
        requiresDocument: false,
        requiresSelection: false,
        successMessage: ''
    };

    writeModule(projectRoot, 'first', manifest);
    writeModule(projectRoot, 'second', { ...manifest });

    assert.throws(
        () => collectModuleDefinitions({ projectRoot }),
        /duplicate id "duplicate_command"/
    );
});

test('collectModuleDefinitions rejects legacy confirm metadata', () => {
    const projectRoot = createProjectFixture();
    writeModule(projectRoot, 'legacy_confirm', {
        id: 'legacy_confirm',
        title: 'Legacy Confirm',
        buttonLabel: 'Legacy Confirm',
        category: 'Test',
        order: 0,
        aliases: ['legacy'],
        description: 'Legacy metadata.',
        favoriteRank: 0,
        requiresDocument: false,
        requiresSelection: false,
        confirmMessage: 'Old field',
        successMessage: ''
    });

    assert.throws(
        () => collectModuleDefinitions({ projectRoot }),
        /legacy field "confirmMessage" is no longer supported/
    );
});
