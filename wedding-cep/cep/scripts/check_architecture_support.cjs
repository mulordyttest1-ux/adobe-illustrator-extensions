const fs = require('fs');
const path = require('path');

const ALLOWED_TOP_LEVEL_JS_FILES = new Set(['app.js', 'bundle.js', 'CSInterface.js']);
const ALLOWED_TOP_LEVEL_NON_JS_FILES = new Set(['types.d.ts']);
const ALLOWED_APP_GLOBAL_WRITES = new Map([
    ['js/bootstrap/startup.js', new Set(['__WEDDING_APP_READY__'])],
    ['js/bootstrap/readyState.js', new Set(['__WEDDING_APP_READY__'])],
    ['js/bootstrap/testApi.js', new Set(['__WEDDING_TEST_API__'])]
]);

const LAYER_RULES = [
    {
        name: 'controllers-layer-retired',
        from: /^js\//,
        to: /^js\/controllers\//,
        message: 'Legacy controllers layer was retired. Move modules into components/, logic/, bootstrap/, or infrastructure/.'
    },
    {
        name: 'components-modules-bucket-retired',
        from: /^js\//,
        to: /^js\/components\/modules\//,
        message: 'Generic components/modules bucket was retired. Move modules into named UI slices.'
    },
    {
        name: 'logic-cannot-import-components',
        from: /^js\/logic\//,
        to: /^js\/components\//,
        message: 'Logic layer must not import components.'
    },
    {
        name: 'logic-cannot-import-controllers',
        from: /^js\/logic\//,
        to: /^js\/controllers\//,
        message: 'Logic layer must not import controllers.'
    },
    {
        name: 'logic-cannot-import-actions',
        from: /^js\/logic\//,
        to: /^js\/actions\//,
        message: 'Logic layer must not import actions.'
    },
    {
        name: 'logic-cannot-import-bridge',
        from: /^js\/logic\//,
        to: /^js\/infrastructure\/bridge\.js$/,
        message: 'Logic layer must not import bridge infrastructure.'
    },
    {
        name: 'core-must-stay-isolated',
        from: /^js\/logic\/core\//,
        to: /^js\/(?!logic\/core\/)/,
        message: 'Core utilities must stay isolated from upper layers.'
    },
    {
        name: 'pipeline-cannot-import-upper-layers',
        from: /^js\/logic\/pipeline\//,
        to: /^js\/(components|controllers|actions)\//,
        message: 'Pipeline may not import UI-facing layers.'
    }
];

const CONTEXT_BOUNDARY_REGISTRY = [
    {
        name: 'workspace',
        root: /^js\/components\/compact-form\//,
        publicEntries: [
            /^js\/components\/compact-form\/CompactFormBuilder\.js$/
        ],
        temporaryPublicEntries: [],
        internalOnly: [
            /^js\/components\/compact-form\/.*Support\.js$/,
            /^js\/components\/compact-form\/FormLogic\.js$/,
            /^js\/components\/compact-form\/FormComponents\.js$/,
            /^js\/components\/compact-form\/CompactFormBindings\.js$/,
            /^js\/components\/compact-form\/CompactFormState\.js$/
        ],
        compatibilityEntries: [],
        message: 'Compact form internals are slice-private. Import CompactFormBuilder.js instead.'
    },
    {
        name: 'document-sync',
        root: /^js\/logic\/use-cases\/document-sync\//,
        publicEntries: [
            /^js\/logic\/use-cases\/scanDocument\.js$/,
            /^js\/logic\/use-cases\/updateDocument\.js$/
        ],
        temporaryPublicEntries: [],
        internalOnly: [
            /^js\/logic\/use-cases\/document-sync\/.+\.js$/
        ],
        compatibilityEntries: [
            /^js\/logic\/use-cases\/scanDocument\.js$/,
            /^js\/logic\/use-cases\/updateDocument\.js$/
        ],
        message: 'Document Sync internals are context-private. Import scanDocument.js or updateDocument.js instead.'
    },
    {
        name: 'template-authoring',
        root: /^js\/logic\/use-cases\/template-authoring\//,
        publicEntries: [
            /^js\/logic\/use-cases\/template-authoring\/templateAuthoringService\.js$/
        ],
        temporaryPublicEntries: [
            /^js\/logic\/use-cases\/manualInjection\.js$/,
            /^js\/logic\/use-cases\/injectSchemaDocument\.js$/
        ],
        internalOnly: [
            /^js\/logic\/use-cases\/template-authoring\/(?!templateAuthoringService\.js$).+\.js$/
        ],
        compatibilityEntries: [
            /^js\/logic\/use-cases\/manualInjection\.js$/,
            /^js\/logic\/use-cases\/injectSchemaDocument\.js$/
        ],
        message: 'Template Authoring internals are context-private. Import templateAuthoringService.js or the compatibility entries instead.'
    },
    {
        name: 'host-raw-adapters',
        root: /^js\/infrastructure\/hostFacade\.js$/,
        publicEntries: [
            /^js\/infrastructure\/hostFacade\.js$/
        ],
        temporaryPublicEntries: [],
        internalOnly: [
            /^js\/infrastructure\/bridge\.js$/,
            /^js\/infrastructure\/cepHost\.js$/
        ],
        compatibilityEntries: [],
        message: 'Raw CEP adapters are internal-only. Import hostFacade.js instead.'
    },
    {
        name: 'selection-plan-io',
        root: /^$/,
        publicEntries: [],
        temporaryPublicEntries: [],
        internalOnly: [
            /^js\/actions\/support\/selectionPlanIO\.js$/
        ],
        compatibilityEntries: [],
        message: 'selectionPlanIO moved under Template Authoring internals. Route through templateAuthoringService.js instead.'
    }
];

