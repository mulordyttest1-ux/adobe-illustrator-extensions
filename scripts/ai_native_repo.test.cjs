const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');

const { toPowerShellArguments } = require('./devkit_proxy.cjs');
const { buildPowerShellArgs } = require('./ensure_devkit.cjs');
const {
    SIZE_BUDGET_BYTES,
    collectRepoDoctorReport,
    readDevkitLock
} = require('./repo_doctor.cjs');

function tempDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(root, relativePath, content = 'fixture\n') {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}

function initProductFixture(root, extraBytes = 0) {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    for (const file of [
        'package-lock.json',
        'AGENTS.md',
        '.specify/integration.json',
        '.agents/skills/speckit-implement/SKILL.md',
        'NEW_MACHINE_PROMPT.txt'
    ]) write(root, file);
    write(root, 'devkit.lock.json', `${JSON.stringify({
        schemaVersion: 1,
        repository: 'owner/adobe-illustrator-devkit',
        release: 'v1.2.3',
        commit: 'a'.repeat(40),
        siblingDirectory: 'adobe-illustrator-devkit',
        productContractVersion: 1
    }, null, 2)}\n`);
    if (extraBytes > 0) fs.writeFileSync(path.join(root, 'budget.bin'), Buffer.alloc(extraBytes));
    fs.mkdirSync(path.join(root, 'node_modules'));
    execFileSync('git', ['add', '.'], { cwd: root });
}

function fakeToolRun(command) {
    if (command === 'npm') return { status: 0, stdout: '11.6.2\n' };
    if (command === 'git') return { status: 0, stdout: 'git version 2.53.0\n' };
    throw new Error(`Unexpected command: ${command}`);
}

test('devkit lock and repository doctor expose the stable version-1 contract', (t) => {
    const root = tempDir('ai-native-doctor-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    initProductFixture(root);

    assert.equal(readDevkitLock(root).release, 'v1.2.3');
    const report = collectRepoDoctorReport({ repoRoot: root }, {
        nodeVersion: 'v24.13.0',
        run: fakeToolRun
    });
    assert.equal(report.version, 1);
    assert.equal(report.status, 'PASS');
    assert.deepEqual(Object.keys(report).sort(), ['checks', 'devkit', 'product', 'status', 'version']);
    assert.ok(report.checks.every((check) => (
        ['id', 'scope', 'status', 'severity', 'message', 'remediation'].every((key) => Object.hasOwn(check, key))
    )));

    const lockPath = path.join(root, 'devkit.lock.json');
    const invalid = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    invalid.siblingDirectory = '..\\outside';
    fs.writeFileSync(lockPath, JSON.stringify(invalid));
    assert.throws(() => readDevkitLock(root), /invalid schema/);
});

test('repository doctor enforces the 10 MiB clean-checkout budget', (t) => {
    const root = tempDir('ai-native-budget-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    initProductFixture(root, SIZE_BUDGET_BYTES + 1);
    const report = collectRepoDoctorReport({ repoRoot: root, phase: 'preflight' }, {
        nodeVersion: 'v24.13.0',
        run: fakeToolRun
    });
    assert.equal(report.status, 'FAIL');
    assert.equal(report.checks.find((check) => check.id === 'repo.size-budget').status, 'FAIL');
});

test('Node wrappers preserve PowerShell flags and inline values', () => {
    const ensureArgs = buildPowerShellArgs({
        lockFile: 'fixture-lock.json',
        target: 'fixture-devkit',
        json: true,
        dryRun: true
    });
    assert.ok(ensureArgs.includes('-LockFile'));
    assert.ok(ensureArgs.includes('-TargetPath'));
    assert.ok(ensureArgs.includes('-Json'));
    assert.ok(ensureArgs.includes('-DryRun'));
    assert.deepEqual(
        toPowerShellArguments(['--dry-run', '--destination=C:\\Backups', '--seven-zip', 'C:\\7z.exe']),
        ['-DryRun', '-Destination', 'C:\\Backups', '-SevenZip', 'C:\\7z.exe']
    );
});

test('native command capture keeps successful stderr as output instead of a terminating error', {
    skip: process.platform !== 'win32'
}, (t) => {
    const root = tempDir('native-capture-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    execFileSync('git', ['config', 'user.name', 'Native Capture Test'], { cwd: root });
    execFileSync('git', ['config', 'user.email', 'native-capture@example.invalid'], { cwd: root });
    write(root, 'fixture.txt');
    execFileSync('git', ['add', 'fixture.txt'], { cwd: root });
    execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const probePath = path.join(root, 'probe.ps1');
    const helperPath = path.join(__dirname, 'native_command.ps1').replace(/'/g, "''");
    const repoPath = root.replace(/'/g, "''");
    fs.writeFileSync(probePath, [
        "$ErrorActionPreference = 'Stop'",
        `. '${helperPath}'`,
        `$result = Invoke-NativeCaptured -FilePath 'git' -Arguments @('-C', '${repoPath}', 'switch', '--detach', '${commit}')`,
        '$result | ConvertTo-Json -Depth 3'
    ].join('\n'), 'utf8');
    const result = spawnSync('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', probePath
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ExitCode, 0);
    assert.match(JSON.stringify(report.Output), /HEAD is now at/);
});

test('ensure-devkit handles missing, pinned, wrong-pin, and dirty targets', {
    skip: process.platform !== 'win32'
}, (t) => {
    const root = tempDir('ensure-devkit-');
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const target = path.join(root, 'devkit');
    const missing = path.join(root, 'missing');
    const lockPath = path.join(root, 'devkit.lock.json');
    const scriptPath = path.join(__dirname, 'ensure-devkit.ps1');
    const repository = 'owner/adobe-illustrator-devkit';

    fs.mkdirSync(target);
    execFileSync('git', ['init', '--quiet'], { cwd: target });
    execFileSync('git', ['config', 'user.name', 'Contract Test'], { cwd: target });
    execFileSync('git', ['config', 'user.email', 'contract@example.invalid'], { cwd: target });
    write(target, 'README.md');
    execFileSync('git', ['add', 'README.md'], { cwd: target });
    execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: target });
    execFileSync('git', ['remote', 'add', 'origin', `https://github.com/${repository}.git`], { cwd: target });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: target, encoding: 'utf8' }).trim();
    execFileSync('git', ['tag', 'v1.2.3'], { cwd: target });

    const saveLock = (sha) => fs.writeFileSync(lockPath, `${JSON.stringify({
        schemaVersion: 1,
        repository,
        release: 'v1.2.3',
        commit: sha,
        siblingDirectory: 'adobe-illustrator-devkit',
        productContractVersion: 1
    })}\n`);
    const invoke = (pathValue, dryRun = false) => spawnSync('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath,
        '-LockFile', lockPath, '-TargetPath', pathValue, '-Json', ...(dryRun ? ['-DryRun'] : [])
    ], { encoding: 'utf8' });

    saveLock(commit);
    let result = invoke(missing, true);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).status, 'WARN');

    result = invoke(target);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).status, 'PASS');

    saveLock('b'.repeat(40));
    result = invoke(target, true);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).status, 'WARN');

    saveLock(commit);
    write(target, 'local.txt', 'dirty\n');
    result = invoke(target);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).status, 'FAIL');
    assert.match(JSON.parse(result.stdout).message, /local changes/);
});
