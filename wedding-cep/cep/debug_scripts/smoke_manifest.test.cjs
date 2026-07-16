const assert = require('node:assert/strict');
const test = require('node:test');

const { registerWeddingSmokeSuites, weddingSmokeSuites } = require('./smoke_manifest.cjs');

test('Wedding smoke manifest registers every suite exactly once', () => {
    const calls = [];
    const runner = {
        addTest(name) {
            calls.push(name);
        }
    };

    registerWeddingSmokeSuites(runner);

    assert.deepEqual(
        weddingSmokeSuites.map((suite) => suite.id),
        ['core', 'name', 'autocomplete', 'document_sync', 'rich_text', 'schema']
    );
    assert.ok(calls.length >= weddingSmokeSuites.length);
    assert.equal(new Set(calls).size, calls.length);
});
