const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const { collectModuleDefinitions } = require('./generate_toolkit_artifacts.cjs');
const {
    deriveTitleFromId,
    normalizePromptAnswers,
    renderRunJsxSource,
    scaffoldToolkitModule
} = require('./scaffold_toolkit_module.cjs');

function createProjectFixture() {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-scaffold-'));
    fs.mkdirSync(path.join(projectRoot, 'modules'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'jsx'), { recursive: true });
    return projectRoot;
}

function createOutputBuffer() {
    const lines = [];

    return {
        lines,
        write(chunk) {
            lines.push(String(chunk));
        }
    };
}

test('normalizePromptAnswers converts prompt strings into a valid module manifest', () => {
    const manifest = normalizePromptAnswers({
        id: 'quick_mask',
        title: '',
        buttonLabel: '',
        category: '',
        order: '',
        aliases: 'mask, quick, mask',
        description: '',
        favoriteRank: '',
        requiresDocument: 'yes',
        requiresSelection: 'no',
        successMessage: ''
    });

    assert.deepEqual(manifest, {
        id: 'quick_mask',
        title: 'Quick Mask',
        buttonLabel: 'Quick Mask',
        category: 'General',
        order: 100,
        aliases: ['mask', 'quick'],
        description: 'Run Quick Mask.',
        favoriteRank: 0,
        requiresDocument: true,
        requiresSelection: false,
        successMessage: ''
    });
});

test('renderRunJsxSource registers the expected handler id and placeholder result', () => {
    const source = renderRunJsxSource({
        id: 'quick_mask'
    }, {
        templatesDir: path.join(__dirname, 'templates')
    });
    const context = {
        $: {
            global: {}
        }
    };

    assert.match(source, /\$\.global\.ToolkitModules\["quick_mask"\]/);
    vm.runInNewContext(source, context);

    assert.equal(typeof context.$.global.ToolkitModules['quick_mask'], 'function');

    const result = context.$.global.ToolkitModules['quick_mask']();
    assert.equal(result.success, false);
    assert.equal(result.errorCode, 'TOOLKIT_MODULE_NOT_IMPLEMENTED');
    assert.match(result.message, /quick_mask/);
});

test('scaffoldToolkitModule rejects duplicate module folders', async () => {
    const projectRoot = createProjectFixture();
    const moduleDir = path.join(projectRoot, 'modules', 'quick_mask');
    fs.mkdirSync(moduleDir, { recursive: true });

    await assert.rejects(
        () => scaffoldToolkitModule({
            projectRoot,
            rawAnswers: {
                id: 'quick_mask',
                title: 'Quick Mask',
                buttonLabel: 'Quick Mask',
                category: 'General',
                order: '100',
                aliases: 'quick_mask',
                description: 'Run Quick Mask.',
                favoriteRank: '0',
                requiresDocument: 'no',
                requiresSelection: 'no',
                successMessage: ''
            },
            output: createOutputBuffer(),
            buildRunner: async () => { }
        }),
        /Toolkit module already exists/
    );
});

test('scaffoldToolkitModule creates files, invokes build validation, and stays generator-compatible', async () => {
    const projectRoot = createProjectFixture();
    const output = createOutputBuffer();
    let buildCalls = 0;

    const result = await scaffoldToolkitModule({
        projectRoot,
        rawAnswers: {
            id: 'quick_mask',
            title: '',
            buttonLabel: '',
            category: '',
            order: '',
            aliases: '',
            description: '',
            favoriteRank: '',
            requiresDocument: 'yes',
            requiresSelection: 'yes',
            successMessage: 'Mask applied.'
        },
        output,
        buildRunner: async ({ projectRoot: buildProjectRoot }) => {
            buildCalls += 1;
            assert.equal(buildProjectRoot, projectRoot);
        }
    });

    assert.equal(result.manifest.id, 'quick_mask');
    assert.equal(buildCalls, 1);
    assert.equal(fs.existsSync(result.manifestPath), true);
    assert.equal(fs.existsSync(result.runPath), true);
    assert.match(output.lines.join(''), /Created toolkit module/);

    const definitions = collectModuleDefinitions({ projectRoot });
    assert.equal(definitions.length, 1);
    assert.equal(definitions[0].id, 'quick_mask');
    assert.equal(definitions[0].requiresDocument, true);
    assert.equal(definitions[0].requiresSelection, true);
});

test('scaffoldToolkitModule keeps created files when post-create build validation fails', async () => {
    const projectRoot = createProjectFixture();
    const output = createOutputBuffer();

    await assert.rejects(
        () => scaffoldToolkitModule({
            projectRoot,
            rawAnswers: {
                id: 'failing_module',
                title: 'Failing Module',
                buttonLabel: 'Failing Module',
                category: 'General',
                order: '100',
                aliases: 'failing_module',
                description: 'Run Failing Module.',
                favoriteRank: '0',
                requiresDocument: 'no',
                requiresSelection: 'no',
                successMessage: ''
            },
            output,
            buildRunner: async () => {
                throw new Error('simulated build failure');
            }
        }),
        /simulated build failure/
    );

    assert.equal(fs.existsSync(path.join(projectRoot, 'modules', 'failing_module', 'module.json')), true);
    assert.equal(fs.existsSync(path.join(projectRoot, 'modules', 'failing_module', 'run.jsx')), true);
    assert.match(output.lines.join(''), /Files were kept/);
});

test('deriveTitleFromId converts ids into a readable default title', () => {
    assert.equal(deriveTitleFromId('quick_mask'), 'Quick Mask');
    assert.equal(deriveTitleFromId('fit-artboard-now'), 'Fit Artboard Now');
});
