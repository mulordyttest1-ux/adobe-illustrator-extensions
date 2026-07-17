const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { run, find7Zip, scanTextForSecrets } = require('./machine_migration_common.cjs');
const { CEP_APPS, buildManifestXml } = require('./install_cep_live_links.cjs');

const SCHEMA_VERSION = 1;
const MAX_ARCHIVE_BYTES = 15 * 1024 * 1024;
const RELEASE_PREFIX = 'adobe-illustrator-cep-golden-recovery-v';
const EXPECTED_EXTENSION_IDS = [
    'com.dinhson.imposition',
    'com.dinhson.toolkit',
    'com.dinhson.weddingscripter'
];

const RUNTIME_SPECS = [
    {
        key: 'symbol',
        extensionDir: 'com.dinhson.imposition',
        source: 'symbol-cep/cep',
        layout: 'root-linked',
        includes: [
            ['index.html'], ['css'], ['data/presets.json'], ['data/wedding_suite_paper_stocks.json'],
            ['js/bundle.js'], ['js/libs'], ['lib'], ['jsx'], ['wedding suite print template.ai']
        ],
        excludes: new Set(['jsx/debug_host_validation.jsx'])
    },
    {
        key: 'wedding',
        extensionDir: 'com.dinhson.weddingscripter',
        source: 'wedding-cep/cep',
        layout: 'root-linked',
        includes: [
            ['index.html'], ['css'], ['data'], ['js/bundle.js'], ['js/CSInterface.js'], ['js/libs'], ['jsx']
        ],
        excludes: new Set()
    },
    {
        key: 'toolkit',
        extensionDir: 'com.dinhson.toolkit',
        source: 'toolkit-cep/cep',
        layout: 'app-junction',
        includes: [
            ['index.html'], ['css'], ['.generated'], ['js/bundle.js'], ['js/libs'], ['lib'], ['jsx'], ['modules']
        ],
        excludes: new Set()
    }
];

function normalizeRelative(value) {
    const normalized = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
    if (!normalized || path.posix.isAbsolute(normalized) || /^[A-Za-z]:\//u.test(normalized)) {
        throw new Error(`Path must be relative: ${value}`);
    }
    const segments = normalized.split('/');
    if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
        throw new Error(`Unsafe relative path: ${value}`);
    }
    return normalized;
}

function assertSemver(value) {
    const version = String(value || '');
    const pattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u;
    if (!pattern.test(version)) {
        throw new Error(`Invalid SemVer: ${value || '<empty>'}`);
    }
    return version;
}

function parseRecoveryArgs(argv, mode) {
    const result = { json: false };
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (token === '--json') {
            result.json = true;
            continue;
        }
        const allowed = mode === 'package' ? ['--version', '--output'] : ['--archive'];
        if (!allowed.includes(token)) {
            throw new Error(`Unknown argument: ${token}`);
        }
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) {
            throw new Error(`${token} requires a value.`);
        }
        result[token.slice(2)] = value;
        index += 1;
    }
    if (mode === 'package') {
        result.version = assertSemver(result.version);
        if (!result.output) throw new Error('--output is required.');
        result.output = path.resolve(result.output);
    } else {
        if (!result.archive) throw new Error('--archive is required.');
        result.archive = path.resolve(result.archive);
    }
    return result;
}

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toLowerCase();
}

function listFiles(rootPath) {
    const files = [];
    function visit(currentPath) {
        const stat = fs.lstatSync(currentPath);
        if (stat.isSymbolicLink()) {
            throw new Error(`Links are forbidden in recovery payloads: ${currentPath}`);
        }
        if (stat.isDirectory()) {
            fs.readdirSync(currentPath).sort().forEach((name) => visit(path.join(currentPath, name)));
            return;
        }
        if (!stat.isFile()) {
            throw new Error(`Unsupported filesystem entry: ${currentPath}`);
        }
        files.push(currentPath);
    }
    if (fs.existsSync(rootPath)) visit(rootPath);
    return files;
}

function isForbiddenRuntimePath(relativePath) {
    const normalized = normalizeRelative(relativePath).toLowerCase();
    const parts = normalized.split('/');
    const base = parts.at(-1);
    return base === '.debug' || base === 'debug_host_validation.jsx' || base === 'presets.usage.json' ||
        base.startsWith('.env') || base === 'auth.json' ||
        /\.(?:map|log|tmp|bak|sqlite|sqlite3|7z|zip)$/u.test(base) ||
        /(?:^|[._-])test(?:[._-]|$)/u.test(base) ||
        parts.some((part) => ['node_modules', 'debug_scripts', 'scripts', 'cache', 'caches', 'coverage', 'docs'].includes(part));
}

