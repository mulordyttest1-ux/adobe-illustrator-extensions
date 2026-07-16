const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { installHooks } = require('./install_githooks.cjs');
const { REPO_ROOT } = require('./shell_freeze_policy.cjs');

function createOutputBuffer() {
    const lines = [];

    return {
        lines,
        write(chunk) {
            lines.push(String(chunk));
        }
    };
}

test('installHooks configures core.hooksPath to .githooks', () => {
    const output = createOutputBuffer();
    const calls = [];
    const result = installHooks({
        cwd: REPO_ROOT,
        output,
        execFileSyncFn(command, args, options) {
            calls.push({
                command,
                args,
                options
            });
            return '';
        }
    });

    assert.equal(result.hooksPath, '.githooks');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].command, 'git');
    assert.deepEqual(calls[0].args, ['config', 'core.hooksPath', '.githooks']);
    assert.match(output.lines.join(''), /Configured git hooksPath/);
});

test('.githooks/pre-commit runs the staged shell freeze check', () => {
    const hookPath = path.join(REPO_ROOT, '.githooks', 'pre-commit');
    const source = fs.readFileSync(hookPath, 'utf8');

    assert.match(source, /^#!\/bin\/sh/m);
    assert.match(source, /npm run check:toolkit:shell-freeze -- --staged/);
});
