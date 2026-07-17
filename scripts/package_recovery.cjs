#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {
    artifactBaseName,
    assertReleaseGitPolicy,
    buildSha256Sums,
    createReleaseManifest,
    createZip,
    materializeExtensions,
    parseRecoveryArgs,
    runtimeInventory,
    sha256File,
    verifyArchive,
    verifyPackageDirectory
} = require('./recovery_core.cjs');
const { copyPath, run } = require('./machine_migration_common.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');

function runProductionBuilds(repoRoot, deps = {}) {
    const runFn = deps.run || run;
    const buildScripts = [
        'wedding-cep/cep/build.cjs',
        'symbol-cep/cep/build.cjs',
        'toolkit-cep/cep/build.cjs'
    ];
    for (const relative of buildScripts) {
        runFn(process.execPath, [path.join(repoRoot, relative), '--production'], { cwd: repoRoot });
    }
}

function copyInstallerTemplates(repoRoot, packageRoot) {
    const templateRoot = path.join(repoRoot, 'recovery');
    const required = [
        'install-silent.bat',
        'uninstall-silent.bat',
        'installer/install.ps1',
        'installer/uninstall.ps1',
        'RECOVERY_README.txt'
    ];
    for (const relative of required) {
        const sourcePath = path.join(templateRoot, relative);
        if (!fs.existsSync(sourcePath)) throw new Error(`Recovery installer template is missing: ${relative}`);
        copyPath(sourcePath, path.join(packageRoot, relative));
    }
}

function packageRecovery(options, deps = {}) {
    const repoRoot = options.repoRoot || REPO_ROOT;
    const gitState = (deps.assertReleaseGitPolicy || assertReleaseGitPolicy)(repoRoot, options.version, deps);
    const baseName = artifactBaseName(options.version, gitState.commit);
    const outputRoot = path.resolve(options.output);
    const packageRoot = path.join(outputRoot, baseName);
    const archivePath = path.join(outputRoot, `${baseName}.zip`);
    if (fs.existsSync(packageRoot) || fs.existsSync(archivePath)) {
        throw new Error(`Refusing to overwrite an existing recovery artifact: ${baseName}`);
    }
    fs.mkdirSync(outputRoot, { recursive: true });
    try {
        (deps.runProductionBuilds || runProductionBuilds)(repoRoot, deps);
        fs.mkdirSync(path.join(packageRoot, 'extensions'), { recursive: true });
        const extensions = materializeExtensions(repoRoot, path.join(packageRoot, 'extensions'), options.version);
        copyInstallerTemplates(repoRoot, packageRoot);
        const manifest = createReleaseManifest({
            version: options.version,
            commit: gitState.commit,
            builtAt: deps.builtAt,
            extensions,
            files: runtimeInventory(packageRoot)
        });
        fs.writeFileSync(path.join(packageRoot, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
        buildSha256Sums(packageRoot);
        const directoryReport = verifyPackageDirectory(packageRoot);
        if (directoryReport.status !== 'PASS') {
            throw new Error(`Unpacked package verification failed: ${directoryReport.checks.filter((check) => check.status === 'FAIL').map((check) => check.message).join('; ')}`);
        }
        createZip(outputRoot, packageRoot, archivePath, deps);
        const archiveReport = verifyArchive(archivePath, deps);
        if (archiveReport.status !== 'PASS') {
            throw new Error(`Archive verification failed: ${archiveReport.checks.filter((check) => check.status === 'FAIL').map((check) => check.message).join('; ')}`);
        }
        return {
            version: options.version,
            release: gitState.release,
            commit: gitState.commit,
            directory: packageRoot,
            archive: archivePath,
            size: fs.statSync(archivePath).size,
            sha256: sha256File(archivePath),
            status: 'PASS'
        };
    } catch (error) {
        fs.rmSync(packageRoot, { recursive: true, force: true });
        fs.rmSync(archivePath, { force: true });
        throw error;
    }
}

function print(value, json) {
    if (json) console.log(JSON.stringify(value));
    else Object.entries(value).forEach(([key, entry]) => console.log(`${key}: ${entry}`));
}

function main(argv = process.argv.slice(2)) {
    let options;
    try {
        options = parseRecoveryArgs(argv, 'package');
    } catch (error) {
        console.error(`[package:recovery] ${error.message}`);
        return 2;
    }
    try {
        print(packageRecovery(options), options.json);
        return 0;
    } catch (error) {
        if (options.json) console.log(JSON.stringify({ version: 1, status: 'FAIL', message: error.message }));
        else console.error(`[package:recovery] ${error.message}`);
        return 1;
    }
}

module.exports = { copyInstallerTemplates, main, packageRecovery, runProductionBuilds };

if (require.main === module) process.exitCode = main();
