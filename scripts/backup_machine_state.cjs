#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    CONTRACT_VERSION,
    REPO_ROOT,
    copyPath,
    ensureDir,
    find7Zip,
    isExcludedMachineDataPath,
    isSensitivePath,
    listFilesRecursive,
    parseCliArgs,
    run,
    scanTextForSecrets,
    sha256File,
    timestamp,
    writeJson
} = require('./machine_migration_common.cjs');

const LOCAL_ASSET_ALLOWLIST = [
    path.join('symbol-cep', 'cep', 'wedding suite print template.ai')
];

function gitOutput(repoRoot, args, options = {}) {
    const result = run('git', args, { cwd: repoRoot, encoding: options.binary ? null : 'utf8' });
    return options.binary ? Buffer.from(result.stdout || Buffer.alloc(0)) : String(result.stdout || '').trimEnd();
}

function splitNullList(buffer) {
    return Buffer.from(buffer || Buffer.alloc(0)).toString('utf8').split('\0').filter(Boolean);
}

function gitPathList(repoRoot, args) {
    return splitNullList(gitOutput(repoRoot, [...args, '-z'], { binary: true }));
}

function refreshRacyCleanEntries(repoRoot) {
    const statDirtyPaths = gitPathList(repoRoot, ['diff-files', '--name-only']);
    if (statDirtyPaths.length === 0) {
        return [];
    }

    const contentChangedPaths = new Set(gitPathList(repoRoot, ['diff', '--name-only']));
    const racyCleanPaths = statDirtyPaths.filter((relativePath) => !contentChangedPaths.has(relativePath));
    const chunkSize = 100;
    for (let index = 0; index < racyCleanPaths.length; index += chunkSize) {
        run('git', ['add', '--refresh', '--', ...racyCleanPaths.slice(index, index + chunkSize)], { cwd: repoRoot });
    }
    return racyCleanPaths;
}

function assertSafeRelativePath(relativePath) {
    if (isSensitivePath(relativePath)) {
        throw new Error(`Refusing to back up sensitive-looking path: ${relativePath}`);
    }
}

function scanBufferForSecrets(buffer, label) {
    if (!buffer || buffer.length === 0) {
        return;
    }
    const texts = [buffer.toString('utf8')];
    if (buffer.includes(0)) {
        texts.push(buffer.toString('utf16le'));
    }
    const matches = [...new Set(texts.flatMap((text) => scanTextForSecrets(text)))];
    if (matches.length > 0) {
        throw new Error(`Refusing to back up ${label}; detected ${matches.join(', ')}.`);
    }
}

function scanFileForSecrets(filePath, relativePath) {
    const descriptor = fs.openSync(filePath, 'r');
    const chunk = Buffer.alloc(1024 * 1024);
    let carry = Buffer.alloc(0);
    try {
        while (true) {
            const bytesRead = fs.readSync(descriptor, chunk, 0, chunk.length, null);
            if (bytesRead === 0) {
                break;
            }
            const current = Buffer.concat([carry, chunk.subarray(0, bytesRead)]);
            scanBufferForSecrets(current, relativePath);
            carry = current.subarray(Math.max(0, current.length - 2048));
        }
    } finally {
        fs.closeSync(descriptor);
    }
}

function assertSafeFile(filePath, relativePath) {
    assertSafeRelativePath(relativePath);
    scanFileForSecrets(filePath, relativePath);
}

function collectToolInventory(repoRoot) {
    const version = (command, args) => {
        const result = run(command, args, { cwd: repoRoot, allowFailure: true });
        return result.status === 0 ? String(result.stdout || '').trim() : null;
    };
    return {
        capturedAt: new Date().toISOString(),
        platform: `${os.platform()} ${os.release()} ${os.arch()}`,
        node: process.version,
        npm: version('npm', ['--version']),
        git: version('git', ['--version']),
        sevenZip: version('7z', ['i'])
    };
}

function collectAdobeInventory(env) {
    const programFiles = env.ProgramFiles || env.PROGRAMFILES || 'C:\\Program Files';
    const illustrator = [2025, 2026].map((year) => {
        const installPath = path.join(programFiles, 'Adobe', `Adobe Illustrator ${year}`);
        return { year, installed: fs.existsSync(installPath), installPath };
    });
    const preferencesRoot = path.join(env.APPDATA || '', 'Adobe', 'Adobe Illustrator');
    const preferenceNames = fs.existsSync(preferencesRoot)
        ? listFilesRecursive(preferencesRoot).map((entry) => path.relative(preferencesRoot, entry).replace(/\\/g, '/'))
            .filter((entry) => /(action|workspace|keyboard|shortcut|preset)/i.test(entry))
        : [];
    return { illustrator, preferenceInventory: preferenceNames };
}

