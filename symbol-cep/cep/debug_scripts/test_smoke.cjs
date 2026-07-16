const { E2ERunner } = require('../../../shared/testing/E2ERunner.cjs');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const smokePort = Number(process.env.SYMBOL_CEP_PORT || 9198);
const smokeProjectName = process.env.SYMBOL_CEP_PROJECT_NAME || 'Symbol CEP Test 2026';

const runner = new E2ERunner({ port: smokePort, projectName: smokeProjectName });
const CSINTERFACE_MISSING = Buffer.from(JSON.stringify({ success: false, error: 'CSInterface missing' }), 'utf8').toString('base64');

function cleanupSmokeArtifact(artifactPath) {
    const resolvedArtifact = path.resolve(String(artifactPath || ''));
    const jobsRoot = path.resolve(os.tmpdir(), 'symbol_cep_wedding_suite_jobs');
    const normalizedArtifact = resolvedArtifact.toLowerCase();
    const normalizedRoot = `${jobsRoot.toLowerCase()}${path.sep}`;

    if (!artifactPath || !normalizedArtifact.startsWith(normalizedRoot)) {
        throw new Error(`Refusing to clean debug artifact outside the Wedding Suite temp root: ${artifactPath || '<empty>'}`);
    }

    fs.rmSync(path.dirname(resolvedArtifact), { recursive: true, force: true });
    if (fs.existsSync(resolvedArtifact)) {
        throw new Error(`Smoke debug artifact was not deleted after pass: ${resolvedArtifact}`);
    }
}

function cleanupSmokeOutput(outputPath) {
    const resolvedOutput = path.resolve(String(outputPath || ''));
    const outputsRoot = path.resolve(os.tmpdir(), 'symbol_cep_smoke_outputs');
    const normalizedOutput = resolvedOutput.toLowerCase();
    const normalizedRoot = `${outputsRoot.toLowerCase()}${path.sep}`;

    if (!outputPath || !normalizedOutput.startsWith(normalizedRoot)) {
        throw new Error(`Refusing to clean smoke output outside the temp root: ${outputPath || '<empty>'}`);
    }

    fs.rmSync(path.dirname(resolvedOutput), { recursive: true, force: true });
    if (fs.existsSync(resolvedOutput)) {
        throw new Error(`Smoke PDF output was not deleted after pass: ${resolvedOutput}`);
    }
}

function decodeBase64Json(payload) {
    if (!payload) {
        throw new Error('Empty host payload');
    }
    if (payload.indexOf('EvalScript') === 0 || payload.indexOf('ReferenceError') === 0) {
        throw new Error(payload);
    }

    try {
        return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    } catch (err) {
        throw new Error(`Invalid host payload: ${payload}`);
    }
}

function makeHostScenarioExpression(mode) {
    return `
        new Promise((resolve) => {
            if (typeof CSInterface === 'undefined') {
                resolve('${CSINTERFACE_MISSING}');
                return;
            }

            const cs = new CSInterface();
            const root = cs.getSystemPath(CSInterface.EXTENSION).replace(/\\\\/g, '/');
            const debugPath = root + '/jsx/debug_host_validation.jsx';
            const script = '(function(){ $.evalFile("' + debugPath + '"); return $.global.SymbolHostValidation.runAutoGroupRestoreScenario("${mode}"); })()';

            cs.evalScript(script, (result) => resolve(result));
        })
    `;
}

