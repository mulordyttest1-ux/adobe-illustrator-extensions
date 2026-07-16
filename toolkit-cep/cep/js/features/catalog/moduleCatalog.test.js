import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolkitCatalog } from './moduleCatalog.js';

const BASE_MODULES = [
    {
        id: 'alpha_command',
        title: 'Alpha Command',
        buttonLabel: 'Alpha Command',
        category: 'Alpha',
        order: 10,
        aliases: ['ping'],
        description: 'Alpha command.',
        favoriteRank: 1,
        requiresDocument: false,
        requiresSelection: false,
        successMessage: 'Done.',
        handler: 'alpha_command'
    },
    {
        id: 'beta_command',
        title: 'Beta Command',
        buttonLabel: 'Beta Command',
        category: 'Zulu',
        order: 20,
        aliases: ['sel'],
        description: 'Beta command.',
        favoriteRank: 2,
        requiresDocument: true,
        requiresSelection: true,
        successMessage: 'Done.',
        handler: 'beta_command'
    }
];

const MODULES = BASE_MODULES.concat([
    {
        id: 'swap_selection_position_only',
        title: 'Swap Position Only',
        buttonLabel: 'Swap Position',
        category: 'Daily Work',
        order: 10,
        aliases: ['swap'],
        description: 'Swap positions.',
        favoriteRank: 0,
        requiresDocument: true,
        requiresSelection: true,
        successMessage: 'Done.',
        handler: 'swap_selection_position_only'
    },
    {
        id: 'unknown_alpha',
        title: 'Unknown Alpha',
        buttonLabel: 'Unknown Alpha',
        category: 'Alpha',
        order: 10,
        aliases: [],
        description: 'Alpha bucket.',
        favoriteRank: 0,
        requiresDocument: false,
        requiresSelection: false,
        successMessage: 'Done.',
        handler: 'unknown_alpha'
    },
    {
        id: 'unknown_zulu',
        title: 'Unknown Zulu',
        buttonLabel: 'Unknown Zulu',
        category: 'Zulu',
        order: 10,
        aliases: [],
        description: 'Zulu bucket.',
        favoriteRank: 0,
        requiresDocument: false,
        requiresSelection: false,
        successMessage: 'Done.',
        handler: 'unknown_zulu'
    }
]);

test('createToolkitCatalog keeps healthy modules enabled and merges quarantine availability', () => {
    const catalog = createToolkitCatalog(BASE_MODULES, {
        loadedAtMs: 100,
        loadedModules: [{ id: 'alpha_command' }],
        quarantinedModules: [{ id: 'beta_command', reason: 'Syntax error in run.jsx' }],
        moduleCount: 2,
        quarantinedCount: 1
    });

    assert.equal(catalog.enabledCount, 1);
    assert.equal(catalog.quarantinedCount, 1);
    assert.equal(catalog.modules.length, 2);
    assert.equal(catalog.lookup.get('alpha_command').enabled, true);
    assert.equal(catalog.lookup.get('beta_command').enabled, false);
    assert.equal(catalog.lookup.get('beta_command').disabledReason, 'Syntax error in run.jsx');
});

test('createToolkitCatalog defaults to ready modules when runtime health is absent', () => {
    const catalog = createToolkitCatalog(BASE_MODULES);

    assert.equal(catalog.enabledCount, 2);
    assert.equal(catalog.quarantinedCount, 0);
    assert.equal(catalog.modules.length, 2);
    assert.equal(catalog.lookup.get('beta_command').status, 'ready');
});

test('createToolkitCatalog orders priority categories before alpha fallback categories', () => {
    const catalog = createToolkitCatalog(MODULES);

    assert.deepEqual(
        catalog.groups.map((group) => group.category),
        ['Daily Work', 'Alpha', 'Zulu']
    );
});
