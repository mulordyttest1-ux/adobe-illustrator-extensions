const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_APP_IMPORTS = [
    './bootstrap/startup.js',
    './bootstrap/testApi.js',
    './infrastructure/hostFacade.js'
];
const ALLOWED_GLOBAL_WRITES = new Map([
    ['js/bootstrap/readyState.js', new Set(['__TOOLKIT_APP_READY__'])],
    ['js/bootstrap/testApi.js', new Set(['__TOOLKIT_TEST_API__'])]
]);

function collectStaticImports(sourceText) {
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

function collectGlobalWrites(sourceText) {
    const writes = [];
    const pattern = /\b(?:window|globalThis|windowRef|windowOverride|targetWindow)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
    let match = pattern.exec(sourceText);

    while (match) {
        writes.push(match[1]);
        match = pattern.exec(sourceText);
    }

    return writes;
}

function walkFiles(rootPath, predicate) {
    if (!fs.existsSync(rootPath)) {
        return [];
    }

    const result = [];
    for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
        const fullPath = path.join(rootPath, entry.name);
        if (entry.isDirectory()) {
            result.push(...walkFiles(fullPath, predicate));
        } else if (predicate(fullPath)) {
            result.push(fullPath);
        }
    }
    return result;
}

function toPosixPath(value) {
    return value.split(path.sep).join('/');
}

function isProductionPanelFile(projectRoot, filePath) {
    const relativePath = toPosixPath(path.relative(projectRoot, filePath));
    return relativePath.startsWith('js/') &&
        !relativePath.startsWith('js/libs/') &&
        !relativePath.endsWith('.test.js') &&
        !relativePath.endsWith('/bundle.js');
}

function readProductionPanelFiles(projectRoot) {
    const files = {};
    const jsRoot = path.join(projectRoot, 'js');

    for (const filePath of walkFiles(jsRoot, (candidate) => candidate.endsWith('.js'))) {
        const relativePath = toPosixPath(path.relative(projectRoot, filePath));
        if (isProductionPanelFile(projectRoot, filePath)) {
            files[relativePath] = fs.readFileSync(filePath, 'utf8');
        }
    }

    return files;
}

function readModuleFiles(projectRoot) {
    const files = {};
    const modulesRoot = path.join(projectRoot, 'modules');

    for (const filePath of walkFiles(modulesRoot, (candidate) => candidate.endsWith('.jsx'))) {
        const relativePath = toPosixPath(path.relative(projectRoot, filePath));
        files[relativePath] = fs.readFileSync(filePath, 'utf8');
    }

    return files;
}

function collectToolkitArchitectureViolations({ panelFiles, moduleFiles }) {
    const violations = [];
    const appSource = panelFiles['js/app.js'] || '';
    const appImports = collectStaticImports(appSource).sort();
    const expectedImports = [...REQUIRED_APP_IMPORTS].sort();

    if (JSON.stringify(appImports) !== JSON.stringify(expectedImports)) {
        violations.push(`js/app.js: expected only ${REQUIRED_APP_IMPORTS.join(', ')}`);
    }
    if (collectGlobalWrites(appSource).length > 0) {
        violations.push('js/app.js: composition entry must not write app globals');
    }

    for (const [filePath, sourceText] of Object.entries(panelFiles)) {
        const globalWrites = collectGlobalWrites(sourceText);
        const allowed = ALLOWED_GLOBAL_WRITES.get(filePath) || new Set();
        for (const globalName of globalWrites) {
            if (!allowed.has(globalName)) {
                violations.push(`${filePath}: unexpected app global ${globalName}`);
            }
        }
    }

    for (const [filePath, sourceText] of Object.entries(panelFiles)) {
        if (!filePath.startsWith('js/features/shell/')) {
            continue;
        }
        for (const specifier of collectStaticImports(sourceText)) {
            if (/infrastructure|CSInterface|cepHost/i.test(specifier)) {
                violations.push(`${filePath}: shell must not import host infrastructure ${specifier}`);
            }
        }
    }

    for (const [filePath, sourceText] of Object.entries(panelFiles)) {
        if (!filePath.startsWith('js/features/catalog/')) {
            continue;
        }
        for (const specifier of collectStaticImports(sourceText)) {
            if (/(?:^|\/)modules(?:\/|$)|\.generated\/module_registry/i.test(specifier)) {
                violations.push(`${filePath}: catalog must not runtime-import module folders or host registry`);
            }
        }
        if (/\b(?:readdirSync|readdir)\s*\(|node:fs|cep_node/.test(sourceText)) {
            violations.push(`${filePath}: catalog must not scan the module filesystem at runtime`);
        }
    }

    for (const [filePath, sourceText] of Object.entries(moduleFiles)) {
        if (/(?:#include|from|require)\s*["'][^"']*(?:features\/shell|js\/infrastructure|CSInterface|cepHost)[^"']*["']/i.test(sourceText)) {
            violations.push(`${filePath}: module must not depend on panel shell or CEP infrastructure`);
        }
    }

    return violations;
}

function runArchitectureCheck({ projectRoot }) {
    return collectToolkitArchitectureViolations({
        panelFiles: readProductionPanelFiles(projectRoot),
        moduleFiles: readModuleFiles(projectRoot)
    });
}

module.exports = {
    collectGlobalWrites,
    collectStaticImports,
    collectToolkitArchitectureViolations,
    readModuleFiles,
    readProductionPanelFiles,
    runArchitectureCheck
};
