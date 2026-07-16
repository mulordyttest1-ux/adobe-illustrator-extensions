const fs = require('fs');
const path = require('path');
const { normalizeModuleManifest, createModuleDefinition } = require('./module_contract.cjs');

function readJsonFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectModuleDefinitions(options = {}) {
    const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    const modulesDir = options.modulesDir || path.join(projectRoot, 'modules');
    const jsxRoot = options.jsxRoot || path.join(projectRoot, 'jsx');
    const moduleDirectories = fs.existsSync(modulesDir)
        ? fs.readdirSync(modulesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
        : [];

    const definitions = [];
    const seenIds = new Set();

    moduleDirectories.forEach((directoryEntry) => {
        const moduleDir = path.join(modulesDir, directoryEntry.name);
        const manifestPath = path.join(moduleDir, 'module.json');
        const runPath = path.join(moduleDir, 'run.jsx');
        const context = `Module "${directoryEntry.name}"`;

        if (!fs.existsSync(manifestPath)) {
            throw new Error(`${context}: missing module.json`);
        }
        if (!fs.existsSync(runPath)) {
            throw new Error(`${context}: missing run.jsx`);
        }

        const normalizedManifest = normalizeModuleManifest(readJsonFile(manifestPath), context);
        if (seenIds.has(normalizedManifest.id)) {
            throw new Error(`${context}: duplicate id "${normalizedManifest.id}"`);
        }
        seenIds.add(normalizedManifest.id);

        definitions.push(createModuleDefinition(normalizedManifest, {
            manifestPath,
            runPath,
            jsxRoot
        }));
    });

    definitions.sort((left, right) => {
        if (left.category !== right.category) {
            return left.category.localeCompare(right.category);
        }
        if (left.order !== right.order) {
            return left.order - right.order;
        }
        return left.title.localeCompare(right.title);
    });

    return definitions;
}

function renderCatalogSource(definitions) {
    const publicCatalog = definitions.map((definition) => ({
        id: definition.id,
        title: definition.title,
        buttonLabel: definition.buttonLabel,
        category: definition.category,
        order: definition.order,
        aliases: definition.aliases,
        description: definition.description,
        favoriteRank: definition.favoriteRank,
        requiresDocument: definition.requiresDocument,
        requiresSelection: definition.requiresSelection,
        successMessage: definition.successMessage,
        handler: definition.handler
    }));

    return [
        'export const GENERATED_TOOLKIT_MODULES = Object.freeze(',
        `${JSON.stringify(publicCatalog, null, 4)}`,
        ');',
        ''
    ].join('\n');
}

function renderRegistrySource(definitions) {
    const registryEntries = definitions.map((definition) => ({
        id: definition.id,
        relativePath: definition.jsxRelativeRunPath
    }));

    return [
        '$.global.ToolkitGeneratedModuleRegistry = ',
        `${JSON.stringify(registryEntries, null, 4)};`,
        ''
    ].join('\n');
}

function renderDispatchSource() {
    return [
        'if (typeof ToolkitModuleDispatch === "undefined") {',
        '    ToolkitModuleDispatch = {};',
        '}',
        '',
        'ToolkitModuleDispatch.run = function(commandId, payload) {',
        '    var runtimeState = $.global.__TOOLKIT_HOST_RUNTIME_STATE__ || {};',
        '    var quarantinedById = runtimeState.quarantinedById || {};',
        '    var registry = $.global.ToolkitModules || {};',
        '',
        '    if (quarantinedById[commandId]) {',
        '        return {',
        '            success: false,',
        '            message: quarantinedById[commandId],',
        '            errorCode: "QUARANTINED_TOOLKIT_COMMAND",',
        '            data: null',
        '        };',
        '    }',
        '',
        '    try {',
        '        var handler = registry[commandId];',
        '        if (typeof handler !== "function") {',
        '            return {',
        '                success: false,',
        '                message: "Unknown toolkit command: " + commandId,',
        '                errorCode: "UNKNOWN_TOOLKIT_COMMAND",',
        '                data: null',
        '            };',
        '        }',
        '',
        '        var result = handler(payload || {});',
        '        if (!result || typeof result !== "object") {',
        '            result = {};',
        '        }',
        '',
        '        return {',
        '            success: result.success !== false,',
        '            message: result.message || "",',
        '            errorCode: result.errorCode || null,',
        '            data: typeof result.data === "undefined" ? null : result.data',
        '        };',
        '    } catch (error) {',
        '        return {',
        '            success: false,',
        '            message: error && error.message ? error.message : "Toolkit command failed",',
        '            errorCode: "TOOLKIT_COMMAND_FAILED",',
        '            data: null',
        '        };',
        '    }',
        '};',
        ''
    ].join('\n');
}

async function generateToolkitArtifacts(options = {}) {
    const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    const generatedDir = options.generatedDir || path.join(projectRoot, '.generated');
    const jsxRoot = options.jsxRoot || path.join(projectRoot, 'jsx');
    const definitions = collectModuleDefinitions({ projectRoot, jsxRoot });

    fs.mkdirSync(generatedDir, { recursive: true });

    const catalogSource = renderCatalogSource(definitions);
    const registrySource = renderRegistrySource(definitions);
    const dispatchSource = renderDispatchSource();

    const catalogPath = path.join(generatedDir, 'module_catalog.js');
    const registryPath = path.join(generatedDir, 'module_registry.jsx');
    const dispatchPath = path.join(generatedDir, 'module_dispatch.jsx');

    fs.writeFileSync(catalogPath, catalogSource, 'utf8');
    fs.writeFileSync(registryPath, registrySource, 'utf8');
    fs.writeFileSync(dispatchPath, dispatchSource, 'utf8');

    return {
        definitions,
        generatedDir,
        catalogPath,
        registryPath,
        dispatchPath
    };
}

module.exports = {
    collectModuleDefinitions,
    generateToolkitArtifacts,
    renderCatalogSource,
    renderRegistrySource,
    renderDispatchSource
};

if (require.main === module) {
    generateToolkitArtifacts().catch((error) => {
        console.error(error.stack || error.message);
        process.exit(1);
    });
}
