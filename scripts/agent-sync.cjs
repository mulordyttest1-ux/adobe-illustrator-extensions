const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = ['node_modules', '.git', '.nx', '.agent', 'dist', 'build', '.vscode', 'CSXS', 'css', 'data', 'debug_scripts', 'installer'];

function scanDirectory(dir, map = {}) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (EXCLUDED_DIRS.includes(file)) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.lstatSync(fullPath);

        if (stat.isDirectory()) {
            map[file] = {};
            scanDirectory(fullPath, map[file]);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.json')) {
            map[file] = 'FILE';
        }
    }
    return map;
}

function formatMarkdownXML(map, indent = '  ') {
    let md = '';
    for (const [key, value] of Object.entries(map)) {
        if (value === 'FILE') {
            md += `${indent}- ${key}\n`;
        } else {
            md += `${indent}- /${key}\n`;
            md += formatMarkdownXML(value, indent + '  ');
        }
    }
    return md;
}

function extractFrontmatter(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*(.+)$/m);
    return {
        name: nameMatch ? nameMatch[1].trim() : '',
        description: descMatch ? descMatch[1].trim() : ''
    };
}

function syncDocumentationIndex(rootDir) {
    console.log('\nSyncing Documentation Index (Auto-MD-Indexer)...');
    const skillsDir = path.join(rootDir, '.agent', 'memory', 'skills');

    // 1. Build Skills Table
    let skillsTable = '| # | Skill | Mô tả | Đường dẫn |\n|---|-------|-------|-------------|\n';
    if (fs.existsSync(skillsDir)) {
        let index = 1;
        const folders = fs.readdirSync(skillsDir);
        for (const folder of folders) {
            if (folder === 'Skills_Index') continue;
            const skillPath = path.join(skillsDir, folder, 'SKILL.md');
            const relativePath = `../${folder}/SKILL.md`;
            const meta = extractFrontmatter(skillPath);
            if (meta) {
                const title = meta.name ? meta.name : folder;
                skillsTable += `| ${index++} | **${title}** | ${meta.description} | [Link](${relativePath}) |\n`;
            }
        }
    }

    // 2. Build Workflows Table
    const workflowsDir = path.join(rootDir, '.agent', 'workflows');
    let workflowsTable = '| # | Workflow / Command | Mô tả | Đường dẫn |\n|---|----------|-------|-------------|\n';
    if (fs.existsSync(workflowsDir)) {
        let index = 1;
        const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            const wfPath = path.join(workflowsDir, file);
            const relativePath = `../../../workflows/${file}`;
            const meta = extractFrontmatter(wfPath);
            if (meta) {
                const command = `@[/${file.replace('.md', '')}]`;
                workflowsTable += `| ${index++} | \`${command}\` | ${meta.description} | [Link](${relativePath}) |\n`;
            }
        }
    }

    // 3. Inject Tables into Skills_Index/SKILL.md
    const indexFile = path.join(skillsDir, 'Skills_Index', 'SKILL.md');
    if (fs.existsSync(indexFile)) {
        let content = fs.readFileSync(indexFile, 'utf8');
        content = content.replace(/(<!-- AUTO-GENERATED-SKILLS-START -->)[\s\S]*?(<!-- AUTO-GENERATED-SKILLS-END -->)/, `$1\n${skillsTable}$2`);
        content = content.replace(/(<!-- AUTO-GENERATED-WORKFLOWS-START -->)[\s\S]*?(<!-- AUTO-GENERATED-WORKFLOWS-END -->)/, `$1\n${workflowsTable}$2`);
        fs.writeFileSync(indexFile, content, 'utf8');
        console.log(`✅ Documentation Index Updated: ${indexFile}`);
    }
}

function main() {
    const rootDir = path.resolve(__dirname, '..');
    const surfaceFile = path.join(rootDir, '.agent', 'memory', 'API_SURFACE.md');

    console.log('Scanning repository structure...');
    const structure = scanDirectory(rootDir);
    const mdTree = formatMarkdownXML(structure);

    const finalContent = `\
# API Surface & Architecture Map\n\n\
> **AUTO-GENERATED FILE** by \`npm run agent:sync\`. Do not edit manually.\n\n\
<repository_surface>\n\
${mdTree}\
</repository_surface>\n\n\
<important_notes>\n\
- This file acts as the AI Agent's spatial memory of the project's living file tree.\n\
- Ensure this file is updated using \`npm run agent:sync\` after architectural changes.\n\
</important_notes>\n\
`;

    const dirPath = path.dirname(surfaceFile);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(surfaceFile, finalContent, 'utf8');
    console.log(`✅ Agent Memory Updated: ${surfaceFile}`);

    // Run MD indexer
    syncDocumentationIndex(rootDir);
}

main();
