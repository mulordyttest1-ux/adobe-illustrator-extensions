const fs = require('fs');
const os = require('os');
const path = require('path');
const CDP = require('chrome-remote-interface');

const { formatSmokeSelection, parseSmokeCliArgs, selectSmokeScenarios } = require('./smoke_filter.cjs');
const { createSmokeScenarioLookup, smokeScenarioRegistry } = require('./smoke_registry.cjs');
const { runToolkitModuleSmokeSuites } = require('./smoke_suites/module_suite_manifest.cjs');

const smokePort = Number(process.env.TOOLKIT_CEP_PORT || 9099);
const smokeProjectName = process.env.TOOLKIT_CEP_PROJECT_NAME || 'Toolkit CEP';
const extensionRoot = path.resolve(__dirname, '..');
const smokeFixtureLayerName = '__TOOLKIT_SMOKE_FIXTURE__';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertNear(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message}. Expected ${expected}, received ${actual}`);
    }
}

async function evaluate(Runtime, expression) {
    const evaluation = await Runtime.evaluate({
        expression,
        returnByValue: true,
        awaitPromise: true
    });

    if (evaluation.exceptionDetails) {
        throw new Error(`Runtime exception: ${JSON.stringify(evaluation.exceptionDetails)}`);
    }

    if (evaluation.result && Object.prototype.hasOwnProperty.call(evaluation.result, 'value')) {
        return evaluation.result.value;
    }

    return evaluation.result;
}

async function waitForReady(Runtime, timeoutMs = 20000) {
    const readyExpression = `
        (function() {
            const ready = window.__TOOLKIT_APP_READY__;
            return Boolean(
                ready &&
                ready.status === 'ready' &&
                ready.hostRuntimeReady === true &&
                ready.catalogReady === true &&
                document.activeElement &&
                document.activeElement.id === 'toolkit-search'
            );
        })()
    `;
    const readyDetailsExpression = `
        (function() {
            return {
                ready: window.__TOOLKIT_APP_READY__ || null,
                activeElementId: document.activeElement ? document.activeElement.id : null
            };
        })()
    `;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const isReady = await evaluate(Runtime, readyExpression);
        if (isReady) {
            return;
        }
        await sleep(100);
    }

    const details = await evaluate(Runtime, readyDetailsExpression);
    throw new Error(`Readiness timeout after ${timeoutMs}ms. ${JSON.stringify(details)}`);
}

async function clickReloadButton(Runtime) {
    await evaluate(Runtime, `
        (function() {
            document.getElementById('btn-reload-panel').click();
            return true;
        })()
    `);
}

async function callHostBridge(Runtime, methodName, payload) {
    return await evaluate(Runtime, `
        (async function() {
            const decodePayload = (encoded) => {
                const binary = atob(encoded);
                const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
                return JSON.parse(new TextDecoder('utf-8').decode(bytes));
            };
            const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
            const methodName = ${JSON.stringify(methodName)};
            const payloadJson = ${typeof payload === 'undefined' ? 'null' : JSON.stringify(JSON.stringify(payload))};
            const script = payloadJson === null
                ? 'ToolkitBridge.' + methodName + '()'
                : 'ToolkitBridge.' + methodName + '(' + JSON.stringify(payloadJson) + ')';
            const encoded = await hostDebug.evalScript(script);
            return decodePayload(encoded);
        })()
    `);
}

async function prepareHostFacadeRunCount(Runtime) {
    await evaluate(Runtime, `
        (function() {
            const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
            if (!hostFacade.__smokePatchedRunCommand) {
                const originalRunCommand = hostFacade.runCommand.bind(hostFacade);
                let runCount = 0;

                hostFacade.runCommand = async function(request) {
                    runCount += 1;
                    return originalRunCommand(request);
                };
                hostFacade.__smokePatchedRunCommand = true;
                hostFacade.__getSmokeRunCount = function() {
                    return runCount;
                };
                hostFacade.__resetSmokeRunCount = function() {
                    runCount = 0;
                };
            }

            hostFacade.__resetSmokeRunCount();
            return true;
        })()
    `);
}

async function readHostFacadeRunCount(Runtime) {
    return await evaluate(Runtime, `
        (function() {
            const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
            return hostFacade.__getSmokeRunCount ? hostFacade.__getSmokeRunCount() : -1;
        })()
    `);
}

async function runTest(name, fn, results) {
    process.stdout.write(`- ${name} ... `);

    try {
        await fn();
        results.passed += 1;
        console.log('PASS');
    } catch (error) {
        results.failed += 1;
        console.log(`FAIL\n  ${error.message}`);
    }
}

async function runSelectedScenario(definition, selectedScenarioIds, results, fn) {
    if (!selectedScenarioIds[definition.id]) {
        return;
    }

    await runTest(definition.description, fn, results);
}

function createBrokenRegistryFixture() {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-quarantine-'));
    const brokenModulePath = path.join(tempRoot, 'broken_quarantine_probe.jsx');
    const registryPath = path.join(tempRoot, 'module_registry.jsx');
    const swapSizeAndPositionPath = path.resolve(extensionRoot, 'modules', 'swap_selection_size_and_position', 'run.jsx');
    const cameraMarksPath = path.resolve(extensionRoot, 'modules', 'add_camera_marks', 'run.jsx');
    const cutLinesPath = path.resolve(extensionRoot, 'modules', 'create_cut_lines', 'run.jsx');
    const prepareCutPath = path.resolve(extensionRoot, 'modules', 'prepare_cut_package', 'run.jsx');
    const saveCutPath = path.resolve(extensionRoot, 'modules', 'save_cut_package', 'run.jsx');

    fs.writeFileSync(
        brokenModulePath,
        'throw new Error("Broken quarantine fixture module");\n',
        'utf8'
    );

    const registrySource = [
        '$.global.ToolkitGeneratedModuleRegistry = [',
        `    { id: "swap_selection_size_and_position", absolutePath: ${JSON.stringify(swapSizeAndPositionPath)} },`,
        `    { id: "add_camera_marks", absolutePath: ${JSON.stringify(cameraMarksPath)} },`,
        `    { id: "create_cut_lines", absolutePath: ${JSON.stringify(cutLinesPath)} },`,
        `    { id: "prepare_cut_package", absolutePath: ${JSON.stringify(prepareCutPath)} },`,
        `    { id: "save_cut_package", absolutePath: ${JSON.stringify(saveCutPath)} },`,
        `    { id: "swap_selection_position_only", absolutePath: ${JSON.stringify(brokenModulePath)} }`,
        '];',
        ''
    ].join('\n');

    fs.writeFileSync(registryPath, registrySource, 'utf8');

    return {
        tempRoot,
        registryPath
    };
}

async function restoreDefaultRuntime(Runtime) {
    await evaluate(Runtime, `
        (async function() {
            await window.__TOOLKIT_TEST_API__.getRuntimeState().services.reloadAndSyncHostRuntime();
            return {
                ready: window.__TOOLKIT_APP_READY__,
                catalog: window.__TOOLKIT_TEST_API__.getCatalog()
            };
        })()
    `);
}

async function closeSmokeFixtureDocuments(Runtime) {
    return await evaluate(Runtime, `
        (async function() {
            const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
            const cleanupJson = await hostDebug.evalScript(
                '(function(){' +
                'var closedCount = 0;' +
                'var i;' +
                'var doc;' +
                'var hasMarkerLayer;' +
                'var layerIndex;' +
                'for(i = app.documents.length - 1; i >= 0; i -= 1){' +
                'doc = app.documents[i];' +
                'hasMarkerLayer = false;' +
                'for(layerIndex = 0; layerIndex < doc.layers.length; layerIndex += 1){' +
                'if(doc.layers[layerIndex].name === ' + ${JSON.stringify(JSON.stringify(smokeFixtureLayerName))} + '){hasMarkerLayer = true; break;}' +
                '}' +
                'if(!hasMarkerLayer){continue;}' +
                'try{doc.close(SaveOptions.DONOTSAVECHANGES); closedCount += 1;}catch(closeError){}' +
                '}' +
                'return JSON.stringify({ closedCount: closedCount });' +
                '})()'
            );
            return JSON.parse(cleanupJson);
        })()
    `);
}

async function activateDocumentByName(Runtime, documentName) {
    return await evaluate(Runtime, `
        (async function() {
            const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
            const targetName = ${JSON.stringify(documentName || '')};
            const activationJson = await hostDebug.evalScript(
                '(function(){' +
                'var targetName = ' + JSON.stringify(targetName) + ';' +
                'var doc = null;' +
                'var i;' +
                'for(i = app.documents.length - 1; i >= 0; i -= 1){' +
                'if(app.documents[i].name === targetName){doc = app.documents[i]; break;}' +
                '}' +
                'if(!doc){return JSON.stringify({ found: false, activeDocumentName: app.documents.length ? app.activeDocument.name : "" });}' +
                'if(typeof doc.activate === "function"){try{doc.activate();}catch(activateError){}}' +
                'try{app.redraw();}catch(redrawError){}' +
                'return JSON.stringify({ found: true, activeDocumentName: app.documents.length ? app.activeDocument.name : "", remainingDocCount: app.documents.length });' +
                '})()'
            );
            return JSON.parse(activationJson);
        })()
    `);
}

async function activateFixtureDocument(Runtime, fixture, label) {
    const activation = await activateDocumentByName(
        Runtime,
        fixture && fixture.data ? fixture.data.documentName : ''
    );

    assert(
        activation &&
        activation.found === true &&
        activation.activeDocumentName === fixture.data.documentName,
        `${label} fixture document was not activated: ${JSON.stringify({ fixture, activation })}`
    );
}

async function prepareSelectionDocument(Runtime, withSelection) {
    const withSelectionLiteral = JSON.stringify(withSelection === true);
    const fixture = await evaluate(Runtime, `
        (async function() {
            const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
            const setupJson = await hostDebug.evalScript(
                '(function(){' +
                'var i;' +
                'var docToClose;' +
                'var hasMarkerLayer;' +
                'var layerIndex;' +
                'for(i = app.documents.length - 1; i >= 0; i -= 1){' +
                'docToClose = app.documents[i];' +
                'hasMarkerLayer = false;' +
                'for(layerIndex = 0; layerIndex < docToClose.layers.length; layerIndex += 1){' +
                'if(docToClose.layers[layerIndex].name === ' + ${JSON.stringify(JSON.stringify(smokeFixtureLayerName))} + '){hasMarkerLayer = true; break;}' +
                '}' +
                'if(!hasMarkerLayer){continue;}' +
                'try{docToClose.close(SaveOptions.DONOTSAVECHANGES);}catch(closeError){}' +
                '}' +
                'var doc = app.documents.add();' +
                'var contentLayer = doc.activeLayer;' +
                'var item = doc.pathItems.rectangle(400, 100, 120, 80);' +
                'item.filled = false;' +
                'item.stroked = true;' +
                'var markerLayer = doc.layers.add();' +
                'markerLayer.name = ' + ${JSON.stringify(JSON.stringify(smokeFixtureLayerName))} + ';' +
                'try{doc.activeLayer = contentLayer;}catch(activeLayerError){}' +
                'try{markerLayer.visible = false;}catch(markerVisibleError){}' +
                'try{markerLayer.locked = true;}catch(markerLockedError){}' +
                'try{doc.activeLayer = contentLayer;}catch(activeLayerResetError){}' +
                'doc.selection = null;' +
                'if(' + ${withSelectionLiteral} + '){item.selected = true; doc.selection = [item];}' +
                'try{if(typeof doc.activate === "function"){doc.activate();}}catch(activateError){}' +
                'try{doc.activeLayer = contentLayer;}catch(activeLayerActivateResetError){}' +
                'try{app.redraw();}catch(redrawError){}' +
                'return JSON.stringify({ documentName: doc.name, selectionCount: doc.selection ? doc.selection.length : 0 });' +
                '})()'
            );
            return JSON.parse(setupJson);
        })()
    `);
    await sleep(150);
    return fixture;
}

async function prepareCmykFixtureDocument(Runtime) {
    const fixture = await evaluate(Runtime, `
        (async function() {
            const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
            const setupJson = await hostDebug.evalScript(
                '(function(){' +
                'var i;' +
                'var docToClose;' +
                'var hasMarkerLayer;' +
                'var layerIndex;' +
                'for(i = app.documents.length - 1; i >= 0; i -= 1){' +
                'docToClose = app.documents[i];' +
                'hasMarkerLayer = false;' +
                'for(layerIndex = 0; layerIndex < docToClose.layers.length; layerIndex += 1){' +
                'if(docToClose.layers[layerIndex].name === ' + ${JSON.stringify(JSON.stringify(smokeFixtureLayerName))} + '){hasMarkerLayer = true; break;}' +
                '}' +
                'if(!hasMarkerLayer){continue;}' +
                'try{docToClose.close(SaveOptions.DONOTSAVECHANGES);}catch(closeError){}' +
                '}' +
                'var doc = app.documents.add(DocumentColorSpace.CMYK);' +
                'var contentLayer = doc.activeLayer;' +
                'var markerLayer = doc.layers.add();' +
                'markerLayer.name = ' + ${JSON.stringify(JSON.stringify(smokeFixtureLayerName))} + ';' +
                'try{markerLayer.visible = false;}catch(markerVisibleError){}' +
                'try{markerLayer.locked = true;}catch(markerLockedError){}' +
                'try{doc.activeLayer = contentLayer;}catch(activeLayerResetError){}' +
                'doc.selection = null;' +
                'try{if(typeof doc.activate === "function"){doc.activate();}}catch(activateError){}' +
                'try{doc.activeLayer = contentLayer;}catch(activeLayerActivateResetError){}' +
                'try{app.redraw();}catch(redrawError){}' +
                'return JSON.stringify({ documentName: doc.name, selectionCount: 0, documentColorSpace: doc.documentColorSpace });' +
                '})()'
            );
            return JSON.parse(setupJson);
        })()
    `);
    await sleep(150);
    return fixture;
}

async function runHostScript(Runtime, scriptSource) {
    return await evaluate(Runtime, `
        (async function() {
            const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
            return await hostDebug.evalScript(${JSON.stringify(scriptSource)});
        })()
    `);
}

async function runHostJson(Runtime, scriptSource) {
    const raw = await runHostScript(Runtime, scriptSource);

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`Host JSON parse failed. Raw: ${raw}`);
    }
}

function assertPointNear(actual, expected, tolerance, message) {
    assert(Array.isArray(actual) && actual.length === 2, `${message}. Actual point missing.`);
    assert(Array.isArray(expected) && expected.length === 2, `${message}. Expected point missing.`);
    assertNear(actual[0], expected[0], tolerance, `${message} (x)`);
    assertNear(actual[1], expected[1], tolerance, `${message} (y)`);
}

function assertBoundsNear(actual, expected, tolerance, message) {
    let index;

    assert(Array.isArray(actual) && actual.length === 4, `${message}. Actual bounds missing.`);
    assert(Array.isArray(expected) && expected.length === 4, `${message}. Expected bounds missing.`);

    for (index = 0; index < 4; index += 1) {
        assertNear(actual[index], expected[index], tolerance, `${message} [${index}]`);
    }
}

function assertCmykColor(actual, expected, tolerance, message) {
    assert(actual && actual.model === 'CMYK', `${message}. Expected a CMYK color, received ${JSON.stringify(actual)}`);
    assertNear(actual.cyan, expected.cyan, tolerance, `${message} cyan`);
    assertNear(actual.magenta, expected.magenta, tolerance, `${message} magenta`);
    assertNear(actual.yellow, expected.yellow, tolerance, `${message} yellow`);
    assertNear(actual.black, expected.black, tolerance, `${message} black`);
}

function normalizeAngleDelta(angle) {
    let normalized = angle % 360;

    if (normalized > 180) {
        normalized -= 360;
    }

    if (normalized < -180) {
        normalized += 360;
    }

    return normalized;
}

function assertAngleNear(actual, expected, tolerance, message) {
    const delta = normalizeAngleDelta(actual - expected);

    if (Math.abs(delta) > tolerance) {
        throw new Error(`${message}. Expected ${expected}, received ${actual}`);
    }
}

async function main() {
    const cliFilter = parseSmokeCliArgs(process.argv.slice(2));
    const selectedScenarios = selectSmokeScenarios(cliFilter, smokeScenarioRegistry);
    const selectedScenarioIds = selectedScenarios.reduce((lookup, scenario) => {
        lookup[scenario.id] = true;
        return lookup;
    }, {});
    const shouldSyncHostRuntime =
        cliFilter.mode === 'module' ||
        (cliFilter.mode === 'scenario' && selectedScenarios.length > 0 && selectedScenarios.every((scenario) => scenario.scope === 'module'));
    const scenarioLookup = createSmokeScenarioLookup();
    const quarantineFixture = createBrokenRegistryFixture();
    const tempOutputRoots = [];
    let client = null;

    const results = {
        passed: 0,
        failed: 0
    };

    try {
        console.log(`Smoke selection: ${formatSmokeSelection(cliFilter, selectedScenarios)}`);
        console.log(`Connecting to ${smokeProjectName} on port ${smokePort}...`);
        client = await CDP({ port: smokePort, host: 'localhost' });
        const { Runtime, Page } = client;
        await Runtime.enable();
        await Page.enable();

        console.log('Reloading panel for a fresh toolkit bundle...');
        await Page.reload();
        await waitForReady(Runtime);

        if (shouldSyncHostRuntime) {
            await restoreDefaultRuntime(Runtime);
            await waitForReady(Runtime);
        }

        await runSelectedScenario(scenarioLookup.startup_ready_path, selectedScenarioIds, results, async () => {
            const result = await evaluate(Runtime, `
                (function() {
                    return {
                        ready: window.__TOOLKIT_APP_READY__,
                        dashboardCount: document.querySelectorAll('#dashboard-groups [data-command-id]').length,
                        activeElementId: document.activeElement ? document.activeElement.id : null,
                        runtimeStateHost: window.__TOOLKIT_TEST_API__.getRuntimeState().hostRuntime,
                        catalogCount: window.__TOOLKIT_TEST_API__.getCatalog().modules.length
                    };
                })()
            `);

            assert(result.ready && result.ready.status === 'ready', `Toolkit did not reach ready state: ${JSON.stringify(result)}`);
            assert(result.ready.hostRuntimeReady === true, `Host runtime was not ready on boot: ${JSON.stringify(result)}`);
            assert(result.ready.hostRuntimeHealthy === true, `Healthy boot expected no quarantine: ${JSON.stringify(result)}`);
            assert(result.ready.hostRuntime && result.ready.hostRuntime.moduleCount >= 6, `Expected toolkit modules on boot: ${JSON.stringify(result)}`);
            assert(result.runtimeStateHost && result.runtimeStateHost.moduleCount === result.ready.hostRuntime.moduleCount, `Runtime state host meta missing: ${JSON.stringify(result)}`);
            assert(result.dashboardCount === result.catalogCount && result.catalogCount >= 1, `Generated modules did not render: ${JSON.stringify(result)}`);
            assert(result.activeElementId === 'toolkit-search', `Search input did not autofocus: ${JSON.stringify(result)}`);
        });

        await runSelectedScenario(scenarioLookup.reload_button_ready, selectedScenarioIds, results, async () => {
            await clickReloadButton(Runtime);
            await waitForReady(Runtime, 25000);

            const result = await evaluate(Runtime, `
                (function() {
                    return {
                        ready: window.__TOOLKIT_APP_READY__,
                        summaryText: document.getElementById('toolkit-execution-summary').textContent.trim()
                    };
                })()
            `);

            assert(result.ready.status === 'ready', `Panel did not return to ready after reload button: ${JSON.stringify(result)}`);
            assert(result.ready.hostRuntimeReady === true, `Host runtime not ready after reload button: ${JSON.stringify(result)}`);
            assert(result.ready.hostRuntimeHealthy === true, `Reload button should keep runtime healthy: ${JSON.stringify(result)}`);
            assert(result.ready.hostRuntime.moduleCount >= 6, `Unexpected module count after reload button: ${JSON.stringify(result)}`);
        });

        if (!shouldSyncHostRuntime) {
            console.log('Syncing host runtime before module scenarios...');
            await restoreDefaultRuntime(Runtime);
            await waitForReady(Runtime);
        }

        await runToolkitModuleSmokeSuites({
            Runtime,
            scenarioLookup,
            selectedScenarioIds,
            results,
            tempOutputRoots,
            runSelectedScenario,
            assert,
            assertNear,
            evaluate,
            callHostBridge,
            prepareHostFacadeRunCount,
            readHostFacadeRunCount,
            restoreDefaultRuntime,
            waitForReady,
            prepareSelectionDocument,
            prepareCmykFixtureDocument,
            activateFixtureDocument,
            activateDocumentByName,
            runHostScript,
            runHostJson,
            assertPointNear,
            assertBoundsNear,
            assertCmykColor,
            assertAngleNear,
            extensionRoot,
            smokeFixtureLayerName,
            fs,
            os,
            path
        });

        await runSelectedScenario(scenarioLookup.quarantine_module_visibility, selectedScenarioIds, results, async () => {
            const syncResult = await evaluate(Runtime, `
                (async function() {
                    await window.__TOOLKIT_TEST_API__.getRuntimeState().services.reloadAndSyncHostRuntime({
                        registryFilePath: ${JSON.stringify(quarantineFixture.registryPath)}
                    });
                    return {
                        ready: window.__TOOLKIT_APP_READY__,
                        catalog: window.__TOOLKIT_TEST_API__.getCatalog(),
                        summaryText: document.getElementById('toolkit-execution-summary').textContent.trim()
                    };
                })()
            `);

            assert(syncResult.ready.status === 'ready', `Shell did not stay ready after quarantine reload: ${JSON.stringify(syncResult)}`);
            assert(syncResult.ready.hostRuntimeHealthy === false, `Quarantine reload should mark runtime unhealthy: ${JSON.stringify(syncResult)}`);
            assert(syncResult.ready.quarantinedModuleCount === 1, `Expected one quarantined module: ${JSON.stringify(syncResult)}`);
            assert(syncResult.catalog.quarantinedCount === 1, `Catalog quarantine count mismatch: ${JSON.stringify(syncResult)}`);

            const disabledState = await evaluate(Runtime, `
                (function() {
                    const disabledNodes = document.querySelectorAll('[data-command-id="swap_selection_position_only"].is-disabled');
                    const selectionModule = window.__TOOLKIT_TEST_API__.getCatalog().lookup.get('swap_selection_position_only');
                    return {
                        disabledNodeCount: disabledNodes.length,
                        disabledReason: selectionModule ? selectionModule.disabledReason : '',
                        runtime: window.__TOOLKIT_APP_READY__.hostRuntime
                    };
                })()
            `);

            assert(disabledState.disabledNodeCount >= 1, `Quarantined module did not render as disabled: ${JSON.stringify(disabledState)}`);
            assert(/Broken quarantine fixture module/.test(disabledState.disabledReason), `Disabled reason did not propagate from quarantine: ${JSON.stringify(disabledState)}`);
            assert(disabledState.runtime.quarantinedModules.length === 1, `Runtime meta missing quarantined module: ${JSON.stringify(disabledState)}`);

            await prepareHostFacadeRunCount(Runtime);
            const blockedRun = await evaluate(Runtime, `
                (async function() {
                    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                    const waitFor = async (condition, timeoutMs) => {
                        const startedAt = Date.now();
                        while ((Date.now() - startedAt) < timeoutMs) {
                            if (condition()) {
                                return true;
                            }
                            await wait(50);
                        }
                        return !!condition();
                    };
                    const input = document.getElementById('toolkit-search');
                    const summary = document.getElementById('toolkit-execution-summary');

                    input.value = 'swap';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    await wait(100);
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    await waitFor(() => {
                        const lastResult = window.__TOOLKIT_TEST_API__.getRuntimeState().lastResult;
                        return Boolean(lastResult && lastResult.errorCode === 'QUARANTINED_TOOLKIT_COMMAND');
                    }, 2000);

                    return {
                        lastResult: window.__TOOLKIT_TEST_API__.getRuntimeState().lastResult,
                        summaryText: summary.textContent.trim(),
                        resultsHidden: document.getElementById('results-panel').hidden
                    };
                })()
            `);
            const hostRunCount = await readHostFacadeRunCount(Runtime);

            assert(blockedRun.lastResult && blockedRun.lastResult.errorCode === 'QUARANTINED_TOOLKIT_COMMAND', `Quarantined module did not block locally: ${JSON.stringify(blockedRun)}`);
            assert(hostRunCount === 0, `Quarantined module should not cross the host facade: ${hostRunCount}`);
            assert(/Broken quarantine fixture module/.test(blockedRun.summaryText), `Summary text did not explain quarantine: ${JSON.stringify(blockedRun)}`);
            assert(blockedRun.resultsHidden === true, `Search should still clear after blocked execution: ${JSON.stringify(blockedRun)}`);

            await restoreDefaultRuntime(Runtime);
            await waitForReady(Runtime);
            const restored = await evaluate(Runtime, `
                (function() {
                    return {
                        ready: window.__TOOLKIT_APP_READY__,
                        selectionModule: window.__TOOLKIT_TEST_API__.getCatalog().lookup.get('swap_selection_position_only')
                    };
                })()
            `);

            assert(restored.ready.hostRuntimeHealthy === true, `Runtime did not recover after restoring default registry: ${JSON.stringify(restored)}`);
            assert(restored.selectionModule.enabled === true, `Selection module stayed disabled after runtime restore: ${JSON.stringify(restored)}`);
        });

        console.log(`\nSmoke complete. Passed: ${results.passed}, Failed: ${results.failed}`);
        if (results.failed > 0) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`Fatal smoke error: ${error.message}`);
        process.exitCode = 1;
    } finally {
        if (client) {
            try {
                const { Runtime } = client;
                await closeSmokeFixtureDocuments(Runtime);
                await restoreDefaultRuntime(Runtime);
            } catch (cleanupError) {
                console.warn(`Cleanup warning: ${cleanupError.message}`);
            }

            await client.close();
        }

        try {
            fs.rmSync(quarantineFixture.tempRoot, { recursive: true, force: true });
        } catch (cleanupError) {
            console.warn(`Temp fixture cleanup warning: ${cleanupError.message}`);
        }

        for (const tempOutputRoot of tempOutputRoots) {
            try {
                fs.rmSync(tempOutputRoot, { recursive: true, force: true });
            } catch (cleanupError) {
                console.warn(`Temp export cleanup warning: ${cleanupError.message}`);
            }
        }
    }
}

main();
