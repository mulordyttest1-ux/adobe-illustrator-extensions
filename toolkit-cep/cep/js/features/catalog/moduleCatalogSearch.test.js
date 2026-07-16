import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolkitCatalogSearch } from './moduleCatalogSearch.js';

const COMMANDS = [
    {
        id: 'alpha_command',
        title: 'Alpha Command',
        aliases: ['ping'],
        description: 'Alpha command.',
        category: 'Alpha',
        order: 10
    },
    {
        id: 'beta_command',
        title: 'Beta Command',
        aliases: ['sel', 'summary'],
        description: 'Describe the beta command.',
        category: 'Zulu',
        order: 20
    }
];

test('ToolkitCatalogSearch falls back to local ranking and matches aliases', () => {
    const index = ToolkitCatalogSearch.createIndex(COMMANDS, { Fuse: null });
    const results = ToolkitCatalogSearch.search(index, 'sel', 5);

    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'beta_command');
});
