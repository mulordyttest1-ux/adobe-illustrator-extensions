async function runSwapSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;

    await runSelectedScenario(scenarioLookup.swap_selection_position_only_basic, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var workLayer = doc.layers.add();' +
                    'workLayer.name = "SWAP_SMOKE_POSITION_ONLY";' +
                    'workLayer.locked = false;' +
                    'workLayer.visible = true;' +
                    'doc.activeLayer = workLayer;' +
                    'doc.selection = null;' +
                    'var first = doc.pathItems.rectangle(320, 100, 120, 80);' +
                    'first.name = "SWAP_POS_A";' +
                    'first.filled = false;' +
                    'first.stroked = true;' +
                    'var second = doc.pathItems.rectangle(180, 320, 60, 40);' +
                    'second.name = "SWAP_POS_B";' +
                    'second.filled = false;' +
                    'second.stroked = true;' +
                    'first.selected = true;' +
                    'second.selected = true;' +
                    'doc.selection = [first, second];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, firstBounds: first.geometricBounds, secondBounds: second.geometricBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'swap_selection_position_only',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ firstBounds: null, secondBounds: null, firstCenter: null, secondCenter: null });}' +
                    'var doc = app.activeDocument;' +
                    'var first = null;' +
                    'var second = null;' +
                    'var i;' +
                    'var getCenter = function(bounds){return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];};' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "SWAP_POS_A"){first = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "SWAP_POS_B"){second = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({' +
                    'firstBounds: first ? first.geometricBounds : null,' +
                    'secondBounds: second ? second.geometricBounds : null,' +
                    'firstCenter: first ? getCenter(first.geometricBounds) : null,' +
                    'secondCenter: second ? getCenter(second.geometricBounds) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
                const firstCenterBefore = [(setup.firstBounds[0] + setup.firstBounds[2]) / 2, (setup.firstBounds[1] + setup.firstBounds[3]) / 2];
                const secondCenterBefore = [(setup.secondBounds[0] + setup.secondBounds[2]) / 2, (setup.secondBounds[1] + setup.secondBounds[3]) / 2];
    
                assert(fixture.documentName && setup.selectionCount === 2, `Failed to prepare swap position fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Swap Position Only should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.mode === 'position_only', `Swap Position Only mode mismatch: ${JSON.stringify(result)}`);
                assertPointNear(inspection.firstCenter, secondCenterBefore, 0.2, 'First item center should move to second item center');
                assertPointNear(inspection.secondCenter, firstCenterBefore, 0.2, 'Second item center should move to first item center');
                assertBoundsNear(inspection.firstBounds, [
                    secondCenterBefore[0] - ((setup.firstBounds[2] - setup.firstBounds[0]) / 2),
                    secondCenterBefore[1] + ((setup.firstBounds[1] - setup.firstBounds[3]) / 2),
                    secondCenterBefore[0] + ((setup.firstBounds[2] - setup.firstBounds[0]) / 2),
                    secondCenterBefore[1] - ((setup.firstBounds[1] - setup.firstBounds[3]) / 2)
                ], 0.2, 'First item bounds should keep their original size');
                assertBoundsNear(inspection.secondBounds, [
                    firstCenterBefore[0] - ((setup.secondBounds[2] - setup.secondBounds[0]) / 2),
                    firstCenterBefore[1] + ((setup.secondBounds[1] - setup.secondBounds[3]) / 2),
                    firstCenterBefore[0] + ((setup.secondBounds[2] - setup.secondBounds[0]) / 2),
                    firstCenterBefore[1] - ((setup.secondBounds[1] - setup.secondBounds[3]) / 2)
                ], 0.2, 'Second item bounds should keep their original size');
                assert(cleanup.closedCount >= 1, `Swap Position Only fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.swap_selection_position_only_exact_two_precheck, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var workLayer = doc.layers.add();' +
                    'workLayer.name = "SWAP_SMOKE_PRECHECK";' +
                    'workLayer.locked = false;' +
                    'workLayer.visible = true;' +
                    'doc.activeLayer = workLayer;' +
                    'doc.selection = null;' +
                    'var first = doc.pathItems.rectangle(320, 100, 80, 50);' +
                    'first.name = "SWAP_PRECHECK_A";' +
                    'first.filled = false;' +
                    'first.stroked = true;' +
                    'var second = doc.pathItems.rectangle(220, 220, 70, 40);' +
                    'second.name = "SWAP_PRECHECK_B";' +
                    'second.filled = false;' +
                    'second.stroked = true;' +
                    'var third = doc.pathItems.rectangle(120, 340, 60, 30);' +
                    'third.name = "SWAP_PRECHECK_C";' +
                    'third.filled = false;' +
                    'third.stroked = true;' +
                    'first.selected = true;' +
                    'doc.selection = [first];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, firstBounds: first.geometricBounds, secondBounds: second.geometricBounds, thirdBounds: third.geometricBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        const hostFacade = window.__TOOLKIT_TEST_API__.getHostFacade();
                        const hostDebug = window.__TOOLKIT_TEST_API__.getHostDebug();
                        const firstResult = await hostFacade.runCommand({
                            id: 'swap_selection_position_only',
                            payload: {}
                        });
                        await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return "no-doc";}' +
                            'var doc = app.activeDocument;' +
                            'var first = null;' +
                            'var second = null;' +
                            'var third = null;' +
                            'var i;' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){' +
                            'if(doc.pathItems[i].name === "SWAP_PRECHECK_A"){first = doc.pathItems[i];}' +
                            'if(doc.pathItems[i].name === "SWAP_PRECHECK_B"){second = doc.pathItems[i];}' +
                            'if(doc.pathItems[i].name === "SWAP_PRECHECK_C"){third = doc.pathItems[i];}' +
                            '}' +
                            'doc.selection = [first, second, third];' +
                            'return "ok";' +
                            '})()'
                        );
                        const secondResult = await hostFacade.runCommand({
                            id: 'swap_selection_position_only',
                            payload: {}
                        });
                        const inspectionJson = await hostDebug.evalScript(
                            '(function(){' +
                            'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, firstBounds: null, secondBounds: null, thirdBounds: null });}' +
                            'var doc = app.activeDocument;' +
                            'var first = null;' +
                            'var second = null;' +
                            'var third = null;' +
                            'var i;' +
                            'for(i = 0; i < doc.pathItems.length; i += 1){' +
                            'if(doc.pathItems[i].name === "SWAP_PRECHECK_A"){first = doc.pathItems[i];}' +
                            'if(doc.pathItems[i].name === "SWAP_PRECHECK_B"){second = doc.pathItems[i];}' +
                            'if(doc.pathItems[i].name === "SWAP_PRECHECK_C"){third = doc.pathItems[i];}' +
                            '}' +
                            'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, firstBounds: first ? first.geometricBounds : null, secondBounds: second ? second.geometricBounds : null, thirdBounds: third ? third.geometricBounds : null });' +
                            '})()'
                        );
                        return {
                            firstResult: firstResult,
                            secondResult: secondResult,
                            inspection: JSON.parse(inspectionJson)
                        };
                    })()
                `);
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 1, `Failed to prepare swap precheck fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result.firstResult && result.firstResult.success === false, `One-item precheck should fail: ${JSON.stringify(result)}`);
                assert(result.firstResult && result.firstResult.errorCode === 'SWAP_SELECTION_NEEDS_TWO_ITEMS', `One-item precheck should surface SWAP_SELECTION_NEEDS_TWO_ITEMS: ${JSON.stringify(result)}`);
                assert(result.secondResult && result.secondResult.success === false, `Three-item precheck should fail: ${JSON.stringify(result)}`);
                assert(result.secondResult && result.secondResult.errorCode === 'SWAP_SELECTION_NEEDS_TWO_ITEMS', `Three-item precheck should surface SWAP_SELECTION_NEEDS_TWO_ITEMS: ${JSON.stringify(result)}`);
                assert(result.inspection.selectionCount === 3, `Three-item precheck should preserve the three-item selection for inspection: ${JSON.stringify(result)}`);
                assertBoundsNear(result.inspection.firstBounds, setup.firstBounds, 0.2, 'First precheck item should remain unchanged');
                assertBoundsNear(result.inspection.secondBounds, setup.secondBounds, 0.2, 'Second precheck item should remain unchanged');
                assertBoundsNear(result.inspection.thirdBounds, setup.thirdBounds, 0.2, 'Third precheck item should remain unchanged');
                assert(cleanup.closedCount >= 1, `Swap precheck fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.swap_selection_size_and_position_basic, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var workLayer = doc.layers.add();' +
                    'workLayer.name = "SWAP_SMOKE_SIZE";' +
                    'workLayer.locked = false;' +
                    'workLayer.visible = true;' +
                    'doc.activeLayer = workLayer;' +
                    'doc.selection = null;' +
                    'var first = doc.pathItems.rectangle(320, 100, 120, 80);' +
                    'first.name = "SWAP_SIZE_A";' +
                    'first.filled = false;' +
                    'first.stroked = true;' +
                    'var second = doc.pathItems.rectangle(180, 320, 60, 40);' +
                    'second.name = "SWAP_SIZE_B";' +
                    'second.filled = false;' +
                    'second.stroked = true;' +
                    'first.selected = true;' +
                    'second.selected = true;' +
                    'doc.selection = [first, second];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, firstBounds: first.geometricBounds, secondBounds: second.geometricBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'swap_selection_size_and_position',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ firstBounds: null, secondBounds: null, firstCenter: null, secondCenter: null });}' +
                    'var doc = app.activeDocument;' +
                    'var first = null;' +
                    'var second = null;' +
                    'var i;' +
                    'var getCenter = function(bounds){return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];};' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "SWAP_SIZE_A"){first = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "SWAP_SIZE_B"){second = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({' +
                    'firstBounds: first ? first.geometricBounds : null,' +
                    'secondBounds: second ? second.geometricBounds : null,' +
                    'firstCenter: first ? getCenter(first.geometricBounds) : null,' +
                    'secondCenter: second ? getCenter(second.geometricBounds) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
                const firstCenterBefore = [(setup.firstBounds[0] + setup.firstBounds[2]) / 2, (setup.firstBounds[1] + setup.firstBounds[3]) / 2];
                const secondCenterBefore = [(setup.secondBounds[0] + setup.secondBounds[2]) / 2, (setup.secondBounds[1] + setup.secondBounds[3]) / 2];
                const firstTargetWidth = setup.secondBounds[2] - setup.secondBounds[0];
                const firstTargetHeight = setup.secondBounds[1] - setup.secondBounds[3];
                const secondTargetWidth = setup.firstBounds[2] - setup.firstBounds[0];
                const secondTargetHeight = setup.firstBounds[1] - setup.firstBounds[3];
    
                assert(fixture.documentName && setup.selectionCount === 2, `Failed to prepare swap size fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Swap Size + Position should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.mode === 'size_and_position', `Swap Size + Position mode mismatch: ${JSON.stringify(result)}`);
                assertPointNear(inspection.firstCenter, secondCenterBefore, 0.2, 'First size-swap item center should move to second item center');
                assertPointNear(inspection.secondCenter, firstCenterBefore, 0.2, 'Second size-swap item center should move to first item center');
                assertNear(inspection.firstBounds[2] - inspection.firstBounds[0], firstTargetWidth, 0.2, 'First size-swap item width should match second item width');
                assertNear(inspection.firstBounds[1] - inspection.firstBounds[3], firstTargetHeight, 0.2, 'First size-swap item height should match second item height');
                assertNear(inspection.secondBounds[2] - inspection.secondBounds[0], secondTargetWidth, 0.2, 'Second size-swap item width should match first item width');
                assertNear(inspection.secondBounds[1] - inspection.secondBounds[3], secondTargetHeight, 0.2, 'Second size-swap item height should match first item height');
                assert(cleanup.closedCount >= 1, `Swap Size + Position fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.swap_selection_size_and_position_rotated, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var workLayer = doc.layers.add();' +
                    'workLayer.name = "SWAP_SMOKE_ROTATED";' +
                    'workLayer.locked = false;' +
                    'workLayer.visible = true;' +
                    'doc.activeLayer = workLayer;' +
                    'doc.selection = null;' +
                    'var getCenter = function(bounds){return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];};' +
                    'var getAngle = function(item){var firstAnchor = item.pathPoints[0].anchor; var secondAnchor = item.pathPoints[1].anchor; return Math.atan2(secondAnchor[1] - firstAnchor[1], secondAnchor[0] - firstAnchor[0]) * 180 / Math.PI;};' +
                    'var first = doc.pathItems.rectangle(320, 100, 90, 50);' +
                    'first.name = "SWAP_ROT_A";' +
                    'first.filled = false;' +
                    'first.stroked = true;' +
                    'first.rotate(30);' +
                    'var second = doc.pathItems.rectangle(180, 320, 90, 50);' +
                    'second.name = "SWAP_ROT_B";' +
                    'second.filled = false;' +
                    'second.stroked = true;' +
                    'second.rotate(30);' +
                    'first.selected = true;' +
                    'second.selected = true;' +
                    'doc.selection = [first, second];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, firstCenter: getCenter(first.geometricBounds), secondCenter: getCenter(second.geometricBounds), firstAngle: getAngle(first), secondAngle: getAngle(second) });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'swap_selection_size_and_position',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ firstCenter: null, secondCenter: null, firstAngle: null, secondAngle: null });}' +
                    'var doc = app.activeDocument;' +
                    'var first = null;' +
                    'var second = null;' +
                    'var i;' +
                    'var getCenter = function(bounds){return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];};' +
                    'var getAngle = function(item){var firstAnchor = item.pathPoints[0].anchor; var secondAnchor = item.pathPoints[1].anchor; return Math.atan2(secondAnchor[1] - firstAnchor[1], secondAnchor[0] - firstAnchor[0]) * 180 / Math.PI;};' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "SWAP_ROT_A"){first = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "SWAP_ROT_B"){second = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({' +
                    'firstCenter: first ? getCenter(first.geometricBounds) : null,' +
                    'secondCenter: second ? getCenter(second.geometricBounds) : null,' +
                    'firstAngle: first ? getAngle(first) : null,' +
                    'secondAngle: second ? getAngle(second) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 2, `Failed to prepare rotated swap fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Rotated Swap Size + Position should succeed: ${JSON.stringify(result)}`);
                assertPointNear(inspection.firstCenter, setup.secondCenter, 0.2, 'First rotated item center should move to second item center');
                assertPointNear(inspection.secondCenter, setup.firstCenter, 0.2, 'Second rotated item center should move to first item center');
                assertAngleNear(inspection.firstAngle, setup.firstAngle, 0.2, 'First rotated item should keep its own angle');
                assertAngleNear(inspection.secondAngle, setup.secondAngle, 0.2, 'Second rotated item should keep its own angle');
                assert(cleanup.closedCount >= 1, `Rotated swap fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.swap_selection_size_and_position_zero_size_fail, selectedScenarioIds, results, async () => {
                const fixture = await prepareSelectionDocument(Runtime, false);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var workLayer = doc.layers.add();' +
                    'workLayer.name = "SWAP_SMOKE_ZERO_SIZE";' +
                    'workLayer.locked = false;' +
                    'workLayer.visible = true;' +
                    'doc.activeLayer = workLayer;' +
                    'doc.selection = null;' +
                    'var line = doc.pathItems.add();' +
                    'line.name = "SWAP_ZERO_LINE";' +
                    'line.stroked = true;' +
                    'line.filled = false;' +
                    'line.setEntirePath([[120, 320], [120, 200]]);' +
                    'var rect = doc.pathItems.rectangle(220, 260, 80, 50);' +
                    'rect.name = "SWAP_ZERO_RECT";' +
                    'rect.filled = false;' +
                    'rect.stroked = true;' +
                    'line.selected = true;' +
                    'rect.selected = true;' +
                    'doc.selection = [line, rect];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, lineBounds: line.geometricBounds, rectBounds: rect.geometricBounds });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'swap_selection_size_and_position',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ lineBounds: null, rectBounds: null });}' +
                    'var doc = app.activeDocument;' +
                    'var line = null;' +
                    'var rect = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "SWAP_ZERO_LINE"){line = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "SWAP_ZERO_RECT"){rect = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({ lineBounds: line ? line.geometricBounds : null, rectBounds: rect ? rect.geometricBounds : null });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(fixture.documentName && setup.selectionCount === 2, `Failed to prepare zero-size swap fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === false, `Zero-size size swap should fail: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'SWAP_SELECTION_ZERO_SIZE', `Zero-size size swap should surface SWAP_SELECTION_ZERO_SIZE: ${JSON.stringify(result)}`);
                assertBoundsNear(inspection.lineBounds, setup.lineBounds, 0.2, 'Zero-size line item should remain unchanged');
                assertBoundsNear(inspection.rectBounds, setup.rectBounds, 0.2, 'Zero-size rectangle item should remain unchanged');
                assert(cleanup.closedCount >= 1, `Zero-size swap fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });
}

module.exports = { runSwapSmokeSuite };
