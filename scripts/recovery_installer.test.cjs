const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const { buildSha256Sums } = require('./recovery_core.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const EXTENSION_IDS = ['com.dinhson.imposition', 'com.dinhson.weddingscripter', 'com.dinhson.toolkit'];

function tempDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

function createFixture(root) {
    const packageRoot = path.join(root, 'package');
    fs.cpSync(path.join(REPO_ROOT, 'recovery'), packageRoot, { recursive: true });
    for (const id of EXTENSION_IDS) {
        write(path.join(packageRoot, 'extensions', id, 'CSXS', 'manifest.xml'), `<ExtensionManifest ExtensionBundleVersion="1.0.0"><Extension Id="${id}.panel" Version="1.0.0"/></ExtensionManifest>`);
        write(path.join(packageRoot, 'extensions', id, 'payload.txt'), `new-${id}\n`);
    }
    write(path.join(packageRoot, 'extensions', 'com.dinhson.imposition', 'data', 'presets.json'), '{"origin":"release"}\n');
    write(path.join(packageRoot, 'release-manifest.json'), `${JSON.stringify({
        schemaVersion: 1,
        release: 'recovery-v1.0.0',
        version: '1.0.0',
        commit: 'a'.repeat(40),
        extensions: EXTENSION_IDS.map((id) => ({ id }))
    }, null, 2)}\n`);
    buildSha256Sums(packageRoot);
    return packageRoot;
}

function runPowerShell(scriptPath, args) {
    return spawnSync('powershell.exe', [
        '-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args
    ], { encoding: 'utf8', windowsHide: true });
}

function install(packageRoot, extensionsRoot, stateRoot, extra = []) {
    return runPowerShell(path.join(packageRoot, 'installer', 'install.ps1'), [
        '-ExtensionsRoot', extensionsRoot,
        '-StateRoot', stateRoot,
        '-SkipHostCheck', '-SkipProcessCheck', '-SkipRegistry',
        ...extra
    ]);
}

test('installer supports fresh, idempotent, upgrade, uninstall, and preset-preserving reinstall', { timeout: 60000, skip: process.platform !== 'win32' }, (t) => {
    const root = tempDir('recovery-installer-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const packageRoot = createFixture(root);
    const extensionsRoot = path.join(root, 'cep');
    const stateRoot = path.join(root, 'state');

    let result = install(packageRoot, extensionsRoot, stateRoot);
    assert.equal(result.status, 0, result.stderr);
    EXTENSION_IDS.forEach((id) => assert.equal(fs.existsSync(path.join(extensionsRoot, id, 'payload.txt')), true));
    const presetPath = path.join(extensionsRoot, 'com.dinhson.imposition', 'data', 'presets.json');
    const usagePath = path.join(extensionsRoot, 'com.dinhson.imposition', 'data', 'presets.usage.json');
    write(presetPath, '{"origin":"user"}\n');
    write(usagePath, '{"used":true}\n');

    result = install(packageRoot, extensionsRoot, stateRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(presetPath, 'utf8'), /user/);
    assert.match(fs.readFileSync(usagePath, 'utf8'), /used/);
    assert.equal(fs.existsSync(path.join(stateRoot, 'install-state.json')), true);

    result = runPowerShell(path.join(packageRoot, 'installer', 'uninstall.ps1'), [
        '-ExtensionsRoot', extensionsRoot, '-StateRoot', stateRoot, '-SkipProcessCheck'
    ]);
    assert.equal(result.status, 0, result.stderr);
    EXTENSION_IDS.forEach((id) => assert.equal(fs.existsSync(path.join(extensionsRoot, id)), false));

    result = install(packageRoot, extensionsRoot, stateRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(presetPath, 'utf8'), /user/);
    assert.match(fs.readFileSync(usagePath, 'utf8'), /used/);
});

test('integrity failure and Illustrator-running guard stop before extension copy', { timeout: 30000, skip: process.platform !== 'win32' }, (t) => {
    const root = tempDir('recovery-guards-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const packageRoot = createFixture(root);
    const extensionsRoot = path.join(root, 'cep');
    const stateRoot = path.join(root, 'state');
    fs.appendFileSync(path.join(packageRoot, 'extensions', EXTENSION_IDS[0], 'payload.txt'), 'tampered');
    let result = install(packageRoot, extensionsRoot, stateRoot);
    assert.equal(result.status, 10, `${result.stdout}\n${result.stderr}`);
    assert.equal(fs.existsSync(path.join(extensionsRoot, EXTENSION_IDS[0])), false);

    const extraRoot = path.join(root, 'extra');
    const extraPackage = createFixture(extraRoot);
    write(path.join(extraPackage, 'extensions', EXTENSION_IDS[2], 'unlisted.jsx'), 'malicious-extra');
    result = install(extraPackage, extensionsRoot, stateRoot);
    assert.equal(result.status, 10, `${result.stdout}\n${result.stderr}`);
    assert.equal(fs.existsSync(path.join(extensionsRoot, EXTENSION_IDS[2])), false);

    const cleanRoot = path.join(root, 'clean');
    const cleanPackage = createFixture(cleanRoot);
    result = runPowerShell(path.join(cleanPackage, 'installer', 'install.ps1'), [
        '-ExtensionsRoot', extensionsRoot, '-StateRoot', stateRoot,
        '-SkipHostCheck', '-SkipRegistry', '-SimulateIllustratorRunning'
    ]);
    assert.equal(result.status, 20, `${result.stdout}\n${result.stderr}`);
    assert.equal(fs.existsSync(path.join(extensionsRoot, EXTENSION_IDS[0])), false);
});

test('simulated copy failure restores previous production wrappers', { timeout: 30000, skip: process.platform !== 'win32' }, (t) => {
    const root = tempDir('recovery-rollback-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const packageRoot = createFixture(root);
    const extensionsRoot = path.join(root, 'cep');
    const stateRoot = path.join(root, 'state');
    for (const id of EXTENSION_IDS) write(path.join(extensionsRoot, id, 'payload.txt'), `old-${id}\n`);
    const result = install(packageRoot, extensionsRoot, stateRoot, ['-FailAfterExtension', EXTENSION_IDS[0]]);
    assert.equal(result.status, 30, `${result.stdout}\n${result.stderr}`);
    for (const id of EXTENSION_IDS) {
        assert.equal(fs.readFileSync(path.join(extensionsRoot, id, 'payload.txt'), 'utf8'), `old-${id}\n`);
    }
});

test('replacement and cleanup never follow an existing production junction', { timeout: 30000, skip: process.platform !== 'win32' }, (t) => {
    const root = tempDir('recovery-junction-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const packageRoot = createFixture(root);
    const extensionsRoot = path.join(root, 'cep');
    const stateRoot = path.join(root, 'state');
    const sourceTarget = path.join(root, 'developer-source');
    write(path.join(sourceTarget, 'keep.txt'), 'do-not-delete\n');
    fs.mkdirSync(extensionsRoot, { recursive: true });
    fs.symlinkSync(sourceTarget, path.join(extensionsRoot, EXTENSION_IDS[0]), 'junction');

    let result = install(packageRoot, extensionsRoot, stateRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(sourceTarget, 'keep.txt'), 'utf8'), 'do-not-delete\n');
    assert.equal(fs.lstatSync(path.join(extensionsRoot, EXTENSION_IDS[0])).isSymbolicLink(), false);

    result = install(packageRoot, extensionsRoot, stateRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(sourceTarget, 'keep.txt'), 'utf8'), 'do-not-delete\n');
});
