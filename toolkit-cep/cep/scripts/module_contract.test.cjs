const test = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeModuleManifest,
    createModuleDefinition
} = require('./module_contract.cjs');

test('normalizeModuleManifest validates and normalizes toolkit module metadata', () => {
    const manifest = normalizeModuleManifest({
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
        successMessage: ' Done. '
    }, 'Test module');

    assert.deepEqual(manifest, {
        id: 'alpha_command',
        title: 'Alpha Command',
        buttonLabel: 'Alpha Command',
        category: 'Alpha',
        order: 20,
        aliases: ['sel', 'summary'],
        description: 'Describe the alpha command.',
        favoriteRank: 2,
        requiresDocument: true,
        requiresSelection: true,
        successMessage: 'Done.'
    });
});

test('normalizeModuleManifest rejects legacy confirm metadata', () => {
    assert.throws(
        () => normalizeModuleManifest({
            id: 'legacy_confirm',
            title: 'Legacy Confirm',
            buttonLabel: 'Legacy Confirm',
            category: 'Test',
            order: 0,
            aliases: ['legacy'],
            description: 'Old manifest.',
            favoriteRank: 0,
            requiresDocument: false,
            requiresSelection: false,
            confirmMessage: 'Old field',
            successMessage: ''
        }, 'Legacy test'),
        /legacy field "confirmMessage" is no longer supported/
    );
});

test('createModuleDefinition derives handler and jsx-relative path', () => {
    const definition = createModuleDefinition({
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
        successMessage: ''
    }, {
        manifestPath: 'C:/toolkit-cep/cep/modules/test_probe_command/module.json',
        runPath: 'C:/toolkit-cep/cep/modules/test_probe_command/run.jsx',
        requestPath: 'C:/toolkit-cep/cep/modules/test_probe_command/request.js',
        jsxRoot: 'C:/toolkit-cep/cep/jsx'
    });

    assert.equal(definition.handler, 'test_probe_command');
    assert.equal(definition.jsxRelativeRunPath, '../modules/test_probe_command/run.jsx');
    assert.equal(definition.requestRelativePath, '../modules/test_probe_command/request.js');
});
