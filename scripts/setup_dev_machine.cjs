#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    REPO_ROOT,
    commandAvailable,
    parseCliArgs,
    run
} = require('./machine_migration_common.cjs');
const { ILLUSTRATOR_YEARS, versionMajor } = require('./dev_machine_doctor.cjs');

function buildSetupSteps(options = {}) {
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const steps = [
        { command: 'npm', args: ['ci'], cwd: repoRoot, description: 'Install frozen dependencies.' },
        { command: 'npm', args: ['run', 'hooks:install'], cwd: repoRoot, description: 'Install repository Git hooks.' }
    ];

    if (!options.skipVerify) {
        steps.push({ command: 'npm', args: ['run', 'verify'], cwd: repoRoot, description: 'Run the CI-safe verification gate.' });
    }

    if (!options.skipCepDebug) {
        [11, 12].forEach((version) => {
            steps.push({
                command: 'reg.exe',
                args: ['add', `HKCU\\Software\\Adobe\\CSXS.${version}`, '/v', 'PlayerDebugMode', '/t', 'REG_SZ', '/d', '1', '/f'],
                cwd: repoRoot,
                description: `Enable unsigned CEP development for CSXS.${version}.`
            });
        });
    }

    steps.push({
        command: 'npm',
        args: ['run', 'install:cep-live-links'],
        cwd: repoRoot,
        description: 'Create the six managed CEP wrappers.'
    });

    if (options.codexConfig) {
        const codexConfig = path.resolve(options.codexConfig);
        steps.push({
            command: 'powershell.exe',
            args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(codexConfig, 'install.ps1'), '-AdobeRepoPath', repoRoot],
            cwd: codexConfig,
            description: 'Install safe Codex config, skills, rules, and plugin manifest.'
        });
    }

    const doctorArgs = ['scripts/dev_machine_doctor.cjs'];
    if (options.codexConfig) {
        doctorArgs.push('--codex-config', path.resolve(options.codexConfig));
        const fontInventory = path.join(path.resolve(options.codexConfig), 'inventories', 'fonts.json');
        if (fs.existsSync(fontInventory)) {
            doctorArgs.push('--font-inventory', fontInventory);
        }
    }
    steps.push({ command: process.execPath, args: doctorArgs, cwd: repoRoot, description: 'Run final machine doctor.' });

    return steps;
}

function validatePrerequisites(options = {}, injected = {}) {
    const platform = injected.platform || process.platform;
    const env = injected.env || process.env;
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const problems = [];

    if (platform !== 'win32') {
        problems.push(`Windows is required; detected ${platform}.`);
    }
    if (versionMajor(process.version) !== 24) {
        problems.push(`Node 24 is required; detected ${process.version}.`);
    }
    if (!commandAvailable('git')) {
        problems.push('Git is required.');
    }
    if (!commandAvailable('npm')) {
        problems.push('npm is required.');
    }
    const programFiles = env.ProgramFiles || env.PROGRAMFILES || 'C:\\Program Files';
    ILLUSTRATOR_YEARS.forEach((year) => {
        const installPath = path.join(programFiles, 'Adobe', `Adobe Illustrator ${year}`);
        if (!fs.existsSync(installPath)) {
            problems.push(`Illustrator ${year} is missing at ${installPath}.`);
        }
    });
    if (!fs.existsSync(path.join(repoRoot, 'symbol-cep', 'wedding suite print template.ai'))) {
        problems.push('The tracked wedding suite Illustrator template is missing.');
    }
    if (options.codexConfig && !fs.existsSync(path.join(path.resolve(options.codexConfig), 'install.ps1'))) {
        problems.push(`Codex config installer is missing under ${path.resolve(options.codexConfig)}.`);
    }
    return problems;
}

function runSetup(options = {}, injected = {}) {
    const runFn = injected.run || run;
    const steps = buildSetupSteps(options);
    if (options.dryRun) {
        steps.forEach((step, index) => {
            console.log(`${index + 1}. ${step.description}`);
            console.log(`   ${step.command} ${step.args.map((value) => JSON.stringify(value)).join(' ')}`);
        });
        return steps;
    }

    const problems = validatePrerequisites(options, injected);
    if (problems.length > 0) {
        throw new Error(`Setup preflight failed:\n- ${problems.join('\n- ')}`);
    }

    steps.forEach((step) => {
        console.log(`[setup:dev] ${step.description}`);
        runFn(step.command, step.args, { cwd: step.cwd, stdio: 'inherit' });
    });
    return steps;
}

function main() {
    try {
        const args = parseCliArgs(process.argv.slice(2), {
            boolean: ['dry-run', 'skip-verify', 'skip-cep-debug'],
            value: ['repo-root', 'codex-config']
        });
        runSetup({
            repoRoot: args['repo-root'],
            codexConfig: args['codex-config'],
            dryRun: args['dry-run'],
            skipVerify: args['skip-verify'],
            skipCepDebug: args['skip-cep-debug'],
            codexHome: process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
        });
    } catch (error) {
        console.error(`[setup:dev] ${error.message}`);
        process.exitCode = 2;
    }
}

module.exports = {
    buildSetupSteps,
    runSetup,
    validatePrerequisites
};

if (require.main === module) {
    main();
}
