const { execFileSync } = require('child_process');
const {
    REPO_ROOT,
    classifyToolkitShellFreezePath
} = require('./shell_freeze_policy.cjs');

function uniqueSortedPaths(paths) {
    return Array.from(new Set(paths.filter(Boolean))).sort();
}

function parseNullSeparatedPaths(output) {
    return uniqueSortedPaths(String(output || '').split('\0').filter(Boolean).map((entry) => entry.replace(/\\/g, '/')));
}

function runGitCommand(args, options = {}) {
    const execFileSyncFn = options.execFileSyncFn || execFileSync;
    const cwd = options.cwd || REPO_ROOT;

    return execFileSyncFn('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

function collectWorktreeChangedPaths(options = {}) {
    let trackedOutput;

    try {
        trackedOutput = runGitCommand(['diff', '--name-only', '-z', 'HEAD', '--'], options);
    } catch (error) {
        trackedOutput = runGitCommand(['diff', '--name-only', '-z', '--'], options);
    }

    const untrackedOutput = runGitCommand(['ls-files', '--others', '--exclude-standard', '-z', '--'], options);
    return uniqueSortedPaths([
        ...parseNullSeparatedPaths(trackedOutput),
        ...parseNullSeparatedPaths(untrackedOutput)
    ]);
}

function collectStagedChangedPaths(options = {}) {
    const stagedOutput = runGitCommand(['diff', '--cached', '--name-only', '-z', '--'], options);
    return parseNullSeparatedPaths(stagedOutput);
}

function collectChangedPaths(options = {}) {
    const mode = options.mode === 'staged' ? 'staged' : 'worktree';
    return mode === 'staged'
        ? collectStagedChangedPaths(options)
        : collectWorktreeChangedPaths(options);
}

function evaluateShellFreezePaths(changedPaths) {
    const classifications = changedPaths.map((filePath) => classifyToolkitShellFreezePath(filePath));
    const violations = classifications
        .filter((entry) => entry.scope === 'frozen')
        .map((entry) => entry.repoPath);

    return {
        classifications,
        violations: uniqueSortedPaths(violations)
    };
}

function writeLine(stream, message) {
    stream.write(String(message) + '\n');
}

function buildViolationMessage(violations) {
    return [
        '[toolkit-shell-freeze] Toolkit shell is frozen for V1.',
        '[toolkit-shell-freeze] Approval is required before editing these files:',
        ...violations.map((filePath) => '[toolkit-shell-freeze] - ' + filePath),
        '[toolkit-shell-freeze] If this is an approved shell change, rerun with TOOLKIT_ALLOW_SHELL_CHANGE=1.'
    ].join('\n');
}

function buildOverrideMessage(violations) {
    return [
        '[toolkit-shell-freeze] WARNING: TOOLKIT_ALLOW_SHELL_CHANGE=1 bypassed the frozen shell guard.',
        ...violations.map((filePath) => '[toolkit-shell-freeze] - ' + filePath)
    ].join('\n');
}

function runShellFreezeCheck(options = {}) {
    const mode = options.mode === 'staged' ? 'staged' : 'worktree';
    const output = options.output || process.stdout;
    const errorOutput = options.errorOutput || process.stderr;
    const allowShellChange = options.allowShellChange === true || process.env.TOOLKIT_ALLOW_SHELL_CHANGE === '1';
    const changedPaths = options.changedPaths || collectChangedPaths({
        mode,
        cwd: options.cwd,
        execFileSyncFn: options.execFileSyncFn
    });
    const evaluation = evaluateShellFreezePaths(changedPaths);

    if (evaluation.violations.length === 0) {
        writeLine(output, `[toolkit-shell-freeze] OK: no frozen toolkit shell changes detected in ${mode} mode.`);
        return {
            ok: true,
            mode,
            changedPaths,
            violationPaths: [],
            usedOverride: false
        };
    }

    if (allowShellChange) {
        writeLine(output, buildOverrideMessage(evaluation.violations));
        return {
            ok: true,
            mode,
            changedPaths,
            violationPaths: evaluation.violations,
            usedOverride: true
        };
    }

    writeLine(errorOutput, buildViolationMessage(evaluation.violations));
    return {
        ok: false,
        mode,
        changedPaths,
        violationPaths: evaluation.violations,
        usedOverride: false
    };
}

module.exports = {
    collectChangedPaths,
    collectStagedChangedPaths,
    collectWorktreeChangedPaths,
    evaluateShellFreezePaths,
    runShellFreezeCheck
};

if (require.main === module) {
    const args = process.argv.slice(2);
    const result = runShellFreezeCheck({
        mode: args.indexOf('--staged') >= 0 ? 'staged' : 'worktree'
    });

    process.exitCode = result.ok ? 0 : 1;
}
