async function runStepRepeatSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;

    await runSelectedScenario(scenarioLookup.step_repeat_basic_centered, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'doc.artboards[0].artboardRect = [0, 300, 400, 0];' +
                    'var layer = doc.layers.add();' +
                    'layer.name = "STEP_REPEAT_BASIC_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(260, 40, 100, 50);' +
                    'source.name = "STEP_REPEAT_BASIC_SOURCE";' +
                    'source.filled = false;' +
                    'source.stroked = true;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, artboardBounds: doc.artboards[0].artboardRect });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'step_repeat',
                            payload: {
                                gapMm: 1,
                                marginMm: 10
                            }
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ groupBounds: null, groupCenter: null, childCount: 0, sourceExists: false, printableBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var group = null;' +
                    'var sourceExists = false;' +
                    'var i;' +
                    'var artboardBounds = doc.artboards[0].artboardRect;' +
                    'var marginPt = (10 * 72 / 25.4);' +
                    'var printableBounds = [artboardBounds[0] + marginPt, artboardBounds[1] - marginPt, artboardBounds[2] - marginPt, artboardBounds[3] + marginPt];' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if(doc.groupItems[i].name === "STEP_REPEAT_GRID"){group = doc.groupItems[i]; break;}}' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "STEP_REPEAT_BASIC_SOURCE" && doc.pathItems[i].parent && doc.pathItems[i].parent.typename === "Layer"){sourceExists = true; break;}}' +
                    'return JSON.stringify({' +
                    'groupBounds: group ? group.geometricBounds : null,' +
                    'groupCenter: group ? [(group.geometricBounds[0] + group.geometricBounds[2]) / 2, (group.geometricBounds[1] + group.geometricBounds[3]) / 2] : null,' +
                    'childCount: group ? group.groupItems.length : 0,' +
                    'sourceExists: sourceExists,' +
                    'printableBounds: printableBounds' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare step-repeat basic fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Step Repeat basic run should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.mode === 'plain', `Step Repeat basic mode mismatch: ${JSON.stringify(result)}`);
                assert(result.data && result.data.marginMm === 10, `Step Repeat basic should report applied margin: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rows === 4 && result.data.cols === 3 && result.data.count === 12, `Step Repeat basic margin-aware count mismatch: ${JSON.stringify(result)}`);
                assertPointNear(inspection.groupCenter, [200, 150], 0.2, 'Step Repeat grid should be centered on the active artboard');
                assert(inspection.childCount === 12, `Step Repeat grid should create 12 cell groups inside the printable area: ${JSON.stringify(inspection)}`);
                assert(inspection.groupBounds[0] >= inspection.printableBounds[0] - 0.2, `Step Repeat grid should respect printable left margin: ${JSON.stringify(inspection)}`);
                assert(inspection.groupBounds[1] <= inspection.printableBounds[1] + 0.2, `Step Repeat grid should respect printable top margin: ${JSON.stringify(inspection)}`);
                assert(inspection.groupBounds[2] <= inspection.printableBounds[2] + 0.2, `Step Repeat grid should respect printable right margin: ${JSON.stringify(inspection)}`);
                assert(inspection.groupBounds[3] >= inspection.printableBounds[3] - 0.2, `Step Repeat grid should respect printable bottom margin: ${JSON.stringify(inspection)}`);
                assert(inspection.sourceExists === false, `Step Repeat should replace the source selection: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Step Repeat basic fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.step_repeat_auto_count, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'doc.artboards[0].artboardRect = [0, 260, 420, 0];' +
                    'var layer = doc.layers.add();' +
                    'layer.name = "STEP_REPEAT_AUTO_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(210, 30, 90, 70);' +
                    'source.name = "STEP_REPEAT_AUTO_SOURCE";' +
                    'source.filled = false;' +
                    'source.stroked = true;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'step_repeat',
                            payload: {
                                gapMm: 1,
                                marginMm: 0
                            }
                        });
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare step-repeat auto-count fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Step Repeat auto-count run should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rows === 3 && result.data.cols === 4 && result.data.count === 12, `Step Repeat should auto-calculate rows/cols from the active artboard: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 1, `Step Repeat auto-count fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.step_repeat_auto_rotate_better_fit, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'doc.artboards[0].artboardRect = [0, 400, 240, 0];' +
                    'var layer = doc.layers.add();' +
                    'layer.name = "STEP_REPEAT_ROTATE_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(340, 20, 140, 60);' +
                    'source.name = "STEP_REPEAT_ROTATE_SOURCE";' +
                    'source.filled = false;' +
                    'source.stroked = true;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'step_repeat',
                            payload: {
                                gapMm: 0,
                                marginMm: 0
                            }
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ groupBounds: null, childCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var group = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if(doc.groupItems[i].name === "STEP_REPEAT_GRID"){group = doc.groupItems[i]; break;}}' +
                    'return JSON.stringify({ groupBounds: group ? group.geometricBounds : null, childCount: group ? group.groupItems.length : 0 });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare auto-rotate fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Step Repeat auto-rotate run should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rotationApplied === true, `Step Repeat should auto-rotate when it fits more cells: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rows === 2 && result.data.cols === 4 && result.data.count === 8, `Step Repeat auto-rotate count mismatch: ${JSON.stringify(result)}`);
                assert(inspection.childCount === 8, `Step Repeat auto-rotate should create 8 cells: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Step Repeat auto-rotate fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.step_repeat_cell_too_large_fail, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, sourceBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'doc.artboards[0].artboardRect = [0, 100, 100, 0];' +
                    'var layer = doc.layers.add();' +
                    'layer.name = "STEP_REPEAT_TOO_LARGE_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(130, 0, 180, 120);' +
                    'source.name = "STEP_REPEAT_TOO_LARGE_SOURCE";' +
                    'source.filled = false;' +
                    'source.stroked = true;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, sourceBounds: source.geometricBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'step_repeat',
                            payload: {
                                gapMm: 0,
                                marginMm: 0
                            }
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ sourceExists: false, outputExists: false, sourceBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var source = null;' +
                    'var outputExists = false;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "STEP_REPEAT_TOO_LARGE_SOURCE" && doc.pathItems[i].parent && doc.pathItems[i].parent.typename === "Layer"){source = doc.pathItems[i]; break;}}' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if(doc.groupItems[i].name === "STEP_REPEAT_GRID"){outputExists = true; break;}}' +
                    'return JSON.stringify({ sourceExists: source !== null, outputExists: outputExists, sourceBounds: source ? source.geometricBounds : null });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare too-large fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === false, `Too-large cell should fail: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'STEP_REPEAT_CELL_TOO_LARGE', `Too-large cell should surface STEP_REPEAT_CELL_TOO_LARGE: ${JSON.stringify(result)}`);
                assert(inspection.sourceExists === true, `Too-large cell should leave the source selection untouched: ${JSON.stringify(inspection)}`);
                assert(inspection.outputExists === false, `Too-large cell should not create an output grid: ${JSON.stringify(inspection)}`);
                assertBoundsNear(inspection.sourceBounds, setup.sourceBounds, 0.2, 'Too-large source bounds should remain unchanged');
                assert(cleanup.closedCount >= 1, `Too-large cell fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.step_repeat_gap_invalid_fail, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, sourceBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'layer.name = "STEP_REPEAT_INVALID_GAP_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(200, 60, 80, 50);' +
                    'source.name = "STEP_REPEAT_INVALID_GAP_SOURCE";' +
                    'source.filled = false;' +
                    'source.stroked = true;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, sourceBounds: source.geometricBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'step_repeat',
                            payload: {
                                gapMm: -5,
                                marginMm: 0
                            }
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ sourceExists: false, outputExists: false, sourceBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var source = null;' +
                    'var outputExists = false;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "STEP_REPEAT_INVALID_GAP_SOURCE" && doc.pathItems[i].parent && doc.pathItems[i].parent.typename === "Layer"){source = doc.pathItems[i]; break;}}' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if(doc.groupItems[i].name === "STEP_REPEAT_GRID"){outputExists = true; break;}}' +
                    'return JSON.stringify({ sourceExists: source !== null, outputExists: outputExists, sourceBounds: source ? source.geometricBounds : null });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare invalid-gap fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === false, `Invalid gap should fail: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'STEP_REPEAT_INVALID_GAP', `Invalid gap should surface STEP_REPEAT_INVALID_GAP: ${JSON.stringify(result)}`);
                assert(inspection.sourceExists === true, `Invalid gap should leave the source selection untouched: ${JSON.stringify(inspection)}`);
                assert(inspection.outputExists === false, `Invalid gap should not create an output grid: ${JSON.stringify(inspection)}`);
                assertBoundsNear(inspection.sourceBounds, setup.sourceBounds, 0.2, 'Invalid-gap source bounds should remain unchanged');
                assert(cleanup.closedCount >= 1, `Invalid-gap fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.step_repeat_symbol_creates_instances, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'doc.artboards[0].artboardRect = [0, 220, 300, 0];' +
                    'var layer = doc.layers.add();' +
                    'layer.name = "STEP_REPEAT_SYMBOL_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(180, 50, 100, 50);' +
                    'source.name = "STEP_REPEAT_SYMBOL_SOURCE";' +
                    'source.filled = false;' +
                    'source.stroked = true;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'step_repeat_symbol',
                            payload: {
                                gapMm: 10,
                                marginMm: 10
                            }
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ groupBounds: null, groupPageItemCount: 0, groupNonSymbolCount: 0, sourceExists: false, symbolCount: 0, symbolDefinitionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var group = null;' +
                    'var sourceExists = false;' +
                    'var i;' +
                    'var nonSymbolCount = 0;' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if(doc.groupItems[i].name === "STEP_REPEAT_SYMBOL_GRID"){group = doc.groupItems[i]; break;}}' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "STEP_REPEAT_SYMBOL_SOURCE" && doc.pathItems[i].parent && doc.pathItems[i].parent.typename === "Layer"){sourceExists = true; break;}}' +
                    'if(group){for(i = 0; i < group.pageItems.length; i += 1){if(group.pageItems[i].typename !== "SymbolItem"){nonSymbolCount += 1;}}}' +
                    'return JSON.stringify({' +
                    'groupBounds: group ? group.geometricBounds : null,' +
                    'groupPageItemCount: group ? group.pageItems.length : 0,' +
                    'groupNonSymbolCount: nonSymbolCount,' +
                    'sourceExists: sourceExists,' +
                    'symbolCount: doc.symbolItems.length,' +
                    'symbolDefinitionCount: doc.symbols.length' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare step-repeat symbol fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Step Repeat Symbol run should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.mode === 'symbol', `Step Repeat Symbol mode mismatch: ${JSON.stringify(result)}`);
                assert(result.data && result.data.marginMm === 10, `Step Repeat Symbol should report applied margin: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rows === 2 && result.data.cols === 2 && result.data.count === 4, `Step Repeat Symbol margin-aware count mismatch: ${JSON.stringify(result)}`);
                assert(inspection.groupPageItemCount === 4, `Step Repeat Symbol should create 4 instances in the output group: ${JSON.stringify(inspection)}`);
                assert(inspection.groupNonSymbolCount === 0, `Step Repeat Symbol output group should only contain SymbolItem children: ${JSON.stringify(inspection)}`);
                assert(inspection.sourceExists === false, `Step Repeat Symbol should replace the source selection: ${JSON.stringify(inspection)}`);
                assert(inspection.symbolCount >= 4, `Step Repeat Symbol should create document-level symbol instances: ${JSON.stringify(inspection)}`);
                assert(inspection.symbolDefinitionCount >= 1, `Step Repeat Symbol should create at least one symbol definition: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Step Repeat Symbol fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });
}

module.exports = { runStepRepeatSmokeSuite };
