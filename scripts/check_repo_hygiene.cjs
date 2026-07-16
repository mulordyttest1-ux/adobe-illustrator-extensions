#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const DEFAULT_REQUIRED_PATHS = [
    'symbol-cep/wedding suite print template.ai',
    'symbol-cep/cep/debug_scripts/test_smoke.cjs',
    'symbol-cep/cep/debug_scripts/test_smoke_2026.cjs',
    'symbol-cep/cep/debug_scripts/fixtures/wedding_suite/runtime_probe_ascii.pdf',
    'wedding-cep/cep/debug_scripts/test_smoke.cjs',
    'wedding-cep/cep/debug_scripts/test_smoke_2026.cjs',
    'wedding-cep/cep/debug_scripts/smoke_helpers.cjs',
    'wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs',
    'toolkit-cep/cep/debug_scripts/test_smoke.cjs',
    'toolkit-cep/cep/debug_scripts/smoke_filter.cjs',
    'toolkit-cep/cep/debug_scripts/smoke_registry.cjs'
];

const SOURCE_EXTENSIONS = new Set([
    '.js', '.jsx', '.cjs', '.mjs', '.ts', '.css', '.html', '.json', '.xml', '.md'
]);

function normalizePath(filePath) {
    return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function listGitFiles(repoRoot, args) {
    const output = execFileSync('git', [...args, '-z'], {
        cwd: repoRoot,
        encoding: 'buffer'
    });
    return output.toString('utf8').split('\0').filter(Boolean).map(normalizePath);
}

function isIgnored(repoRoot, relativePath) {
    const result = spawnSync('git', ['check-ignore', '--no-index', '--quiet', '--', relativePath], {
        cwd: repoRoot,
        stdio: 'ignore'
    });
    return result.status === 0;
}

function isForbiddenTrackedPath(filePath) {
    const normalized = normalizePath(filePath);
    return normalized.startsWith('.nx/') ||
        normalized.startsWith('%APPDATA%/') ||
        normalized.startsWith('local-artifacts/') ||
        /(?:^|\/)bundle\.js(?:\.map)?$/u.test(normalized) ||
        /(?:^|\/)\.generated\//u.test(normalized) ||
        normalized === 'symbol-cep/cep/wedding suite print template.ai' ||
        normalized === 'symbol-cep/cep/data/presets.usage.json' ||
        /symbol-cep\/cep\/data\/.*\.bak$/u.test(normalized);
}

function findMisplacedArtifacts(repoRoot) {
    const findings = [];
    const explicitPaths = [
        '%APPDATA%',
        'symbol-cep/runtime_probe_out',
        '.tmp_envelope_guides.json',
        'temp_measure_symbol_text_precleanup_2026.cjs',
        'binhbai4c.ai'
    ];

    for (const relativePath of explicitPaths) {
        if (fs.existsSync(path.join(repoRoot, relativePath))) {
            findings.push(relativePath);
        }
    }

    for (const entry of fs.readdirSync(repoRoot, { withFileTypes: true })) {
        if (entry.isFile() && /\.xlsx$/iu.test(entry.name)) {
            findings.push(entry.name);
        }
    }

    const symbolRoot = path.join(repoRoot, 'symbol-cep');
    if (fs.existsSync(symbolRoot)) {
        for (const entry of fs.readdirSync(symbolRoot, { withFileTypes: true })) {
            if (!entry.isFile() || !/\.(?:ai|pdf)$/iu.test(entry.name)) {
                continue;
            }
            if (entry.name === 'wedding suite print template.ai') {
                continue;
            }
            findings.push(normalizePath(path.join('symbol-cep', entry.name)));
        }
    }

    return Array.from(new Set(findings)).sort();
}

function inspectRepo(repoRoot, options = {}) {
    const requiredPaths = options.requiredPaths || DEFAULT_REQUIRED_PATHS;
    const trackedFiles = options.trackedFiles || listGitFiles(repoRoot, ['ls-files']);
    const untrackedFiles = options.untrackedFiles || listGitFiles(repoRoot, [
        'ls-files', '--others', '--exclude-standard'
    ]);
    const errors = [];
    const warnings = [];

    const forbiddenTracked = trackedFiles.filter(isForbiddenTrackedPath);
    if (forbiddenTracked.length > 0) {
        errors.push(`Forbidden generated/local paths are tracked: ${forbiddenTracked.join(', ')}`);
    }

    for (const requiredPath of requiredPaths) {
        const normalized = normalizePath(requiredPath);
        if (!fs.existsSync(path.join(repoRoot, normalized))) {
            errors.push(`Required source is missing: ${normalized}`);
            continue;
        }
        if (isIgnored(repoRoot, normalized)) {
            errors.push(`Required source is hidden by ignore rules: ${normalized}`);
        }
    }

    const misplacedArtifacts = findMisplacedArtifacts(repoRoot);
    if (misplacedArtifacts.length > 0) {
        errors.push(`Local artifacts remain in source-owned paths: ${misplacedArtifacts.join(', ')}`);
    }

    const untrackedSource = untrackedFiles.filter((filePath) => (
        SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase()) ||
        requiredPaths.includes(filePath)
    ));
    if (untrackedSource.length > 0) {
        warnings.push(
            `${untrackedSource.length} source/config/test files remain untracked by explicit operator choice.`
        );
    }

    return {
        errors,
        warnings,
        trackedCount: trackedFiles.length,
        untrackedCount: untrackedFiles.length,
        untrackedSource,
        forbiddenTracked,
        misplacedArtifacts
    };
}

function main() {
    const result = inspectRepo(process.cwd());
    for (const warning of result.warnings) {
        console.warn(`[hygiene] WARNING: ${warning}`);
    }
    for (const error of result.errors) {
        console.error(`[hygiene] ERROR: ${error}`);
    }
    console.log(
        `[hygiene] tracked=${result.trackedCount} untracked=${result.untrackedCount} ` +
        `untrackedSource=${result.untrackedSource.length}`
    );
    if (result.errors.length > 0) {
        process.exit(1);
    }
}

module.exports = {
    DEFAULT_REQUIRED_PATHS,
    findMisplacedArtifacts,
    inspectRepo,
    isForbiddenTrackedPath,
    normalizePath
};

if (require.main === module) {
    main();
}
