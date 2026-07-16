#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const quarantineRoot = path.join(
    repoRoot,
    'local-artifacts',
    `quarantine-${new Date().toISOString().replace(/[:.]/g, '-')}`
);

const explicitCandidates = [
    { relativePath: '%APPDATA%', classification: 'stale-local-install-copy' },
    { relativePath: 'symbol-cep/runtime_probe_out', classification: 'runtime-probe-output' },
    { relativePath: '.tmp_envelope_guides.json', classification: 'temporary-debug-data' },
    { relativePath: 'temp_measure_symbol_text_precleanup_2026.cjs', classification: 'temporary-debug-script' },
    { relativePath: 'binhbai4c.ai', classification: 'operator-document' },
    { relativePath: 'MA BARCODE_UPDATE_11_03_26 (1).xlsx', classification: 'operator-document' },
    { relativePath: 'symbol-cep/envelope golden file.ai', classification: 'unreferenced-debug-fixture' }
];

function normalizeRelative(filePath) {
    return filePath.replace(/\\/g, '/');
}

function assertInside(parentPath, candidatePath, label) {
    const parent = `${path.resolve(parentPath).toLowerCase()}${path.sep}`;
    const candidate = path.resolve(candidatePath).toLowerCase();
    if (!candidate.startsWith(parent)) {
        throw new Error(`${label} escapes its expected root: ${candidatePath}`);
    }
}

function hashFile(filePath) {
    const data = fs.readFileSync(filePath);
    return {
        bytes: data.length,
        sha256: crypto.createHash('sha256').update(data).digest('hex')
    };
}

function collectFiles(sourcePath) {
    const stat = fs.statSync(sourcePath);
    if (stat.isFile()) {
        return [sourcePath];
    }

    const files = [];
    for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
        const childPath = path.join(sourcePath, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(childPath));
        } else if (entry.isFile()) {
            files.push(childPath);
        }
    }
    return files;
}

function collectSymbolRootDocuments() {
    const symbolRoot = path.join(repoRoot, 'symbol-cep');
    const keepNames = new Set([
        'wedding suite print template.ai',
        'runtime_probe_ascii.pdf'
    ]);

    return fs.readdirSync(symbolRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .filter((entry) => /\.(?:ai|pdf)$/i.test(entry.name))
        .filter((entry) => !keepNames.has(entry.name))
        .map((entry) => ({
            relativePath: normalizeRelative(path.join('symbol-cep', entry.name)),
            classification: 'operator-or-debug-document'
        }));
}

function writeManifest(manifestPath, manifest) {
    const tempPath = `${manifestPath}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, manifestPath);
}

function moveEntry(sourcePath, targetPath) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    try {
        fs.renameSync(sourcePath, targetPath);
    } catch (error) {
        if (error.code !== 'EXDEV') {
            throw error;
        }
        fs.cpSync(sourcePath, targetPath, { recursive: true, errorOnExist: true });
        fs.rmSync(sourcePath, { recursive: true, force: false });
    }
}

function verifyManifest(manifestPath, manifest, expectedRoot) {
    for (const entry of manifest.entries) {
        const targetPath = path.resolve(repoRoot, entry.quarantinedPath);
        assertInside(expectedRoot, targetPath, 'Manifest target');
        if (!fs.existsSync(targetPath)) {
            throw new Error(`Quarantined artifact is missing: ${entry.quarantinedPath}`);
        }
        const actual = hashFile(targetPath);
        if (actual.bytes !== entry.bytes || actual.sha256 !== entry.sha256) {
            throw new Error(`Quarantined artifact hash mismatch: ${entry.quarantinedPath}`);
        }
        entry.verified = true;
    }
    manifest.status = 'verified';
    manifest.verifiedAt = new Date().toISOString();
    writeManifest(manifestPath, manifest);
}

function main() {
    if (process.argv[2] === '--verify') {
        const manifestPath = path.resolve(process.argv[3] || '');
        const localArtifactsRoot = path.join(repoRoot, 'local-artifacts');
        assertInside(localArtifactsRoot, manifestPath, 'Manifest path');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        verifyManifest(manifestPath, manifest, path.dirname(manifestPath));
        console.log(`[quarantine] Verified ${manifest.entries.length} files from ${manifestPath}`);
        return;
    }

    const candidates = [...explicitCandidates, ...collectSymbolRootDocuments()]
        .filter((candidate, index, all) => (
            all.findIndex((entry) => entry.relativePath === candidate.relativePath) === index
        ))
        .filter((candidate) => fs.existsSync(path.join(repoRoot, candidate.relativePath)));

    if (candidates.length === 0) {
        console.log('[quarantine] No matching local artifacts found.');
        return;
    }

    assertInside(repoRoot, quarantineRoot, 'Quarantine root');
    fs.mkdirSync(quarantineRoot, { recursive: true });

    const manifest = {
        version: 1,
        createdAt: new Date().toISOString(),
        repoRoot,
        quarantineRoot,
        status: 'planned',
        entries: []
    };

    for (const candidate of candidates) {
        const sourcePath = path.resolve(repoRoot, candidate.relativePath);
        assertInside(repoRoot, sourcePath, 'Artifact source');
        const targetPath = path.resolve(quarantineRoot, candidate.relativePath);
        assertInside(quarantineRoot, targetPath, 'Artifact target');

        for (const filePath of collectFiles(sourcePath)) {
            const relativeWithinCandidate = normalizeRelative(path.relative(sourcePath, filePath));
            const originalRelativePath = normalizeRelative(path.relative(repoRoot, filePath));
            const quarantinedRelativePath = normalizeRelative(path.relative(
                repoRoot,
                relativeWithinCandidate
                    ? path.join(targetPath, relativeWithinCandidate)
                    : targetPath
            ));
            const hash = hashFile(filePath);
            manifest.entries.push({
                originalPath: originalRelativePath,
                quarantinedPath: quarantinedRelativePath,
                classification: candidate.classification,
                bytes: hash.bytes,
                sha256: hash.sha256,
                moved: false
            });
        }
    }

    const manifestPath = path.join(quarantineRoot, 'manifest.json');
    writeManifest(manifestPath, manifest);

    for (const candidate of candidates) {
        const sourcePath = path.resolve(repoRoot, candidate.relativePath);
        const targetPath = path.resolve(quarantineRoot, candidate.relativePath);
        moveEntry(sourcePath, targetPath);
        for (const entry of manifest.entries) {
            if (
                entry.originalPath === candidate.relativePath ||
                entry.originalPath.startsWith(`${candidate.relativePath}/`)
            ) {
                entry.moved = true;
            }
        }
        writeManifest(manifestPath, manifest);
    }

    manifest.status = 'moved';
    manifest.completedAt = new Date().toISOString();
    writeManifest(manifestPath, manifest);
    verifyManifest(manifestPath, manifest, quarantineRoot);
    console.log(`[quarantine] Moved and verified ${manifest.entries.length} files in ${quarantineRoot}`);
}

main();
