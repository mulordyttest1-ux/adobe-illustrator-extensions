#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { inspectRepo } = require('./check_repo_hygiene.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sourceExtensions = new Set(['.js', '.jsx', '.cjs', '.mjs', '.ts', '.css']);
const ignoredDirectories = new Set([
    '.git', '.nx', 'node_modules', 'local-artifacts', '.generated', 'archive', 'runtime_probe_out'
]);

function collectSourceFiles(rootPath) {
    const files = [];
    function visit(currentPath) {
        for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
            if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
                continue;
            }
            const childPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                visit(childPath);
            } else if (
                entry.isFile() &&
                sourceExtensions.has(path.extname(entry.name).toLowerCase()) &&
                entry.name !== 'bundle.js' &&
                !/\.min\.(?:js|css)$/iu.test(entry.name)
            ) {
                files.push(childPath);
            }
        }
    }
    visit(rootPath);
    return files;
}

function countLines(filePath) {
    return fs.readFileSync(filePath, 'utf8').split(/\r?\n/u).length;
}

function buildDuplicateGroups(files) {
    const groups = new Map();
    for (const filePath of files) {
        const data = fs.readFileSync(filePath);
        if (data.length < 1000) {
            continue;
        }
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        const existing = groups.get(hash) || [];
        existing.push(filePath);
        groups.set(hash, existing);
    }
    return Array.from(groups.values()).filter((group) => group.length > 1);
}

function printKnipReport() {
    const executable = path.join(repoRoot, 'node_modules', 'knip', 'bin', 'knip.js');
    if (!fs.existsSync(executable)) {
        console.log('\n[audit] Knip is not installed; dead-code report skipped.');
        return;
    }
    const result = spawnSync(process.execPath, [executable, '--reporter', 'compact'], {
        cwd: repoRoot,
        encoding: 'utf8'
    });
    console.log('\n[audit] Knip advisory report (non-blocking):');
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    console.log(output || 'No Knip findings.');
    if (result.status !== 0) {
        console.log(`[audit] Knip returned ${result.status}; findings remain advisory.`);
    }
}

function main() {
    const hygiene = inspectRepo(repoRoot);
    const files = collectSourceFiles(repoRoot);
    const largest = files
        .map((filePath) => ({
            path: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
            lines: countLines(filePath)
        }))
        .sort((left, right) => right.lines - left.lines)
        .slice(0, 15);
    const duplicateGroups = buildDuplicateGroups(files).slice(0, 10);

    console.log('[audit] Repository maintenance scorecard');
    console.log(JSON.stringify({
        trackedFiles: hygiene.trackedCount,
        untrackedFiles: hygiene.untrackedCount,
        untrackedSource: hygiene.untrackedSource.length,
        hygieneErrors: hygiene.errors.length,
        hygieneWarnings: hygiene.warnings.length,
        exactDuplicateGroups: duplicateGroups.length
    }, null, 2));
    console.log('\n[audit] Largest source files:');
    largest.forEach((entry) => console.log(`- ${entry.lines} ${entry.path}`));
    console.log('\n[audit] Exact duplicate source groups:');
    if (duplicateGroups.length === 0) {
        console.log('- none');
    } else {
        duplicateGroups.forEach((group) => {
            console.log(`- ${group.map((filePath) => path.relative(repoRoot, filePath).replace(/\\/g, '/')).join(' | ')}`);
        });
    }
    hygiene.warnings.forEach((warning) => console.log(`[audit] WARNING: ${warning}`));
    hygiene.errors.forEach((error) => console.log(`[audit] ERROR: ${error}`));
    printKnipReport();
    console.log('\n[audit] Report-only mode: no files were changed or deleted.');
}

main();
