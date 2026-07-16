#!/usr/bin/env node

const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const {
    CONTRACT_VERSION,
    REPO_ROOT,
    makeCheck,
    parseCliArgs,
    run,
    summarizeChecks
} = require('./machine_migration_common.cjs');

const ILLUSTRATOR_YEARS = [2025, 2026];
const CSXS_VERSIONS = [11, 12];
const REQUIRED_SKILLS = ['adobe-cep-repo-context', 'cep-es3-es6-boundary', 'wedding-domain-knowledge'];
const REQUIRED_PLUGINS = ['browser@openai-bundled', 'sites@openai-bundled', 'visualize@openai-bundled'];
const WRAPPERS = [
    { name: 'com.dinhson.imposition', probe: ['symbol-cep', 'cep', 'js'] },
    { name: 'com.dinhson.imposition.panel.test2026', probe: ['symbol-cep', 'cep', 'js'] },
    { name: 'com.dinhson.weddingscripter', probe: ['wedding-cep', 'cep', 'js'] },
    { name: 'com.dinhson.weddingscripter.panel.test2026', probe: ['wedding-cep', 'cep', 'js'] },
    { name: 'com.dinhson.toolkit', probe: ['toolkit-cep', 'cep'] },
    { name: 'com.dinhson.toolkit.panel.dev', probe: ['toolkit-cep', 'cep'] }
];
const LEGACY_WRAPPERS = ['com.dinhson.imposition.panel.dev', 'com.dinhson.weddingscripter.panel.dev'];
const DEBUG_PORTS = [
    { id: 'wedding', port: 9197 },
    { id: 'symbol', port: 9198 },
    { id: 'toolkit', port: 9099 }
];

function versionMajor(value) {
    const match = String(value || '').match(/(\d+)/);
    return match ? Number(match[1]) : null;
}

function commandVersion(command, args, deps) {
    const result = deps.run(command, args, { allowFailure: true });
    if (result.error || result.status !== 0) {
        return null;
    }
    return String(result.stdout || '').trim();
}

function resolveRealPath(targetPath) {
    try {
        return fs.realpathSync.native(targetPath).toLowerCase();
    } catch (_error) {
        return null;
    }
}

function queryPlayerDebugMode(version, deps) {
    const key = `HKCU\\Software\\Adobe\\CSXS.${version}`;
    const result = deps.run('reg.exe', ['query', key, '/v', 'PlayerDebugMode'], { allowFailure: true });
    if (result.error || result.status !== 0) {
        return false;
    }
    return /PlayerDebugMode\s+REG_SZ\s+1(?:\s|$)/i.test(String(result.stdout || ''));
}

function checkPort(port, timeoutMs = 250) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let settled = false;
        const finish = (open) => {
            if (settled) {
                return;
            }
            settled = true;
            socket.destroy();
            resolve(open);
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, '127.0.0.1');
    });
}

function readFontInventory(inventoryPath) {
    const parsed = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    if (!Array.isArray(parsed.fonts)) {
        throw new Error(`Font inventory must contain a fonts array: ${inventoryPath}`);
    }
    return parsed.fonts.map((entry) => String(entry).toLowerCase());
}

function installedFontNames(env) {
    const roots = [
        path.join(env.WINDIR || 'C:\\Windows', 'Fonts'),
        path.join(env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'Fonts')
    ];
    const names = new Set();
    roots.forEach((root) => {
        if (!root || !fs.existsSync(root)) {
            return;
        }
        fs.readdirSync(root).forEach((entry) => names.add(entry.toLowerCase()));
    });
    return names;
}

function isPluginEnabled(configText, pluginId) {
    const lines = String(configText || '').split(/\r?\n/);
    const header = `[plugins."${pluginId}"]`;
    const start = lines.findIndex((line) => line.trim() === header);
    if (start === -1) {
        return false;
    }
    for (let index = start + 1; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (line.startsWith('[')) {
            return false;
        }
        if (/^enabled\s*=\s*true\s*$/.test(line)) {
            return true;
        }
    }
    return false;
}

