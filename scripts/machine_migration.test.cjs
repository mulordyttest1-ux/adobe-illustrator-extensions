const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    assertEmptyTarget,
    find7Zip,
    isExcludedMachineDataPath,
    isSensitivePath,
    parseCliArgs,
    run,
    REPO_ROOT,
    scanTextForSecrets,
    summarizeChecks
} = require('./machine_migration_common.cjs');
const {
    assertSafeFile,
    createBackupPayload,
    createEncryptedArchive,
    refreshRacyCleanEntries
} = require('./backup_machine_state.cjs');
const { collectDoctorReport, isPluginEnabled } = require('./dev_machine_doctor.cjs');
const { restoreArchive, restorePayload, verifyChecksumSidecar } = require('./restore_machine_state.cjs');
const { buildSetupSteps } = require('./setup_dev_machine.cjs');
const { CEP_APPS, buildManifestXml, parseArgs: parseLiveLinkArgs } = require('./install_cep_live_links.cjs');

function tempDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

test('CLI parser handles boolean, separated, and inline values', () => {
    assert.deepEqual(
        parseCliArgs(['--dry-run', '--target', 'C:\\restore', '--archive=test.7z'], {
            boolean: ['dry-run'],
            value: ['target', 'archive']
        }),
        { 'dry-run': true, target: 'C:\\restore', archive: 'test.7z' }
    );
    assert.throws(() => parseCliArgs(['--unknown'], { boolean: [], value: [] }), /Unknown flag/);
});

test('doctor status contract and plugin section parsing are stable', () => {
    assert.equal(summarizeChecks([{ status: 'PASS' }]), 'pass');
    assert.equal(summarizeChecks([{ status: 'WARN' }]), 'warn');
    assert.equal(summarizeChecks([{ status: 'FAIL' }]), 'fail');
    const config = '[plugins."browser@openai-bundled"]\nenabled = true\n\n[projects."example"]\ntrust_level = "trusted"\n';
    assert.equal(isPluginEnabled(config, 'browser@openai-bundled'), true);
    assert.equal(isPluginEnabled(config, 'sites@openai-bundled'), false);
});

