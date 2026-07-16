const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync } = require('node:child_process');

const { inspectRepo } = require('./check_repo_hygiene.cjs');

function createFixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-hygiene-'));
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    return root;
}

function writeFile(root, relativePath, contents = 'fixture\n') {
    const targetPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, contents, 'utf8');
}

function addForced(root, relativePath) {
    execFileSync('git', ['add', '--force', '--', relativePath], { cwd: root });
}

test('hygiene checker rejects tracked Nx cache', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    writeFile(root, '.nx/cache/run.json', '{}\n');
    addForced(root, '.nx/cache/run.json');

    const result = inspectRepo(root, { requiredPaths: [] });
    assert.ok(result.errors.some((entry) => entry.includes('.nx/cache/run.json')));
});

test('hygiene checker rejects tracked generated bundle', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    writeFile(root, 'symbol-cep/cep/js/bundle.js');
    addForced(root, 'symbol-cep/cep/js/bundle.js');

    const result = inspectRepo(root, { requiredPaths: [] });
    assert.ok(result.errors.some((entry) => entry.includes('bundle.js')));
});

test('hygiene checker rejects required smoke source hidden by ignore rules', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    writeFile(root, '.gitignore', 'debug_scripts/\n');
    writeFile(root, 'debug_scripts/test_smoke.cjs');

    const result = inspectRepo(root, { requiredPaths: ['debug_scripts/test_smoke.cjs'] });
    assert.ok(result.errors.some((entry) => entry.includes('hidden by ignore rules')));
});

test('hygiene checker accepts the explicitly allowlisted Symbol template', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    writeFile(root, '.gitignore', '/symbol-cep/*.ai\n!/symbol-cep/wedding suite print template.ai\n');
    writeFile(root, 'symbol-cep/wedding suite print template.ai');

    const result = inspectRepo(root, {
        requiredPaths: ['symbol-cep/wedding suite print template.ai']
    });
    assert.deepEqual(result.errors, []);
});