async function collectDoctorReport(options = {}, injected = {}) {
    const deps = {
        env: injected.env || process.env,
        platform: injected.platform || process.platform,
        run: injected.run || run,
        checkPort: injected.checkPort || checkPort
    };
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const codexHome = path.resolve(options.codexHome || deps.env.CODEX_HOME || path.join(os.homedir(), '.codex'));
    const checks = [];
    const finalPhase = options.phase !== 'preflight';

    checks.push(deps.platform === 'win32'
        ? makeCheck('platform.windows', 'PASS', 'Windows host detected.')
        : makeCheck('platform.windows', 'FAIL', `Unsupported platform: ${deps.platform}.`, 'Run the machine kit on Windows.'));

    const nodeVersion = process.version;
    checks.push(versionMajor(nodeVersion) === 24
        ? makeCheck('tool.node', 'PASS', `Node ${nodeVersion} matches supported major 24.`)
        : makeCheck('tool.node', 'FAIL', `Node ${nodeVersion} does not match supported major 24.`, 'Install Node 24 LTS.'));

    const npmVersion = commandVersion('npm', ['--version'], deps);
    checks.push(npmVersion && versionMajor(npmVersion) === 11
        ? makeCheck('tool.npm', 'PASS', `npm ${npmVersion} matches supported major 11.`)
        : makeCheck('tool.npm', 'FAIL', `npm ${npmVersion || 'missing'} does not match supported major 11.`, 'Install npm 11 with Node 24 LTS.'));

    const gitVersion = commandVersion('git', ['--version'], deps);
    checks.push(gitVersion
        ? makeCheck('tool.git', 'PASS', gitVersion)
        : makeCheck('tool.git', 'FAIL', 'Git is missing.', 'Install Git for Windows.'));

    checks.push(fs.existsSync(path.join(repoRoot, 'package-lock.json'))
        ? makeCheck('repo.lockfile', 'PASS', 'Root package-lock.json is present.')
        : makeCheck('repo.lockfile', 'FAIL', 'Root package-lock.json is missing.', 'Restore the tracked lockfile.'));

    if (finalPhase) {
        checks.push(fs.existsSync(path.join(repoRoot, 'node_modules'))
            ? makeCheck('repo.dependencies', 'PASS', 'node_modules is installed.')
            : makeCheck('repo.dependencies', 'FAIL', 'node_modules is missing.', 'Run npm ci.'));
    }

    const programFiles = deps.env.ProgramFiles || deps.env.PROGRAMFILES || 'C:\\Program Files';
    ILLUSTRATOR_YEARS.forEach((year) => {
        const installPath = path.join(programFiles, 'Adobe', `Adobe Illustrator ${year}`);
        checks.push(fs.existsSync(installPath)
            ? makeCheck(`adobe.illustrator.${year}`, 'PASS', `Illustrator ${year} found at ${installPath}.`)
            : makeCheck(`adobe.illustrator.${year}`, 'FAIL', `Illustrator ${year} is not installed.`, 'Install it through Adobe Creative Cloud.'));
    });

    if (deps.platform === 'win32') {
        CSXS_VERSIONS.forEach((version) => {
            checks.push(queryPlayerDebugMode(version, deps)
                ? makeCheck(`adobe.csxs.${version}`, 'PASS', `CSXS.${version} PlayerDebugMode is enabled.`)
                : makeCheck(`adobe.csxs.${version}`, 'FAIL', `CSXS.${version} PlayerDebugMode is not enabled.`, 'Run npm run setup:dev or set PlayerDebugMode=1 under HKCU.'));
        });
    }

    const templateSource = path.join(repoRoot, 'symbol-cep', 'wedding suite print template.ai');
    const templateGenerated = path.join(repoRoot, 'symbol-cep', 'cep', 'wedding suite print template.ai');
    checks.push(fs.existsSync(templateSource)
        ? makeCheck('asset.wedding-template.source', 'PASS', 'Tracked wedding suite template is present.')
        : makeCheck('asset.wedding-template.source', 'FAIL', 'Tracked wedding suite template is missing.', 'Restore the product asset from Git.'));
    if (finalPhase) {
        checks.push(fs.existsSync(templateGenerated)
            ? makeCheck('asset.wedding-template.generated', 'PASS', 'Generated CEP template copy is present.')
            : makeCheck('asset.wedding-template.generated', 'FAIL', 'Generated CEP template copy is missing.', 'Run npm run build:symbol.'));
    }

    const extensionRoot = path.join(deps.env.APPDATA || '', 'Adobe', 'CEP', 'extensions');
    if (finalPhase) {
        WRAPPERS.forEach((wrapper) => {
            const wrapperRoot = path.join(extensionRoot, wrapper.name);
            const probePath = wrapper.name.startsWith('com.dinhson.toolkit')
                ? path.join(wrapperRoot, 'app')
                : path.join(wrapperRoot, 'js');
            const expectedPath = path.join(repoRoot, ...wrapper.probe);
            const actualRealPath = resolveRealPath(probePath);
            const expectedRealPath = resolveRealPath(expectedPath);
            checks.push(actualRealPath && expectedRealPath && actualRealPath === expectedRealPath
                ? makeCheck(`cep.wrapper.${wrapper.name}`, 'PASS', `${wrapper.name} resolves to the current repo.`)
                : makeCheck(`cep.wrapper.${wrapper.name}`, 'FAIL', `${wrapper.name} is missing or points elsewhere.`, 'Run npm run install:cep-live-links.'));
        });

        LEGACY_WRAPPERS.forEach((name) => {
            const legacyPath = path.join(extensionRoot, name);
            if (fs.existsSync(legacyPath)) {
                checks.push(makeCheck(`cep.legacy.${name}`, 'WARN', `Legacy wrapper remains: ${name}.`, 'Close Illustrator and remove it manually if no longer needed.', 'advisory'));
            }
        });
    }

    checks.push(fs.existsSync(codexHome)
        ? makeCheck('codex.home', 'PASS', `CODEX_HOME found at ${codexHome}.`)
        : makeCheck('codex.home', 'FAIL', `CODEX_HOME is missing at ${codexHome}.`, 'Install Codex and sign in again.'));

    REQUIRED_SKILLS.forEach((skillName) => {
        const skillPath = path.join(codexHome, 'skills', skillName, 'SKILL.md');
        checks.push(fs.existsSync(skillPath)
            ? makeCheck(`codex.skill.${skillName}`, 'PASS', `${skillName} is installed.`)
            : makeCheck(`codex.skill.${skillName}`, 'FAIL', `${skillName} is missing.`, 'Install the private Codex workstation config.'));
    });

    const configPath = path.join(codexHome, 'config.toml');
    const configText = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
    REQUIRED_PLUGINS.forEach((pluginId) => {
        const enabled = isPluginEnabled(configText, pluginId);
        checks.push(enabled
            ? makeCheck(`codex.plugin.${pluginId}`, 'PASS', `${pluginId} is enabled in config.`)
            : makeCheck(`codex.plugin.${pluginId}`, 'WARN', `${pluginId} is not enabled in config.`, 'Reinstall or enable the plugin after signing in.', 'advisory'));
    });

    if (options.codexConfig) {
        const installerPath = path.join(path.resolve(options.codexConfig), 'install.ps1');
        checks.push(fs.existsSync(installerPath)
            ? makeCheck('codex.portable-config', 'PASS', 'Private Codex config installer is available.')
            : makeCheck('codex.portable-config', 'FAIL', `Private Codex config installer is missing: ${installerPath}`, 'Clone codex-workstation-config.'));
    }

    if (options.fontInventory) {
        try {
            const expectedFonts = readFontInventory(path.resolve(options.fontInventory));
            const installed = installedFontNames(deps.env);
            const missing = expectedFonts.filter((fontName) => !installed.has(fontName));
            checks.push(missing.length === 0
                ? makeCheck('fonts.inventory', 'PASS', `${expectedFonts.length} inventoried font files are present.`)
                : makeCheck('fonts.inventory', 'WARN', `${missing.length} inventoried font files are missing.`, `Restore licensed fonts: ${missing.slice(0, 10).join(', ')}`, 'advisory'));
        } catch (error) {
            checks.push(makeCheck('fonts.inventory', 'WARN', error.message, 'Provide a valid fonts.json inventory.', 'advisory'));
        }
    } else if (finalPhase) {
        checks.push(makeCheck('fonts.inventory', 'WARN', 'No font inventory was provided.', 'Pass --font-inventory from the encrypted backup/private config repo.', 'advisory'));
    }

    if (finalPhase && !options.skipPorts) {
        const portResults = await Promise.all(DEBUG_PORTS.map(async (entry) => ({
            ...entry,
            open: await deps.checkPort(entry.port)
        })));
        portResults.forEach((entry) => {
            checks.push(entry.open
                ? makeCheck(`cep.port.${entry.id}`, 'PASS', `Debug port ${entry.port} is open.`)
                : makeCheck(`cep.port.${entry.id}`, 'WARN', `Debug port ${entry.port} is closed.`, 'Open the matching test/dev panel before smoke testing.', 'advisory'));
        });
    }

    return {
        version: CONTRACT_VERSION,
        status: summarizeChecks(checks),
        checks
    };
}

