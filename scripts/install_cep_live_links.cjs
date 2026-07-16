#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXTENSIONS_ROOT = path.join(process.env.APPDATA || '', 'Adobe', 'CEP', 'extensions');

const CEP_APPS = [
    {
        key: 'symbol',
        sourceDir: path.join(REPO_ROOT, 'symbol-cep', 'cep'),
        wrapperLayout: 'root-linked',
        linkDirs: ['css', 'data', 'js', 'jsx', 'lib', 'debug_scripts'],
        linkFiles: ['index.html', 'build.cjs', 'wedding suite print template.ai'],
        variants: [
            {
                name: 'work',
                extensionDir: 'com.dinhson.imposition',
                manifest: {
                    version: '7.0',
                    runtimeVersion: '9.0',
                    bundleId: 'com.dinhson.imposition',
                    bundleName: 'imposition panel',
                    extensionId: 'com.dinhson.imposition.panel',
                    hostVersion: '[29.0,30.9]',
                    menu: 'imposition panel',
                    scriptPath: './jsx/host.jsx',
                    cefParameters: ['--enable-nodejs', '--enable-media-stream'],
                    autoVisible: true,
                    geometry: {
                        width: 420,
                        height: 600,
                        minWidth: 320,
                        minHeight: 400,
                        maxWidth: 600,
                        maxHeight: 800
                    }
                }
            },
            {
                name: 'test2026',
                extensionDir: 'com.dinhson.imposition.panel.test2026',
                debugPort: 9198,
                manifest: {
                    version: '7.0',
                    runtimeVersion: '9.0',
                    bundleId: 'com.dinhson.imposition.test2026',
                    bundleName: 'Imposition Panel (Test 2026)',
                    extensionId: 'com.dinhson.imposition.panel.test2026',
                    hostVersion: '[30.0,30.9]',
                    menu: 'Imposition Panel (Test 2026)',
                    scriptPath: './jsx/host.jsx',
                    cefParameters: ['--enable-nodejs', '--enable-media-stream'],
                    autoVisible: true,
                    geometry: {
                        width: 420,
                        height: 600,
                        minWidth: 130,
                        minHeight: 400,
                        maxWidth: 600,
                        maxHeight: 800
                    }
                }
            }
        ]
    },
    {
        key: 'wedding',
        sourceDir: path.join(REPO_ROOT, 'wedding-cep', 'cep'),
        wrapperLayout: 'root-linked',
        linkDirs: ['css', 'data', 'js', 'jsx', 'scripts', 'debug_scripts'],
        linkFiles: ['index.html', 'build.cjs'],
        variants: [
            {
                name: 'work',
                extensionDir: 'com.dinhson.weddingscripter',
                manifest: {
                    version: '8.0',
                    runtimeVersion: '11.0',
                    bundleId: 'com.dinhson.weddingscripter',
                    bundleName: 'Wedding Scripter',
                    extensionId: 'com.dinhson.weddingscripter.panel',
                    hostVersion: '[29.0,30.9]',
                    menu: 'Wedding Scripter',
                    scriptPath: './jsx/illustrator.jsx',
                    cefParameters: ['--enable-nodejs', '--mixed-context'],
                    autoVisible: true,
                    geometry: {
                        width: 420,
                        height: 600,
                        minWidth: 320,
                        minHeight: 400,
                        maxWidth: 600,
                        maxHeight: 800
                    }
                }
            },
            {
                name: 'test2026',
                extensionDir: 'com.dinhson.weddingscripter.panel.test2026',
                debugPort: 9197,
                manifest: {
                    version: '8.0',
                    runtimeVersion: '11.0',
                    bundleId: 'com.dinhson.weddingscripter.test2026',
                    bundleName: 'Wedding Scripter (Test 2026)',
                    extensionId: 'com.dinhson.weddingscripter.panel.test2026',
                    hostVersion: '[30.0,30.9]',
                    menu: 'Wedding Scripter (Test 2026)',
                    scriptPath: './jsx/illustrator.jsx',
                    cefParameters: ['--enable-nodejs', '--mixed-context'],
                    autoVisible: true,
                    geometry: {
                        width: 420,
                        height: 600,
                        minWidth: 320,
                        minHeight: 400,
                        maxWidth: 600,
                        maxHeight: 800
                    }
                }
            }
        ]
    },
    {
        key: 'toolkit',
        sourceDir: path.join(REPO_ROOT, 'toolkit-cep', 'cep'),
        wrapperLayout: 'app-junction',
        linkDirs: ['.generated', 'css', 'js', 'jsx', 'lib', 'modules', 'scripts', 'debug_scripts'],
        linkFiles: ['index.html', 'build.cjs'],
        variants: [
            {
                name: 'work',
                extensionDir: 'com.dinhson.toolkit',
                manifest: {
                    version: '7.0',
                    runtimeVersion: '9.0',
                    bundleId: 'com.dinhson.toolkit',
                    bundleName: 'Toolkit Panel',
                    extensionId: 'com.dinhson.toolkit.panel',
                    hostVersion: '[29.0,30.9]',
                    menu: 'Toolkit Panel',
                    scriptPath: './jsx/host.jsx',
                    cefParameters: ['--enable-nodejs'],
                    autoVisible: false,
                    geometry: {
                        width: 420,
                        height: 620,
                        minWidth: 320,
                        minHeight: 460,
                        maxWidth: 640,
                        maxHeight: 920
                    }
                }
            },
            {
                name: 'test2026',
                extensionDir: 'com.dinhson.toolkit.panel.dev',
                debugPort: 9099,
                manifest: {
                    version: '7.0',
                    runtimeVersion: '9.0',
                    bundleId: 'com.dinhson.toolkit.dev',
                    bundleName: 'Toolkit Panel (Dev)',
                    extensionId: 'com.dinhson.toolkit.panel.dev',
                    hostVersion: '[30.0,30.9]',
                    menu: 'Toolkit Panel (Dev)',
                    scriptPath: './jsx/host.jsx',
                    cefParameters: ['--enable-nodejs'],
                    autoVisible: false,
                    geometry: {
                        width: 420,
                        height: 620,
                        minWidth: 320,
                        minHeight: 460,
                        maxWidth: 640,
                        maxHeight: 920
                    }
                }
            }
        ]
    }
];