function toPosixPath(filePath) {
    return filePath.split(path.sep).join('/');
}

function matchesAny(patterns, value) {
    return patterns.some((pattern) => pattern.test(value));
}

function walk(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'libs') {
                continue;
            }
            files.push(...walk(fullPath));
            continue;
        }

        if (!entry.name.endsWith('.js')) {
            continue;
        }
        if (entry.name === 'bundle.js' || entry.name.endsWith('.test.js')) {
            continue;
        }

        files.push(fullPath);
    }

    return files;
}

function collectImports(sourceText) {
    const imports = [];
    const patterns = [
        /(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];

    for (const pattern of patterns) {
        let match = pattern.exec(sourceText);
        while (match) {
            imports.push(match[1]);
            match = pattern.exec(sourceText);
        }
    }

    return imports;
}

function resolveRelativeImport(sourceFile, specifier) {
    if (!specifier.startsWith('.')) {
        return null;
    }

    const baseTarget = path.resolve(path.dirname(sourceFile), specifier);
    const candidates = [
        baseTarget,
        `${baseTarget}.js`,
        path.join(baseTarget, 'index.js')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }

    return null;
}

function getLineNumber(sourceText, index) {
    return sourceText.slice(0, index).split('\n').length;
}

function collectAppGlobalWrites(sourceText) {
    const propertyWrites = [];
    const objectAssignWrites = [];
    const propertyPattern = /\b(?:window|globalThis|targetWindow)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
    const objectAssignPattern = /\bObject\.assign\s*\(\s*(window|globalThis|targetWindow)\s*,/g;

    let match = propertyPattern.exec(sourceText);
    while (match) {
        propertyWrites.push({
            globalName: match[1],
            line: getLineNumber(sourceText, match.index)
        });
        match = propertyPattern.exec(sourceText);
    }

    match = objectAssignPattern.exec(sourceText);
    while (match) {
        objectAssignWrites.push({
            target: match[1],
            line: getLineNumber(sourceText, match.index)
        });
        match = objectAssignPattern.exec(sourceText);
    }

    return { propertyWrites, objectAssignWrites };
}

function collectScriptSources(sourceText) {
    const sources = [];
    const scriptPattern = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    let match = scriptPattern.exec(sourceText);
    while (match) {
        sources.push(match[1]);
        match = scriptPattern.exec(sourceText);
    }
    return sources;
}

function collectImportViolations(sourcePath, targetPath) {
    const violations = [];

    for (const rule of LAYER_RULES) {
        if (rule.from.test(sourcePath) && rule.to.test(targetPath)) {
            violations.push(`${rule.name}: ${sourcePath} -> ${targetPath} (${rule.message})`);
        }
    }

    for (const context of CONTEXT_BOUNDARY_REGISTRY) {
        if (!matchesAny(context.internalOnly, targetPath)) {
            continue;
        }

        const allowedImporters = [context.root, ...context.compatibilityEntries];
        if (matchesAny(allowedImporters, sourcePath)) {
            continue;
        }

        violations.push(
            `${context.name}-public-entry-only: ${sourcePath} -> ${targetPath} (${context.message})`
        );
    }

    return violations;
}

function validateFuseVendorContract(projectRoot, violations) {
    const indexHtmlPath = path.join(projectRoot, 'index.html');
    const sourceText = fs.readFileSync(indexHtmlPath, 'utf8');
    const scriptSources = collectScriptSources(sourceText);
    const fuseScript = 'js/libs/fuse.basic.min.js';
    const bundleScript = 'js/bundle.js';

    const fuseMatches = scriptSources.filter((source) => source === fuseScript);
    const alternateFuseScripts = scriptSources.filter((source) => /fuse/i.test(source) && source !== fuseScript);
    const fuseIndex = scriptSources.indexOf(fuseScript);
    const bundleIndex = scriptSources.indexOf(bundleScript);

    if (fuseMatches.length !== 1) {
        violations.push(
            `fuse-vendor-script-contract: index.html (${fuseScript} must appear exactly once before ${bundleScript}.)`
        );
    }

    if (alternateFuseScripts.length > 0) {
        violations.push(
            `fuse-vendor-script-duplicates: index.html (${alternateFuseScripts.join(', ')} is not an allowed Fuse runtime source.)`
        );
    }

    if (bundleIndex === -1) {
        violations.push(
            `bundle-script-missing: index.html (${bundleScript} must exist so runtime vendor ordering can be enforced.)`
        );
    } else if (fuseIndex === -1 || fuseIndex > bundleIndex) {
        violations.push(
            `fuse-vendor-script-order: index.html (${fuseScript} must load before ${bundleScript}.)`
        );
    }
}

function validateTopLevelRuntimeFiles(jsRoot, violations) {
    const topLevelEntries = fs.readdirSync(jsRoot, { withFileTypes: true });

    for (const entry of topLevelEntries) {
        if (entry.isDirectory()) {
            continue;
        }

        const entryName = entry.name;
        if (entryName.endsWith('.test.js')) {
            continue;
        }
        if (ALLOWED_TOP_LEVEL_JS_FILES.has(entryName) || ALLOWED_TOP_LEVEL_NON_JS_FILES.has(entryName)) {
            continue;
        }
        if (/\.(?:js|mjs|cjs)$/.test(entryName)) {
            violations.push(
                `top-level-runtime-file-retired: js/${entryName} (Top-level app runtime files are retired. Move runtime boundaries into bootstrap/, infrastructure/, components/, actions/, or logic/.)`
            );
        }
    }
}

function runArchitectureCheck({ projectRoot, jsRoot }) {
    const files = walk(jsRoot);
    const violations = [];

    for (const file of files) {
        const sourcePath = toPosixPath(path.relative(projectRoot, file));
        const sourceText = fs.readFileSync(file, 'utf8');
        const imports = collectImports(sourceText);
        const allowedWrites = ALLOWED_APP_GLOBAL_WRITES.get(sourcePath) || new Set();
        const { propertyWrites, objectAssignWrites } = collectAppGlobalWrites(sourceText);

        if (sourcePath.startsWith('js/controllers/')) {
            violations.push(
                `controllers-layer-retired: ${sourcePath} (Legacy controllers layer was retired. Move modules into components/, logic/, bootstrap/, or infrastructure/.)`
            );
        }
        if (sourcePath.startsWith('js/components/modules/')) {
            violations.push(
                `components-modules-bucket-retired: ${sourcePath} (Generic components/modules bucket was retired. Move modules into named UI slices.)`
            );
        }

        for (const specifier of imports) {
            const resolved = resolveRelativeImport(file, specifier);
            if (!resolved) {
                continue;
            }

            const targetPath = toPosixPath(path.relative(projectRoot, resolved));
            violations.push(...collectImportViolations(sourcePath, targetPath));
        }

        for (const write of propertyWrites) {
            if (!allowedWrites.has(write.globalName)) {
                violations.push(
                    `app-globals-only-through-bootstrap: ${sourcePath}:${write.line} -> ${write.globalName} (Only __WEDDING_APP_READY__ and __WEDDING_TEST_API__ may be published as app-owned globals.)`
                );
            }
        }

        for (const write of objectAssignWrites) {
            violations.push(
                `app-globals-object-assign-forbidden: ${sourcePath}:${write.line} -> Object.assign(${write.target}, ...) (Publishing app-owned globals via Object.assign is forbidden.)`
            );
        }
    }

    validateFuseVendorContract(projectRoot, violations);
    validateTopLevelRuntimeFiles(jsRoot, violations);

    return violations;
}

module.exports = {
    ALLOWED_TOP_LEVEL_JS_FILES,
    ALLOWED_TOP_LEVEL_NON_JS_FILES,
    ALLOWED_APP_GLOBAL_WRITES,
    LAYER_RULES,
    CONTEXT_BOUNDARY_REGISTRY,
    toPosixPath,
    walk,
    collectImports,
    resolveRelativeImport,
    getLineNumber,
    collectAppGlobalWrites,
    collectScriptSources,
    collectImportViolations,
    validateFuseVendorContract,
    validateTopLevelRuntimeFiles,
    runArchitectureCheck
};
