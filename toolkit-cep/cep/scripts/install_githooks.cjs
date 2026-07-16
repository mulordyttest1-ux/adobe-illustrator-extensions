const { execFileSync } = require('child_process');
const { REPO_ROOT } = require('./shell_freeze_policy.cjs');

function installHooks(options = {}) {
    const cwd = options.cwd || REPO_ROOT;
    const hooksPath = options.hooksPath || '.githooks';
    const execFileSyncFn = options.execFileSyncFn || execFileSync;
    const output = options.output || process.stdout;

    try {
        execFileSyncFn('git', ['config', 'core.hooksPath', hooksPath], {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe']
        });
    } catch (error) {
        const message = error && error.message ? error.message : 'Unable to configure git hooksPath.';
        throw new Error(message);
    }

    output.write(`[toolkit-shell-freeze] Configured git hooksPath to ${hooksPath}.\n`);
    return {
        cwd,
        hooksPath
    };
}

module.exports = {
    installHooks
};

if (require.main === module) {
    installHooks();
}