function parseArgs(argv) {
    const options = {
        repoRoot: REPO_ROOT,
        extensionsRoot: DEFAULT_EXTENSIONS_ROOT,
        dryRun: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const value = argv[index];
        if (value === '--dry-run') {
            options.dryRun = true;
            continue;
        }

        if (value === '--repo-root') {
            options.repoRoot = path.resolve(argv[index + 1]);
            index += 1;
            continue;
        }

        if (value === '--extensions-root') {
            options.extensionsRoot = path.resolve(argv[index + 1]);
            index += 1;
            continue;
        }
    }

    if (!options.extensionsRoot) {
        throw new Error('APPDATA is not available. Pass --extensions-root explicitly.');
    }

    return options;
}

function ensureDir(targetPath, dryRun) {
    if (dryRun) {
        return;
    }
    fs.mkdirSync(targetPath, { recursive: true });
}

function removePath(targetPath, dryRun) {
    if (dryRun) {
        return;
    }
    fs.rmSync(targetPath, { recursive: true, force: true });
}

function writeTextFile(targetPath, content, dryRun) {
    if (dryRun) {
        return;
    }
    fs.writeFileSync(targetPath, content, 'utf8');
}

function createDirLink(sourcePath, targetPath, dryRun) {
    if (dryRun) {
        return;
    }
    fs.symlinkSync(sourcePath, targetPath, 'junction');
}

