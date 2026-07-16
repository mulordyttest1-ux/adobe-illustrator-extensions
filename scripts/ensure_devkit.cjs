#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');
const { parseCliArgs } = require('./machine_migration_common.cjs');

function buildPowerShellArgs(options = {}) {
    const args = [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', path.join(__dirname, 'ensure-devkit.ps1')
    ];
    if (options.lockFile) args.push('-LockFile', path.resolve(options.lockFile));
    if (options.target) args.push('-TargetPath', path.resolve(options.target));
    if (options.json) args.push('-Json');
    if (options.dryRun) args.push('-DryRun');
    return args;
}

function main() {
    try {
        if (process.platform !== 'win32') {
            throw new Error('The private Adobe CEP devkit is supported on Windows only.');
        }
        const args = parseCliArgs(process.argv.slice(2), {
            boolean: ['json', 'dry-run'],
            value: ['lock-file', 'target']
        });
        const result = spawnSync('powershell.exe', buildPowerShellArgs({
            lockFile: args['lock-file'],
            target: args.target,
            json: args.json,
            dryRun: args['dry-run']
        }), { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', windowsHide: true });
        if (result.error) throw result.error;
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        process.exitCode = typeof result.status === 'number' ? result.status : 2;
    } catch (error) {
        console.error(`[devkit:ensure] ${error.message}`);
        process.exitCode = 2;
    }
}

module.exports = { buildPowerShellArgs };

if (require.main === module) main();
