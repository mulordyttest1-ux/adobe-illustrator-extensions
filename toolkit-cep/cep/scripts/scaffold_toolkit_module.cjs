const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');
const { normalizeModuleManifest } = require('./module_contract.cjs');

const DEFAULTS = Object.freeze({
    category: 'General',
    order: 100,
    favoriteRank: 0,
    requiresDocument: false,
    requiresSelection: false,
    successMessage: ''
});

function createReadlinePrompter(options = {}) {
    const rl = readline.createInterface({
        input: options.input || stdin,
        output: options.output || stdout
    });

    return {
        async ask(question) {
            return await rl.question(question);
        },
        async close() {
            await rl.close();
        }
    };
}

function deriveTitleFromId(id) {
    return String(id || '')
        .trim()
        .split(/[_\-\s]+/g)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

function parseIntegerInput(value, defaultValue, fieldName) {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
        return defaultValue;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed)) {
        throw new Error(`Prompt answer "${fieldName}" must be an integer`);
    }

    return parsed;
}

function parseBooleanInput(value, defaultValue, fieldName) {
    const trimmed = String(value || '').trim().toLowerCase();
    if (!trimmed) {
        return defaultValue;
    }

    if (['y', 'yes', 'true', '1'].includes(trimmed)) {
        return true;
    }
    if (['n', 'no', 'false', '0'].includes(trimmed)) {
        return false;
    }

    throw new Error(`Prompt answer "${fieldName}" must be yes or no`);
}

function parseAliasesInput(value, fallbackId) {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
        return [fallbackId];
    }

    return trimmed
        .split(',')
        .map((alias) => alias.trim())
        .filter(Boolean);
}

function normalizePromptAnswers(rawAnswers) {
    const id = String(rawAnswers.id || '').trim();
    const defaultTitle = deriveTitleFromId(id);
    const title = String(rawAnswers.title || '').trim() || defaultTitle;
    const buttonLabel = String(rawAnswers.buttonLabel || '').trim() || title;
    const category = String(rawAnswers.category || '').trim() || DEFAULTS.category;
    const description = String(rawAnswers.description || '').trim() || `Run ${title}.`;
    const successMessage = String(rawAnswers.successMessage || '').trim();

    return normalizeModuleManifest({
        id,
        title,
        buttonLabel,
        category,
        order: parseIntegerInput(rawAnswers.order, DEFAULTS.order, 'order'),
        aliases: parseAliasesInput(rawAnswers.aliases, id),
        description,
        favoriteRank: parseIntegerInput(rawAnswers.favoriteRank, DEFAULTS.favoriteRank, 'favoriteRank'),
        requiresDocument: parseBooleanInput(rawAnswers.requiresDocument, DEFAULTS.requiresDocument, 'requiresDocument'),
        requiresSelection: parseBooleanInput(rawAnswers.requiresSelection, DEFAULTS.requiresSelection, 'requiresSelection'),
        successMessage
    }, `Prompted toolkit module "${id || 'new_module'}"`);
}

function readTemplate(templateName, templatesDir) {
    return fs.readFileSync(path.join(templatesDir, templateName), 'utf8');
}

function renderTemplate(templateSource, replacements) {
    return Object.keys(replacements).reduce((result, token) => (
        result.replace(new RegExp(`{{${token}}}`, 'g'), () => replacements[token])
    ), templateSource);
}

function renderModuleJsonSource(manifest, options = {}) {
    const templatesDir = options.templatesDir || path.join(__dirname, 'templates');
    const templateSource = readTemplate('module.json.template', templatesDir);

    return `${renderTemplate(templateSource, {
        ID_JSON: JSON.stringify(manifest.id),
        TITLE_JSON: JSON.stringify(manifest.title),
        BUTTON_LABEL_JSON: JSON.stringify(manifest.buttonLabel),
        CATEGORY_JSON: JSON.stringify(manifest.category),
        ORDER_JSON: JSON.stringify(manifest.order),
        ALIASES_JSON: JSON.stringify(manifest.aliases, null, 2),
        DESCRIPTION_JSON: JSON.stringify(manifest.description),
        FAVORITE_RANK_JSON: JSON.stringify(manifest.favoriteRank),
        REQUIRES_DOCUMENT_JSON: JSON.stringify(manifest.requiresDocument),
        REQUIRES_SELECTION_JSON: JSON.stringify(manifest.requiresSelection),
        SUCCESS_MESSAGE_JSON: JSON.stringify(manifest.successMessage)
    })}\n`;
}

