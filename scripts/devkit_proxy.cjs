#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCRIPT_BY_MODE = {
    bootstrap: 'bootstrap.ps1',
    doctor: 'doctor.ps1',
    backup: 'backup-machine.ps1',
    restore: 'restore-machine.ps1'
};

function toPowerShellArguments(argv) {
    const aliases = { 'dry-run': 'DryRun', 'skip-verify': 'SkipVerify', 'seven-zip': 'SevenZip' };
    const converted = [];
    for (const token of argv) {
        if (!token.startsWith('--')) {
            converted.push(token);
            continue;
        }
        const equalsIndex = token.indexOf('=');
        const raw = token.slice(2, equalsIndex === -1 ? undefined : equalsIndex);
        const name = aliases[raw] || raw.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        converted.push(`-${name}`);
        if (equalsIndex !== -1) converted.push(token.slice(equalsIndex + 1));
    }
    return converted;
}

function runPowerShell(scriptPath, args) {
    return spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        windowsHide: true
    });
}

function main() {
    const [mode, ...forwarded] = process.argv.slice(2);
    if (process.platform !== 'win32' || !SCRIPT_BY_MODE[mode]) {
        console.error('[devkit-proxy] Usage on Windows: devkit_proxy.cjs <bootstrap|doctor|backup|restore> [args]');
        process.exitCode = 2;
        return;
    }

    console.warn(`[deprecated] This command is a compatibility proxy. Prefer the matching adobe-illustrator-devkit entrypoint.`);

    const ensure = spawnSync('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'ensure-devkit.ps1'), '-Json'
    ], { cwd: REPO_ROOT, encoding: 'utf8', windowsHide: true });
    if (ensure.stdout) process.stderr.write(ensure.stdout);
    if (ensure.status !== 0) {
        if (ensure.stderr) process.stderr.write(ensure.stderr);
        process.exitCode = typeof ensure.status === 'number' ? ensure.status : 2;
        return;
    }

    let report;
    try { report = JSON.parse(ensure.stdout); } catch (error) {
        console.error(`[devkit-proxy] Invalid ensure JSON: ${error.message}`);
        process.exitCode = 2;
        return;
    }
    const scriptPath = path.join(report.devkitPath, SCRIPT_BY_MODE[mode]);
    if (!fs.existsSync(scriptPath)) {
        console.error(`[devkit-proxy] Missing devkit entrypoint: ${scriptPath}`);
        process.exitCode = 1;
        return;
    }
    const args = ['-ProductPath', REPO_ROOT, ...toPowerShellArguments(forwarded)];
    const result = runPowerShell(scriptPath, args);
    process.exitCode = typeof result.status === 'number' ? result.status : 2;
}

module.exports = { SCRIPT_BY_MODE, toPowerShellArguments };

if (require.main === module) main();