function printHumanReport(report) {
    report.checks.forEach((check) => {
        console.log(`[${check.status}] ${check.id}: ${check.message}`);
        if (check.remediation && check.status !== 'PASS') {
            console.log(`       ${check.remediation}`);
        }
    });
    console.log(`Doctor status: ${report.status}`);
}

async function main() {
    try {
        const args = parseCliArgs(process.argv.slice(2), {
            boolean: ['json', 'skip-ports'],
            value: ['repo-root', 'codex-home', 'codex-config', 'font-inventory']
        });
        const report = await collectDoctorReport({
            repoRoot: args['repo-root'],
            codexHome: args['codex-home'],
            codexConfig: args['codex-config'],
            fontInventory: args['font-inventory'],
            skipPorts: args['skip-ports']
        });
        if (args.json) {
            console.log(JSON.stringify(report, null, 2));
        } else {
            printHumanReport(report);
        }
        process.exitCode = report.status === 'fail' ? 1 : 0;
    } catch (error) {
        console.error(`[doctor:dev] ${error.message}`);
        process.exitCode = 2;
    }
}

module.exports = {
    CSXS_VERSIONS,
    DEBUG_PORTS,
    ILLUSTRATOR_YEARS,
    LEGACY_WRAPPERS,
    REQUIRED_PLUGINS,
    REQUIRED_SKILLS,
    WRAPPERS,
    checkPort,
    collectDoctorReport,
    isPluginEnabled,
    printHumanReport,
    versionMajor
};

if (require.main === module) {
    main();
}