function renderRunJsxSource(manifest, options = {}) {
    const templatesDir = options.templatesDir || path.join(__dirname, 'templates');
    const templateSource = readTemplate('run.jsx.template', templatesDir);

    return `${renderTemplate(templateSource, {
        ID_JSON: JSON.stringify(manifest.id),
        PLACEHOLDER_MESSAGE_JSON: JSON.stringify(`Toolkit module "${manifest.id}" is not implemented yet.`)
    })}\n`;
}

async function collectPromptAnswers(options = {}) {
    const prompt = options.prompt;
    if (typeof prompt !== 'function') {
        throw new Error('Toolkit scaffolder requires a prompt(question) function');
    }

    const rawAnswers = {};

    rawAnswers.id = await prompt('Module id: ');
    const titleDefault = deriveTitleFromId(rawAnswers.id);
    rawAnswers.title = await prompt(`Title [${titleDefault}]: `);
    rawAnswers.buttonLabel = await prompt(`Button label [${titleDefault || 'same as title'}]: `);
    rawAnswers.category = await prompt(`Category [${DEFAULTS.category}]: `);
    rawAnswers.order = await prompt(`Order [${DEFAULTS.order}]: `);
    rawAnswers.aliases = await prompt(`Aliases (comma-separated) [${String(rawAnswers.id || '').trim()}]: `);
    rawAnswers.description = await prompt(`Description [Run ${titleDefault || String(rawAnswers.id || '').trim()}.]: `);
    rawAnswers.favoriteRank = await prompt(`Favorite rank [${DEFAULTS.favoriteRank}]: `);
    rawAnswers.requiresDocument = await prompt('Requires document? [no]: ');
    rawAnswers.requiresSelection = await prompt('Requires selection? [no]: ');
    rawAnswers.successMessage = await prompt('Success message [optional]: ');

    return rawAnswers;
}

async function runToolkitBuildValidation(options = {}) {
    const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    const output = options.output || stdout;
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    output.write('Running toolkit build validation...\n');

    await new Promise((resolve, reject) => {
        const child = spawn(npmCommand, ['run', 'build'], {
            cwd: projectRoot,
            stdio: 'inherit'
        });

        child.on('error', reject);
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`Toolkit build validation failed with exit code ${code}`));
        });
    });
}

async function scaffoldToolkitModule(options = {}) {
    const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    const modulesDir = options.modulesDir || path.join(projectRoot, 'modules');
    const templatesDir = options.templatesDir || path.join(__dirname, 'templates');
    const prompt = options.prompt;
    const output = options.output || stdout;
    const buildRunner = options.buildRunner || runToolkitBuildValidation;
    const rawAnswers = options.rawAnswers || await collectPromptAnswers({ prompt });
    const manifest = normalizePromptAnswers(rawAnswers);
    const moduleDir = path.join(modulesDir, manifest.id);
    const manifestPath = path.join(moduleDir, 'module.json');
    const runPath = path.join(moduleDir, 'run.jsx');

    if (fs.existsSync(moduleDir)) {
        throw new Error(`Toolkit module already exists: ${moduleDir}`);
    }

    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(manifestPath, renderModuleJsonSource(manifest, { templatesDir }), 'utf8');
    fs.writeFileSync(runPath, renderRunJsxSource(manifest, { templatesDir }), 'utf8');

    output.write(`Created toolkit module at ${moduleDir}\n`);

    try {
        await buildRunner({ projectRoot, output });
    } catch (error) {
        output.write(`Build validation failed after scaffolding. Files were kept at ${moduleDir}\n`);
        throw error;
    }

    output.write(`Toolkit module "${manifest.id}" is ready for implementation.\n`);

    return {
        manifest,
        moduleDir,
        manifestPath,
        runPath
    };
}

async function runCli() {
    const prompter = createReadlinePrompter();

    try {
        await scaffoldToolkitModule({
            prompt: (question) => prompter.ask(question),
            output: stdout
        });
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await prompter.close();
    }
}

module.exports = {
    DEFAULTS,
    collectPromptAnswers,
    createReadlinePrompter,
    deriveTitleFromId,
    normalizePromptAnswers,
    parseAliasesInput,
    parseBooleanInput,
    parseIntegerInput,
    renderModuleJsonSource,
    renderRunJsxSource,
    runToolkitBuildValidation,
    scaffoldToolkitModule
};

if (require.main === module) {
    void runCli();
}
