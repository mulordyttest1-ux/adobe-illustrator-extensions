const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { packageRecovery } = require('./package_recovery.cjs');
const { verifyArchive } = require('./recovery_core.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');

test('production runtime package round-trips through ZIP under the size budget', { timeout: 120000, skip: process.platform !== 'win32' }, (t) => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'recovery-roundtrip-'));
    t.after(() => fs.rmSync(output, { recursive: true, force: true }));
    const commit = 'd'.repeat(40);
    const result = packageRecovery({ repoRoot: REPO_ROOT, version: '1.0.0', output }, {
        assertReleaseGitPolicy: () => ({ release: 'recovery-v1.0.0', commit }),
        builtAt: new Date('2026-07-17T00:00:00Z')
    });
    assert.equal(result.status, 'PASS');
    assert.ok(result.size <= 15 * 1024 * 1024);
    const report = verifyArchive(result.archive);
    assert.equal(report.status, 'PASS', JSON.stringify(report.checks, null, 2));
    const packageRoot = result.directory;
    assert.equal(fs.existsSync(path.join(packageRoot, 'extensions', 'com.dinhson.imposition', 'jsx', 'debug_host_validation.jsx')), false);
    assert.equal(fs.existsSync(path.join(packageRoot, 'extensions', 'com.dinhson.imposition', 'data', 'presets.usage.json')), false);
    assert.equal(fs.existsSync(path.join(packageRoot, 'extensions', 'com.dinhson.toolkit', 'app', '.generated', 'module_catalog.js')), true);
    for (const bundle of [
        'extensions/com.dinhson.imposition/js/bundle.js',
        'extensions/com.dinhson.weddingscripter/js/bundle.js',
        'extensions/com.dinhson.toolkit/app/js/bundle.js'
    ]) {
        assert.doesNotMatch(fs.readFileSync(path.join(packageRoot, bundle), 'utf8'), /sourceMappingURL=/u);
    }
});
