#!/usr/bin/env node

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

    const doctorArgs = ['scripts/repo_doctor.cjs'];
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
        console.log(`[setup:repo] ${step.description}`);
        runFn(step.command, step.args, { cwd: step.cwd, stdio: 'inherit' });
    });
    return steps;
}

function main() {
    try {
        const args = parseCliArgs(process.argv.slice(2), {
            boolean: ['dry-run', 'skip-verify', 'skip-cep-debug'],
            value: ['repo-root']
        });
        runSetup({
            repoRoot: args['repo-root'],
            dryRun: args['dry-run'],
            skipVerify: args['skip-verify'],
            skipCepDebug: args['skip-cep-debug']
        });
    } catch (error) {
        console.error(`[setup:repo] ${error.message}`);
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