function collectSpecFiles(repoRoot, spec) {
    const sourceRoot = path.join(repoRoot, spec.source);
    const selected = new Map();
    for (const [include] of spec.includes) {
        const relativeInclude = normalizeRelative(include);
        const sourcePath = path.join(sourceRoot, relativeInclude);
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Required runtime path is missing: ${spec.source}/${relativeInclude}`);
        }
        for (const filePath of listFiles(sourcePath)) {
            const relative = normalizeRelative(path.relative(sourceRoot, filePath));
            if (spec.excludes.has(relative)) continue;
            if (relative.endsWith('/README.md') || relative === 'README.md') continue;
            if (isForbiddenRuntimePath(relative)) {
                throw new Error(`Forbidden runtime path selected: ${spec.key}/${relative}`);
            }
            const secretKinds = path.extname(relative).toLowerCase() === '.ai'
                ? []
                : scanTextForSecrets(fs.readFileSync(filePath, 'utf8'));
            if (secretKinds.length > 0) {
                throw new Error(`Secret-like content (${secretKinds.join(', ')}) in runtime file: ${relative}`);
            }
            selected.set(relative, filePath);
        }
    }
    const bundlePath = selected.get('js/bundle.js');
    if (!bundlePath || /sourceMappingURL=/u.test(fs.readFileSync(bundlePath, 'utf8'))) {
        throw new Error(`${spec.key} production bundle is missing or contains a source map reference.`);
    }
    return [...selected.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function productionApp(spec) {
    const app = CEP_APPS.find((candidate) => candidate.key === spec.key);
    if (!app) throw new Error(`Missing CEP application definition: ${spec.key}`);
    const variant = app.variants.find((candidate) => candidate.name === 'work');
    if (!variant) throw new Error(`Missing work variant: ${spec.key}`);
    return { app, variant };
}

function materializeExtensions(repoRoot, extensionsRoot, version) {
    const extensionEntries = [];
    for (const spec of RUNTIME_SPECS) {
        const { variant } = productionApp(spec);
        const extensionRoot = path.join(extensionsRoot, spec.extensionDir);
        const runtimeRoot = spec.layout === 'app-junction' ? path.join(extensionRoot, 'app') : extensionRoot;
        fs.mkdirSync(path.join(extensionRoot, 'CSXS'), { recursive: true });
        for (const [relative, sourcePath] of collectSpecFiles(repoRoot, spec)) {
            const targetPath = path.join(runtimeRoot, relative);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
        }
        const manifest = buildManifestXml({
            ...variant.manifest,
            bundleVersion: version,
            wrapperLayout: spec.layout
        });
        fs.writeFileSync(path.join(extensionRoot, 'CSXS', 'manifest.xml'), manifest, 'utf8');
        extensionEntries.push({
            id: spec.extensionDir,
            extensionId: variant.manifest.extensionId,
            name: variant.manifest.bundleName,
            version,
            relativePath: `extensions/${spec.extensionDir}`,
            manifestPath: `extensions/${spec.extensionDir}/CSXS/manifest.xml`,
            hostRange: variant.manifest.hostVersion
        });
    }
    return extensionEntries.sort((left, right) => left.id.localeCompare(right.id));
}

function runtimeInventory(packageRoot) {
    const extensionsRoot = path.join(packageRoot, 'extensions');
    return listFiles(extensionsRoot).map((filePath) => ({
        path: normalizeRelative(path.relative(packageRoot, filePath)),
        size: fs.statSync(filePath).size,
        sha256: sha256File(filePath)
    })).sort((left, right) => left.path.localeCompare(right.path));
}

function createReleaseManifest({ version, commit, builtAt, extensions, files }) {
    return {
        schemaVersion: SCHEMA_VERSION,
        release: `recovery-v${assertSemver(version)}`,
        version,
        commit,
        builtAt: (builtAt || new Date()).toISOString(),
        supportedHosts: {
            platform: 'Windows',
            illustratorVersions: ['2025', '2026'],
            illustratorHostRange: '[29.0,30.9]',
            csxsRegistryKeys: ['CSXS.11', 'CSXS.12']
        },
        extensions,
        files,
        portabilityExceptions: [{
            id: 'committed-preset-output-paths',
            path: 'extensions/com.dinhson.imposition/data/presets.json',
            message: 'Committed preset output paths are preserved verbatim and may be machine-specific; installed user preset files are preserved during upgrades.'
        }]
    };
}

function gitOutput(repoRoot, args, deps = {}) {
    const runFn = deps.run || run;
    const result = runFn('git', args, { cwd: repoRoot, allowFailure: true });
    return { status: result.status, stdout: String(result.stdout || '').trim(), stderr: String(result.stderr || '').trim() };
}

function assertReleaseGitPolicy(repoRoot, version, deps = {}) {
    const release = `recovery-v${assertSemver(version)}`;
    const status = gitOutput(repoRoot, ['status', '--porcelain=v1', '--untracked-files=all'], deps);
    if (status.status !== 0 || status.stdout) throw new Error('Packaging requires a clean Git worktree.');
    const commitResult = gitOutput(repoRoot, ['rev-parse', 'HEAD'], deps);
    if (commitResult.status !== 0 || !/^[0-9a-f]{40}$/iu.test(commitResult.stdout)) throw new Error('Unable to resolve the release commit.');
    const ancestor = gitOutput(repoRoot, ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'], deps);
    if (ancestor.status !== 0) throw new Error('HEAD must already exist on origin/main.');
    const localTag = gitOutput(repoRoot, ['show-ref', '--verify', '--quiet', `refs/tags/${release}`], deps);
    if (localTag.status === 0) throw new Error(`Release tag already exists locally: ${release}`);
    const remoteTag = gitOutput(repoRoot, ['ls-remote', '--exit-code', '--tags', 'origin', `refs/tags/${release}`], deps);
    if (remoteTag.status === 0) throw new Error(`Release tag already exists on origin: ${release}`);
    if (![2].includes(remoteTag.status)) throw new Error(`Unable to check remote release tag: ${remoteTag.stderr || remoteTag.status}`);
    return { release, commit: commitResult.stdout.toLowerCase() };
}

function buildSha256Sums(packageRoot) {
    const files = listFiles(packageRoot)
        .filter((filePath) => path.basename(filePath) !== 'SHA256SUMS.txt')
        .map((filePath) => normalizeRelative(path.relative(packageRoot, filePath)))
        .sort();
    const lines = files.map((relative) => `${sha256File(path.join(packageRoot, relative))} *${relative}`);
    fs.writeFileSync(path.join(packageRoot, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`, 'utf8');
    return lines;
}

