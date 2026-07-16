#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    assertEmptyTarget,
    copyPath,
    find7Zip,
    parseCliArgs,
    run,
    sha256File
} = require('./machine_migration_common.cjs');

function applyPatchIfPresent(patchPath, targetRoot, index) {
    if (!fs.existsSync(patchPath) || fs.statSync(patchPath).size === 0) {
        return;
    }
    const args = ['apply', '--binary'];
    if (index) {
        args.push('--index');
    }
    args.push(patchPath);
    run('git', args, { cwd: targetRoot });
}

function splitNullList(buffer) {
    return Buffer.from(buffer || Buffer.alloc(0)).toString('utf8').split('\0').filter(Boolean).sort();
}

function copyPayloadCategory(payloadRoot, category, targetRoot, relativePaths) {
    (relativePaths || []).forEach((relativePath) => {
        const normalized = String(relativePath).replace(/\\/g, '/');
        if (normalized === '.git' || normalized.startsWith('.git/')) {
            throw new Error(`Refusing to restore Git metadata from payload category ${category}: ${relativePath}`);
        }
        const sourcePath = path.join(payloadRoot, category, relativePath);
        const targetPath = path.resolve(targetRoot, relativePath);
        if (!targetPath.startsWith(`${path.resolve(targetRoot)}${path.sep}`)) {
            throw new Error(`Unsafe restore path: ${relativePath}`);
        }
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Backup payload is missing ${category}/${relativePath}.`);
        }
        copyPath(sourcePath, targetPath);
    });
}

function verifyChecksumSidecar(archivePath) {
    const checksumPath = `${archivePath}.sha256`;
    if (!fs.existsSync(checksumPath)) {
        throw new Error(`Checksum sidecar not found: ${checksumPath}`);
    }
    const match = fs.readFileSync(checksumPath, 'utf8').match(/^([A-Fa-f0-9]{64})(?:\s|$)/);
    if (!match) {
        throw new Error(`Checksum sidecar is malformed: ${checksumPath}`);
    }
    const expected = match[1].toUpperCase();
    const actual = sha256File(archivePath);
    if (actual !== expected) {
        throw new Error(`Archive SHA-256 mismatch. Expected ${expected}, got ${actual}.`);
    }
    return actual;
}

function restorePayload(options = {}) {
    const payloadRoot = path.resolve(options.payloadRoot);
    const targetRoot = path.resolve(options.target);
    assertEmptyTarget(targetRoot);
    const manifestPath = path.join(payloadRoot, 'manifest.json');
    const bundlePath = path.join(payloadRoot, 'repo.bundle');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(bundlePath)) {
        throw new Error('Archive does not contain a valid machine-migration payload.');
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.version !== 1 || manifest.credentialsIncluded !== false) {
        throw new Error('Unsupported or unsafe backup manifest.');
    }

    const cloneArgs = ['clone'];
    if (manifest.branch) {
        cloneArgs.push('--branch', manifest.branch);
    }
    cloneArgs.push(bundlePath, targetRoot);
    run('git', cloneArgs, { cwd: path.dirname(targetRoot) });
    if (!manifest.branch) {
        run('git', ['checkout', '--detach', manifest.head], { cwd: targetRoot });
    }
    applyPatchIfPresent(path.join(payloadRoot, 'staged.patch'), targetRoot, true);
    applyPatchIfPresent(path.join(payloadRoot, 'unstaged.patch'), targetRoot, false);
    copyPayloadCategory(payloadRoot, 'untracked', targetRoot, manifest.untracked);
    copyPayloadCategory(payloadRoot, 'assets', targetRoot, manifest.assets);

    const actualStatus = String(run('git', ['status', '--porcelain=v1', '-uall'], { cwd: targetRoot }).stdout || '').trimEnd();
    const actualTrackedStatus = String(run('git', ['status', '--porcelain=v1', '--untracked-files=no'], { cwd: targetRoot }).stdout || '').trimEnd();
    const actualUntrackedResult = run('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: targetRoot, encoding: null });
    const actualStatusContract = {
        tracked: actualTrackedStatus,
        untracked: splitNullList(actualUntrackedResult.stdout)
    };
    if (JSON.stringify(actualStatusContract) !== JSON.stringify(manifest.expectedStatus)) {
        throw new Error(`Restored git status does not match the backup manifest.\nExpected:\n${JSON.stringify(manifest.expectedStatus, null, 2)}\nActual:\n${JSON.stringify(actualStatusContract, null, 2)}`);
    }
    return { targetRoot, manifest, status: actualStatus, statusContract: actualStatusContract };
}

function restoreArchive(options = {}) {
    const archivePath = path.resolve(options.archive);
    const targetRoot = path.resolve(options.target);
    const env = options.env || process.env;
    if (!fs.existsSync(archivePath)) {
        throw new Error(`Archive not found: ${archivePath}`);
    }
    verifyChecksumSidecar(archivePath);
    assertEmptyTarget(targetRoot);
    const sevenZip = find7Zip({ explicitPath: options.sevenZip });
    const extractionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-migration-restore-'));
    const password = env.MACHINE_BACKUP_PASSWORD ? `-p${env.MACHINE_BACKUP_PASSWORD}` : '-p';
    try {
        run(sevenZip, ['t', password, archivePath], { env, stdio: 'inherit' });
        run(sevenZip, ['x', '-y', password, `-o${extractionRoot}`, archivePath], { env, stdio: 'inherit' });
        return restorePayload({ payloadRoot: extractionRoot, target: targetRoot });
    } finally {
        fs.rmSync(extractionRoot, { recursive: true, force: true });
    }
}

function main() {
    try {
        const args = parseCliArgs(process.argv.slice(2), {
            value: ['archive', 'target', 'seven-zip']
        });
        if (!args.archive || !args.target) {
            throw new Error('--archive and --target are required.');
        }
        const result = restoreArchive({ archive: args.archive, target: args.target, sevenZip: args['seven-zip'] });
        console.log(`Restore verified: ${result.targetRoot}`);
        console.log('Sign in to Codex and Adobe again; credentials were intentionally not restored.');
    } catch (error) {
        console.error(`[restore:machine] ${error.message}`);
        process.exitCode = 2;
    }
}

module.exports = {
    applyPatchIfPresent,
    restoreArchive,
    restorePayload,
    verifyChecksumSidecar
};

if (require.main === module) {
    main();
}
