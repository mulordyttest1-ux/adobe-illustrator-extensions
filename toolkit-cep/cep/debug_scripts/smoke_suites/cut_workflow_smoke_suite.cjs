async function runCutWorkflowSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;
    const { closeSmokeFixtureDocuments } = context;

    await runSelectedScenario(scenarioLookup.create_cut_lines_invalid_grid, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, true);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        const fixtureName = ${JSON.stringify(fixture.documentName)};
                        const commandResult = await hostFacade.runCommand({
                            id: 'create_cut_lines',
                            payload: {
                                strategy: 'sline',
                                gridInput: 'abc',
                                extendMm: 3
                            }
                        });
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'var fixtureName = ' + JSON.stringify(fixtureName) + ';' +
                            'var doc = null;' +
                            'var hasCutLayer = false;' +
                            'var cutPathCount = 0;' +
                            'var cutGroupCount = 0;' +
                            'var i;' +
                            'for(i = 0; i < app.documents.length; i += 1){if(app.documents[i].name === fixtureName){doc = app.documents[i]; break;}}' +
                            'if(!doc){return JSON.stringify({ hasFixtureDocument: false, hasCutLayer: false, cutPathCount: 0, cutGroupCount: 0 });}' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "CUT"){hasCutLayer = true;}}' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "CutContour"){cutPathCount += 1;}}' +
                            'for(i = 0; i < doc.groupItems.length; i += 1){if((doc.groupItems[i].name || "").indexOf("CUTLINES_") === 0){cutGroupCount += 1;}}' +
                            'return JSON.stringify({ hasFixtureDocument: true, hasCutLayer: hasCutLayer, cutPathCount: cutPathCount, cutGroupCount: cutGroupCount });' +
                            '})()'
                        );
    
                        return {
                            lastResult: commandResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.selectionCount >= 1, `Failed to prepare cut-lines invalid-grid fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === false, `Invalid grid should fail: ${JSON.stringify(result)}`);
                assert(result.lastResult && result.lastResult.errorCode === 'CUT_LINES_INVALID_GRID', `Invalid grid should surface CUT_LINES_INVALID_GRID: ${JSON.stringify(result)}`);
                assert(result.inspection.hasFixtureDocument === true, `Invalid-grid inspection should stay on the fixture document: ${JSON.stringify(result)}`);
                assert(result.inspection.hasCutLayer === false, `Invalid grid should not create CUT layer: ${JSON.stringify(result)}`);
                assert(result.inspection.cutPathCount === 0, `Invalid grid should not create cut paths: ${JSON.stringify(result)}`);
                assert(result.inspection.cutGroupCount === 0, `Invalid grid should not create cut groups: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 1, `Cut-lines invalid-grid fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.create_cut_lines_contour_append_only, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, true);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return "no-doc";}' +
                            'var doc = app.activeDocument;' +
                            'doc.selection = null;' +
                            'var sourcePath = doc.pathItems.rectangle(320, 40, 140, 80);' +
                            'sourcePath.filled = false;' +
                            'sourcePath.stroked = true;' +
                            'var pointText = doc.textFrames.pointText([240, 260]);' +
                            'pointText.contents = "skip";' +
                            'sourcePath.selected = true;' +
                            'pointText.selected = true;' +
                            'return "ok";' +
                            '})()'
                        );
                        await hostDebug.evalScript(
                            '(function(){' +
                            'try{' +
                            'if(app.documents.length && typeof app.activeDocument.activate === "function"){app.activeDocument.activate();}' +
                            'app.redraw();' +
                            '}catch(error){}' +
                            'return "ok";' +
                            '})()'
                        );
                        const firstResult = await hostFacade.runCommand({
                            id: 'create_cut_lines',
                            payload: {
                                strategy: 'contour'
                            }
                        });
                        const secondResult = await hostFacade.runCommand({
                            id: 'create_cut_lines',
                            payload: {
                                strategy: 'contour'
                            }
                        });
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'function tagsToObject(item){' +
                            'var result = {};' +
                            'var i;' +
                            'if(!item || !item.tags){return result;}' +
                            'for(i = 0; i < item.tags.length; i += 1){result[item.tags[i].name] = item.tags[i].value;}' +
                            'return result;' +
                            '}' +
                            'if(!app.documents.length){return JSON.stringify({ hasCutLayer: false, layerLocked: false, runGroups: [], cutPathCount: 0, strategyGroupNames: [], pathSpotNames: [], firstRunTags: {}, firstPathTags: {}, firstRunNote: "", firstPathNote: "" });}' +
                            'var doc = app.activeDocument;' +
                            'var layer = null;' +
                            'var runGroups = [];' +
                            'var strategyGroupNames = [];' +
                            'var pathSpotNames = [];' +
                            'var cutPathCount = 0;' +
                            'var firstRunGroup = null;' +
                            'var firstPath = null;' +
                            'var i;' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "CUT"){layer = doc.layers[i]; break;}}' +
                            'for(i = 0; i < doc.groupItems.length; i += 1){' +
                            'if((doc.groupItems[i].name || "").indexOf("CUTLINES_CONTOUR_") === 0){runGroups.push(doc.groupItems[i].name); if(firstRunGroup === null){firstRunGroup = doc.groupItems[i];}}' +
                            'if(doc.groupItems[i].name === "CUTLINES_CONTOUR"){strategyGroupNames.push(doc.groupItems[i].name);}' +
                            '}' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){' +
                            'if(doc.pathItems[i].name !== "CutContour"){continue;}' +
                            'cutPathCount += 1;' +
                            'if(doc.pathItems[i].strokeColor && doc.pathItems[i].strokeColor.spot){pathSpotNames.push(doc.pathItems[i].strokeColor.spot.name);}' +
                            'if(firstPath === null){firstPath = doc.pathItems[i];}' +
                            '}' +
                            'return JSON.stringify({' +
                            'hasCutLayer: layer !== null,' +
                            'layerLocked: layer ? layer.locked : false,' +
                            'runGroups: runGroups,' +
                            'cutPathCount: cutPathCount,' +
                            'strategyGroupNames: strategyGroupNames,' +
                            'pathSpotNames: pathSpotNames,' +
                            'firstRunTags: tagsToObject(firstRunGroup),' +
                            'firstPathTags: tagsToObject(firstPath),' +
                            'firstRunNote: firstRunGroup ? firstRunGroup.note : "",' +
                            'firstPathNote: firstPath ? firstPath.note : "",' +
                            'firstPathStrokeWidth: firstPath ? firstPath.strokeWidth : 0' +
                            '});' +
                            '})()'
                        );
    
                        return {
                            firstResult,
                            secondResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName, `Failed to prepare cut-lines contour fixture: ${JSON.stringify(fixture)}`);
                assert(result.firstResult && result.firstResult.success === true, `First contour run failed: ${JSON.stringify(result)}`);
                assert(result.secondResult && result.secondResult.success === true, `Second contour run failed: ${JSON.stringify(result)}`);
                assert(result.firstResult.data && result.firstResult.data.strategy === 'contour', `Contour strategy was not reported: ${JSON.stringify(result)}`);
                assert(result.firstResult.data && result.firstResult.data.createdCount === 1, `Contour should create one owned contour path per run: ${JSON.stringify(result)}`);
                assert(result.firstResult.data && result.firstResult.data.skippedCount === 1, `Contour should skip unsupported point text: ${JSON.stringify(result)}`);
                assert(result.firstResult.data && result.firstResult.data.layerName === 'CUT', `Contour should use CUT layer: ${JSON.stringify(result)}`);
                assert(result.firstResult.data && result.firstResult.data.spotName === 'CutContour', `Contour should use CutContour spot: ${JSON.stringify(result)}`);
                assert(result.firstResult.data && result.firstResult.data.strokeWidthPt === 0.25, `Contour should use 0.25pt stroke: ${JSON.stringify(result)}`);
                assert(result.inspection.hasCutLayer === true, `CUT layer was not created: ${JSON.stringify(result)}`);
                assert(result.inspection.layerLocked === false, `CUT layer should stay unlocked: ${JSON.stringify(result)}`);
                assert(result.inspection.runGroups.length === 2, `Repeated contour runs should append two owned groups: ${JSON.stringify(result)}`);
                assert(result.inspection.runGroups[0] !== result.inspection.runGroups[1], `Repeated contour runs should use unique group names: ${JSON.stringify(result)}`);
                assert(result.inspection.cutPathCount === 2, `Repeated contour runs should keep older cut paths: ${JSON.stringify(result)}`);
                assert(result.inspection.strategyGroupNames.length === 2, `Each contour run should create one strategy subgroup: ${JSON.stringify(result)}`);
                assert(result.inspection.pathSpotNames.every((name) => name === 'CutContour'), `Contour paths should use the CutContour spot: ${JSON.stringify(result)}`);
                assertNear(result.inspection.firstPathStrokeWidth, 0.25, 0.001, 'Contour stroke width mismatch');
                assert(result.inspection.firstRunTags['toolkit_module'] === 'create_cut_lines', `Run group tag metadata missing toolkit_module: ${JSON.stringify(result)}`);
                assert(result.inspection.firstRunTags['toolkit_strategy'] === 'contour', `Run group tag metadata missing contour strategy: ${JSON.stringify(result)}`);
                assert(result.inspection.firstPathTags['toolkit_family'] === 'cut_lines', `Cut path tag metadata missing family: ${JSON.stringify(result)}`);
                assert(result.inspection.firstPathTags['toolkit_spot'] === 'CutContour', `Cut path tag metadata missing spot: ${JSON.stringify(result)}`);
                assert(/"toolkit.module":"create_cut_lines"/.test(result.inspection.firstRunNote), `Run group note metadata missing module id: ${JSON.stringify(result)}`);
                assert(/"toolkit.strategy":"contour"/.test(result.inspection.firstPathNote), `Cut path note metadata missing strategy: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 1, `Cut-lines contour fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.create_cut_lines_sline_selection_bounds, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, true);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return "no-doc";}' +
                            'var doc = app.activeDocument;' +
                            'doc.selection = null;' +
                            'var sample = doc.pathItems.rectangle(320, 40, 200, 100);' +
                            'sample.filled = false;' +
                            'sample.stroked = false;' +
                            'sample.selected = true;' +
                            'doc.selection = [sample];' +
                            'return "ok";' +
                            '})()'
                        );
                        const commandResult = await hostFacade.runCommand({
                            id: 'create_cut_lines',
                            payload: {
                                strategy: 'sline',
                                gridInput: '4x2',
                                extendMm: 3
                            }
                        });
                        return {
                            lastResult: commandResult
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.selectionCount >= 1, `Failed to prepare cut-lines s-line fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === true, `S-Line run failed: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.strategy === 'sline', `S-Line strategy was not reported: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.createdCount === 2, `S-Line should create two snake paths: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.layerName === 'CUT', `S-Line should use CUT layer: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.grid && result.lastResult.data.grid.cols === 4 && result.lastResult.data.grid.rows === 2, `S-Line should report grid 4x2: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 0, `Cut-lines s-line fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.prepare_cut_package_normalizes, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, true);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
    
                        await hostFacade.runCommand({
                            id: 'create_cut_lines',
                            payload: {
                                strategy: 'contour'
                            }
                        });
                        await hostFacade.runCommand({
                            id: 'add_camera_marks',
                            payload: {
                                markProfile: 'round',
                                artboardInput: '1',
                                roundOffsetXMm: 7,
                                roundOffsetYMm: 30
                            }
                        });
                        await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ movedCutGroup: false, cameraLayerFound: false });}' +
                            'var doc = app.activeDocument;' +
                            'var wrongLayer = null;' +
                            'var i;' +
                            'var movedCutGroup = false;' +
                            'var cameraLayerFound = false;' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "WRONG_CUT_LAYER"){wrongLayer = doc.layers[i]; break;}}' +
                            'if(!wrongLayer){wrongLayer = doc.layers.add(); wrongLayer.name = "WRONG_CUT_LAYER";}' +
                            'for(i = 0; i < doc.groupItems.length; i += 1){' +
                            'if(doc.groupItems[i].name.indexOf("CUTLINES_") === 0){doc.groupItems[i].move(wrongLayer, ElementPlacement.PLACEATBEGINNING); movedCutGroup = true; break;}' +
                            '}' +
                            'for(i = 0; i < doc.layers.length; i += 1){' +
                            'if(doc.layers[i].name === "camera_marks"){' +
                            'cameraLayerFound = true;' +
                            'try{doc.layers[i].locked = false;}catch(unlockError){}' +
                            'try{doc.layers[i].hidden = true;}catch(hiddenError){}' +
                            'try{doc.layers[i].visible = false;}catch(visibleError){}' +
                            'try{doc.layers[i].zOrder(ZOrderMethod.SENDTOBACK);}catch(zOrderError){}' +
                            'try{doc.layers[i].locked = true;}catch(relockError){}' +
                            'break;' +
                            '}' +
                            '}' +
                            'return JSON.stringify({ movedCutGroup: movedCutGroup, cameraLayerFound: cameraLayerFound });' +
                            '})()'
                        );
    
                        const prepareResult = await hostFacade.runCommand({
                            id: 'prepare_cut_package',
                            payload: {}
                        });
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ topLayerName: "", wrongLayerOwnedCount: 0, cutLayerOwnedCount: 0, cameraLayerVisible: false, cameraLayerUnlocked: false });}' +
                            'var doc = app.activeDocument;' +
                            'var wrongLayerOwnedCount = 0;' +
                            'var cutLayerOwnedCount = 0;' +
                            'var cameraLayerVisible = false;' +
                            'var cameraLayerUnlocked = false;' +
                            'var topLayerName = doc.layers.length ? doc.layers[0].name : "";' +
                            'var i;' +
                            'var j;' +
                            'for(i = 0; i < doc.layers.length; i += 1){' +
                            'if(doc.layers[i].name === "WRONG_CUT_LAYER"){' +
                            'for(j = 0; j < doc.layers[i].pageItems.length; j += 1){if(doc.layers[i].pageItems[j].name.indexOf("CUTLINES_") === 0){wrongLayerOwnedCount += 1;}}' +
                            '}' +
                            'if(doc.layers[i].name === "CUT"){' +
                            'for(j = 0; j < doc.layers[i].pageItems.length; j += 1){if(doc.layers[i].pageItems[j].name.indexOf("CUTLINES_") === 0){cutLayerOwnedCount += 1;}}' +
                            '}' +
                            'if(doc.layers[i].name === "camera_marks"){' +
                            'cameraLayerVisible = doc.layers[i].hidden !== true && doc.layers[i].visible !== false;' +
                            'cameraLayerUnlocked = doc.layers[i].locked !== true;' +
                            '}' +
                            '}' +
                            'return JSON.stringify({ topLayerName: topLayerName, wrongLayerOwnedCount: wrongLayerOwnedCount, cutLayerOwnedCount: cutLayerOwnedCount, cameraLayerVisible: cameraLayerVisible, cameraLayerUnlocked: cameraLayerUnlocked });' +
                            '})()'
                        );
    
                        return {
                            lastResult: prepareResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.selectionCount >= 1, `Failed to prepare prepare-cut fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === true, `Prepare Cut Package did not succeed: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.detectedCutItemCount >= 1, `Prepare Cut Package should detect at least one cut item: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.movedCutItemCount >= 1, `Prepare Cut Package should move a misplaced cut group: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.cameraLayerExists === true, `Prepare Cut Package should find camera_marks: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.cameraLayerVisible === true, `Prepare Cut Package should show camera_marks: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.cameraLayerUnlocked === true, `Prepare Cut Package should unlock camera_marks: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.cameraLayerBroughtToFront === true, `Prepare Cut Package should bring camera_marks to front: ${JSON.stringify(result)}`);
                assert(result.inspection.topLayerName === 'camera_marks', `camera_marks should end on top after prepare: ${JSON.stringify(result)}`);
                assert(result.inspection.wrongLayerOwnedCount === 0, `Prepare Cut Package should empty misplaced owned cut groups from WRONG_CUT_LAYER: ${JSON.stringify(result)}`);
                assert(result.inspection.cutLayerOwnedCount >= 1, `Prepare Cut Package should move owned cut groups back to CUT: ${JSON.stringify(result)}`);
                assert(result.inspection.cameraLayerVisible === true, `camera_marks should be visible after prepare: ${JSON.stringify(result)}`);
                assert(result.inspection.cameraLayerUnlocked === true, `camera_marks should be unlocked after prepare: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 1, `Prepare-cut fixture cleanup failed: ${JSON.stringify({ result, cleanup })}`);
            });

    await runSelectedScenario(scenarioLookup.save_cut_package_exports, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, true);
                const exportRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-save-cut-'));
                const sourceAiPath = path.join(exportRoot, 'cut-job.ai').replace(/\\/g, '/');
                const aiOutputPath = path.join(exportRoot, 'BAI_BE_cut-job.ai').replace(/\\/g, '/');
                const pdfOutputPath = path.join(exportRoot, 'BAI_IN_cut-job.pdf').replace(/\\/g, '/');
                tempOutputRoots.push(exportRoot);
    
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        const sourceAiPath = ${JSON.stringify(sourceAiPath)};
                        const aiOutputPath = ${JSON.stringify(aiOutputPath)};
                        const pdfOutputPath = ${JSON.stringify(pdfOutputPath)};
    
                        await hostFacade.runCommand({
                            id: 'create_cut_lines',
                            payload: {
                                strategy: 'contour'
                            }
                        });
                        await hostFacade.runCommand({
                            id: 'add_camera_marks',
                            payload: {
                                markProfile: 'round',
                                artboardInput: '1',
                                roundOffsetXMm: 7,
                                roundOffsetYMm: 30
                            }
                        });
                        const saveResult = await hostFacade.runCommand({
                            id: 'save_cut_package',
                            payload: {
                                sourceAiPath: sourceAiPath
                            }
                        });
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ original: null, exportAi: null });}' +
                            'var originalDoc = app.activeDocument;' +
                            'var aiFile = new File(' + JSON.stringify(aiOutputPath) + ');' +
                            'var exportDoc = null;' +
                            'var exportInfo = null;' +
                            'var i;' +
                            'var layer;' +
                            'var cutLayer = null;' +
                            'var cameraLayer = null;' +
                            'var protectedHiddenCount = 0;' +
                            'var originalInfo = {' +
                            'name: originalDoc.name,' +
                            'path: (function(){try{return originalDoc.fullName.fsName || originalDoc.fullName;}catch(pathError){return "";}})(),' +
                            'rasterItemCount: originalDoc.rasterItems.length,' +
                            'cutLayerExists: false,' +
                            'cameraLayerExists: false' +
                            '};' +
                            'for(i = 0; i < originalDoc.layers.length; i += 1){' +
                            'if(originalDoc.layers[i].name === "CUT"){originalInfo.cutLayerExists = true;}' +
                            'if(originalDoc.layers[i].name === "camera_marks"){originalInfo.cameraLayerExists = true;}' +
                            '}' +
                            'if(aiFile.exists){' +
                            'exportDoc = app.open(aiFile);' +
                            'exportInfo = {' +
                            'rasterItemCount: exportDoc.rasterItems.length,' +
                            'cutLayerExists: false,' +
                            'cameraLayerExists: false,' +
                            'cutLayerPageItemCount: 0,' +
                            'cameraLayerPageItemCount: 0' +
                            '};' +
                            'for(i = 0; i < exportDoc.layers.length; i += 1){' +
                            'layer = exportDoc.layers[i];' +
                            'if(layer.name === "CUT"){cutLayer = layer; exportInfo.cutLayerExists = true; exportInfo.cutLayerPageItemCount = layer.pageItems.length;}' +
                            'if(layer.name === "camera_marks"){cameraLayer = layer; exportInfo.cameraLayerExists = true; exportInfo.cameraLayerPageItemCount = layer.pageItems.length;}' +
                            'if((layer.name === "CUT" || layer.name === "camera_marks") && (layer.hidden === true || layer.visible === false)){protectedHiddenCount += 1;}' +
                            '}' +
                            'exportInfo.protectedHiddenCount = protectedHiddenCount;' +
                            'exportDoc.close(SaveOptions.DONOTSAVECHANGES);' +
                            'try{if(typeof originalDoc.activate === "function"){originalDoc.activate();}}catch(activateError){}' +
                            'try{app.redraw();}catch(redrawError){}' +
                            '}' +
                            'return JSON.stringify({ original: originalInfo, exportAi: exportInfo, activeDocumentName: app.activeDocument ? app.activeDocument.name : "" });' +
                            '})()'
                        );
    
                        return {
                            lastResult: saveResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
                const aiExists = fs.existsSync(aiOutputPath);
                const pdfExists = fs.existsSync(pdfOutputPath);
                const sourceExists = fs.existsSync(sourceAiPath);
    
                assert(fixture.selectionCount >= 1, `Failed to prepare save-cut fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === true, `Save Cut Package did not succeed: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.sourceAiPath === sourceAiPath, `Source AI path mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.aiPath === aiOutputPath, `AI export path mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.pdfPath === pdfOutputPath, `PDF export path mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.dieAiPrefix === 'BAI_BE_', `Die AI prefix mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.printPdfPrefix === 'BAI_IN_', `Print PDF prefix mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.rasterizedLayerCount >= 1, `Die AI should rasterize at least one print layer: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.rasterItemCount >= 1, `Die AI should create at least one raster item: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.hiddenProtectedLayerCount >= 2, `Print PDF should hide protected layers: ${JSON.stringify(result)}`);
                assert(sourceExists === true, `Working source AI was not created: ${JSON.stringify({ result, sourceAiPath })}`);
                assert(aiExists === true, `Final AI output was not created: ${JSON.stringify({ result, aiOutputPath })}`);
                assert(pdfExists === true, `Final PDF output was not created: ${JSON.stringify({ result, pdfOutputPath })}`);
                assert(
                    result.inspection &&
                    result.inspection.original &&
                    String(result.inspection.original.path || '').replace(/\\/g, '/') === sourceAiPath,
                    `Active working document should stay on source AI path: ${JSON.stringify(result)}`
                );
                assert(result.inspection && result.inspection.original && result.inspection.original.rasterItemCount === 0, `Working document should not be rasterized in-place: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.original && result.inspection.original.cutLayerExists === true, `Working document should still contain CUT layer: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.original && result.inspection.original.cameraLayerExists === true, `Working document should still contain camera_marks layer: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.exportAi && result.inspection.exportAi.rasterItemCount >= 1, `Die AI should contain rasterized print artwork: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.exportAi && result.inspection.exportAi.cutLayerExists === true, `Die AI should keep CUT layer: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.exportAi && result.inspection.exportAi.cameraLayerExists === true, `Die AI should keep camera_marks layer: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.exportAi && result.inspection.exportAi.cutLayerPageItemCount >= 1, `Die AI CUT layer should still contain vector artwork: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.exportAi && result.inspection.exportAi.cameraLayerPageItemCount >= 1, `Die AI camera_marks layer should still contain vector artwork: ${JSON.stringify(result)}`);
                assert(result.inspection && result.inspection.exportAi && result.inspection.exportAi.protectedHiddenCount === 0, `Protected layers should stay visible in die AI: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 1, `Save-cut fixture cleanup failed: ${JSON.stringify({ result, cleanup })}`);
            });
}

module.exports = { runCutWorkflowSmokeSuite };
