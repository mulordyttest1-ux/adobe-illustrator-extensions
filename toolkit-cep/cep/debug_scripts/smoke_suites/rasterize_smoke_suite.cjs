async function runRasterizeSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;
    const { closeSmokeFixtureDocuments } = context;

    await runSelectedScenario(scenarioLookup.rasterize_bitmap_basic, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var fillColor = new GrayColor();' +
                    'fillColor.gray = 100;' +
                    'layer.name = "RASTER_BASIC_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var source = doc.pathItems.rectangle(280, 60, 110, 70);' +
                    'source.name = "RASTER_BASIC_SOURCE";' +
                    'source.filled = true;' +
                    'source.fillColor = fillColor;' +
                    'source.stroked = false;' +
                    'source.selected = true;' +
                    'doc.selection = [source];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, sourceBounds: source.visibleBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'rasterize_bitmap_300_transparent',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ rasterCount: 0, outputBounds: null, outputBitsPerChannel: 0, outputType: "", outputSelected: false, sourceExists: false, selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var output = null;' +
                    'var sourceExists = false;' +
                    'var i;' +
                    'for(i = 0; i < doc.rasterItems.length; i += 1){if(doc.rasterItems[i].name === "RASTERIZE_BITMAP_300PPI"){output = doc.rasterItems[i]; break;}}' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "RASTER_BASIC_SOURCE"){sourceExists = true; break;}}' +
                    'return JSON.stringify({' +
                    'rasterCount: doc.rasterItems.length,' +
                    'outputBounds: output ? output.visibleBounds : null,' +
                    'outputBitsPerChannel: output ? output.bitsPerChannel : 0,' +
                    'outputType: output ? output.typename : "",' +
                    'outputSelected: output ? output.selected === true : false,' +
                    'sourceExists: sourceExists,' +
                    'selectionCount: doc.selection ? doc.selection.length : 0' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare rasterize bitmap basic fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Rasterize Bitmap basic run should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.selectionCountBefore === 1, `Rasterize Bitmap should report one selected source item: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rasterItemCountAfter === 1, `Rasterize Bitmap should report one raster output item: ${JSON.stringify(result)}`);
                assert(result.data && result.data.colorModel === 'bitmap', `Rasterize Bitmap should report bitmap color model: ${JSON.stringify(result)}`);
                assert(result.data && result.data.resolution === 300, `Rasterize Bitmap should report 300 ppi: ${JSON.stringify(result)}`);
                assert(result.data && result.data.transparent === true, `Rasterize Bitmap should report transparent output: ${JSON.stringify(result)}`);
                assert(result.data && result.data.bitsPerChannel === 1, `Rasterize Bitmap should report 1 bit per channel for bitmap output: ${JSON.stringify(result)}`);
                assert(inspection.rasterCount === 1, `Rasterize Bitmap should create exactly one raster item: ${JSON.stringify(inspection)}`);
                assert(inspection.outputType === 'RasterItem', `Rasterize Bitmap output should be a RasterItem: ${JSON.stringify(inspection)}`);
                assert(inspection.outputBitsPerChannel === 1, `Rasterize Bitmap output bits per channel mismatch: ${JSON.stringify(inspection)}`);
                assert(inspection.outputSelected === true && inspection.selectionCount === 1, `Rasterize Bitmap should select the raster output: ${JSON.stringify(inspection)}`);
                assert(inspection.sourceExists === false, `Rasterize Bitmap should dispose the original source art: ${JSON.stringify(inspection)}`);
                assertBoundsNear(inspection.outputBounds, setup.sourceBounds, 0.5, 'Rasterize Bitmap output bounds should match the source bounds');
                assert(cleanup.closedCount >= 1, `Rasterize Bitmap basic fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.rasterize_bitmap_multi_selection_single_output, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var fillColor = new GrayColor();' +
                    'fillColor.gray = 100;' +
                    'var firstLayer = doc.layers.add();' +
                    'firstLayer.name = "RASTER_MULTI_A";' +
                    'firstLayer.locked = false;' +
                    'firstLayer.visible = true;' +
                    'var secondLayer = doc.layers.add();' +
                    'secondLayer.name = "RASTER_MULTI_B";' +
                    'secondLayer.locked = false;' +
                    'secondLayer.visible = true;' +
                    'doc.selection = null;' +
                    'doc.activeLayer = firstLayer;' +
                    'var first = doc.pathItems.rectangle(300, 40, 70, 50);' +
                    'first.name = "RASTER_MULTI_SOURCE_A";' +
                    'first.filled = true;' +
                    'first.fillColor = fillColor;' +
                    'first.stroked = false;' +
                    'doc.activeLayer = secondLayer;' +
                    'var second = doc.pathItems.rectangle(180, 220, 90, 60);' +
                    'second.name = "RASTER_MULTI_SOURCE_B";' +
                    'second.filled = true;' +
                    'second.fillColor = fillColor;' +
                    'second.stroked = false;' +
                    'first.selected = true;' +
                    'second.selected = true;' +
                    'doc.selection = [first, second];' +
                    'var unionBounds = [' +
                    'Math.min(first.visibleBounds[0], second.visibleBounds[0]),' +
                    'Math.max(first.visibleBounds[1], second.visibleBounds[1]),' +
                    'Math.max(first.visibleBounds[2], second.visibleBounds[2]),' +
                    'Math.min(first.visibleBounds[3], second.visibleBounds[3])' +
                    '];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, unionBounds: unionBounds, anchorParentName: first.parent ? first.parent.name : "" });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'rasterize_bitmap_300_transparent',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ rasterCount: 0, outputBounds: null, outputParentName: "", outputType: "", firstExists: false, secondExists: false, selectionCount: 0, selectedType: "" });}' +
                    'var doc = app.activeDocument;' +
                    'var output = null;' +
                    'var firstExists = false;' +
                    'var secondExists = false;' +
                    'var i;' +
                    'for(i = 0; i < doc.rasterItems.length; i += 1){if(doc.rasterItems[i].name === "RASTERIZE_BITMAP_300PPI"){output = doc.rasterItems[i]; break;}}' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "RASTER_MULTI_SOURCE_A"){firstExists = true;}' +
                    'if(doc.pathItems[i].name === "RASTER_MULTI_SOURCE_B"){secondExists = true;}' +
                    '}' +
                    'return JSON.stringify({' +
                    'rasterCount: doc.rasterItems.length,' +
                    'outputBounds: output ? output.visibleBounds : null,' +
                    'outputParentName: output && output.parent ? output.parent.name : "",' +
                    'outputType: output ? output.typename : "",' +
                    'firstExists: firstExists,' +
                    'secondExists: secondExists,' +
                    'selectionCount: doc.selection ? doc.selection.length : 0,' +
                    'selectedType: (doc.selection && doc.selection.length === 1 && doc.selection[0]) ? doc.selection[0].typename : ""' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 2, `Failed to prepare rasterize bitmap multi-selection fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Rasterize Bitmap multi-selection run should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.selectionCountBefore === 2, `Rasterize Bitmap should report two source items for multi-selection: ${JSON.stringify(result)}`);
                assert(result.data && result.data.rasterItemCountAfter === 1, `Rasterize Bitmap multi-selection should still report one raster item: ${JSON.stringify(result)}`);
                assert(inspection.rasterCount === 1, `Rasterize Bitmap multi-selection should collapse to one raster item: ${JSON.stringify(inspection)}`);
                assert(inspection.outputType === 'RasterItem', `Rasterize Bitmap multi-selection output should be a RasterItem: ${JSON.stringify(inspection)}`);
                assert(inspection.outputParentName === setup.anchorParentName, `Rasterize Bitmap output should be moved back to the first item's parent: ${JSON.stringify({ setup, inspection })}`);
                assert(inspection.firstExists === false && inspection.secondExists === false, `Rasterize Bitmap should dispose both source items: ${JSON.stringify(inspection)}`);
                assert(inspection.selectionCount === 1 && inspection.selectedType === 'RasterItem', `Rasterize Bitmap should leave one raster item selected after multi-selection run: ${JSON.stringify(inspection)}`);
                assertBoundsNear(inspection.outputBounds, setup.unionBounds, 1.0, 'Rasterize Bitmap multi-selection output bounds should match union visible bounds');
                assert(cleanup.closedCount >= 1, `Rasterize Bitmap multi-selection fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.rasterize_bitmap_no_selection_precheck, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'rasterize_bitmap_300_transparent',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ rasterCount: 0, selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'return JSON.stringify({ rasterCount: doc.rasterItems.length, selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName, `Failed to prepare rasterize bitmap no-selection fixture: ${JSON.stringify(fixture)}`);
                assert(result && result.success === false, `Rasterize Bitmap should fail cleanly without a selection: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'RASTERIZE_SELECTION_NEEDS_SELECTION', `Rasterize Bitmap no-selection precheck should surface RASTERIZE_SELECTION_NEEDS_SELECTION: ${JSON.stringify(result)}`);
                assert(inspection.rasterCount === 0, `Rasterize Bitmap no-selection precheck should not create raster items: ${JSON.stringify(inspection)}`);
                assert(inspection.selectionCount === 0, `Rasterize Bitmap no-selection precheck should leave selection empty: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Rasterize Bitmap no-selection fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });
}

module.exports = { runRasterizeSmokeSuite };
