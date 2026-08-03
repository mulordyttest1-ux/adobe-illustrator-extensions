const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    REQUIRED_CONTEXT_FILES,
    REQUIRED_ROOT_SCRIPTS,
    classifySourcePath,
    inspectAgentReadiness
} = require('./check_agent_ready.cjs');

function createFixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-ready-'));
    for (const relativePath of REQUIRED_CONTEXT_FILES) {
        const target = path.join(root, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, relativePath === 'AGENT_CONTEXT.md'
            ? [
                '# Agent Context',
                '## Product Map',
                '## Change Protocol',
                '## Validation Matrix',
                '## Legacy Policy',
                '## Completion Evidence'
            ].join('\n')
            : 'fixture\n');
    }
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
        scripts: Object.fromEntries(REQUIRED_ROOT_SCRIPTS.map((name) => [name, 'fixture']))
    }));
    const specRoot = path.join(root, 'specs', '001-fixture');
    fs.mkdirSync(specRoot, { recursive: true });
    for (const fileName of ['spec.md', 'plan.md', 'tasks.md']) {
        fs.writeFileSync(path.join(specRoot, fileName), 'fixture\n');
    }
    return root;
}

test('agent-readiness checker accepts a complete repository contract', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));

    const result = inspectAgentReadiness(root, { untrackedFiles: [] });

    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
});

test('agent-readiness checker catches missing context, scripts, and spec files', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));

    fs.rmSync(path.join(root, 'toolkit-cep', 'FEATURE_MAP.md'));
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    delete packageJson.scripts.verify;
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson));
    fs.rmSync(path.join(root, 'specs', '001-fixture', 'tasks.md'));

    const result = inspectAgentReadiness(root, { untrackedFiles: [] });

    assert.ok(result.errors.some((message) => message.includes('toolkit-cep/FEATURE_MAP.md')));
    assert.ok(result.errors.some((message) => message.includes('verify')));
    assert.ok(result.errors.some((message) => message.includes('tasks.md')));
});

test('strict mode rejects untracked source while default mode warns', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const untrackedFiles = ['src/new.js', 'notes.txt'];

    const defaultResult = inspectAgentReadiness(root, { untrackedFiles });
    const strictResult = inspectAgentReadiness(root, { strict: true, untrackedFiles });

    assert.equal(defaultResult.errors.length, 0);
    assert.ok(defaultResult.warnings.some((message) => message.includes('1 source/context/test')));
    assert.ok(strictResult.errors.some((message) => message.includes('1 source/context/test')));
});

test('cancelled spec directories are explicit and cannot contain active spec files', (t) => {
    const root = createFixture();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const cancelledRoot = path.join(root, 'specs', '002-cancelled');
    fs.mkdirSync(cancelledRoot);
    fs.writeFileSync(path.join(cancelledRoot, 'CANCELLED.md'), 'Status: cancelled\n');

    let result = inspectAgentReadiness(root, { untrackedFiles: [] });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);

    fs.writeFileSync(path.join(cancelledRoot, 'spec.md'), 'active\n');
    result = inspectAgentReadiness(root, { untrackedFiles: [] });
    assert.ok(result.errors.some((message) => message.includes('also contains active files')));
});

test('untracked source classification exposes ownership for GPT review', () => {
    assert.equal(classifySourcePath('specs/010-agent/spec.md'), 'spec');
    assert.equal(
        classifySourcePath('symbol-cep/cep/debug_scripts/smoke_suites/host/test.cjs'),
        'test-smoke'
    );
    assert.equal(
        classifySourcePath('symbol-cep/cep/js/features/example.js'),
        'product-source'
    );
    assert.equal(classifySourcePath('scripts/check_agent_ready.cjs'), 'agent-tooling');
    assert.equal(classifySourcePath('docs/operator.md'), 'docs-config');
});
