async function runRecolorSmokeSuite(context) {
    const { Runtime, scenarioLookup, selectedScenarioIds, results, tempOutputRoots, runSelectedScenario, assert, assertNear, evaluate, callHostBridge, prepareHostFacadeRunCount, readHostFacadeRunCount, restoreDefaultRuntime, waitForReady, prepareSelectionDocument, prepareCmykFixtureDocument, activateFixtureDocument, activateDocumentByName, runHostScript, runHostJson, assertPointNear, assertBoundsNear, assertCmykColor, assertAngleNear, extensionRoot, smokeFixtureLayerName, fs, os, path } = context;
    const { closeSmokeFixtureDocuments } = context;

    await runSelectedScenario(scenarioLookup.recolor_selection_k100_basic_paths, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var cyan = new CMYKColor();' +
                    'var magenta = new CMYKColor();' +
                    'var black = new CMYKColor();' +
                    'layer.name = "RECOLOR_K100_BASIC_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'cyan.cyan = 100;' +
                    'magenta.magenta = 100;' +
                    'black.black = 100;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'var first = doc.pathItems.rectangle(320, 60, 90, 60);' +
                    'first.name = "RECOLOR_K100_BASIC_A";' +
                    'first.filled = true;' +
                    'first.fillColor = cyan;' +
                    'first.stroked = true;' +
                    'first.strokeWidth = 1;' +
                    'first.strokeColor = magenta;' +
                    'var second = doc.pathItems.rectangle(210, 190, 90, 60);' +
                    'second.name = "RECOLOR_K100_BASIC_B";' +
                    'second.filled = true;' +
                    'second.fillColor = black;' +
                    'second.stroked = true;' +
                    'second.strokeWidth = 1;' +
                    'second.strokeColor = black;' +
                    'first.selected = true;' +
                    'second.selected = true;' +
                    'doc.selection = [first, second];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_k100',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'function describeColor(color){' +
                    'if(!color){return null;}' +
                    'if(color.typename === "CMYKColor"){return { model: "CMYK", cyan: color.cyan, magenta: color.magenta, yellow: color.yellow, black: color.black };}' +
                    'return { model: color.typename || "" };' +
                    '}' +
                    'if(!app.documents.length){return JSON.stringify({ firstFill: null, firstStroke: null, secondFill: null, secondStroke: null });}' +
                    'var doc = app.activeDocument;' +
                    'var first = null;' +
                    'var second = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "RECOLOR_K100_BASIC_A"){first = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "RECOLOR_K100_BASIC_B"){second = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({' +
                    'firstFill: first ? describeColor(first.fillColor) : null,' +
                    'firstStroke: first ? describeColor(first.strokeColor) : null,' +
                    'secondFill: second ? describeColor(second.fillColor) : null,' +
                    'secondStroke: second ? describeColor(second.strokeColor) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName && setup.selectionCount === 2, `Failed to prepare recolor K100 basic fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Recolor K100 basic paths should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.targetColor && result.data.targetColor.black === 100, `Recolor K100 should report K100 target color: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedItemCount === 2, `Recolor K100 should process two path items: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredFillCount === 2, `Recolor K100 should recolor two fills: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredStrokeCount === 2, `Recolor K100 should recolor two strokes: ${JSON.stringify(result)}`);
                assert(result.data && result.data.skippedItemCount === 0, `Recolor K100 basic paths should not skip items: ${JSON.stringify(result)}`);
                assertCmykColor(inspection.firstFill, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor first fill');
                assertCmykColor(inspection.firstStroke, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor first stroke');
                assertCmykColor(inspection.secondFill, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should not preserve existing black fill');
                assertCmykColor(inspection.secondStroke, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should not preserve existing black stroke');
                assert(cleanup.closedCount >= 1, `Recolor K100 basic fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.recolor_selection_k100_group_and_compound, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'function makeColor(c, m, y, k){var color = new CMYKColor(); color.cyan = c; color.magenta = m; color.yellow = y; color.black = k; return color;}' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var group;' +
                    'var direct;' +
                    'var compound;' +
                    'var outer;' +
                    'var inner;' +
                    'layer.name = "RECOLOR_K100_GROUP_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'group = layer.groupItems.add();' +
                    'group.name = "RECOLOR_K100_GROUP";' +
                    'direct = group.pathItems.add();' +
                    'direct.name = "RECOLOR_K100_GROUP_DIRECT";' +
                    'direct.setEntirePath([[40, 330], [120, 330], [120, 260], [40, 260]]);' +
                    'direct.closed = true;' +
                    'direct.filled = true;' +
                    'direct.fillColor = makeColor(0, 100, 100, 0);' +
                    'direct.stroked = true;' +
                    'direct.strokeWidth = 1;' +
                    'direct.strokeColor = makeColor(100, 0, 0, 0);' +
                    'compound = group.compoundPathItems.add();' +
                    'compound.name = "RECOLOR_K100_COMPOUND";' +
                    'outer = compound.pathItems.add();' +
                    'outer.setEntirePath([[170, 330], [280, 330], [280, 220], [170, 220]]);' +
                    'outer.closed = true;' +
                    'outer.filled = true;' +
                    'outer.fillColor = makeColor(0, 100, 100, 0);' +
                    'outer.stroked = true;' +
                    'outer.strokeWidth = 1;' +
                    'outer.strokeColor = makeColor(100, 0, 0, 0);' +
                    'inner = compound.pathItems.add();' +
                    'inner.setEntirePath([[205, 295], [245, 295], [245, 255], [205, 255]]);' +
                    'inner.closed = true;' +
                    'inner.filled = true;' +
                    'inner.fillColor = makeColor(0, 100, 100, 0);' +
                    'inner.stroked = true;' +
                    'inner.strokeWidth = 1;' +
                    'inner.strokeColor = makeColor(100, 0, 0, 0);' +
                    'group.selected = true;' +
                    'doc.selection = [group];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_k100',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'function describeColor(color){' +
                    'if(!color){return null;}' +
                    'if(color.typename === "CMYKColor"){return { model: "CMYK", cyan: color.cyan, magenta: color.magenta, yellow: color.yellow, black: color.black };}' +
                    'return { model: color.typename || "" };' +
                    '}' +
                    'if(!app.documents.length){return JSON.stringify({ directFill: null, directStroke: null, compoundFill: null, compoundStroke: null, compoundPathCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var direct = null;' +
                    'var compound = null;' +
                    'var compoundChild = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "RECOLOR_K100_GROUP_DIRECT"){direct = doc.pathItems[i];}}' +
                    'for(i = 0; i < doc.compoundPathItems.length; i += 1){if(doc.compoundPathItems[i].name === "RECOLOR_K100_COMPOUND"){compound = doc.compoundPathItems[i]; break;}}' +
                    'if(compound && compound.pathItems.length){compoundChild = compound.pathItems[0];}' +
                    'return JSON.stringify({' +
                    'compoundPathCount: doc.compoundPathItems.length,' +
                    'compoundChildCount: compound ? compound.pathItems.length : 0,' +
                    'directFill: direct ? describeColor(direct.fillColor) : null,' +
                    'directStroke: direct ? describeColor(direct.strokeColor) : null,' +
                    'compoundFill: compoundChild ? describeColor(compoundChild.fillColor) : null,' +
                    'compoundStroke: compoundChild ? describeColor(compoundChild.strokeColor) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName && setup.selectionCount === 1, `Failed to prepare recolor K100 group/compound fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Recolor K100 group/compound should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedItemCount === 3, `Recolor K100 should process one direct path and two compound children: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredFillCount === 3, `Recolor K100 should recolor all group/compound fills: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredStrokeCount === 3, `Recolor K100 should recolor all group/compound strokes: ${JSON.stringify(result)}`);
                assert(inspection.compoundPathCount === 1 && inspection.compoundChildCount === 2, `Recolor K100 fixture should contain one compound path with two children: ${JSON.stringify(inspection)}`);
                assertCmykColor(inspection.directFill, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor direct group path fill');
                assertCmykColor(inspection.directStroke, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor direct group path stroke');
                assertCmykColor(inspection.compoundFill, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor compound path fill');
                assertCmykColor(inspection.compoundStroke, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor compound path stroke');
                assert(cleanup.closedCount >= 1, `Recolor K100 group/compound fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.recolor_selection_k100_text_fill_and_stroke, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'function makeColor(c, m, y, k){var color = new CMYKColor(); color.cyan = c; color.magenta = m; color.yellow = y; color.black = k; return color;}' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var pointText;' +
                    'layer.name = "RECOLOR_K100_TEXT_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'pointText = doc.textFrames.pointText([120, 320]);' +
                    'pointText.name = "RECOLOR_K100_TEXT";' +
                    'pointText.contents = "Color Text";' +
                    'pointText.textRange.characterAttributes.size = 24;' +
                    'pointText.textRange.characterAttributes.fillColor = makeColor(100, 0, 0, 0);' +
                    'pointText.textRange.characterAttributes.strokeColor = makeColor(0, 100, 100, 0);' +
                    'pointText.textRange.characterAttributes.strokeWeight = 1;' +
                    'pointText.selected = true;' +
                    'doc.selection = [pointText];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_k100',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'function describeColor(color){' +
                    'if(!color){return null;}' +
                    'if(color.typename === "CMYKColor"){return { model: "CMYK", cyan: color.cyan, magenta: color.magenta, yellow: color.yellow, black: color.black };}' +
                    'return { model: color.typename || "" };' +
                    '}' +
                    'if(!app.documents.length){return JSON.stringify({ fillColor: null, strokeColor: null, textFrameCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var textItem = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.textFrames.length; i += 1){if(doc.textFrames[i].name === "RECOLOR_K100_TEXT"){textItem = doc.textFrames[i]; break;}}' +
                    'return JSON.stringify({' +
                    'textFrameCount: doc.textFrames.length,' +
                    'fillColor: textItem ? describeColor(textItem.textRange.characterAttributes.fillColor) : null,' +
                    'strokeColor: textItem ? describeColor(textItem.textRange.characterAttributes.strokeColor) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName && setup.selectionCount === 1, `Failed to prepare recolor K100 text fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Recolor K100 text should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedItemCount === 1, `Recolor K100 text should process one text frame: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredTextRangeCount === 1, `Recolor K100 text should report one recolored text range: ${JSON.stringify(result)}`);
                assertCmykColor(inspection.fillColor, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor text fill');
                assertCmykColor(inspection.strokeColor, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 should recolor text stroke');
                assert(cleanup.closedCount >= 1, `Recolor K100 text fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.recolor_selection_k100_mixed_skip, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'function makeColor(c, m, y, k){var color = new CMYKColor(); color.cyan = c; color.magenta = m; color.yellow = y; color.black = k; return color;}' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var supported;' +
                    'var unsupported;' +
                    'var gradient;' +
                    'var gradientColor = new GradientColor();' +
                    'layer.name = "RECOLOR_K100_MIXED_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'supported = doc.pathItems.rectangle(320, 60, 90, 60);' +
                    'supported.name = "RECOLOR_K100_SUPPORTED";' +
                    'supported.filled = true;' +
                    'supported.fillColor = makeColor(100, 0, 0, 0);' +
                    'supported.stroked = true;' +
                    'supported.strokeWidth = 1;' +
                    'supported.strokeColor = makeColor(0, 100, 100, 0);' +
                    'unsupported = doc.pathItems.rectangle(220, 210, 90, 60);' +
                    'unsupported.name = "RECOLOR_K100_GRADIENT";' +
                    'unsupported.filled = true;' +
                    'gradient = doc.gradients.add();' +
                    'gradient.name = "RECOLOR_K100_SKIP_GRADIENT";' +
                    'gradient.gradientStops[0].color = makeColor(100, 0, 0, 0);' +
                    'gradient.gradientStops[1].color = makeColor(0, 100, 100, 0);' +
                    'gradientColor.gradient = gradient;' +
                    'unsupported.fillColor = gradientColor;' +
                    'unsupported.stroked = false;' +
                    'supported.selected = true;' +
                    'unsupported.selected = true;' +
                    'doc.selection = [supported, unsupported];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_k100',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'function describeColor(color){' +
                    'if(!color){return null;}' +
                    'if(color.typename === "CMYKColor"){return { model: "CMYK", cyan: color.cyan, magenta: color.magenta, yellow: color.yellow, black: color.black };}' +
                    'return { model: color.typename || "" };' +
                    '}' +
                    'if(!app.documents.length){return JSON.stringify({ supportedFill: null, supportedStroke: null, unsupportedFill: null });}' +
                    'var doc = app.activeDocument;' +
                    'var supported = null;' +
                    'var unsupported = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "RECOLOR_K100_SUPPORTED"){supported = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "RECOLOR_K100_GRADIENT"){unsupported = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({' +
                    'supportedFill: supported ? describeColor(supported.fillColor) : null,' +
                    'supportedStroke: supported ? describeColor(supported.strokeColor) : null,' +
                    'unsupportedFill: unsupported ? describeColor(unsupported.fillColor) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName && setup.selectionCount === 2, `Failed to prepare recolor K100 mixed-skip fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Recolor K100 mixed skip should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedItemCount === 1, `Recolor K100 mixed skip should only process the supported path: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredFillCount === 1, `Recolor K100 mixed skip should recolor one supported fill: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredStrokeCount === 1, `Recolor K100 mixed skip should recolor one supported stroke: ${JSON.stringify(result)}`);
                assert(result.data && result.data.skippedReasons && result.data.skippedReasons.gradientColor === 1, `Recolor K100 mixed skip should record one gradient skip: ${JSON.stringify(result)}`);
                assertCmykColor(inspection.supportedFill, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 mixed skip should recolor supported fill');
                assertCmykColor(inspection.supportedStroke, { cyan: 0, magenta: 0, yellow: 0, black: 100 }, 0.1, 'Recolor K100 mixed skip should recolor supported stroke');
                assert(inspection.unsupportedFill && inspection.unsupportedFill.model === 'GradientColor', `Recolor K100 mixed skip should leave gradient fill untouched: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Recolor K100 mixed-skip fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.recolor_selection_red_basic_paths, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'function makeColor(c, m, y, k){var color = new CMYKColor(); color.cyan = c; color.magenta = m; color.yellow = y; color.black = k; return color;}' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var first;' +
                    'var second;' +
                    'layer.name = "RECOLOR_RED_BASIC_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'first = doc.pathItems.rectangle(320, 60, 90, 60);' +
                    'first.name = "RECOLOR_RED_BASIC_A";' +
                    'first.filled = true;' +
                    'first.fillColor = makeColor(100, 0, 0, 0);' +
                    'first.stroked = true;' +
                    'first.strokeWidth = 1;' +
                    'first.strokeColor = makeColor(0, 0, 0, 100);' +
                    'second = doc.pathItems.rectangle(210, 190, 90, 60);' +
                    'second.name = "RECOLOR_RED_BASIC_B";' +
                    'second.filled = true;' +
                    'second.fillColor = makeColor(0, 0, 0, 100);' +
                    'second.stroked = true;' +
                    'second.strokeWidth = 1;' +
                    'second.strokeColor = makeColor(0, 100, 0, 0);' +
                    'first.selected = true;' +
                    'second.selected = true;' +
                    'doc.selection = [first, second];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_red_c0_m100_y100_k0',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'function describeColor(color){' +
                    'if(!color){return null;}' +
                    'if(color.typename === "CMYKColor"){return { model: "CMYK", cyan: color.cyan, magenta: color.magenta, yellow: color.yellow, black: color.black };}' +
                    'return { model: color.typename || "" };' +
                    '}' +
                    'if(!app.documents.length){return JSON.stringify({ firstFill: null, firstStroke: null, secondFill: null, secondStroke: null });}' +
                    'var doc = app.activeDocument;' +
                    'var first = null;' +
                    'var second = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){' +
                    'if(doc.pathItems[i].name === "RECOLOR_RED_BASIC_A"){first = doc.pathItems[i];}' +
                    'if(doc.pathItems[i].name === "RECOLOR_RED_BASIC_B"){second = doc.pathItems[i];}' +
                    '}' +
                    'return JSON.stringify({' +
                    'firstFill: first ? describeColor(first.fillColor) : null,' +
                    'firstStroke: first ? describeColor(first.strokeColor) : null,' +
                    'secondFill: second ? describeColor(second.fillColor) : null,' +
                    'secondStroke: second ? describeColor(second.strokeColor) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName && setup.selectionCount === 2, `Failed to prepare recolor Red basic fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === true, `Recolor Red basic paths should succeed: ${JSON.stringify(result)}`);
                assert(result.data && result.data.targetColor && result.data.targetColor.magenta === 100 && result.data.targetColor.yellow === 100, `Recolor Red should report red target color: ${JSON.stringify(result)}`);
                assert(result.data && result.data.processedItemCount === 2, `Recolor Red should process two path items: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredFillCount === 2, `Recolor Red should recolor two fills: ${JSON.stringify(result)}`);
                assert(result.data && result.data.recoloredStrokeCount === 2, `Recolor Red should recolor two strokes: ${JSON.stringify(result)}`);
                assertCmykColor(inspection.firstFill, { cyan: 0, magenta: 100, yellow: 100, black: 0 }, 0.1, 'Recolor Red should recolor first fill');
                assertCmykColor(inspection.firstStroke, { cyan: 0, magenta: 100, yellow: 100, black: 0 }, 0.1, 'Recolor Red should recolor first stroke');
                assertCmykColor(inspection.secondFill, { cyan: 0, magenta: 100, yellow: 100, black: 0 }, 0.1, 'Recolor Red should recolor second fill');
                assertCmykColor(inspection.secondStroke, { cyan: 0, magenta: 100, yellow: 100, black: 0 }, 0.1, 'Recolor Red should recolor second stroke');
                assert(cleanup.closedCount >= 1, `Recolor Red basic fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.recolor_selection_red_no_supported_items_fail, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const setup = await runHostJson(Runtime,
                    '(function(){' +
                    'function makeColor(c, m, y, k){var color = new CMYKColor(); color.cyan = c; color.magenta = m; color.yellow = y; color.black = k; return color;}' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var layer = doc.layers.add();' +
                    'var unsupported;' +
                    'var gradient;' +
                    'var gradientColor = new GradientColor();' +
                    'layer.name = "RECOLOR_RED_FAIL_LAYER";' +
                    'layer.locked = false;' +
                    'layer.visible = true;' +
                    'doc.activeLayer = layer;' +
                    'doc.selection = null;' +
                    'unsupported = doc.pathItems.rectangle(260, 120, 110, 70);' +
                    'unsupported.name = "RECOLOR_RED_GRADIENT_ONLY";' +
                    'unsupported.filled = true;' +
                    'gradient = doc.gradients.add();' +
                    'gradient.name = "RECOLOR_RED_ONLY_GRADIENT";' +
                    'gradient.gradientStops[0].color = makeColor(100, 0, 0, 0);' +
                    'gradient.gradientStops[1].color = makeColor(0, 100, 100, 0);' +
                    'gradientColor.gradient = gradient;' +
                    'unsupported.fillColor = gradientColor;' +
                    'unsupported.stroked = false;' +
                    'unsupported.selected = true;' +
                    'doc.selection = [unsupported];' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0 });' +
                    '})()'
                );
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_red_c0_m100_y100_k0',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'function describeColor(color){' +
                    'if(!color){return null;}' +
                    'if(color.typename === "CMYKColor"){return { model: "CMYK", cyan: color.cyan, magenta: color.magenta, yellow: color.yellow, black: color.black };}' +
                    'return { model: color.typename || "" };' +
                    '}' +
                    'if(!app.documents.length){return JSON.stringify({ fillColor: null, selectionCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'var unsupported = null;' +
                    'var i;' +
                    'for(i = 0; i < doc.pathItems.length; i += 1){if(doc.pathItems[i].name === "RECOLOR_RED_GRADIENT_ONLY"){unsupported = doc.pathItems[i]; break;}}' +
                    'return JSON.stringify({' +
                    'selectionCount: doc.selection ? doc.selection.length : 0,' +
                    'fillColor: unsupported ? describeColor(unsupported.fillColor) : null' +
                    '});' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName && setup.selectionCount === 1, `Failed to prepare recolor Red unsupported-only fixture: ${JSON.stringify({ fixture, setup })}`);
                assert(result && result.success === false, `Recolor Red unsupported-only selection should fail: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'RECOLOR_SELECTION_NO_SUPPORTED_ITEMS', `Recolor Red unsupported-only selection should surface RECOLOR_SELECTION_NO_SUPPORTED_ITEMS: ${JSON.stringify(result)}`);
                assert(result.data && result.data.skippedReasons && result.data.skippedReasons.gradientColor === 1, `Recolor Red unsupported-only selection should record one gradient skip: ${JSON.stringify(result)}`);
                assert(inspection.fillColor && inspection.fillColor.model === 'GradientColor', `Recolor Red unsupported-only selection should leave gradient fill untouched: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Recolor Red unsupported-only fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });

    await runSelectedScenario(scenarioLookup.recolor_selection_red_no_selection_precheck, selectedScenarioIds, results, async () => {
                const fixture = await prepareCmykFixtureDocument(Runtime);
                const result = await evaluate(Runtime, `
                    (async function() {
                        return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                            id: 'recolor_selection_red_c0_m100_y100_k0',
                            payload: {}
                        });
                    })()
                `);
                const inspection = await runHostJson(Runtime,
                    '(function(){' +
                    'if(!app.documents.length){return JSON.stringify({ selectionCount: 0, pathCount: 0, textCount: 0 });}' +
                    'var doc = app.activeDocument;' +
                    'return JSON.stringify({ selectionCount: doc.selection ? doc.selection.length : 0, pathCount: doc.pathItems.length, textCount: doc.textFrames.length });' +
                    '})()'
                );
                const cleanup = await closeSmokeFixtureDocuments(Runtime);
    
                assert(!!fixture.documentName, `Failed to prepare recolor Red no-selection fixture: ${JSON.stringify(fixture)}`);
                assert(result && result.success === false, `Recolor Red should fail cleanly with no selection: ${JSON.stringify(result)}`);
                assert(result && result.errorCode === 'RECOLOR_SELECTION_NEEDS_SELECTION', `Recolor Red no-selection precheck should surface RECOLOR_SELECTION_NEEDS_SELECTION: ${JSON.stringify(result)}`);
                assert(inspection.selectionCount === 0, `Recolor Red no-selection precheck should leave selection empty: ${JSON.stringify(inspection)}`);
                assert(inspection.pathCount === 0 && inspection.textCount === 0, `Recolor Red no-selection precheck should not create artwork: ${JSON.stringify(inspection)}`);
                assert(cleanup.closedCount >= 1, `Recolor Red no-selection fixture cleanup failed: ${JSON.stringify(cleanup)}`);
            });
}

module.exports = { runRecolorSmokeSuite };