test('doctor preflight produces the documented JSON shape', async (t) => {
    const root = tempDir('machine-doctor-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const repoRoot = path.join(root, 'repo');
    const programFiles = path.join(root, 'Program Files');
    const codexHome = path.join(root, 'codex');
    write(path.join(repoRoot, 'package-lock.json'), '{}');
    write(path.join(repoRoot, 'symbol-cep', 'wedding suite print template.ai'), 'fixture');
    [2025, 2026].forEach((year) => fs.mkdirSync(path.join(programFiles, 'Adobe', `Adobe Illustrator ${year}`), { recursive: true }));
    ['adobe-cep-repo-context', 'cep-es3-es6-boundary', 'wedding-domain-knowledge'].forEach((name) => {
        write(path.join(codexHome, 'skills', name, 'SKILL.md'), '# fixture');
    });
    write(path.join(codexHome, 'config.toml'), [
        '[plugins."browser@openai-bundled"]',
        'enabled = true',
        '[plugins."sites@openai-bundled"]',
        'enabled = true',
        '[plugins."visualize@openai-bundled"]',
        'enabled = true'
    ].join('\n'));
    const fakeRun = (command, args) => {
        if (command === 'npm') return { status: 0, stdout: '11.6.2\n' };
        if (command === 'git') return { status: 0, stdout: 'git version 2.50.0\n' };
        if (command === 'reg.exe') return { status: 0, stdout: 'PlayerDebugMode    REG_SZ    1\n' };
        throw new Error(`Unexpected command ${command} ${args.join(' ')}`);
    };
    const report = await collectDoctorReport({ repoRoot, codexHome, phase: 'preflight' }, {
        platform: 'win32',
        env: { ProgramFiles: programFiles, APPDATA: path.join(root, 'appdata'), WINDIR: path.join(root, 'windows'), LOCALAPPDATA: path.join(root, 'local') },
        run: fakeRun
    });
    assert.equal(report.version, 1);
    assert.equal(report.status, 'pass');
    assert.ok(report.checks.every((check) => ['id', 'status', 'severity', 'message', 'remediation'].every((key) => Object.hasOwn(check, key))));
});

test('setup command sequence is deterministic', () => {
    const steps = buildSetupSteps({ repoRoot: 'C:\\repo', codexConfig: 'C:\\private-config' });
    assert.deepEqual(steps.slice(0, 3).map((step) => [step.command, step.args.slice(0, 2)]), [
        ['npm', ['ci']],
        ['npm', ['run', 'hooks:install']],
        ['npm', ['run', 'verify']]
    ]);
    assert.ok(steps.some((step) => step.command === 'reg.exe' && step.args.includes('HKCU\\Software\\Adobe\\CSXS.11')));
    assert.ok(steps.some((step) => step.command === 'reg.exe' && step.args.includes('HKCU\\Software\\Adobe\\CSXS.12')));
    assert.equal(steps.at(-1).description, 'Run final machine doctor.');
});

test('secret and machine-local exclusions are rejected or excluded', () => {
    assert.equal(isSensitivePath('.env.local'), true);
    assert.equal(isSensitivePath('config/auth.json'), true);
    assert.equal(isExcludedMachineDataPath('state/sessions/one.json'), true);
    assert.equal(isExcludedMachineDataPath('state/cache/index.db'), true);
    assert.equal(isExcludedMachineDataPath('.nx/workspace-data/file-map.json'), true);
    const fakeGitHubToken = `github_${'pat'}_${'abcdefghijklmnopqrstuvwxyz'}`;
    assert.deepEqual(scanTextForSecrets(`token = "${fakeGitHubToken}"`), ['github-token']);
});

test('secret scanning covers large files instead of trusting their size', (t) => {
    const root = tempDir('secret-scan-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const filePath = path.join(root, 'large.txt');
    const fakeGitHubToken = `gh${'p'}_${'abcdefghijklmnopqrstuvwxyz0123456789'}`;
    fs.writeFileSync(filePath, `${'x'.repeat(6 * 1024 * 1024)}\n${fakeGitHubToken}`, 'utf8');
    assert.throws(() => assertSafeFile(filePath, 'large.txt'), /github-token/);
});

test('restore refuses a non-empty target', (t) => {
    const root = tempDir('restore-guard-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    write(path.join(root, 'keep.txt'), 'user data');
    assert.throws(() => assertEmptyTarget(root), /must be empty/);
});

test('git bundle, staged patch, unstaged patch, and untracked files round-trip', (t) => {
    const root = tempDir('machine-roundtrip-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source');
    const payload = path.join(root, 'payload');
    const restored = path.join(root, 'restored');
    fs.mkdirSync(source, { recursive: true });
    run('git', ['init', '-b', 'main'], { cwd: source });
    run('git', ['config', 'user.email', 'machine-test@example.invalid'], { cwd: source });
    run('git', ['config', 'user.name', 'Machine Test'], { cwd: source });
    run('git', ['config', 'core.autocrlf', 'false'], { cwd: source });
    write(path.join(source, 'base.txt'), 'base\n');
    run('git', ['add', 'base.txt'], { cwd: source });
    run('git', ['commit', '-m', 'baseline'], { cwd: source });
    write(path.join(source, 'base.txt'), 'staged\n');
    run('git', ['add', 'base.txt'], { cwd: source });
    write(path.join(source, 'base.txt'), 'staged\nunstaged\n');
    write(path.join(source, 'notes', 'untracked.txt'), 'local work\n');

    const isolatedEnv = {
        ...process.env,
        ProgramFiles: path.join(root, 'program-files'),
        APPDATA: path.join(root, 'appdata'),
        LOCALAPPDATA: path.join(root, 'localappdata'),
        WINDIR: path.join(root, 'windows'),
        CODEX_HOME: path.join(root, 'codex')
    };
    const manifest = createBackupPayload({ repoRoot: source, payloadRoot: payload, env: isolatedEnv });
    const result = restorePayload({ payloadRoot: payload, target: restored });
    assert.deepEqual(result.statusContract, manifest.expectedStatus);
    assert.equal(result.status, manifest.originalStatus);
    assert.equal(fs.readFileSync(path.join(restored, 'base.txt'), 'utf8').replace(/\r\n/g, '\n'), 'staged\nunstaged\n');
    assert.equal(fs.readFileSync(path.join(restored, 'notes', 'untracked.txt'), 'utf8'), 'local work\n');
    const staged = String(run('git', ['diff', '--cached', '--', 'base.txt'], { cwd: restored }).stdout);
    assert.match(staged, /\+staged/);
});

test('backup refreshes timestamp-only Git index changes before recording status', (t) => {
    const root = tempDir('machine-racy-clean-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source');
    fs.mkdirSync(source, { recursive: true });
    run('git', ['init', '-b', 'main'], { cwd: source });
    run('git', ['config', 'user.email', 'racy-clean-test@example.invalid'], { cwd: source });
    run('git', ['config', 'user.name', 'Racy Clean Test'], { cwd: source });
    write(path.join(source, 'same.txt'), 'same content\n');
    run('git', ['add', 'same.txt'], { cwd: source });
    run('git', ['commit', '-m', 'baseline'], { cwd: source });

    const filePath = path.join(source, 'same.txt');
    const original = fs.statSync(filePath);
    fs.utimesSync(filePath, original.atime, new Date(original.mtimeMs + 10000));
    const listPaths = () => Buffer.from(run('git', ['diff-files', '--name-only', '-z'], {
        cwd: source,
        encoding: null
    }).stdout || Buffer.alloc(0)).toString('utf8').split('\0').filter(Boolean);
    assert.deepEqual(listPaths(), ['same.txt']);

    assert.deepEqual(refreshRacyCleanEntries(source), ['same.txt']);
    assert.deepEqual(listPaths(), []);
    assert.equal(String(run('git', ['diff', '--cached'], { cwd: source }).stdout), '');
});

test('machine-local untracked cache and log files are excluded from the payload contract', (t) => {
    const root = tempDir('machine-exclusions-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source');
    const payload = path.join(root, 'payload');
    fs.mkdirSync(source, { recursive: true });
    run('git', ['init', '-b', 'main'], { cwd: source });
    run('git', ['config', 'user.email', 'exclusion-test@example.invalid'], { cwd: source });
    run('git', ['config', 'user.name', 'Exclusion Test'], { cwd: source });
    write(path.join(source, 'tracked.txt'), 'baseline\n');
    run('git', ['add', 'tracked.txt'], { cwd: source });
    run('git', ['commit', '-m', 'baseline'], { cwd: source });
    write(path.join(source, 'cache', 'runtime.log'), 'machine local\n');
    const manifest = createBackupPayload({
        repoRoot: source,
        payloadRoot: payload,
        env: { ...process.env, CODEX_HOME: path.join(root, 'codex'), APPDATA: path.join(root, 'appdata'), LOCALAPPDATA: path.join(root, 'local'), WINDIR: path.join(root, 'windows') }
    });
    assert.deepEqual(manifest.untracked, []);
    assert.deepEqual(manifest.expectedStatus.untracked, []);
    assert.equal(fs.existsSync(path.join(payload, 'untracked', 'cache', 'runtime.log')), false);
});

test('tracked machine-local deletions round-trip while live cache changes remain blocked', (t) => {
    const root = tempDir('machine-tracked-exclusions-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source');
    const payload = path.join(root, 'payload');
    const restored = path.join(root, 'restored');
    fs.mkdirSync(source, { recursive: true });
    run('git', ['init', '-b', 'main'], { cwd: source });
    run('git', ['config', 'user.email', 'tracked-exclusion-test@example.invalid'], { cwd: source });
    run('git', ['config', 'user.name', 'Tracked Exclusion Test'], { cwd: source });
    write(path.join(source, '.gitignore'), '.nx/\n');
    write(path.join(source, '.nx', 'workspace-data', 'file-map.json'), '{"generated":true}\n');
    run('git', ['add', '.gitignore'], { cwd: source });
    run('git', ['add', '-f', '.nx/workspace-data/file-map.json'], { cwd: source });
    run('git', ['commit', '-m', 'tracked cache baseline'], { cwd: source });
    run('git', ['rm', '--cached', '.nx/workspace-data/file-map.json'], { cwd: source });

    const isolatedEnv = {
        ...process.env,
        CODEX_HOME: path.join(root, 'codex'),
        APPDATA: path.join(root, 'appdata'),
        LOCALAPPDATA: path.join(root, 'localappdata'),
        WINDIR: path.join(root, 'windows')
    };
    const manifest = createBackupPayload({ repoRoot: source, payloadRoot: payload, env: isolatedEnv });
    assert.deepEqual(manifest.excludedTrackedDeletions, ['.nx/workspace-data/file-map.json']);
    assert.equal(fs.existsSync(path.join(source, '.nx', 'workspace-data', 'file-map.json')), true);
    const result = restorePayload({ payloadRoot: payload, target: restored });
    assert.equal(result.status, manifest.originalStatus);
    assert.equal(fs.existsSync(path.join(restored, '.nx', 'workspace-data', 'file-map.json')), false);

    run('git', ['reset', '--hard', 'HEAD'], { cwd: source });
    write(path.join(source, '.nx', 'workspace-data', 'file-map.json'), '{"generated":false}\n');
    assert.throws(
        () => createBackupPayload({ repoRoot: source, payloadRoot: path.join(root, 'unsafe-payload'), env: isolatedEnv }),
        /added or modified/
    );
});

test('large Git patches stream to disk without exhausting the child-process buffer', (t) => {
    const root = tempDir('machine-large-patch-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source');
    const payload = path.join(root, 'payload');
    fs.mkdirSync(source, { recursive: true });
    run('git', ['init', '-b', 'main'], { cwd: source });
    run('git', ['config', 'user.email', 'large-patch-test@example.invalid'], { cwd: source });
    run('git', ['config', 'user.name', 'Large Patch Test'], { cwd: source });
    write(path.join(source, 'large.txt'), 'before\n'.repeat(200000));
    run('git', ['add', 'large.txt'], { cwd: source });
    run('git', ['commit', '-m', 'large patch baseline'], { cwd: source });
    write(path.join(source, 'large.txt'), 'after\n'.repeat(200000));

    const manifest = createBackupPayload({
        repoRoot: source,
        payloadRoot: payload,
        env: { ...process.env, CODEX_HOME: path.join(root, 'codex'), APPDATA: path.join(root, 'appdata'), LOCALAPPDATA: path.join(root, 'local'), WINDIR: path.join(root, 'windows') }
    });
    assert.ok(manifest.unstagedPatchBytes > 1024 * 1024);
});

let availableSevenZip = null;
try {
    availableSevenZip = find7Zip();
} catch (_error) {
    availableSevenZip = null;
}

test('AES-256 archive can be tested, extracted, and restored', { skip: !availableSevenZip }, (t) => {
    const root = tempDir('machine-archive-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const source = path.join(root, 'source');
    const destination = path.join(root, 'archives');
    const restored = path.join(root, 'restored');
    fs.mkdirSync(source, { recursive: true });
    run('git', ['init', '-b', 'main'], { cwd: source });
    run('git', ['config', 'user.email', 'archive-test@example.invalid'], { cwd: source });
    run('git', ['config', 'user.name', 'Archive Test'], { cwd: source });
    write(path.join(source, 'tracked.txt'), 'baseline\n');
    run('git', ['add', 'tracked.txt'], { cwd: source });
    run('git', ['commit', '-m', 'baseline'], { cwd: source });
    write(path.join(source, 'tracked.txt'), 'changed\n');
    write(path.join(source, 'untracked.txt'), 'local\n');
    const testPassword = ['machine', 'migration', 'test', 'only'].join('-');
    const isolatedEnv = {
        ...process.env,
        ProgramFiles: path.join(root, 'program-files'),
        APPDATA: path.join(root, 'appdata'),
        LOCALAPPDATA: path.join(root, 'localappdata'),
        WINDIR: path.join(root, 'windows'),
        CODEX_HOME: path.join(root, 'codex'),
        MACHINE_BACKUP_PASSWORD: testPassword
    };
    const backup = createEncryptedArchive({
        repoRoot: source,
        destination,
        sevenZip: availableSevenZip,
        env: isolatedEnv
    });
    assert.ok(fs.existsSync(backup.archivePath));
    assert.ok(fs.existsSync(`${backup.archivePath}.sha256`));
    const result = restoreArchive({
        archive: backup.archivePath,
        target: restored,
        sevenZip: availableSevenZip,
        env: isolatedEnv
    });
    assert.deepEqual(result.statusContract, backup.manifest.expectedStatus);
    assert.equal(result.status, backup.manifest.originalStatus);
    fs.appendFileSync(backup.archivePath, 'tamper', 'utf8');
    assert.throws(() => verifyChecksumSidecar(backup.archivePath), /SHA-256 mismatch/);
});

test('live-link installer exposes six manifests and supports dry-run arguments', () => {
    const variants = CEP_APPS.flatMap((app) => app.variants);
    assert.equal(variants.length, 6);
    variants.forEach((variant) => {
        const xml = buildManifestXml(variant.manifest);
        assert.match(xml, /<ExtensionManifest/);
        assert.match(xml, new RegExp(variant.manifest.extensionId.replace(/\./g, '\\.')));
    });
    assert.equal(parseLiveLinkArgs(['--dry-run', '--extensions-root', 'C:\\temp\\cep']).dryRun, true);
});

test('live-link installer is idempotent with real temporary junctions on Windows', { skip: process.platform !== 'win32' }, (t) => {
    const root = tempDir('live-links-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const fixtureRepo = path.join(root, 'repo');
    const extensionsRoot = path.join(root, 'extensions');
    CEP_APPS.forEach((app) => {
        const sourceDir = path.join(fixtureRepo, path.relative(REPO_ROOT, app.sourceDir));
        (app.linkDirs || []).forEach((entry) => fs.mkdirSync(path.join(sourceDir, entry), { recursive: true }));
        (app.linkFiles || []).forEach((entry) => write(path.join(sourceDir, entry), `fixture ${entry}\n`));
    });
    const args = [path.join(REPO_ROOT, 'scripts', 'install_cep_live_links.cjs'), '--repo-root', fixtureRepo, '--extensions-root', extensionsRoot];
    run(process.execPath, args, { cwd: REPO_ROOT });
    const manifestPath = path.join(extensionsRoot, 'com.dinhson.toolkit.panel.dev', 'CSXS', 'manifest.xml');
    const firstManifest = fs.readFileSync(manifestPath, 'utf8');
    run(process.execPath, args, { cwd: REPO_ROOT });
    assert.equal(fs.readFileSync(manifestPath, 'utf8'), firstManifest);
    const wrapperNames = CEP_APPS.flatMap((app) => app.variants.map((variant) => variant.extensionDir)).sort();
    assert.deepEqual(fs.readdirSync(extensionsRoot).sort(), wrapperNames);
    const toolkitTarget = path.join(fixtureRepo, 'toolkit-cep', 'cep');
    const toolkitLink = path.join(extensionsRoot, 'com.dinhson.toolkit', 'app');
    assert.equal(fs.realpathSync.native(toolkitLink).toLowerCase(), fs.realpathSync.native(toolkitTarget).toLowerCase());
});
