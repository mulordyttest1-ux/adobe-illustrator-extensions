#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
    CONTRACT_VERSION,
    REPO_ROOT,
    makeCheck,
    parseCliArgs,
    run
} = require('./machine_migration_common.cjs');

const SIZE_BUDGET_BYTES = 10 * 1024 * 1024;

function commandVersion(command, args, injectedRun = run) {
    const result = injectedRun(command, args, { allowFailure: true });
    return result.error || result.status !== 0 ? null : String(result.stdout || '').trim();
}

function versionMajor(value) {
    const match = String(value || '').match(/(\d+)/u);
    return match ? Number(match[1]) : null;
}

function trackedCheckoutSize(repoRoot) {
    const output = execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'buffer' });
    return output.toString('utf8').split('\0').filter(Boolean).reduce((total, relativePath) => {
        const absolutePath = path.join(repoRoot, relativePath);
        return total + (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile() ? fs.statSync(absolutePath).size : 0);
    }, 0);
}

function readDevkitLock(repoRoot) {
    const lockPath = path.join(repoRoot, 'devkit.lock.json');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (lock.schemaVersion !== 1 ||
        lock.productContractVersion !== 1 ||
        !/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/iu.test(lock.repository) ||
        !/^[a-z0-9_.-]+$/iu.test(lock.siblingDirectory) ||
        !/^[0-9a-f]{40}$/u.test(lock.commit) ||
        !/^v\d+\.\d+\.\d+$/u.test(lock.release)) {
        throw new Error('devkit.lock.json has an invalid schema, repository, sibling directory, release, or full commit SHA.');
    }
    return lock;
}

function collectRepoDoctorReport(options = {}, injected = {}) {
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const runFn = injected.run || run;
    const checks = [];
    const add = (check, scope = 'product') => checks.push({ ...check, scope });
    const finalPhase = options.phase !== 'preflight';
    const nodeVersion = injected.nodeVersion || process.version;
    const npmVersion = commandVersion('npm', ['--version'], runFn);
    const gitVersion = commandVersion('git', ['--version'], runFn);

    add(versionMajor(nodeVersion) === 24
        ? makeCheck('tool.node24', 'PASS', `Node ${nodeVersion} matches major 24.`)
        : makeCheck('tool.node24', 'FAIL', `Node ${nodeVersion} does not match major 24.`, 'Install the pinned Node 24 toolchain.'), 'machine');
    add(versionMajor(npmVersion) === 11
        ? makeCheck('tool.npm11', 'PASS', `npm ${npmVersion} matches major 11.`)
        : makeCheck('tool.npm11', 'FAIL', `npm ${npmVersion || 'missing'} does not match major 11.`, 'Install npm 11 with Node 24.'), 'machine');
    add(gitVersion
        ? makeCheck('tool.git', 'PASS', gitVersion)
        : makeCheck('tool.git', 'FAIL', 'Git is missing.', 'Install Git.'), 'machine');

    for (const relativePath of ['package-lock.json', 'AGENTS.md', '.specify/integration.json', '.agents/skills/speckit-implement/SKILL.md', 'NEW_MACHINE_PROMPT.txt']) {
        add(fs.existsSync(path.join(repoRoot, relativePath))
            ? makeCheck(`repo.${relativePath.replace(/[^a-z0-9]+/giu, '.')}`, 'PASS', `${relativePath} is present.`)
            : makeCheck(`repo.${relativePath.replace(/[^a-z0-9]+/giu, '.')}`, 'FAIL', `${relativePath} is missing.`, 'Restore it from Git.'));
    }

    try {
        const lock = readDevkitLock(repoRoot);
        add(makeCheck('devkit.lock', 'PASS', `${lock.repository}@${lock.release} is pinned to ${lock.commit}.`), 'devkit');
    } catch (error) {
        add(makeCheck('devkit.lock', 'FAIL', error.message, 'Restore a reviewed immutable devkit lock.'), 'devkit');
    }

    const size = trackedCheckoutSize(repoRoot);
    add(size <= SIZE_BUDGET_BYTES
        ? makeCheck('repo.size-budget', 'PASS', `Tracked checkout is ${(size / 1024 / 1024).toFixed(3)} MiB (budget 10 MiB).`)
        : makeCheck('repo.size-budget', 'FAIL', `Tracked checkout is ${(size / 1024 / 1024).toFixed(3)} MiB.`, 'Remove generated/large files or approve a budget change.'));

    if (finalPhase) {
        add(fs.existsSync(path.join(repoRoot, 'node_modules'))
            ? makeCheck('repo.dependencies', 'PASS', 'Frozen dependencies are installed.')
            : makeCheck('repo.dependencies', 'FAIL', 'node_modules is missing.', 'Run npm ci.'));
    }

    const hasFail = checks.some((check) => check.status === 'FAIL');
    const hasWarn = checks.some((check) => check.status === 'WARN');
    return {
        version: CONTRACT_VERSION,
        status: hasFail ? 'FAIL' : (hasWarn ? 'WARN' : 'PASS'),
        product: { path: repoRoot },
        devkit: { lockFile: path.join(repoRoot, 'devkit.lock.json') },
        checks
    };
}

function main() {
    try {
        const args = parseCliArgs(process.argv.slice(2), {
            boolean: ['json'],
            value: ['repo-root', 'phase']
        });
        const report = collectRepoDoctorReport({ repoRoot: args['repo-root'], phase: args.phase });
        if (args.json) console.log(JSON.stringify(report, null, 2));
        else report.checks.forEach((check) => console.log(`[${check.status}] ${check.id}: ${check.message}`));
        process.exitCode = report.status === 'FAIL' ? 1 : 0;
    } catch (error) {
        console.error(`[doctor:repo] ${error.message}`);
        process.exitCode = 2;
    }
}

module.exports = { SIZE_BUDGET_BYTES, collectRepoDoctorReport, readDevkitLock, trackedCheckoutSize, versionMajor };

if (require.main === module) main();
