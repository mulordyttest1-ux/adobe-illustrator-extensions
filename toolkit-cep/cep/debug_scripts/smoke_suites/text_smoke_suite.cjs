async function runTextSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;

    await runSelectedScenario(scenarioLookup.break_text_into_lines_point_and_area, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, pointBounds: null, pointAnchor: null });}' +
                    'var doc = app.activeDocument;' +
                    'var i;' +
                    'var baseLayer = doc.layers[0];' +
                    'try{baseLayer.locked = false; baseLayer.visible = true; doc.activeLayer = baseLayer;}catch(baseLayerError){}' +
                    'var targetLayer = doc.layers.add();' +
                    'targetLayer.name = "TEXT_SMOKE_LAYER";' +
                    'targetLayer.locked = false;' +
                    'targetLayer.visible = true;' +
                    'doc.activeLayer = targetLayer;' +
                    'doc.selection = null;' +
                    'for(i = doc.textFrames.length - 1; i >= 0; i -= 1){try{doc.textFrames[i].remove();}catch(removeError){}}' +
                    'var pointText = doc.textFrames.pointText([120, 320]);' +
                    'pointText.contents = "Alpha\\rBeta";' +
                    'pointText.textRange.characterAttributes.size = 20;' +
                    'pointText.textRange.characterAttributes.leading = 28;' +
                    'var areaRect = doc.pathItems.rectangle(260, 240, 180, 90);' +
                    'areaRect.filled = false;' +
                    'areaRect.stroked = false;' +
                    'var areaText = doc.textFrames.areaText(areaRect);' +
                    'areaText.contents = "Gamma\\rDelta";' +
                    'areaText.textRange.characterAttributes.size = 20;' +
                    'areaText.textRange.characterAttributes.leading = 28;' +
                    'pointText.selected = true;' +
                    'areaText.selected = true;' +
                    'doc.selection = [pointText, areaText];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, pointBounds: pointText.visibleBounds, pointAnchor: pointText.anchor });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'break_text_into_lines',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ textFrameCount: 0, pointCount: 0, areaCount: 0, contents: [], hasWrapperGroup: false, pointFrames: [], pointUnionBounds: null, areaSucceeded: false });}' +
                    'var doc = app.activeDocument;' +
                    'var pointCount = 0;' +
                    'var areaCount = 0;' +
                    'var hasWrapperGroup = false;' +
                    'var contents = [];' +
                    'var pointFrames = [];' +
                    'var unionBounds = null;' +
                    'var hasGamma = false;' +
                    'var hasDelta = false;' +
                    'var addBounds = function(bounds){' +
                    'if(!bounds){return;}' +
                    'if(unionBounds === null){unionBounds = [bounds[0], bounds[1], bounds[2], bounds[3]]; return;}' +
                    'if(bounds[0] < unionBounds[0]){unionBounds[0] = bounds[0];}' +
                    'if(bounds[1] > unionBounds[1]){unionBounds[1] = bounds[1];}' +
                    'if(bounds[2] > unionBounds[2]){unionBounds[2] = bounds[2];}' +
                    'if(bounds[3] < unionBounds[3]){unionBounds[3] = bounds[3];}' +
                    '};' +
                    'var i;' +
                    'for(i = 0; i < doc.textFrames.length; i += 1){' +
                    'contents.push(doc.textFrames[i].contents);' +
                    'if(doc.textFrames[i].contents === "Gamma"){hasGamma = true;}' +
                    'if(doc.textFrames[i].contents === "Delta"){hasDelta = true;}' +
                    'if(doc.textFrames[i].kind === TextType.POINTTEXT){' +
                    'pointCount += 1;' +
                    'if(doc.textFrames[i].contents === "Alpha" || doc.textFrames[i].contents === "Beta"){pointFrames.push({ contents: doc.textFrames[i].contents, anchor: doc.textFrames[i].anchor, bounds: doc.textFrames[i].visibleBounds }); addBounds(doc.textFrames[i].visibleBounds);}' +
                    '}' +
                    'if(doc.textFrames[i].kind === TextType.AREATEXT){areaCount += 1;}' +
                    '}' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if((doc.groupItems[i].name || "") === "TEXTBREAK_LINES"){hasWrapperGroup = true;}}' +
                    'pointFrames.sort(function(a, b){ return a.contents < b.contents ? -1 : (a.contents > b.contents ? 1 : 0); });' +
                    'contents.sort();' +
                    'return JSON.stringify({ textFrameCount: doc.textFrames.length, pointCount: pointCount, areaCount: areaCount, contents: contents, hasWrapperGroup: hasWrapperGroup, pointFrames: pointFrames, pointUnionBounds: unionBounds, areaSucceeded: hasGamma && hasDelta });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(setup.selectionCount === 2, `Failed to prepare line-split fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Break Text into Lines failed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.granularity === 'lines', `Line split should report lines granularity: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedFrameCount >= 1, `Line split should process at least the point-text frame: ${JSON.stringify(result)}`);
                assert(result.data && result.data.createdFrameCount >= 2, `Line split should create point-text line frames: ${JSON.stringify(result)}`);
                assert(inspection.pointFrames.length === 2, `Line split should produce two point-text lines for the point source: ${JSON.stringify(inspection)}`);
                assert(inspection.hasWrapperGroup === false, `Line split should not create wrapper groups: ${JSON.stringify(inspection)}`);
                assert(JSON.stringify(inspection.contents.slice(0, 2)) === JSON.stringify(['Alpha', 'Beta']), `Unexpected point-line contents after split: ${JSON.stringify(inspection)}`);
                assertNear(inspection.pointFrames[0].anchor[0], setup.pointAnchor[0], 0.5, 'First split line should keep the original point-text anchor X');
                assertNear(inspection.pointFrames[0].anchor[1], setup.pointAnchor[1], 0.5, 'First split line should keep the original point-text anchor Y');
                assertNear(inspection.pointFrames[1].anchor[0], setup.pointAnchor[0], 0.5, 'Second split line should keep the original point-text anchor X');
                assert(inspection.pointFrames[1].anchor[1] < inspection.pointFrames[0].anchor[1] - 10, `Second split line should move downward from the first line anchor: ${JSON.stringify(inspection)}`);
                assertNear(inspection.pointUnionBounds[0], setup.pointBounds[0], 0.75, 'Point-line split should preserve the source left bound');
                assertNear(inspection.pointUnionBounds[1], setup.pointBounds[1], 0.75, 'Point-line split should preserve the source top bound');
                assertNear(inspection.pointUnionBounds[2], setup.pointBounds[2], 1.5, 'Point-line split should preserve the source right bound');
                assertNear(inspection.pointUnionBounds[3], setup.pointBounds[3], 1.5, 'Point-line split should preserve the source bottom bound');
                assert(inspection.areaCount === 0, `Line split output should remain point text only: ${JSON.stringify(inspection)}`);
                if (inspection.areaSucceeded) {
                    assert(JSON.stringify(inspection.contents) === JSON.stringify(['Alpha', 'Beta', 'Delta', 'Gamma']), `Unexpected line contents after split: ${JSON.stringify(inspection)}`);
                    assert(result.data.processedFrameCount === 2, `Area text should increment processed count when it succeeds: ${JSON.stringify(result)}`);
                } else {
                    assert(result.data.skippedReasons && result.data.skippedReasons.areaTextPlacementNotReliable >= 1, `Area-text best-effort failures should be reported explicitly: ${JSON.stringify(result)}`);
                }
                assert(cleanup.closedCount >= 1, `Line-split fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.break_text_into_lines_rotated_point_text, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, sourceBounds: null, sourceAnchor: null });}' +
                    'var doc = app.activeDocument;' +
                    'var i;' +
                    'var angle = 27;' +
                    'var radians = angle * Math.PI / 180;' +
                    'var baseLayer = doc.layers[0];' +
                    'try{baseLayer.locked = false; baseLayer.visible = true; doc.activeLayer = baseLayer;}catch(baseLayerError){}' +
                    'var targetLayer = doc.layers.add();' +
                    'targetLayer.name = "TEXT_SMOKE_LAYER";' +
                    'targetLayer.locked = false;' +
                    'targetLayer.visible = true;' +
                    'doc.activeLayer = targetLayer;' +
                    'doc.selection = null;' +
                    'for(i = doc.textFrames.length - 1; i >= 0; i -= 1){try{doc.textFrames[i].remove();}catch(removeError){}}' +
                    'var pointText = doc.textFrames.pointText([160, 320]);' +
                    'pointText.contents = "Tilt\\rShift";' +
                    'pointText.textRange.characterAttributes.size = 20;' +
                    'pointText.textRange.characterAttributes.leading = 30;' +
                    'pointText.rotate(angle);' +
                    'pointText.selected = true;' +
                    'doc.selection = [pointText];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, sourceBounds: pointText.visibleBounds, sourceAnchor: pointText.anchor, expectedDx: 30 * Math.sin(radians), expectedDy: -30 * Math.cos(radians) });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'break_text_into_lines',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ frames: [], unionBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var frames = [];' +
                    'var unionBounds = null;' +
                    'var addBounds = function(bounds){' +
                    'if(!bounds){return;}' +
                    'if(unionBounds === null){unionBounds = [bounds[0], bounds[1], bounds[2], bounds[3]]; return;}' +
                    'if(bounds[0] < unionBounds[0]){unionBounds[0] = bounds[0];}' +
                    'if(bounds[1] > unionBounds[1]){unionBounds[1] = bounds[1];}' +
                    'if(bounds[2] > unionBounds[2]){unionBounds[2] = bounds[2];}' +
                    'if(bounds[3] < unionBounds[3]){unionBounds[3] = bounds[3];}' +
                    '};' +
                    'var i;' +
                    'for(i = 0; i < doc.textFrames.length; i += 1){frames.push({ contents: doc.textFrames[i].contents, anchor: doc.textFrames[i].anchor, bounds: doc.textFrames[i].visibleBounds }); addBounds(doc.textFrames[i].visibleBounds);}' +
                    'frames.sort(function(a, b){ return a.contents < b.contents ? -1 : (a.contents > b.contents ? 1 : 0); });' +
                    'return JSON.stringify({ frames: frames, unionBounds: unionBounds });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
                const tilt = inspection.frames.find((frame) => frame.contents === 'Tilt');
                const shift = inspection.frames.find((frame) => frame.contents === 'Shift');
                const actualDx = shift ? shift.anchor[0] - tilt.anchor[0] : 0;
                const actualDy = shift ? shift.anchor[1] - tilt.anchor[1] : 0;
                const actualMagnitude = Math.sqrt((actualDx * actualDx) + (actualDy * actualDy));
                const actualAngle = Math.atan2(actualDx, -actualDy) * (180 / Math.PI);
    
                assert(setup.selectionCount === 1, `Failed to prepare rotated line-split fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Rotated point-text line split failed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.createdFrameCount === 2, `Rotated line split should create two frames: ${JSON.stringify(result)}`);
                assert(inspection.frames.length === 2, `Rotated line split should leave two frames: ${JSON.stringify(inspection)}`);
                assert(tilt && shift, `Rotated line outputs missing expected contents: ${JSON.stringify(inspection)}`);
                assertNear(inspection.unionBounds[0], setup.sourceBounds[0], 2.5, 'Rotated line split should preserve source left bound');
                assertNear(inspection.unionBounds[2], setup.sourceBounds[2], 2.5, 'Rotated line split should preserve source right bound');
                assertNear(tilt.anchor[0], setup.sourceAnchor[0], 0.75, 'The first rotated line should keep the original anchor X');
                assertNear(tilt.anchor[1], setup.sourceAnchor[1], 0.75, 'The first rotated line should keep the original anchor Y');
                assert(actualMagnitude > 15, `Rotated line split should advance by a visible line distance: ${JSON.stringify({ inspection, actualMagnitude })}`);
                assertNear(actualAngle, 27, 2.5, 'Rotated line split should preserve the rotated line advance angle');
                assert(cleanup.closedCount >= 1, `Rotated line-split fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.break_text_into_lines_mixed_selection_skip, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var i;' +
                    'var targetLayer = doc.layers.add();' +
                    'targetLayer.name = "TEXT_SMOKE_LAYER";' +
                    'targetLayer.locked = false;' +
                    'targetLayer.visible = true;' +
                    'doc.activeLayer = targetLayer;' +
                    'doc.selection = null;' +
                    'var pointText = doc.textFrames.pointText([140, 320]);' +
                    'pointText.contents = "Solo";' +
                    'var shape = doc.pathItems[0];' +
                    'pointText.selected = true;' +
                    'shape.selected = true;' +
                    'doc.selection = [pointText, shape];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'break_text_into_lines',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ textFrameCount: 0, contents: [] });}' +
                    'var doc = app.activeDocument;' +
                    'var contents = [];' +
                    'var i;' +
                    'for(i = 0; i < doc.textFrames.length; i += 1){contents.push(doc.textFrames[i].contents);}' +
                    'contents.sort();' +
                    'return JSON.stringify({ textFrameCount: doc.textFrames.length, contents: contents });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(setup.selectionCount === 2, `Failed to prepare mixed line-split fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Mixed line split should still succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedFrameCount === 1, `Mixed line split should process one text frame: ${JSON.stringify(result)}`);
                assert(result.data && result.data.createdFrameCount === 1, `Mixed line split should create one line item: ${JSON.stringify(result)}`);
                assert(result.data && result.data.skippedReasons && result.data.skippedReasons.nonTextSelection === 1, `Mixed line split should record one skipped non-text item: ${JSON.stringify(result)}`);
                assert(inspection.textFrameCount === 1, `Mixed line split should leave one text frame: ${JSON.stringify(inspection)}`);
                assert(JSON.stringify(inspection.contents) === JSON.stringify(['Solo']), `Mixed line split should preserve the text content: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Mixed line-split fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.break_text_into_words_replace_original, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, sourceBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var i;' +
                    'var targetLayer = doc.layers.add();' +
                    'targetLayer.name = "TEXT_SMOKE_LAYER";' +
                    'targetLayer.locked = false;' +
                    'targetLayer.visible = true;' +
                    'doc.activeLayer = targetLayer;' +
                    'doc.selection = null;' +
                    'for(i = doc.textFrames.length - 1; i >= 0; i -= 1){try{doc.textFrames[i].remove();}catch(removeError){}}' +
                    'var pointText = doc.textFrames.pointText([120, 320]);' +
                    'pointText.contents = "Hello world again";' +
                    'pointText.textRange.characterAttributes.size = 20;' +
                    'pointText.selected = true;' +
                    'doc.selection = [pointText];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, sourceBounds: pointText.visibleBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'break_text_into_words',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ textFrameCount: 0, contents: [], unionBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var contents = [];' +
                    'var unionBounds = null;' +
                    'var addBounds = function(bounds){' +
                    'if(!bounds){return;}' +
                    'if(unionBounds === null){unionBounds = [bounds[0], bounds[1], bounds[2], bounds[3]]; return;}' +
                    'if(bounds[0] < unionBounds[0]){unionBounds[0] = bounds[0];}' +
                    'if(bounds[1] > unionBounds[1]){unionBounds[1] = bounds[1];}' +
                    'if(bounds[2] > unionBounds[2]){unionBounds[2] = bounds[2];}' +
                    'if(bounds[3] < unionBounds[3]){unionBounds[3] = bounds[3];}' +
                    '};' +
                    'var i;' +
                    'for(i = 0; i < doc.textFrames.length; i += 1){contents.push(doc.textFrames[i].contents); addBounds(doc.textFrames[i].visibleBounds);}' +
                    'contents.sort();' +
                    'return JSON.stringify({ textFrameCount: doc.textFrames.length, contents: contents, unionBounds: unionBounds });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(setup.selectionCount === 1, `Failed to prepare word-split fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Break Text into Words failed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.granularity === 'words', `Word split should report words granularity: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedFrameCount === 1, `Word split should process one source frame: ${JSON.stringify(result)}`);
                assert(result.data && result.data.createdFrameCount === 3, `Word split should create three word frames: ${JSON.stringify(result)}`);
                assert(inspection.textFrameCount === 3, `Word split should leave three text frames: ${JSON.stringify(inspection)}`);
                assert(JSON.stringify(inspection.contents) === JSON.stringify(['Hello', 'again', 'world']), `Unexpected word contents after split: ${JSON.stringify(inspection)}`);
                assert(inspection.contents.indexOf('Hello world again') === -1, `Word split should remove the original unsplit frame: ${JSON.stringify(inspection)}`);
                assertNear(inspection.unionBounds[0], setup.sourceBounds[0], 1.0, 'Word split should preserve the source left bound');
                assertNear(inspection.unionBounds[1], setup.sourceBounds[1], 1.0, 'Word split should preserve the source top bound');
                assertNear(inspection.unionBounds[2], setup.sourceBounds[2], 1.5, 'Word split should preserve the source right bound');
                assertNear(inspection.unionBounds[3], setup.sourceBounds[3], 1.5, 'Word split should preserve the source bottom bound');
                assert(cleanup.closedCount >= 1, `Word-split fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.break_text_into_glyphs_point_text, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, sourceBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var i;' +
                    'var targetLayer = doc.layers.add();' +
                    'targetLayer.name = "TEXT_SMOKE_LAYER";' +
                    'targetLayer.locked = false;' +
                    'targetLayer.visible = true;' +
                    'doc.activeLayer = targetLayer;' +
                    'doc.selection = null;' +
                    'for(i = doc.textFrames.length - 1; i >= 0; i -= 1){try{doc.textFrames[i].remove();}catch(removeError){}}' +
                    'var pointText = doc.textFrames.pointText([120, 320]);' +
                    'pointText.contents = "ABC";' +
                    'pointText.textRange.characterAttributes.size = 20;' +
                    'pointText.selected = true;' +
                    'doc.selection = [pointText];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, sourceBounds: pointText.visibleBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'break_text_into_glyphs',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ textFrameCount: 0, contents: [], unionBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var contents = [];' +
                    'var unionBounds = null;' +
                    'var addBounds = function(bounds){' +
                    'if(!bounds){return;}' +
                    'if(unionBounds === null){unionBounds = [bounds[0], bounds[1], bounds[2], bounds[3]]; return;}' +
                    'if(bounds[0] < unionBounds[0]){unionBounds[0] = bounds[0];}' +
                    'if(bounds[1] > unionBounds[1]){unionBounds[1] = bounds[1];}' +
                    'if(bounds[2] > unionBounds[2]){unionBounds[2] = bounds[2];}' +
                    'if(bounds[3] < unionBounds[3]){unionBounds[3] = bounds[3];}' +
                    '};' +
                    'var i;' +
                    'for(i = 0; i < doc.textFrames.length; i += 1){contents.push(doc.textFrames[i].contents); addBounds(doc.textFrames[i].visibleBounds);}' +
                    'contents.sort();' +
                    'return JSON.stringify({ textFrameCount: doc.textFrames.length, contents: contents, unionBounds: unionBounds });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(setup.selectionCount === 1, `Failed to prepare glyph-split fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Break Text into Glyphs failed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.granularity === 'characters', `Glyph split should report characters granularity: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedFrameCount === 1, `Glyph split should process one source frame: ${JSON.stringify(result)}`);
                assert(result.data && result.data.createdFrameCount === 3, `Glyph split should create three glyph frames: ${JSON.stringify(result)}`);
                assert(inspection.textFrameCount === 3, `Glyph split should leave three text frames: ${JSON.stringify(inspection)}`);
                assert(JSON.stringify(inspection.contents) === JSON.stringify(['A', 'B', 'C']), `Unexpected glyph contents after split: ${JSON.stringify(inspection)}`);
                assertNear(inspection.unionBounds[0], setup.sourceBounds[0], 1.0, 'Glyph split should preserve the source left bound');
                assertNear(inspection.unionBounds[1], setup.sourceBounds[1], 1.0, 'Glyph split should preserve the source top bound');
                assertNear(inspection.unionBounds[2], setup.sourceBounds[2], 1.5, 'Glyph split should preserve the source right bound');
                assertNear(inspection.unionBounds[3], setup.sourceBounds[3], 1.5, 'Glyph split should preserve the source bottom bound');
                assert(cleanup.closedCount >= 1, `Glyph-split fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.break_text_into_glyphs_unsupported_only_fail, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, pathTextKind: "" });}' +
                    'var doc = app.activeDocument;' +
                    'var i;' +
                    'var targetLayer = doc.layers.add();' +
                    'targetLayer.name = "TEXT_SMOKE_LAYER";' +
                    'targetLayer.locked = false;' +
                    'targetLayer.visible = true;' +
                    'doc.activeLayer = targetLayer;' +
                    'doc.selection = null;' +
                    'for(i = doc.textFrames.length - 1; i >= 0; i -= 1){try{doc.textFrames[i].remove();}catch(removeError){}}' +
                    'var textPath = doc.pathItems.add();' +
                    'textPath.stroked = false;' +
                    'textPath.filled = false;' +
                    'textPath.setEntirePath([[60, 280], [260, 280]]);' +
                    'var pathText = doc.textFrames.pathText(textPath);' +
                    'pathText.contents = "On path";' +
                    'pathText.selected = true;' +
                    'doc.selection = [pathText];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, pathTextKind: pathText.kind });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'break_text_into_glyphs',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ textFrameCount: 0, hasWrapperGroup: false });}' +
                    'var doc = app.activeDocument;' +
                    'var hasWrapperGroup = false;' +
                    'var i;' +
                    'for(i = 0; i < doc.groupItems.length; i += 1){if((doc.groupItems[i].name || "") === "TEXTBREAK_GLYPHS"){hasWrapperGroup = true;}}' +
                    'return JSON.stringify({ textFrameCount: doc.textFrames.length, hasWrapperGroup: hasWrapperGroup });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(setup.selectionCount === 1, `Failed to prepare unsupported glyph-split fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === false, `Unsupported path-text selection should fail cleanly: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'TEXT_BREAK_NO_SUPPORTED_SELECTION', `Unsupported path-text selection should surface TEXT_BREAK_NO_SUPPORTED_SELECTION: ${JSON.stringify(result)}`);
                assert(inspection.hasWrapperGroup === false, `Unsupported path-text selection should not create text-break groups: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Unsupported glyph-split fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });
}

module.exports = { runTextSmokeSuite };
