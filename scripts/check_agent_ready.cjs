#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REQUIRED_CONTEXT_FILES = [
    'AGENTS.md',
    'AGENT_CONTEXT.md',
    'LEGACY_MAP.md',
    'README.md',
    'devkit.lock.json',
    '.github/ISSUE_TEMPLATE/agent-task.yml',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/workflows/ci.yml',
    'symbol-cep/AGENTS.md',
    'symbol-cep/ARCHITECTURE.md',
    'symbol-cep/FEATURE_MAP.md',
    'wedding-cep/AGENTS.md',
    'wedding-cep/ARCHITECTURE.md',
    'wedding-cep/FEATURE_MAP.md',
    'toolkit-cep/AGENTS.md',
    'toolkit-cep/ARCHITECTURE.md',
    'toolkit-cep/FEATURE_MAP.md',
    'libs/wedding/domain/AGENTS.md',
    'libs/shared/AGENTS.md'
];

const REQUIRED_ROOT_SCRIPTS = [
    'devkit:ensure',
    'setup:repo',
    'doctor:repo',
    'check:agent-ready',
    'check:encoding',
    'check:repo-hygiene',
    'check:architecture',
    'lint:all',
    'build:all',
    'test:ci',
    'verify',
    'test:smoke:wedding',
    'test:smoke:symbol',
    'test:smoke:toolkit'
];

const REQUIRED_SPEC_FILES = ['spec.md', 'plan.md', 'tasks.md'];
const SOURCE_EXTENSIONS = new Set([
    '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.ts',
    '.tsx', '.xml', '.yml', '.yaml'
]);