function makePresetRoundtripExpression(body) {
    return `
        (async function() {
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

            function normalizePath(value) {
                return String(value || '')
                    .replace(/^file:\\/\\//, '')
                    .replace(/\\\\/g, '/');
            }

            function dirname(path) {
                const normalized = normalizePath(path);
                const lastSlash = normalized.lastIndexOf('/');
                return lastSlash > 0 ? normalized.slice(0, lastSlash) : normalized;
            }

            function ensureDir(store, dirPath) {
                let current = normalizePath(dirPath);
                while (current) {
                    store.dirs[current] = true;
                    const parent = dirname(current);
                    if (!parent || parent === current) {
                        break;
                    }
                    current = parent;
                }
            }

            function installPresetFsOverlay() {
                if (typeof CSInterface === 'undefined' || !window.cep || !window.cep.fs) {
                    return { reason: 'missing_cep_fs' };
                }

                const fs = window.cep.fs;
                const originalFs = {
                    readFile: fs.readFile,
                    writeFile: fs.writeFile,
                    stat: fs.stat,
                    makedir: fs.makedir,
                    deleteFile: fs.deleteFile
                };
                const cs = new CSInterface();
                let extensionRoot = cs.getSystemPath(CSInterface.EXTENSION);
                if (extensionRoot.indexOf('file:///') === 0) {
                    extensionRoot = extensionRoot.slice('file:///'.length);
                } else if (extensionRoot.indexOf('file://') === 0) {
                    extensionRoot = extensionRoot.slice('file://'.length);
                }

                const dataDirRaw = extensionRoot + '/data';
                const presetsPathRaw = dataDirRaw + '/presets.json';
                const usagePathRaw = dataDirRaw + '/presets.usage.json';
                const dataDir = normalizePath(dataDirRaw);
                const presetsPath = normalizePath(presetsPathRaw);
                const usagePath = normalizePath(usagePathRaw);
                const store = {
                    files: {},
                    dirs: {}
                };

                function seedFile(rawPath, fallbackData) {
                    const normalizedPath = normalizePath(rawPath);
                    const result = originalFs.readFile(rawPath);
                    store.files[normalizedPath] = result && result.err === 0
                        ? result.data
                        : fallbackData;
                    ensureDir(store, dirname(normalizedPath));
                }

                ensureDir(store, dataDir);
                seedFile(presetsPathRaw, JSON.stringify({ version: 4, presets: [] }, null, 2));
                seedFile(usagePathRaw, JSON.stringify({ version: 1, usageById: {} }, null, 2));

                fs.readFile = function(path) {
                    const normalized = normalizePath(path);
                    if (Object.prototype.hasOwnProperty.call(store.files, normalized)) {
                        return { err: 0, data: store.files[normalized] };
                    }
                    return { err: 1, data: '' };
                };

                fs.writeFile = function(path, data) {
                    const normalized = normalizePath(path);
                    store.files[normalized] = String(data);
                    ensureDir(store, dirname(normalized));
                    return { err: 0 };
                };

                fs.stat = function(path) {
                    const normalized = normalizePath(path);
                    if (store.dirs[normalized] || Object.prototype.hasOwnProperty.call(store.files, normalized)) {
                        return { err: 0 };
                    }
                    return { err: 1 };
                };

                fs.makedir = function(path) {
                    ensureDir(store, path);
                    return { err: 0 };
                };

                fs.deleteFile = function(path) {
                    const normalized = normalizePath(path);
                    delete store.files[normalized];
                    return { err: 0 };
                };

                return {
                    lastActiveKey: 'cep_imposition_presets_last_active',
                    restore() {
                        fs.readFile = originalFs.readFile;
                        fs.writeFile = originalFs.writeFile;
                        fs.stat = originalFs.stat;
                        fs.makedir = originalFs.makedir;
                        fs.deleteFile = originalFs.deleteFile;
                    }
                };
            }

            function getDebug() {
                return window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
            }

            function setInputValue(id, value) {
                const element = document.getElementById(id);
                if (!element) {
                    return false;
                }

                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }

            function setCheckboxValue(id, checked) {
                const element = document.getElementById(id);
                if (!element) {
                    return false;
                }

                element.checked = !!checked;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }

            function collectToastTexts() {
                return Array.from(document.querySelectorAll('#toast-container .toast'))
                    .map((toast) => toast.textContent.replace(/\\s+/g, ' ').trim());
            }

            async function waitFor(condition, timeoutMs = 600, intervalMs = 40) {
                const startedAt = Date.now();
                while ((Date.now() - startedAt) < timeoutMs) {
                    if (condition()) {
                        return true;
                    }
                    await wait(intervalMs);
                }
                return !!condition();
            }

            function findOptionByText(select, text) {
                return Array.from(select.options).find((option) => option.textContent && option.textContent.indexOf(text) !== -1);
            }

            ${body}
        })()
    `;
}

const { registerSymbolSmokeSuites } = require('./smoke_suites/smoke_manifest.cjs');

registerSymbolSmokeSuites({
    runner,
    cleanupSmokeArtifact,
    cleanupSmokeOutput,
    decodeBase64Json,
    makeHostScenarioExpression,
    makePresetRoundtripExpression
});

runner.run();