function collectFontInventory(env) {
    const roots = [
        path.join(env.WINDIR || 'C:\\Windows', 'Fonts'),
        path.join(env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'Fonts')
    ];
    const fonts = [];
    roots.forEach((root) => {
        if (!root || !fs.existsSync(root)) {
            return;
        }
        fs.readdirSync(root).forEach((entry) => fonts.push(entry));
    });
    return { capturedAt: new Date().toISOString(), fonts: [...new Set(fonts)].sort() };
}

function collectCodexInventory(env) {
    const codexHome = env.CODEX_HOME || path.join(os.homedir(), '.codex');
    const skillsRoot = path.join(codexHome, 'skills');
    const skills = fs.existsSync(skillsRoot)
        ? fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => entry.name).sort()
        : [];
    const configPath = path.join(codexHome, 'config.toml');
    const pluginIds = [];
    if (fs.existsSync(configPath)) {
        const configText = fs.readFileSync(configPath, 'utf8');
        const pattern = /^\[plugins\."([^"]+)"\]\s*$/gm;
        let match;
        while ((match = pattern.exec(configText)) !== null) {
            pluginIds.push(match[1]);
        }
    }
    return { codexHome, skills, configuredPlugins: pluginIds.sort(), credentialsIncluded: false };
}

function writePatch(repoRoot, targetPath, args) {
    ensureDir(path.dirname(targetPath));
    const descriptor = fs.openSync(targetPath, 'w');
    try {
        run('git', args, {
            cwd: repoRoot,
            encoding: null,
            stdio: ['ignore', descriptor, 'pipe']
        });
    } finally {
        fs.closeSync(descriptor);
    }
    scanFileForSecrets(targetPath, path.basename(targetPath));
    return fs.statSync(targetPath).size;
}

function copySafePaths(repoRoot, payloadRoot, category, relativePaths) {
    const copied = [];
    relativePaths.forEach((relativePath) => {
        assertSafeRelativePath(relativePath);
        const sourcePath = path.resolve(repoRoot, relativePath);
        if (!sourcePath.startsWith(`${path.resolve(repoRoot)}${path.sep}`) || !fs.existsSync(sourcePath)) {
            throw new Error(`Backup path is outside the repository or missing: ${relativePath}`);
        }
        if (fs.statSync(sourcePath).isDirectory()) {
            listFilesRecursive(sourcePath).forEach((filePath) => {
                const nestedRelative = path.relative(repoRoot, filePath);
                assertSafeFile(filePath, nestedRelative);
            });
        } else {
            assertSafeFile(sourcePath, relativePath);
        }
        copyPath(sourcePath, path.join(payloadRoot, category, relativePath));
        copied.push(relativePath.replace(/\\/g, '/'));
    });
    return copied;
}

