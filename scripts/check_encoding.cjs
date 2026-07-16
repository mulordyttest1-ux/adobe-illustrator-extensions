const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEXT_EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.cjs',
    '.mjs',
    '.html',
    '.css',
    '.json',
    '.xml',
    '.md',
    '.yml',
    '.yaml',
    '.toml',
    '.txt',
    '.svg'
]);

const ROOT_TEXT_FILES = new Set([
    '.editorconfig',
    '.gitattributes',
    '.npmrc',
    'AGENTS.md',
    'README.md',
    'package.json',
    'package-lock.json'
]);

const LF_ONLY_PATTERNS = [
    /^(?:\.editorconfig|\.gitattributes|\.npmrc|AGENTS\.md|README\.md|package\.json|package-lock\.json)$/,
    /^\.github\//,
    /^scripts\//,
    /^shared\//,
    /^libs\/shared\//
];

const IGNORE_PATTERNS = [
    /^\.agent\//,
    /^\.task_steps\//,
    /^\.nx\//,
    /^local-artifacts\//,
    /^%APPDATA%\//,
    /^node_modules\//,
    /\/node_modules\//,
    /(?:^|\/)bundle\.js$/,
    /\.min\.(?:js|css)$/i,
    /(?:^|\/)(?:dist|coverage)\//,
    /(?:^|\/)runtime_probe_out\//,
    /(?:^|\/)(?:vendor|vendors|third_party|third-party)\//i
];

const WORKSPACE_SCAN_ROOTS = [
    '.github',
    'libs',
    'scripts',
    'shared',
    'symbol-cep',
    'toolkit-cep',
    'wedding-cep'
];

const MOJIBAKE_RULES = [
    { name: 'UTF-8 mojibake fragment (A-tilde lead)', regex: /\u00C3[\u00A0-\u00BF]/u },
    { name: 'UTF-8 mojibake fragment (AE lead)', regex: /\u00C6[\u00A0-\u00BF]/u },
    { name: 'UTF-8 mojibake fragment (a-acute lead)', regex: /\u00E1[\u00A0-\u00BF]/u },
    { name: 'Windows-1252 punctuation mojibake', regex: /\u00E2[\u2013-\u2122]/u },
    { name: 'Misdecoded emoji fragment', regex: /\u00F0\u0178/u },
    { name: 'Misdecoded d-stroke fragment', regex: /\u00C4[\u2018\u2019\u0090]/u },
    { name: 'Misdecoded degree or symbol fragment', regex: /\u00C2[°·©®±]/u },
    { name: 'Replacement character', regex: /\uFFFD/u }
];

function listTrackedFiles() {
    const output = execFileSync('git', ['ls-files', '-z'], {
        cwd: process.cwd(),
        encoding: 'buffer'
    });

    return output.toString('utf8').split('\0').filter(Boolean);
}

function listExtraFiles() {
    const raw = process.env.CHECK_ENCODING_EXTRA_FILES;
    if (!raw) {
        return [];
    }

    return raw
        .split(/\r?\n/u)
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function listWorkspaceFiles() {
    const files = [];

    function visit(relativePath) {
        if (shouldIgnore(relativePath)) {
            return;
        }
        const absolutePath = path.resolve(relativePath);
        if (!fs.existsSync(absolutePath)) {
            return;
        }
        const stat = fs.statSync(absolutePath);
        if (stat.isFile()) {
            files.push(relativePath.replace(/\\/g, '/'));
            return;
        }
        if (!stat.isDirectory()) {
            return;
        }
        for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.nx') {
                continue;
            }
            visit(path.join(relativePath, entry.name));
        }
    }

    WORKSPACE_SCAN_ROOTS.forEach(visit);
    return files;
}

function shouldIgnore(filePath) {
    return IGNORE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isTextCandidate(filePath) {
    if (ROOT_TEXT_FILES.has(filePath)) {
        return true;
    }

    return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function requiresLf(filePath) {
    return LF_ONLY_PATTERNS.some((pattern) => pattern.test(filePath));
}

function hasBom(buffer) {
    return buffer.length >= 3 &&
        buffer[0] === 0xEF &&
        buffer[1] === 0xBB &&
        buffer[2] === 0xBF;
}

function decodeUtf8(buffer) {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

function getLineColumn(text, index) {
    const before = text.slice(0, index);
    const lines = before.split('\n');

    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

function findCrlf(text) {
    const index = text.indexOf('\r');
    if (index === -1) {
        return null;
    }

    const position = getLineColumn(text, index);
    return {
        line: position.line,
        column: position.column,
        rule: 'CRLF or bare CR line ending',
        sample: '\\r'
    };
}

function findFirstMatch(text, filePath) {
    const crlf = requiresLf(filePath) ? findCrlf(text) : null;
    if (crlf) {
        return crlf;
    }

    const lines = text.split(/\r?\n/u);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        for (const rule of MOJIBAKE_RULES) {
            const match = line.match(rule.regex);
            if (match) {
                return {
                    line: index + 1,
                    column: match.index + 1,
                    rule: rule.name,
                    sample: match[0]
                };
            }
        }
    }

    return null;
}

function main() {
    const failures = [];
    const filesToCheck = Array.from(new Set([
        ...listTrackedFiles(),
        ...listWorkspaceFiles(),
        ...listExtraFiles()
    ]));

    for (const filePath of filesToCheck) {
        if (shouldIgnore(filePath) || !isTextCandidate(filePath) || !fs.existsSync(filePath)) {
            continue;
        }

        const buffer = fs.readFileSync(filePath);
        if (hasBom(buffer)) {
            failures.push(`${filePath}:1:1 UTF-8 BOM is not allowed`);
            continue;
        }

        let text;
        try {
            text = decodeUtf8(buffer);
        } catch (error) {
            failures.push(`${filePath}:1:1 invalid UTF-8 (${error.message})`);
            continue;
        }

        const match = findFirstMatch(text, filePath);
        if (match) {
            failures.push(
                `${filePath}:${match.line}:${match.column} ${match.rule} -> ${JSON.stringify(match.sample)}`
            );
        }
    }

    if (failures.length > 0) {
        console.error('[encoding] Found encoding issues:');
        failures.forEach((failure) => console.error(`- ${failure}`));
        process.exit(1);
    }

    console.log('[encoding] OK - tracked and workspace source text is UTF-8 and BOM-free; root/shared/tooling text is LF-only and common mojibake markers are blocked repo-wide.');
}

main();
