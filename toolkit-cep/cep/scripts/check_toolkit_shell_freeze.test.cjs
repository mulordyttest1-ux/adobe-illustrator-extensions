const test = require('node:test');
const assert = require('node:assert/strict');

const {
    classifyToolkitShellFreezePath
} = require('./shell_freeze_policy.cjs');
const {
    collectChangedPaths,
    evaluateShellFreezePaths,
    runShellFreezeCheck
} = require('./check_toolkit_shell_freeze.cjs');

function createOutputBuffer() {
    const lines = [];

    return {
        lines,
        write(chunk) {
            lines.push(String(chunk));
        }
    };
}

test('modules and docs stay in the safe zone while shell files are frozen', () => {
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/cep/modules/add_camera_marks/run.jsx').scope,
        'safe'
    );
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/AGENTS.md').scope,
        'safe'
    );
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/cep/js/features/shell/toolkitShell.js').scope,
        'frozen'
    );
});

test('generated artifacts and bundle outputs are ignored', () => {
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/cep/js/bundle.js').scope,
        'ignored'
    );
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/cep/.generated/module_catalog.js').scope,
        'ignored'
    );
});

test('tests under frozen directories remain safe to edit', () => {
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/cep/scripts/check_toolkit_shell_freeze.test.cjs').scope,
        'safe'
    );
    assert.equal(
        classifyToolkitShellFreezePath('toolkit-cep/cep/js/features/run/commandRunner.test.js').scope,
        'safe'
    );
});

test('evaluateShellFreezePaths returns only frozen toolkit paths as violations', () => {
    const evaluation = evaluateShellFreezePaths([
        'toolkit-cep/cep/modules/add_camera_marks/run.jsx',
        'toolkit-cep/cep/js/app.js',
        'toolkit-cep/cep/js/bundle.js',
        'README.md'
    ]);

    assert.deepEqual(evaluation.violations, ['toolkit-cep/cep/js/app.js']);
});

test('collectChangedPaths supports staged mode', () => {
    const calls = [];
    const changedPaths = collectChangedPaths({
        mode: 'staged',
        execFileSyncFn(command, args) {
            calls.push([command, ...args].join(' '));
            return 'toolkit-cep/cep/js/app.js\0toolkit-cep/cep/modules/add_camera_marks/run.jsx\0';
        }
    });

    assert.deepEqual(changedPaths, [
        'toolkit-cep/cep/js/app.js',
        'toolkit-cep/cep/modules/add_camera_marks/run.jsx'
    ]);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /diff --cached --name-only -z --/);
});

test('runShellFreezeCheck fails with approval guidance when frozen files change', () => {
    const output = createOutputBuffer();
    const errorOutput = createOutputBuffer();
    const result = runShellFreezeCheck({
        changedPaths: [
            'toolkit-cep/cep/js/app.js',
            'toolkit-cep/cep/modules/add_camera_marks/run.jsx'
        ],
        output,
        errorOutput
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.violationPaths, ['toolkit-cep/cep/js/app.js']);
    assert.match(errorOutput.lines.join(''), /Toolkit shell is frozen for V1/);
    assert.match(errorOutput.lines.join(''), /TOOLKIT_ALLOW_SHELL_CHANGE=1/);
    assert.equal(output.lines.length, 0);
});

test('runShellFreezeCheck allows approved shell edits with an override warning', () => {
    const output = createOutputBuffer();
    const errorOutput = createOutputBuffer();
    const result = runShellFreezeCheck({
        changedPaths: ['toolkit-cep/cep/js/app.js'],
        allowShellChange: true,
        output,
        errorOutput
    });

    assert.equal(result.ok, true);
    assert.equal(result.usedOverride, true);
    assert.match(output.lines.join(''), /bypassed the frozen shell guard/);
    assert.equal(errorOutput.lines.length, 0);
});
