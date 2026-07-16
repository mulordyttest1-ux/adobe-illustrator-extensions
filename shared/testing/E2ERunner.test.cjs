const assert = require('node:assert/strict');
const test = require('node:test');

const { E2ERunner } = require('./E2ERunner.cjs');

test('E2ERunner rejects an empty smoke suite before connecting', () => {
    const runner = new E2ERunner({ port: 9198, projectName: 'Fixture Panel' });

    assert.throws(
        () => runner._assertTestsRegistered(),
        /No smoke tests registered for Fixture Panel\./
    );
});

test('E2ERunner accepts a registered smoke test', () => {
    const runner = new E2ERunner({ port: 9198, projectName: 'Fixture Panel' });
    runner.addTest('fixture', 'true', () => {});

    assert.doesNotThrow(() => runner._assertTestsRegistered());
});