function parseSha256Sums(text) {
    const entries = new Map();
    for (const rawLine of String(text || '').split(/\r?\n/u)) {
        if (!rawLine) continue;
        const match = /^([0-9a-f]{64}) \*(.+)$/u.exec(rawLine);
        if (!match) throw new Error(`Invalid SHA256SUMS line: ${rawLine}`);
        const relative = normalizeRelative(match[2]);
        if (entries.has(relative)) throw new Error(`Duplicate SHA256SUMS path: ${relative}`);
        entries.set(relative, match[1].toLowerCase());
    }
    return entries;
}

function artifactBaseName(version, commit) {
    return `${RELEASE_PREFIX}${assertSemver(version)}-${String(commit).slice(0, 12).toLowerCase()}`;
}

function findArchiveTool(options = {}) {
    return find7Zip(options);
}

function createZip(outputRoot, packageRoot, archivePath, options = {}) {
    const sevenZip = options.sevenZip || findArchiveTool(options);
    const result = (options.run || run)(sevenZip, ['a', '-tzip', '-mx=9', '-bd', '-y', archivePath, path.basename(packageRoot)], {
        cwd: outputRoot,
        allowFailure: true
    });
    if (result.status !== 0) throw new Error(`7-Zip failed to create recovery archive (${result.status}).`);
}

function listArchiveEntries(archivePath, options = {}) {
    const sevenZip = options.sevenZip || findArchiveTool(options);
    const result = (options.run || run)(sevenZip, ['l', '-slt', archivePath], { allowFailure: true });
    if (result.status !== 0) throw new Error(`Unable to list recovery archive (${result.status}).`);
    const listing = String(result.stdout || '');
    if (/^Symbolic Link = .+$/mu.test(listing)) {
        throw new Error('Archive contains a symbolic link entry.');
    }
    const entries = [];
    const archiveAbsolute = path.resolve(archivePath).replace(/\\/g, '/').toLowerCase();
    for (const line of listing.split(/\r?\n/u)) {
        const match = /^Path = (.+)$/u.exec(line);
        if (!match) continue;
        const candidate = match[1].replace(/\\/g, '/');
        if (path.resolve(candidate).replace(/\\/g, '/').toLowerCase() === archiveAbsolute) continue;
        entries.push(candidate);
    }
    return entries;
}

