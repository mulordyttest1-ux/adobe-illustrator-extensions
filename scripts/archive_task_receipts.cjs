#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const taskRoot = path.join(repoRoot, '.task_steps');
const archiveRoot = path.join(taskRoot, 'archive', '2026');
const keepFiles = new Set([
    'INDEX.md',
    'c1_repo_hygiene_architecture_refresh_document.md',
    'c1_toolkit_cep_document.md',
    'c2_repo_hygiene_architecture_refresh_scope.md'
]);

function classifyType(fileName) {
    const normalized = fileName.toLowerCase();
    if (normalized.startsWith('c1')) return 'C1';
    if (normalized.startsWith('c2')) return 'C2';
    if (normalized.includes('audit')) return 'audit';
    if (normalized.includes('retrospective')) return 'retrospective';
    if (normalized.includes('lesson')) return 'legacy-lessons';
    return 'legacy';
}

function classifyApp(fileName) {
    const normalized = fileName.toLowerCase();
    if (normalized.includes('wedding')) return 'wedding';
    if (normalized.includes('symbol')) return 'symbol';
    if (normalized.includes('toolkit')) return 'toolkit';
    if (normalized.includes('agent')) return 'agent';
    if (normalized.includes('shared') || normalized.includes('cross_app')) return 'shared';
    if (normalized.includes('repo') || normalized.includes('global')) return 'repo';
    return 'general';
}

function classifyStatus(contents) {
    if (/pending approval|status:\s*pending/iu.test(contents)) return 'pending-at-archive';
    if (/## Verification Gate/u.test(contents)) return 'verification-recorded';
    if (/approved/iu.test(contents)) return 'approved-plan';
    return 'historical';
}

function buildIndex(rows) {
    const lines = [
        '# Task Receipt Archive 2026',
        '',
        'Historical receipts are retained for evidence only and are not part of the default agent context.',
        'Active task artifacts remain in `.task_steps/`.',
        '',
        '| File | Type | App | Status |',
        '|:-----|:-----|:----|:-------|'
    ];
    for (const row of rows) {
        const encodedName = encodeURI(row.fileName).replace(/\|/g, '%7C');
        lines.push(`| [${row.fileName}](./${encodedName}) | ${row.type} | ${row.app} | ${row.status} |`);
    }
    lines.push('');
    return lines.join('\n');
}

function main() {
    fs.mkdirSync(archiveRoot, { recursive: true });
    const rows = [];
    const files = fs.readdirSync(taskRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
        .filter((entry) => !keepFiles.has(entry.name))
        .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of files) {
        const sourcePath = path.join(taskRoot, entry.name);
        const targetPath = path.join(archiveRoot, entry.name);
        if (fs.existsSync(targetPath)) {
            throw new Error(`Archive target already exists: ${targetPath}`);
        }
        const contents = fs.readFileSync(sourcePath, 'utf8');
        rows.push({
            fileName: entry.name,
            type: classifyType(entry.name),
            app: classifyApp(entry.name),
            status: classifyStatus(contents)
        });
        fs.renameSync(sourcePath, targetPath);
    }

    const existingRows = fs.readdirSync(archiveRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
        .filter((entry) => entry.name !== 'INDEX.md')
        .map((entry) => {
            const contents = fs.readFileSync(path.join(archiveRoot, entry.name), 'utf8');
            return {
                fileName: entry.name,
                type: classifyType(entry.name),
                app: classifyApp(entry.name),
                status: classifyStatus(contents)
            };
        })
        .sort((left, right) => left.fileName.localeCompare(right.fileName));

    fs.writeFileSync(path.join(archiveRoot, 'INDEX.md'), buildIndex(existingRows), 'utf8');
    fs.writeFileSync(path.join(taskRoot, 'INDEX.md'), [
        '# Active Task Artifacts',
        '',
        '- `c1_repo_hygiene_architecture_refresh_document.md` - approved cleanup direction and plan.',
        '- `c1_toolkit_cep_document.md` - pending Toolkit planning context.',
        '- `c2_repo_hygiene_architecture_refresh_scope.md` - active cleanup scope and gates.',
        '- `templates/` - canonical C1/C2 templates.',
        '- `archive/2026/` - historical evidence; do not load by default.',
        ''
    ].join('\n'), 'utf8');

    console.log(`[task-archive] Archived ${rows.length} receipts; indexed ${existingRows.length}.`);
}

main();
