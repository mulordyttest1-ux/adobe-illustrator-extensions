const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_APP_IMPORTS = ['./features/runtime/appBoot.js'];
const SYMBOL_FILES = [
    'js/app.js',
    'js/features/runtime/appBoot.js',
    'js/features/imposition/action_tab.js',
    'js/features/imposition/config_tab.js',
    'js/features/wedding-suite-standard/WeddingSuiteTab.js',
    'js/features/wedding-suite-standard/panelPolicy.js',
    'js/features/wedding-suite-standard/panelView.js'
];

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

function readArchitectureFiles(projectRoot) {
    const files = {};

    for (const relativePath of SYMBOL_FILES) {
        files[relativePath] = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    }

    return files;
}

function addForbiddenSurfaceViolations(violations, filePath, sourceText, options) {
    const imports = collectStaticImports(sourceText);
    const forbiddenImports = options.forbiddenImports || [];
    const forbiddenTokens = options.forbiddenTokens || [];

    for (const specifier of imports) {
        if (forbiddenImports.some((pattern) => pattern.test(specifier))) {
            violations.push(`${filePath}: forbidden import ${specifier}`);
        }
    }

    for (const token of forbiddenTokens) {
        if (token.pattern.test(sourceText)) {
            violations.push(`${filePath}: ${token.message}`);
        }
    }
}

function collectSymbolArchitectureViolations(files) {
    const violations = [];
    const appSource = files['js/app.js'] || '';
    const appImports = collectStaticImports(appSource).sort();
    const expectedImports = [...REQUIRED_APP_IMPORTS].sort();

    if (JSON.stringify(appImports) !== JSON.stringify(expectedImports)) {
        violations.push(`js/app.js: expected only ${REQUIRED_APP_IMPORTS.join(', ')}`);
    }

    if (collectGlobalWrites(appSource).length > 0) {
        violations.push('js/app.js: composition entry must not write app globals');
    }

    const appBootSource = files['js/features/runtime/appBoot.js'] || '';
    const appBootGlobalWrites = collectGlobalWrites(appBootSource);
    const unexpectedAppBootWrites = appBootGlobalWrites.filter((name) => name !== 'Imposition');
    if (!appBootGlobalWrites.includes('Imposition')) {
        violations.push('js/features/runtime/appBoot.js: missing window.Imposition composition write');
    }
    if (unexpectedAppBootWrites.length > 0) {
        violations.push(`js/features/runtime/appBoot.js: unexpected app globals ${unexpectedAppBootWrites.join(', ')}`);
    }

    const coordinators = [
        'js/features/imposition/config_tab.js',
        'js/features/wedding-suite-standard/WeddingSuiteTab.js'
    ];
    for (const filePath of coordinators) {
        if (/\blocalStorage\b/.test(files[filePath] || '')) {
            violations.push(`${filePath}: coordinator must not access localStorage directly`);
        }
    }

    addForbiddenSurfaceViolations(
        violations,
        'js/features/imposition/action_tab.js',
        files['js/features/imposition/action_tab.js'] || '',
        {
            forbiddenImports: [
                /(?:^|\/)data_store\.js$/,
                /(?:^|\/)preset_repository\.js$/
            ]
        }
    );

    const isolatedPanelFiles = [
        'js/features/wedding-suite-standard/panelPolicy.js',
        'js/features/wedding-suite-standard/panelView.js'
    ];
    for (const filePath of isolatedPanelFiles) {
        addForbiddenSurfaceViolations(violations, filePath, files[filePath] || '', {
            forbiddenImports: [
                /bridge/i,
                /storage/i,
                /repository/i,
                /@shared\/cep-ui/
            ],
            forbiddenTokens: [
                { pattern: /\blocalStorage\b/, message: 'must not access localStorage' },
                { pattern: /\bCSInterface\b/, message: 'must not access CEP transport' },
                { pattern: /\bUIFeedback\b/, message: 'must not own feedback side effects' }
            ]
        });
    }

    return violations;
}

function runArchitectureCheck({ projectRoot }) {
    return collectSymbolArchitectureViolations(readArchitectureFiles(projectRoot));
}

module.exports = {
    collectGlobalWrites,
    collectStaticImports,
    collectSymbolArchitectureViolations,
    readArchitectureFiles,
    runArchitectureCheck
};