function extractArchive(archivePath, destination, options = {}) {
    const sevenZip = options.sevenZip || findArchiveTool(options);
    fs.mkdirSync(destination, { recursive: true });
    const result = (options.run || run)(sevenZip, ['x', '-bd', '-y', `-o${destination}`, archivePath], { allowFailure: true });
    if (result.status !== 0) throw new Error(`Unable to extract recovery archive (${result.status}).`);
}

function makeCheck(id, status, message, remediation = '') {
    return { id, status, message, remediation };
}

function verifyPackageDirectory(packageRoot) {
    const checks = [];
    const fail = (id, message, remediation) => checks.push(makeCheck(id, 'FAIL', message, remediation));
    const pass = (id, message) => checks.push(makeCheck(id, 'PASS', message, ''));
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'release-manifest.json'), 'utf8'));
        if (manifest.schemaVersion !== SCHEMA_VERSION) throw new Error(`schemaVersion must be ${SCHEMA_VERSION}`);
        assertSemver(manifest.version);
        if (manifest.release !== `recovery-v${manifest.version}`) throw new Error('release/version mismatch');
        if (!/^[0-9a-f]{40}$/u.test(manifest.commit)) throw new Error('commit must be a full lowercase SHA');
        pass('manifest.schema', 'Release manifest schema and identity are valid.');
    } catch (error) {
        fail('manifest.schema', `Release manifest is invalid: ${error.message}`, 'Rebuild the artifact from the release command.');
    }

    try {
        const actualIds = fs.readdirSync(path.join(packageRoot, 'extensions')).sort();
        if (JSON.stringify(actualIds) !== JSON.stringify(EXPECTED_EXTENSION_IDS)) {
            throw new Error(`expected ${EXPECTED_EXTENSION_IDS.join(', ')}, got ${actualIds.join(', ')}`);
        }
        pass('extensions.production-only', 'Exactly the three production extensions are present.');
    } catch (error) {
        fail('extensions.production-only', `Extension set is invalid: ${error.message}`, 'Package only the three approved work variants.');
    }

    let actualFiles = [];
    try {
        actualFiles = listFiles(packageRoot);
        const forbidden = actualFiles.map((filePath) => normalizeRelative(path.relative(packageRoot, filePath)))
            .filter((relative) => relative.startsWith('extensions/') && isForbiddenRuntimePath(relative));
        if (forbidden.length) throw new Error(forbidden.join(', '));
        pass('payload.forbidden', 'No forbidden runtime path or filesystem link is present.');
    } catch (error) {
        fail('payload.forbidden', `Forbidden payload content: ${error.message}`, 'Remove dev/test/cache/link content and rebuild.');
    }

    try {
        const sumPath = path.join(packageRoot, 'SHA256SUMS.txt');
        const sums = parseSha256Sums(fs.readFileSync(sumPath, 'utf8'));
        const expected = actualFiles
            .map((filePath) => normalizeRelative(path.relative(packageRoot, filePath)))
            .filter((relative) => relative !== 'SHA256SUMS.txt')
            .sort();
        if (JSON.stringify([...sums.keys()].sort()) !== JSON.stringify(expected)) throw new Error('checksum inventory does not match package files');
        for (const [relative, digest] of sums) {
            if (sha256File(path.join(packageRoot, relative)) !== digest) throw new Error(`hash mismatch: ${relative}`);
        }
        pass('payload.hashes', 'SHA256SUMS covers and matches every package file.');
    } catch (error) {
        fail('payload.hashes', `Payload integrity failed: ${error.message}`, 'Do not install; obtain an unmodified release asset.');
    }

    if (manifest) {
        try {
            const actualInventory = runtimeInventory(packageRoot);
            if (JSON.stringify(actualInventory) !== JSON.stringify(manifest.files)) throw new Error('runtime inventory differs from release manifest');
            const manifestIds = manifest.extensions.map((entry) => entry.id).sort();
            if (JSON.stringify(manifestIds) !== JSON.stringify(EXPECTED_EXTENSION_IDS)) throw new Error('manifest extension set differs');
            for (const entry of manifest.extensions) {
                if (entry.version !== manifest.version) throw new Error(`extension version mismatch: ${entry.id}`);
                const xml = fs.readFileSync(path.join(packageRoot, entry.manifestPath), 'utf8');
                if (!xml.includes(`ExtensionBundleVersion="${manifest.version}"`) || !xml.includes(`Version="${manifest.version}"/>`)) {
                    throw new Error(`CEP manifest version mismatch: ${entry.id}`);
                }
            }
            pass('manifest.runtime', 'Runtime inventory and all CEP manifest versions match the release.');
        } catch (error) {
            fail('manifest.runtime', `Runtime manifest verification failed: ${error.message}`, 'Rebuild from the tagged commit.');
        }
    }

    return { version: SCHEMA_VERSION, status: checks.some((check) => check.status === 'FAIL') ? 'FAIL' : 'PASS', checks, manifest };
}

