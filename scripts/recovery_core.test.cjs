const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { main: verifyMain } = require('./verify_recovery.cjs');

const {
    EXPECTED_EXTENSION_IDS,
    artifactBaseName,
    assertReleaseGitPolicy,
    assertSemver,
    buildSha256Sums,
    createReleaseManifest,
    isForbiddenRuntimePath,
    normalizeRelative,
    parseRecoveryArgs,
    parseSha256Sums,
    listArchiveEntries,
    runtimeInventory,
    sha256File
} = require('./recovery_core.cjs');

function tempDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

test('SemVer and recovery CLI contracts reject ambiguous input', () => {
    assert.equal(assertSemver('1.0.0'), '1.0.0');
    assert.equal(assertSemver('2.1.0-rc.1'), '2.1.0-rc.1');
    assert.throws(() => assertSemver('01.0.0'), /Invalid SemVer/);
    assert.deepEqual(
        parseRecoveryArgs(['--version', '1.2.3', '--output', 'out', '--json'], 'package'),
        { json: true, version: '1.2.3', output: path.resolve('out') }
    );
    assert.throws(() => parseRecoveryArgs(['--version', '1.0.0', '--output', 'out', '--allow-dirty'], 'package'), /Unknown argument/);
    assert.throws(() => parseRecoveryArgs(['--json'], 'verify'), /--archive is required/);
});

test('runtime path policy excludes dev, test, cache, secrets, maps, and mutable usage', () => {
    const forbidden = [
        '.debug', 'debug_scripts/probe.cjs', 'js/app.test.js', 'js/bundle.js.map',
        'data/presets.usage.json', 'cache/state.json', '.env.local', 'jsx/debug_host_validation.jsx'
    ];
    forbidden.forEach((relative) => assert.equal(isForbiddenRuntimePath(relative), true, relative));
    ['js/bundle.js', 'data/presets.json', 'jsx/hostValidation.jsx', 'modules/step_repeat/run.jsx']
        .forEach((relative) => assert.equal(isForbiddenRuntimePath(relative), false, relative));
    assert.throws(() => normalizeRelative('../escape.txt'), /Unsafe/);
    assert.throws(() => normalizeRelative('C:/absolute.txt'), /relative/);
});

test('git release policy requires clean origin/main commit and unused local/remote tag', () => {
    const commit = 'a'.repeat(40);
    const calls = [];
    const fakeRun = (_command, args) => {
        calls.push(args.join(' '));
        if (args[0] === 'status') return { status: 0, stdout: '' };
        if (args[0] === 'rev-parse') return { status: 0, stdout: `${commit}\n` };
        if (args[0] === 'merge-base') return { status: 0, stdout: '' };
        if (args[0] === 'show-ref') return { status: 1, stdout: '' };
        if (args[0] === 'ls-remote') return { status: 2, stdout: '' };
        throw new Error(`unexpected git call: ${args.join(' ')}`);
    };
    assert.deepEqual(assertReleaseGitPolicy('repo', '1.0.0', { run: fakeRun }), {
        release: 'recovery-v1.0.0', commit
    });
    assert.ok(calls.some((call) => call.includes('origin/main')));
    assert.ok(calls.some((call) => call.includes('refs/tags/recovery-v1.0.0')));

    assert.throws(() => assertReleaseGitPolicy('repo', '1.0.0', {
        run: (_command, args) => args[0] === 'status' ? { status: 0, stdout: ' M dirty.txt' } : { status: 0, stdout: '' }
    }), /clean Git worktree/);
});

test('manifest inventory and SHA256SUMS are sorted, complete, and tamper evident', (t) => {
    const root = tempDir('recovery-core-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const id of EXPECTED_EXTENSION_IDS) {
        write(path.join(root, 'extensions', id, 'CSXS', 'manifest.xml'), '<manifest/>');
    }
    write(path.join(root, 'install-silent.bat'), 'fixture');
    const files = runtimeInventory(root);
    assert.deepEqual(files.map((entry) => entry.path), [...files.map((entry) => entry.path)].sort());
    const manifest = createReleaseManifest({
        version: '1.0.0', commit: 'b'.repeat(40), builtAt: new Date('2026-07-17T00:00:00Z'),
        extensions: EXPECTED_EXTENSION_IDS.map((id) => ({ id, version: '1.0.0' })), files
    });
    assert.equal(manifest.release, 'recovery-v1.0.0');
    assert.equal(manifest.portabilityExceptions[0].id, 'committed-preset-output-paths');
    buildSha256Sums(root);
    const sums = parseSha256Sums(fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8'));
    assert.equal(sums.get('install-silent.bat'), sha256File(path.join(root, 'install-silent.bat')));
    assert.equal(sums.has('SHA256SUMS.txt'), false);
    assert.equal(artifactBaseName('1.0.0', 'c'.repeat(40)), 'adobe-illustrator-cep-golden-recovery-v1.0.0-cccccccccccc');
});

test('checksum parser rejects duplicate and unsafe paths', () => {
    const digest = 'a'.repeat(64);
    assert.throws(() => parseSha256Sums(`${digest} *file.txt\n${digest} *file.txt\n`), /Duplicate/);
    assert.throws(() => parseSha256Sums(`${digest} *..\/escape.txt\n`), /Unsafe/);
});

test('archive listing rejects symbolic links before extraction', () => {
    const fakeListing = [
        'Path = C:\\fixture.zip',
        'Type = zip',
        '',
        'Path = root/link',
        'Symbolic Link = ../../outside'
    ].join('\n');
    assert.throws(() => listArchiveEntries('C:\\fixture.zip', {
        sevenZip: '7z',
        run: () => ({ status: 0, stdout: fakeListing })
    }), /symbolic link/);
});

test('release workflow uses the administrator-confirmed immutability preflight', () => {
    const workflow = fs.readFileSync(
        path.join(__dirname, '..', '.github', 'workflows', 'recovery-release.yml'),
        'utf8'
    );
    assert.match(workflow, /vars\.RECOVERY_IMMUTABLE_RELEASES_ENABLED/);
    assert.doesNotMatch(workflow, /gh api .*immutable-releases/);
});

test('verifier uses exit 1 for an invalid archive and exit 2 for invalid CLI', (t) => {
    const root = tempDir('recovery-invalid-archive-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const archive = path.join(root, 'invalid.zip');
    fs.writeFileSync(archive, 'not a zip', 'utf8');
    assert.equal(verifyMain(['--archive', archive, '--json'], {
        sevenZip: '7z',
        run: () => ({ status: 2, stdout: '', stderr: 'invalid archive fixture' })
    }), 1);
    assert.equal(verifyMain(['--unknown']), 2);
});