function createFileLink(sourcePath, targetPath, dryRun) {
    if (dryRun) {
        return;
    }

    try {
        fs.linkSync(sourcePath, targetPath);
        return;
    } catch (hardLinkError) {
        try {
            fs.symlinkSync(sourcePath, targetPath, 'file');
            return;
        } catch (symlinkError) {
            throw new Error(`Failed to link file ${sourcePath} -> ${targetPath}: ${symlinkError.message}`);
        }
    }
}

function buildAppRelativePath(relativePath) {
    const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
    return `./app/${normalized}`;
}

function buildManifestXml(manifest) {
    const autoVisible = manifest.autoVisible ? 'true' : 'false';
    const parameters = manifest.cefParameters.map((parameter) => `            <Parameter>${parameter}</Parameter>`).join('\n');
    const wrapperLayout = manifest.wrapperLayout || 'root-linked';
    const mainPath = wrapperLayout === 'app-junction' ? './app/index.html' : './index.html';
    const scriptPath = wrapperLayout === 'app-junction'
        ? buildAppRelativePath(manifest.scriptPath)
        : manifest.scriptPath;

    return `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="${manifest.version}" ExtensionBundleId="${manifest.bundleId}" ExtensionBundleVersion="1.0.0" ExtensionBundleName="${manifest.bundleName}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ExtensionList>
        <Extension Id="${manifest.extensionId}" Version="1.0.0"/>
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            <Host Name="ILST" Version="${manifest.hostVersion}"/>
        </HostList>
        <LocaleList>
            <Locale Code="All"/>
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="${manifest.runtimeVersion}"/>
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="${manifest.extensionId}">
            <DispatchInfo>
                <Resources>
                    <MainPath>${mainPath}</MainPath>
                    <ScriptPath>${scriptPath}</ScriptPath>
                    <CEFCommandLine>
${parameters}
                    </CEFCommandLine>
                </Resources>
                <Lifecycle>
                    <AutoVisible>${autoVisible}</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>${manifest.menu}</Menu>
                    <Geometry>
                        <Size><Height>${manifest.geometry.height}</Height><Width>${manifest.geometry.width}</Width></Size>
                        <MinSize><Height>${manifest.geometry.minHeight}</Height><Width>${manifest.geometry.minWidth}</Width></MinSize>
                        <MaxSize><Height>${manifest.geometry.maxHeight}</Height><Width>${manifest.geometry.maxWidth}</Width></MaxSize>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
`;
}

function buildDebugXml(extensionId, port) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="${extensionId}">
        <HostList>
            <Host Name="ILST" Port="${port}"/>
        </HostList>
    </Extension>
