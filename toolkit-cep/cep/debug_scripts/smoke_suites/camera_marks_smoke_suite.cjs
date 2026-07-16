async function runCameraMarksSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;

    await runSelectedScenario(scenarioLookup.add_camera_marks_invalid_target, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        const commandResult = await hostFacade.runCommand({
                            id: 'add_camera_marks',
                            payload: {
                                markProfile: 'smart',
                                artboardInput: 'abc'
                            }
                        });
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ hasCameraLayer: false, mklineCount: 0 });}' +
                            'var doc = app.activeDocument;' +
                            'var hasCameraLayer = false;' +
                            'var mklineCount = 0;' +
                            'var i;' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "camera_marks"){hasCameraLayer = true;}}' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "MKLINE"){mklineCount += 1;}}' +
                            'return JSON.stringify({ hasCameraLayer: hasCameraLayer, mklineCount: mklineCount });' +
                            '})()'
                        );
    
                        return {
                            lastResult: commandResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName, `Failed to prepare invalid-target fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === false, `Invalid target should fail: ${JSON.stringify(result)}`);
                assert(result.lastResult && result.lastResult.errorCode === 'CAMERA_MARKS_INVALID_TARGET', `Invalid target should surface CAMERA_MARKS_INVALID_TARGET: ${JSON.stringify(result)}`);
                assert(result.inspection.hasCameraLayer === false, `Invalid target should not create camera_marks layer: ${JSON.stringify(result)}`);
                assert(result.inspection.mklineCount === 0, `Invalid target should not draw any marks: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 0, `Invalid-target fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.add_camera_marks_manual_multi_artboard, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return "no-doc";}' +
                            'var doc = app.activeDocument;' +
                            'var baseRect = doc.artboards[0].artboardRect;' +
                            'if(doc.artboards.length < 2){doc.artboards.add([baseRect[0] + 500, baseRect[1], baseRect[2] + 500, baseRect[3]]);}' +
                            'var layer = null;' +
                            'var i;' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "camera_marks"){layer = doc.layers[i]; break;}}' +
                            'if(!layer){layer = doc.layers.add(); layer.name = "camera_marks";}' +
                            'layer.locked = false;' +
                            'layer.hidden = false;' +
                            'var oldPath = layer.pathItems.rectangle(450, 50, 20, 20);' +
                            'oldPath.name = "DUMMY_OLD_MARK";' +
                            'oldPath.filled = false;' +
                            'oldPath.stroked = true;' +
                            'layer.locked = true;' +
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
                        const commandResult = await hostFacade.runCommand({
                            id: 'add_camera_marks',
                            payload: {
                                markProfile: 'both',
                                targetMode: 'all',
                                lineOffsetXMm: 7,
                                lineOffsetYMm: 7,
                                roundOffsetXMm: 7,
                                roundOffsetYMm: 30
                            }
                        });
                        window.__TOOLKIT_TEST_API__.getRuntimeState().lastResult = commandResult;
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ openCount: 0, closedCount: 0, lineGroupCount: 0, roundGroupCount: 0, hasCameraLayer: false, layerLocked: false, dummyCount: 0, artboardCount: 0, lineGroupNames: [], roundGroupNames: [] });}' +
                            'var doc = app.activeDocument;' +
                            'var openCount = 0;' +
                            'var closedCount = 0;' +
                            'var lineGroupCount = 0;' +
                            'var roundGroupCount = 0;' +
                            'var hasCameraLayer = false;' +
                            'var layerLocked = false;' +
                            'var dummyCount = 0;' +
                            'var artboardCount = doc.artboards.length;' +
                            'var lineGroupNames = [];' +
                            'var roundGroupNames = [];' +
                            'var i;' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "camera_marks"){hasCameraLayer = true; layerLocked = doc.layers[i].locked;}}' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){' +
                            'if(doc.pathItems[i].name === "DUMMY_OLD_MARK"){dummyCount += 1;}' +
                            'if(doc.pathItems[i].name !== "MKLINE"){continue;}' +
                            'if(doc.pathItems[i].closed){closedCount += 1;} else {openCount += 1;}' +
                            '}' +
                            'for(i = 0; i < doc.groupItems.length; i += 1){' +
                            'if(doc.groupItems[i].name.indexOf("LMarkLine") === 0){lineGroupCount += 1; lineGroupNames.push(doc.groupItems[i].name);}' +
                            'if(doc.groupItems[i].name.indexOf("MarkLine") === 0){roundGroupCount += 1; roundGroupNames.push(doc.groupItems[i].name);}' +
                            '}' +
                            'return JSON.stringify({ openCount: openCount, closedCount: closedCount, lineGroupCount: lineGroupCount, roundGroupCount: roundGroupCount, hasCameraLayer: hasCameraLayer, layerLocked: layerLocked, dummyCount: dummyCount, artboardCount: artboardCount, lineGroupNames: lineGroupNames, roundGroupNames: roundGroupNames });' +
                            '})()'
                        );
    
                        return {
                            lastResult: commandResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName, `Failed to prepare camera-mark fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === true, `Camera marks command did not succeed: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.mode === 'both', `Camera marks did not run in both mode: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.targetRectSource === 'artboard', `Manual camera marks should use artboard target: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.targetMode === 'all', `Camera marks should report all-artboard targeting: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.targetArtboardIndexes.length === 2, `Camera marks should target two artboards: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.layerName === 'camera_marks', `Camera marks should report the dedicated layer name: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.layerLocked === true, `Camera marks should lock the dedicated layer after drawing: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.overwroteExistingLayer === true, `Camera marks should report that it overwrote an existing layer: ${JSON.stringify(result)}`);
                assert(result.lastResult.message.includes('Overwrote existing camera_marks layer.'), `Camera marks success message should warn about overwrite: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.drawnCount === 20, `Camera marks returned unexpected total draw count: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.line && result.lastResult.data.line.drawnCount === 12, `Line profile draw count mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.line && result.lastResult.data.line.artboardCount === 2, `Line profile should cover both artboards: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.round && result.lastResult.data.round.drawnCount === 8, `Round profile draw count mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.round && result.lastResult.data.round.artboardCount === 2, `Round profile should cover both artboards: ${JSON.stringify(result)}`);
                assert(result.inspection.artboardCount === 2, `Fixture should expose two artboards: ${JSON.stringify(result)}`);
                assert(result.inspection.openCount === 12, `Line camera marks did not create twelve open MKLINE paths across two artboards: ${JSON.stringify(result)}`);
                assert(result.inspection.closedCount === 8, `Round camera marks did not create eight closed MKLINE paths across two artboards: ${JSON.stringify(result)}`);
                assert(result.inspection.lineGroupCount === 2, `Line camera mark groups were not created for both artboards: ${JSON.stringify(result)}`);
                assert(result.inspection.roundGroupCount === 2, `Round camera mark groups were not created for both artboards: ${JSON.stringify(result)}`);
                assert(result.inspection.lineGroupNames.includes('LMarkLine1') && result.inspection.lineGroupNames.includes('LMarkLine2'), `Line camera mark groups missing expected artboard names: ${JSON.stringify(result)}`);
                assert(result.inspection.roundGroupNames.includes('MarkLine1') && result.inspection.roundGroupNames.includes('MarkLine2'), `Round camera mark groups missing expected artboard names: ${JSON.stringify(result)}`);
                assert(result.inspection.hasCameraLayer === true, `Camera mark layer was not created: ${JSON.stringify(result)}`);
                assert(result.inspection.layerLocked === true, `Camera mark layer was not locked after drawing: ${JSON.stringify(result)}`);
                assert(result.inspection.dummyCount === 0, `Old camera mark layer content was not cleared before overwrite: ${JSON.stringify(result)}`);
                assert(cleanup.closedCount >= 1, `Camera marks fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.add_camera_marks_smart_all_artboards, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, true);
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return "no-doc";}' +
                            'var doc = app.activeDocument;' +
                            'var baseRect = doc.artboards[0].artboardRect;' +
                            'if(doc.artboards.length < 2){doc.artboards.add([baseRect[0] + 500, baseRect[1], baseRect[2] + 500, baseRect[3]]);}' +
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
                        const commandResult = await hostFacade.runCommand({
                            id: 'add_camera_marks',
                            payload: {
                                markProfile: 'smart',
                                targetMode: 'all'
                            }
                        });
                        window.__TOOLKIT_TEST_API__.getRuntimeState().lastResult = commandResult;
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ selectionBounds: null, artboardRects: [], lineAnchors: [], openCount: 0, closedCount: 0, roundGroupCount: 0, lineGroupCount: 0, hasCameraLayer: false, layerLocked: false });}' +
                            'var doc = app.activeDocument;' +
                            'var selectionBounds = null;' +
                            'var artboardRects = [];' +
                            'var lineAnchors = [];' +
                            'var openCount = 0;' +
                            'var closedCount = 0;' +
                            'var roundGroupCount = 0;' +
                            'var lineGroupCount = 0;' +
                            'var hasCameraLayer = false;' +
                            'var layerLocked = false;' +
                            'var i;' +
                            'var sourceItem = null;' +
                            'var groupIndex = 0;' +
                            'for(i = 0; i < doc.layers.length; i += 1){if(doc.layers[i].name === "camera_marks"){hasCameraLayer = true; layerLocked = doc.layers[i].locked;}}' +
                            'for(i = 0; i < doc.artboards.length; i += 1){artboardRects.push(doc.artboards[i].artboardRect);}' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){' +
                            'if(doc.pathItems[i].name !== "MKLINE" && sourceItem === null){sourceItem = doc.pathItems[i];}' +
                            'if(doc.pathItems[i].name !== "MKLINE"){continue;}' +
                            'if(doc.pathItems[i].closed){closedCount += 1;} else {openCount += 1;}' +
                            '}' +
                            'for(i = 0; i < doc.groupItems.length; i += 1){' +
                            'if(doc.groupItems[i].name.indexOf("LMarkLine") === 0){' +
                            'lineGroupCount += 1;' +
                            'var lineGroup = doc.groupItems[i];' +
                            'var bestLine = null;' +
                            'for(groupIndex = 0; groupIndex < lineGroup.pathItems.length; groupIndex += 1){' +
                            'var lineItem = lineGroup.pathItems[groupIndex];' +
                            'if(lineItem.pathPoints.length !== 3){continue;}' +
                            'var candidateAnchor = lineItem.pathPoints[1].anchor;' +
                            'if(bestLine === null || candidateAnchor[0] < bestLine[0] || (candidateAnchor[0] === bestLine[0] && candidateAnchor[1] > bestLine[1])){bestLine = candidateAnchor;}' +
                            '}' +
                            'lineAnchors.push({ name: lineGroup.name, anchor: bestLine });' +
                            '}' +
                            'if(doc.groupItems[i].name.indexOf("MarkLine") === 0){roundGroupCount += 1;}' +
                            '}' +
                            'if(sourceItem){selectionBounds = sourceItem.visibleBounds;}' +
                            'return JSON.stringify({ selectionBounds: selectionBounds, artboardRects: artboardRects, lineAnchors: lineAnchors, openCount: openCount, closedCount: closedCount, roundGroupCount: roundGroupCount, lineGroupCount: lineGroupCount, hasCameraLayer: hasCameraLayer, layerLocked: layerLocked });' +
                            '})()'
                        );
    
                        return {
                            lastResult: commandResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.selectionCount >= 1, `Failed to prepare smart-line fixture: ${JSON.stringify(fixture)}`);
                assert(result.lastResult && result.lastResult.success === true, `Smart line command did not succeed: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.mode === 'smart', `Smart line mode was not used: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.targetRectSource === 'smart_line', `Smart line target source mismatch: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.targetMode === 'all', `Smart line should report all-artboard targeting: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.targetArtboardIndexes.length >= 1, `Smart line should target at least one artboard: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.layerName === 'camera_marks', `Smart line should report the dedicated layer name: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.layerLocked === true, `Smart line should lock the dedicated layer after drawing: ${JSON.stringify(result)}`);
                assert(result.lastResult.data && result.lastResult.data.overwroteExistingLayer === false, `Fresh smart-line fixture should not report an overwrite: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.line && result.lastResult.data.line.smartApplied === true, `Smart line should have applied selection sizing: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.line && result.lastResult.data.line.usedDefaultMargin === false, `Smart line should not have fallen back to default margin for this fixture: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.line && result.lastResult.data.line.smartAppliedCount >= 1, `Smart line should apply on at least one artboard: ${JSON.stringify(result)}`);
                assert(result.lastResult.data.round && result.lastResult.data.round.drawnCount === 0, `Smart line should not draw round marks: ${JSON.stringify(result)}`);
                assert(result.inspection.openCount >= 6, `Smart line should create open MKLINE paths: ${JSON.stringify(result)}`);
                assert(result.inspection.closedCount === 0, `Smart line should not create closed round paths: ${JSON.stringify(result)}`);
                assert(result.inspection.roundGroupCount === 0, `Smart line should not create round groups: ${JSON.stringify(result)}`);
                assert(result.inspection.lineGroupCount >= 1, `Smart line should create at least one line group: ${JSON.stringify(result)}`);
                assert(result.inspection.hasCameraLayer === true, `Smart line should create the dedicated camera mark layer: ${JSON.stringify(result)}`);
                assert(result.inspection.layerLocked === true, `Smart line should lock the dedicated camera mark layer: ${JSON.stringify(result)}`);
                assert(Array.isArray(result.inspection.selectionBounds), `Smart line selection bounds missing: ${JSON.stringify(result)}`);
                assert(Array.isArray(result.inspection.artboardRects) && result.inspection.artboardRects.length >= 1, `Smart line artboard rects missing: ${JSON.stringify(result)}`);
                assert(Array.isArray(result.inspection.lineAnchors) && result.inspection.lineAnchors.length >= 1, `Smart line anchors missing: ${JSON.stringify(result)}`);
    
                const mmToPt = 2.834645669291339;
                const selectionWidthMm = (result.inspection.selectionBounds[2] - result.inspection.selectionBounds[0]) / mmToPt;
                const selectionHeightMm = (result.inspection.selectionBounds[1] - result.inspection.selectionBounds[3]) / mmToPt;
                const lineAnchorMap = new Map(result.inspection.lineAnchors.map((entry) => [entry.name, entry.anchor]));
    
                result.inspection.artboardRects.forEach((artboardRect, index) => {
                    const artboardWidthMm = (artboardRect[2] - artboardRect[0]) / mmToPt;
                    const artboardHeightMm = (artboardRect[1] - artboardRect[3]) / mmToPt;
                    const expectedOffsetXMm = (artboardWidthMm - (selectionWidthMm + 10)) / 2;
                    const expectedOffsetYMm = (artboardHeightMm - (selectionHeightMm + 10)) / 2;
                    const anchor = lineAnchorMap.get(`LMarkLine${index + 1}`);
    
                    assert(Array.isArray(anchor), `Missing smart line anchor for artboard ${index + 1}: ${JSON.stringify(result)}`);
                    assertNear(anchor[0], artboardRect[0] + (expectedOffsetXMm * mmToPt), 0.2, `Smart line X anchor mismatch on artboard ${index + 1}`);
                    assertNear(anchor[1], artboardRect[1] - (expectedOffsetYMm * mmToPt), 0.2, `Smart line Y anchor mismatch on artboard ${index + 1}`);
                });
                assert(cleanup.closedCount >= 1, `Smart line fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });
}

module.exports = { runCameraMarksSmokeSuite };