function normalizePath(filePath) {
    return String(filePath || '').replace(/\\/gu, '/').replace(/^\.\//u, '');
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listGitFiles(repoRoot, args) {
    const output = execFileSync('git', [...args, '-z'], {
        cwd: repoRoot,
        encoding: 'buffer'
    });
    return output.toString('utf8').split('\0').filter(Boolean).map(normalizePath);
}

function collectUntrackedSource(repoRoot, options = {}) {
    const files = options.untrackedFiles || listGitFiles(repoRoot, [
        'ls-files', '--others', '--exclude-standard'
    ]);
    return files.filter((filePath) => SOURCE_EXTENSIONS.has(
        path.extname(filePath).toLowerCase()
    ));
}

function classifySourcePath(filePath) {
    const normalized = normalizePath(filePath);
    if (normalized.startsWith('specs/')) {
        return 'spec';
    }
    if (
        /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(normalized) ||
        normalized.includes('/debug_scripts/') ||
        normalized.includes('/smoke_suites/')
    ) {
        return 'test-smoke';
    }
    if (/^(?:symbol-cep|wedding-cep|toolkit-cep|libs)\//u.test(normalized)) {
        return 'product-source';
    }
    if (
        /^(?:scripts|\.agents|\.specify|\.github)\//u.test(normalized) ||
        /^(?:AGENT_CONTEXT|LEGACY_MAP|REPO_FUNCTION_INVENTORY)/u.test(normalized)
    ) {
        return 'agent-tooling';
    }
    return 'docs-config';
}

function summarizeUntrackedSource(files) {
    const categories = {};
    for (const filePath of files) {
        const category = classifySourcePath(filePath);
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(normalizePath(filePath));
    }
    return Object.fromEntries(
        Object.entries(categories)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([category, categoryFiles]) => [
                category,
                {
                    count: categoryFiles.length,
                    files: categoryFiles.sort()
                }
            ])
    );
}

function inspectSpecs(repoRoot) {
    const specsRoot = path.join(repoRoot, 'specs');
    const errors = [];
    const warnings = [];

    if (!fs.existsSync(specsRoot)) {
        return {
            errors: ['Missing specs/ directory.'],
            warnings
        };
    }

    const entries = fs.readdirSync(specsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
        const specRoot = path.join(specsRoot, entry.name);
        const files = fs.readdirSync(specRoot, { withFileTypes: true })
            .filter((item) => item.isFile())
            .map((item) => item.name);
        if (files.length === 0) {
            warnings.push(`Empty spec directory: specs/${entry.name}`);
            continue;
        }
        if (files.includes('CANCELLED.md')) {
            const activeFiles = REQUIRED_SPEC_FILES.filter((fileName) => files.includes(fileName));
            if (activeFiles.length > 0) {
                errors.push(
                    `Cancelled spec specs/${entry.name} also contains active files: ` +
                    activeFiles.join(', ')
                );
            }
            continue;
        }
        const missing = REQUIRED_SPEC_FILES.filter((fileName) => !files.includes(fileName));
        if (missing.length > 0) {
            errors.push(
                `Incomplete spec specs/${entry.name}: missing ${missing.join(', ')}`
            );
        }
    }

    return { errors, warnings };
}

function inspectAgentReadiness(repoRoot, options = {}) {
    const strict = options.strict === true;
    const errors = [];
    const warnings = [];

    for (const relativePath of REQUIRED_CONTEXT_FILES) {
        if (!fs.existsSync(path.join(repoRoot, relativePath))) {
            errors.push(`Missing agent context file: ${relativePath}`);
        }
    }

    const packagePath = path.join(repoRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
        errors.push('Missing package.json.');
    } else {
        const scripts = readJson(packagePath).scripts || {};
        for (const scriptName of REQUIRED_ROOT_SCRIPTS) {
            if (!scripts[scriptName]) {
                errors.push(`Missing root npm script: ${scriptName}`);
            }
        }
    }

    const contextPath = path.join(repoRoot, 'AGENT_CONTEXT.md');
    if (fs.existsSync(contextPath)) {
        const context = fs.readFileSync(contextPath, 'utf8');
        for (const requiredHeading of [
            '## Product Map',
            '## Change Protocol',
            '## Validation Matrix',
            '## Legacy Policy',
            '## Completion Evidence'
        ]) {
            if (!context.includes(requiredHeading)) {
                errors.push(`AGENT_CONTEXT.md is missing heading: ${requiredHeading}`);
            }
        }
    }

    const specResult = inspectSpecs(repoRoot);
    errors.push(...specResult.errors);
    warnings.push(...specResult.warnings);

    let untrackedSource = [];
    try {
        untrackedSource = collectUntrackedSource(repoRoot, options);
    } catch (error) {
        warnings.push(`Unable to inspect untracked source: ${error.message}`);
    }
    if (untrackedSource.length > 0) {
        const message = (
            `${untrackedSource.length} source/context/test files are untracked; ` +
            'a clean clone may not reproduce this workspace.'
        );
        if (strict) {
            errors.push(message);
        } else {
            warnings.push(message);
        }
    }

    return {
        errors,
        warnings,
        untrackedSource,
        untrackedSummary: summarizeUntrackedSource(untrackedSource),
        strict
    };
}

function parseArgs(argv) {
    return {
        json: argv.includes('--json'),
        strict: argv.includes('--strict')
    };
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const result = inspectAgentReadiness(process.cwd(), options);

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        if (result.errors.length > 0) {
            process.exit(1);
        }
        return;
    }

    for (const warning of result.warnings) {
        console.warn(`[agent-ready] WARNING: ${warning}`);
    }
    for (const error of result.errors) {
        console.error(`[agent-ready] ERROR: ${error}`);
    }
    console.log(
        `[agent-ready] errors=${result.errors.length} warnings=${result.warnings.length} ` +
        `untrackedSource=${result.untrackedSource.length} strict=${result.strict}`
    );
    if (result.errors.length > 0) {
        process.exit(1);
    }
}

module.exports = {
    REQUIRED_CONTEXT_FILES,
    REQUIRED_ROOT_SCRIPTS,
    REQUIRED_SPEC_FILES,
    classifySourcePath,
    collectUntrackedSource,
    inspectAgentReadiness,
    inspectSpecs,
    normalizePath,
    parseArgs,
    summarizeUntrackedSource
};

if (require.main === module) {
    main();
}