function verifyArchive(archivePath, options = {}) {
    const checks = [];
    if (!fs.existsSync(archivePath)) throw new Error(`Archive not found: ${archivePath}`);
    const size = fs.statSync(archivePath).size;
    checks.push(size <= MAX_ARCHIVE_BYTES
        ? makeCheck('archive.size', 'PASS', `Archive is ${size} bytes (limit ${MAX_ARCHIVE_BYTES}).`)
        : makeCheck('archive.size', 'FAIL', `Archive exceeds 15 MiB: ${size} bytes.`, 'Reduce runtime payload size.'));
    let entries;
    try {
        entries = listArchiveEntries(archivePath, options);
    } catch (error) {
        checks.push(makeCheck('archive.format', 'FAIL', `Archive cannot be safely listed: ${error.message}`, 'Reject this archive.'));
        return { version: SCHEMA_VERSION, status: 'FAIL', archive: path.resolve(archivePath), checks };
    }
    const unsafe = entries.filter((entry) => {
        try { normalizeRelative(entry); return false; } catch { return true; }
    });
    checks.push(unsafe.length === 0
        ? makeCheck('archive.paths', 'PASS', 'Archive entries use safe relative paths.')
        : makeCheck('archive.paths', 'FAIL', `Unsafe archive entries: ${unsafe.join(', ')}`, 'Reject this archive.'));
    if (unsafe.length > 0) {
        return { version: SCHEMA_VERSION, status: 'FAIL', archive: path.resolve(archivePath), checks };
    }
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'recovery-verify-'));
    try {
        extractArchive(archivePath, tempRoot, options);
        const roots = fs.readdirSync(tempRoot);
        if (roots.length !== 1) throw new Error('Archive must contain exactly one root directory.');
        const packageResult = verifyPackageDirectory(path.join(tempRoot, roots[0]));
        checks.push(...packageResult.checks);
        const expectedBase = artifactBaseName(packageResult.manifest && packageResult.manifest.version, packageResult.manifest && packageResult.manifest.commit);
        if (roots[0] !== expectedBase || path.basename(archivePath, '.zip') !== expectedBase) {
            checks.push(makeCheck('archive.identity', 'FAIL', 'Archive filename/root does not match manifest version and commit.', 'Use the canonical package command output.'));
        } else {
            checks.push(makeCheck('archive.identity', 'PASS', 'Archive filename and root match manifest identity.'));
        }
    } catch (error) {
        checks.push(makeCheck('archive.extract', 'FAIL', `Archive extraction/inspection failed: ${error.message}`, 'Reject this archive.'));
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
    return { version: SCHEMA_VERSION, status: checks.some((check) => check.status === 'FAIL') ? 'FAIL' : 'PASS', archive: path.resolve(archivePath), checks };
}

module.exports = {
    EXPECTED_EXTENSION_IDS,
    MAX_ARCHIVE_BYTES,
    RELEASE_PREFIX,
    RUNTIME_SPECS,
    SCHEMA_VERSION,
    artifactBaseName,
    assertReleaseGitPolicy,
    assertSemver,
    buildSha256Sums,
    collectSpecFiles,
    createReleaseManifest,
    createZip,
    extractArchive,
    isForbiddenRuntimePath,
    listArchiveEntries,
    listFiles,
    materializeExtensions,
    normalizeRelative,
    parseRecoveryArgs,
    parseSha256Sums,
    runtimeInventory,
    sha256File,
    verifyArchive,
    verifyPackageDirectory
};