</ExtensionList>
`;
}

function installAppJunctionVariant(app, variant, options, logs) {
    const wrapperRoot = path.join(options.extensionsRoot, variant.extensionDir);
    const manifestDir = path.join(wrapperRoot, 'CSXS');
    const manifestPath = path.join(manifestDir, 'manifest.xml');
    const appLinkPath = path.join(wrapperRoot, 'app');
    const staleEntries = ['app', 'CSXS', '.debug'].concat(app.linkDirs || [], app.linkFiles || []);

    logs.push(`[${app.key}:${variant.name}] ${wrapperRoot}`);

    ensureDir(wrapperRoot, options.dryRun);
    staleEntries.forEach((entryName) => {
        removePath(path.join(wrapperRoot, entryName), options.dryRun);
    });
    ensureDir(manifestDir, options.dryRun);

    writeTextFile(
        manifestPath,
        buildManifestXml({
            ...variant.manifest,
            wrapperLayout: 'app-junction'
        }),
        options.dryRun
    );

    if (variant.debugPort) {
        writeTextFile(
            path.join(wrapperRoot, '.debug'),
            buildDebugXml(variant.manifest.extensionId, variant.debugPort),
            options.dryRun
        );
    }

    createDirLink(app.sourceDir, appLinkPath, options.dryRun);
}

function installRootLinkedVariant(app, variant, options, logs) {
    const wrapperRoot = path.join(options.extensionsRoot, variant.extensionDir);
    const manifestDir = path.join(wrapperRoot, 'CSXS');
    const manifestPath = path.join(manifestDir, 'manifest.xml');
    const staleEntries = ['app', 'CSXS', '.debug'].concat(app.linkDirs || [], app.linkFiles || []);

    logs.push(`[${app.key}:${variant.name}] ${wrapperRoot}`);

    ensureDir(wrapperRoot, options.dryRun);
    staleEntries.forEach((entryName) => {
        removePath(path.join(wrapperRoot, entryName), options.dryRun);
    });
    ensureDir(manifestDir, options.dryRun);

    writeTextFile(
        manifestPath,
        buildManifestXml({
            ...variant.manifest,
            wrapperLayout: 'root-linked'
        }),
        options.dryRun
    );

    if (variant.debugPort) {
        writeTextFile(
            path.join(wrapperRoot, '.debug'),
            buildDebugXml(variant.manifest.extensionId, variant.debugPort),
            options.dryRun
        );
    }

    (app.linkDirs || []).forEach((dirName) => {
        const sourcePath = path.join(app.sourceDir, dirName);
        const targetPath = path.join(wrapperRoot, dirName);

        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source directory missing for ${app.key}:${variant.name}: ${sourcePath}`);
        }

        createDirLink(sourcePath, targetPath, options.dryRun);
    });

    (app.linkFiles || []).forEach((fileName) => {
        const sourcePath = path.join(app.sourceDir, fileName);
        const targetPath = path.join(wrapperRoot, fileName);

        if (!fs.existsSync(sourcePath)) {
            const buildHint = app.key === 'symbol' && fileName === 'wedding suite print template.ai'
                ? ' Run "npm run build:symbol" to materialize the build-owned template copy first.'
                : '';
            throw new Error(`Source file missing for ${app.key}:${variant.name}: ${sourcePath}.${buildHint}`);
        }

        createFileLink(sourcePath, targetPath, options.dryRun);
    });
}

function installVariant(app, variant, options, logs) {
    if (app.wrapperLayout === 'app-junction') {
        installAppJunctionVariant(app, variant, options, logs);
        return;
    }

    installRootLinkedVariant(app, variant, options, logs);
}

function validateSources(apps) {
    apps.forEach((app) => {
        if (!fs.existsSync(app.sourceDir)) {
            throw new Error(`Source CEP folder missing: ${app.sourceDir}`);
        }
    });
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const apps = CEP_APPS.map((app) => ({
        ...app,
        sourceDir: path.join(options.repoRoot, path.relative(REPO_ROOT, app.sourceDir))
    }));

    validateSources(apps);
    ensureDir(options.extensionsRoot, options.dryRun);

    const logs = [];
    apps.forEach((app) => {
        app.variants.forEach((variant) => {
            installVariant(app, variant, options, logs);
        });
    });

    const mode = options.dryRun ? 'dry-run' : 'install';
    console.log(`[install_cep_live_links] ${mode} complete`);
    console.log(`Repo root: ${options.repoRoot}`);
    console.log(`Extensions root: ${options.extensionsRoot}`);
    logs.forEach((line) => console.log(line));
    console.log('Toolkit wrappers use ./app -> <repo>/toolkit-cep/cep.');
    console.log('Symbol/Wedding wrappers expose linked runtime folders/files directly at the extension root.');
    console.log('Work wrappers: one shared live-linked work panel for Illustrator 2025 + 2026, no .debug');
    console.log('Test wrappers: supplemental Illustrator 2026-only debug gate, ports 9198 / 9197 / 9099');
}

module.exports = {
    CEP_APPS,
    buildDebugXml,
    buildManifestXml,
    installVariant,
    main,
    parseArgs,
    validateSources
};

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(`[install_cep_live_links] ${error.message}`);
        process.exitCode = 1;
    }
}