function createBackupPayload(options = {}) {
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const payloadRoot = path.resolve(options.payloadRoot);
    const env = options.env || process.env;
    ensureDir(payloadRoot);

    // A timestamp-only index mismatch can make `git status` report a change
    // that `git diff` correctly omits. Refresh only those content-identical
    // entries so the manifest describes what the patches can actually restore.
    refreshRacyCleanEntries(repoRoot);

    const trackedChangedPaths = [
        ...gitPathList(repoRoot, ['diff', '--name-only', '--cached']),
        ...gitPathList(repoRoot, ['diff', '--name-only'])
    ];
    const untrackedCandidates = gitPathList(repoRoot, ['ls-files', '--others', '--exclude-standard']);
    [...new Set([...trackedChangedPaths, ...untrackedCandidates])].forEach(assertSafeRelativePath);
    const excludedTrackedChanges = [...new Set(trackedChangedPaths)].filter((relativePath) => isExcludedMachineDataPath(relativePath));
    const trackedDeletionPaths = new Set([
        ...gitPathList(repoRoot, ['diff', '--name-only', '--diff-filter=D', '--cached']),
        ...gitPathList(repoRoot, ['diff', '--name-only', '--diff-filter=D'])
    ]);
    const unsafeExcludedTrackedChanges = excludedTrackedChanges.filter((relativePath) => !trackedDeletionPaths.has(relativePath));
    if (unsafeExcludedTrackedChanges.length > 0) {
        throw new Error(`Machine-local cache/log/session/SQLite paths are added or modified and cannot be included safely: ${unsafeExcludedTrackedChanges.join(', ')}`);
    }
    const excludedTrackedDeletions = excludedTrackedChanges
        .filter((relativePath) => trackedDeletionPaths.has(relativePath))
        .map((relativePath) => relativePath.replace(/\\/g, '/'))
        .sort();

    const bundlePath = path.join(payloadRoot, 'repo.bundle');
    run('git', ['bundle', 'create', bundlePath, '--all'], { cwd: repoRoot });
    run('git', ['bundle', 'verify', bundlePath], { cwd: repoRoot });

    const stagedBytes = writePatch(repoRoot, path.join(payloadRoot, 'staged.patch'), ['diff', '--binary', '--full-index', '--cached']);
    const unstagedBytes = writePatch(repoRoot, path.join(payloadRoot, 'unstaged.patch'), ['diff', '--binary', '--full-index']);
    const untracked = untrackedCandidates
        .filter((relativePath) => !isExcludedMachineDataPath(relativePath));
    const copiedUntracked = copySafePaths(repoRoot, payloadRoot, 'untracked', untracked);
    const assets = LOCAL_ASSET_ALLOWLIST.filter((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
    const copiedAssets = copySafePaths(repoRoot, payloadRoot, 'assets', assets);

    const inventoryRoot = path.join(payloadRoot, 'inventories');
    writeJson(path.join(inventoryRoot, 'tools.json'), collectToolInventory(repoRoot));
    writeJson(path.join(inventoryRoot, 'adobe.json'), collectAdobeInventory(env));
    writeJson(path.join(inventoryRoot, 'fonts.json'), collectFontInventory(env));
    writeJson(path.join(inventoryRoot, 'codex.json'), collectCodexInventory(env));

    const head = gitOutput(repoRoot, ['rev-parse', 'HEAD']);
    const branchResult = run('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd: repoRoot, allowFailure: true });
    const branch = branchResult.status === 0 ? String(branchResult.stdout || '').trim() : null;
    const originalStatus = gitOutput(repoRoot, ['status', '--porcelain=v1', '-uall']);
    const trackedStatus = gitOutput(repoRoot, ['status', '--porcelain=v1', '--untracked-files=no']);
    const manifest = {
        version: CONTRACT_VERSION,
        createdAt: new Date().toISOString(),
        head,
        branch,
        originalStatus,
        expectedStatus: {
            tracked: trackedStatus,
            untracked: [...copiedUntracked].sort()
        },
        stagedPatchBytes: stagedBytes,
        unstagedPatchBytes: unstagedBytes,
        excludedTrackedDeletions,
        untracked: copiedUntracked,
        assets: copiedAssets,
        credentialsIncluded: false
    };
    writeJson(path.join(payloadRoot, 'manifest.json'), manifest);
    return manifest;
}

function passwordArgs(env) {
    return env.MACHINE_BACKUP_PASSWORD ? [`-p${env.MACHINE_BACKUP_PASSWORD}`] : ['-p'];
}

function createEncryptedArchive(options = {}) {
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const destination = path.resolve(options.destination);
    const env = options.env || process.env;
    ensureDir(destination);
    const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-migration-backup-'));
    const payloadRoot = path.join(stagingRoot, 'machine-migration-payload');
    const archivePath = path.join(destination, `${path.basename(repoRoot)}-${timestamp()}.7z`);
    const partialArchivePath = `${archivePath}.partial`;
    const sevenZip = find7Zip({ explicitPath: options.sevenZip });

    if (fs.existsSync(archivePath) || fs.existsSync(partialArchivePath)) {
        throw new Error(`Backup destination already exists: ${archivePath}`);
    }

    try {
        const manifest = createBackupPayload({ repoRoot, payloadRoot, env });
        run(sevenZip, ['a', '-t7z', '-mhe=on', '-m0=lzma2', ...passwordArgs(env), partialArchivePath, '.'], {
            cwd: payloadRoot,
            env,
            stdio: 'inherit'
        });
        run(sevenZip, ['t', ...passwordArgs(env), partialArchivePath], { env, stdio: 'inherit' });
        const checksum = sha256File(partialArchivePath);
        fs.renameSync(partialArchivePath, archivePath);
        fs.writeFileSync(`${archivePath}.sha256`, `${checksum}  ${path.basename(archivePath)}\n`, 'utf8');
        return { archivePath, checksum, manifest };
    } finally {
        if (fs.existsSync(partialArchivePath)) {
            fs.rmSync(partialArchivePath, { force: true });
        }
        fs.rmSync(stagingRoot, { recursive: true, force: true });
    }
}

function main() {
    try {
        const args = parseCliArgs(process.argv.slice(2), {
            value: ['destination', 'repo-root', 'seven-zip']
        });
        if (!args.destination) {
            throw new Error('--destination is required.');
        }
        const result = createEncryptedArchive({
            destination: args.destination,
            repoRoot: args['repo-root'],
            sevenZip: args['seven-zip']
        });
        console.log(`Backup verified: ${result.archivePath}`);
        console.log(`SHA-256: ${result.checksum}`);
        console.log('Credentials, sessions, caches, logs, SQLite files, and .env files were not restored or copied.');
    } catch (error) {
        console.error(`[backup:machine] ${error.message}`);
        process.exitCode = 2;
    }
}

module.exports = {
    LOCAL_ASSET_ALLOWLIST,
    assertSafeFile,
    collectAdobeInventory,
    collectCodexInventory,
    collectFontInventory,
    createBackupPayload,
    createEncryptedArchive,
    refreshRacyCleanEntries,
    scanBufferForSecrets,
    scanFileForSecrets
};

if (require.main === module) {
    main();
}
