const { PDFDocument, degrees } = require('pdf-lib');

async function createPdfFixture({ fs, os, path, tempOutputRoots }) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-place-all-pdf-'));
    const filePath = path.join(tempRoot, 'smoke-mixed-pages.pdf');
    const pdfDocument = await PDFDocument.create();
    const pages = [
        {
            pageNumber: 1,
            widthPt: 100,
            heightPt: 200,
            rotationDegrees: 0,
            mediaWidthPt: 140,
            mediaHeightPt: 240,
            trimBox: { x: 20, y: 20, width: 100, height: 200 }
        },
        {
            pageNumber: 2,
            widthPt: 120,
            heightPt: 300,
            rotationDegrees: 90,
            mediaWidthPt: 340,
            mediaHeightPt: 160,
            trimBox: { x: 20, y: 20, width: 300, height: 120 }
        },
        {
            pageNumber: 3,
            widthPt: 80,
            heightPt: 80,
            rotationDegrees: 0,
            mediaWidthPt: 110,
            mediaHeightPt: 120,
            trimBox: { x: 15, y: 20, width: 80, height: 80 }
        }
    ];

    for (const page of pages) {
        const pdfPage = pdfDocument.addPage([page.mediaWidthPt, page.mediaHeightPt]);
        pdfPage.setTrimBox(
            page.trimBox.x,
            page.trimBox.y,
            page.trimBox.width,
            page.trimBox.height
        );
        pdfPage.setRotation(degrees(page.rotationDegrees));
    }

    fs.writeFileSync(filePath, await pdfDocument.save());
    tempOutputRoots.push(tempRoot);

    return {
        filePath,
        normalizedPath: filePath.replace(/\\/g, '/'),
        pages
    };
}

async function createAiFixture(context, { pdfCompatible = true } = {}) {
    const {
        Runtime,
        fs,
        os,
        path,
        runHostJson,
        tempOutputRoots
    } = context;
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-place-all-ai-'));
    const filePath = path.join(
        tempRoot,
        pdfCompatible ? 'smoke-mixed-artboards.ai' : 'smoke-no-pdf-compatible.ai'
    );
    const normalizedPath = filePath.replace(/\\/g, '/');
    const artboards = [
        { pageNumber: 1, widthPt: 100, heightPt: 200, name: 'Front' },
        { pageNumber: 2, widthPt: 300, heightPt: 120, name: 'Back' },
        { pageNumber: 3, widthPt: 80, heightPt: 80, name: 'Draft' }
    ];
    const fixture = await runHostJson(Runtime,
        '(function(){' +
        `var outputFile = new File(${JSON.stringify(normalizedPath)});` +
        'var doc = app.documents.add(DocumentColorSpace.CMYK, 100, 200);' +
        'var rects = [[0,200,100,0],[150,200,450,80],[500,200,580,120]];' +
        'var names = ["Front","Back","Draft"];' +
        'var i;' +
        'var item;' +
        'var rect;' +
        'var color = new CMYKColor();' +
        'var options = new IllustratorSaveOptions();' +
        'color.black = 100;' +
        'for(i = 0; i < rects.length; i += 1){' +
        'if(i === 0){doc.artboards[0].artboardRect = rects[i];}' +
        'else{doc.artboards.add(rects[i]);}' +
        'doc.artboards[i].name = names[i];' +
        'rect = rects[i];' +
        'item = doc.pathItems.rectangle(' +
        'rect[1], rect[0], Math.abs(rect[2]-rect[0]), Math.abs(rect[1]-rect[3])' +
        ');' +
        'item.stroked = false;' +
        'item.filled = true;' +
        'item.fillColor = color;' +
        '}' +
        `options.pdfCompatible = ${pdfCompatible ? 'true' : 'false'};` +
        'doc.saveAs(outputFile, options);' +
        'doc.close(SaveOptions.DONOTSAVECHANGES);' +
        'return JSON.stringify({exists: outputFile.exists, path: outputFile.fsName});' +
        '})()'
    );

    if (!fixture || fixture.exists !== true) {
        throw new Error(`Unable to create AI smoke fixture: ${JSON.stringify(fixture)}`);
    }

    tempOutputRoots.push(tempRoot);
    return {
        filePath,
        normalizedPath,
        artboards
    };
}

async function runModuleCommand(Runtime, evaluate, payload) {
    return await evaluate(Runtime, `
        (async function() {
            return await window.__TOOLKIT_TEST_API__.getHostFacade().runCommand({
                id: 'place_all_pdf_pages',
                payload: ${JSON.stringify(payload)}
            });
        })()
    `);
}

async function prepareExistingDocument(context) {
    const { Runtime, prepareSelectionDocument, runHostJson } = context;
    const fixture = await prepareSelectionDocument(Runtime, false);
    const before = await runHostJson(Runtime,
        '(function(){' +
        'var doc = app.activeDocument;' +
        'if(doc.pathItems.length){doc.pathItems[0].name = "PLACE_ALL_PDF_EXISTING";}' +
        'return JSON.stringify({' +
        'documentName: doc.name,' +
        'artboardCount: doc.artboards.length,' +
        'placedItemCount: doc.placedItems.length,' +
        'existingPathCount: doc.pathItems.length' +
        '});' +
        '})()'
    );

    return { fixture, before };
}

async function inspectPlacement(context, options = {}) {
    const { Runtime, runHostJson } = context;
    const layerPrefix = options.layerPrefix || 'PDF Pages - smoke-mixed-pages';
    const artboardPrefix = options.artboardPrefix || 'PDF smoke-mixed-pages - Page ';
    const sourcePath = String(options.sourcePath || '').replace(/\\/g, '/').toLowerCase();

    return await runHostJson(Runtime,
        '(function(){' +
        'var doc = app.activeDocument;' +
        'var layer = null;' +
        'var linkedItems = [];' +
        'var artboards = [];' +
        'var existingPathFound = false;' +
        'var sourceOpen = false;' +
        'var i;' +
        'var item;' +
        'var rect;' +
        'for(i = 0; i < doc.layers.length; i += 1){' +
        `if(doc.layers[i].name.indexOf(${JSON.stringify(layerPrefix)}) === 0){layer = doc.layers[i]; break;}` +
        '}' +
        'for(i = 0; i < doc.placedItems.length; i += 1){' +
        'item = doc.placedItems[i];' +
        'if(layer && item.parent === layer){' +
        'rect = item.geometricBounds;' +
        'linkedItems.push({' +
        'name: item.name,' +
        'filePath: item.file ? item.file.fsName : "",' +
        'widthPt: Math.abs(rect[2] - rect[0]),' +
        'heightPt: Math.abs(rect[1] - rect[3])' +
        '});' +
        '}' +
        '}' +
        'for(i = 0; i < doc.artboards.length; i += 1){' +
        `if(doc.artboards[i].name.indexOf(${JSON.stringify(artboardPrefix)}) === 0){` +
        'rect = doc.artboards[i].artboardRect;' +
        'artboards.push({' +
        'index: i,' +
        'name: doc.artboards[i].name,' +
        'widthPt: Math.abs(rect[2] - rect[0]),' +
        'heightPt: Math.abs(rect[1] - rect[3])' +
        '});' +
        '}' +
        '}' +
        'for(i = 0; i < doc.pathItems.length; i += 1){' +
        'if(doc.pathItems[i].name === "PLACE_ALL_PDF_EXISTING"){existingPathFound = true; break;}' +
        '}' +
        (sourcePath
            ? 'for(i = 0; i < app.documents.length; i += 1){' +
                'try{' +
                `if(String(app.documents[i].fullName.fsName || "").replace(/\\\\/g,"/").toLowerCase() === ${JSON.stringify(sourcePath)}){sourceOpen = true; break;}` +
                '}catch(pathError){}' +
                '}'
            : '') +
        'linkedItems.sort(function(left, right){return left.name < right.name ? -1 : (left.name > right.name ? 1 : 0);});' +
        'return JSON.stringify({' +
        'artboardCount: doc.artboards.length,' +
        'placedItemCount: doc.placedItems.length,' +
        'layerName: layer ? layer.name : "",' +
        'linkedItems: linkedItems,' +
        'artboards: artboards,' +
        'activeArtboardIndex: doc.artboards.getActiveArtboardIndex(),' +
        'existingPathFound: existingPathFound,' +
        'sourceOpen: sourceOpen' +
        '});' +
        '})()'
    );
}

async function runPlaceAllPdfPagesSmokeSuite(context) {
    const {
        Runtime,
        scenarioLookup,
        selectedScenarioIds,
        results,
        tempOutputRoots,
        runSelectedScenario,
        assert,
        assertNear,
        evaluate,
        closeSmokeFixtureDocuments,
        fs,
        os,
        path
    } = context;

    await runSelectedScenario(
        scenarioLookup.place_all_pdf_pages_basic,
        selectedScenarioIds,
        results,
        async () => {
            const source = await createPdfFixture({ fs, os, path, tempOutputRoots });
            const setup = await prepareExistingDocument(context);
            const result = await runModuleCommand(Runtime, evaluate, {
                sourceType: 'pdf',
                sourcePath: source.normalizedPath,
                sourceName: 'smoke-mixed-pages',
                pageCount: source.pages.length,
                cropBox: 'trim',
                pages: source.pages
            });
            const inspection = await inspectPlacement(context);
            const cleanup = await closeSmokeFixtureDocuments(Runtime);

            assert(setup.before.artboardCount === 1, `Unexpected fixture artboard count: ${JSON.stringify(setup)}`);
            assert(result && result.success === true, `Place All PDF Pages should succeed: ${JSON.stringify(result)}`);
            assert(result.data && result.data.pageCount === 3, `Result page count mismatch: ${JSON.stringify(result)}`);
            assert(result.data && result.data.linkedItemCount === 3, `Result linked item count mismatch: ${JSON.stringify(result)}`);
            assert(result.data && result.data.artboardCountAdded === 3, `Result artboard count mismatch: ${JSON.stringify(result)}`);
            assert(inspection.artboardCount === setup.before.artboardCount + 3, `Artboards were not appended exactly once per page: ${JSON.stringify(inspection)}`);
            assert(inspection.linkedItems.length === 3, `Expected three linked PlacedItems: ${JSON.stringify(inspection)}`);
            assert(inspection.artboards.length === 3, `Expected three named PDF artboards: ${JSON.stringify(inspection)}`);
            assert(inspection.existingPathFound === true, `Existing artwork was mutated: ${JSON.stringify(inspection)}`);
            assert(inspection.activeArtboardIndex === result.data.firstArtboardIndex, `First imported artboard was not activated: ${JSON.stringify({ result, inspection })}`);

            for (let index = 0; index < source.pages.length; index += 1) {
                const expected = source.pages[index];
                const item = inspection.linkedItems[index];
                const artboard = inspection.artboards[index];

                assert(item.name === `Page ${String(index + 1).padStart(3, '0')}`, `Linked item order/name mismatch: ${JSON.stringify(inspection.linkedItems)}`);
                assert(item.filePath.replace(/\\/g, '/').toLowerCase() === source.normalizedPath.toLowerCase(), `Placed item is not linked to the source PDF: ${JSON.stringify(item)}`);
                assertNear(item.widthPt, expected.widthPt, 2, `Linked page ${index + 1} width mismatch`);
                assertNear(item.heightPt, expected.heightPt, 2, `Linked page ${index + 1} height mismatch`);
                assertNear(artboard.widthPt, expected.widthPt, 0.1, `Artboard ${index + 1} width mismatch`);
                assertNear(artboard.heightPt, expected.heightPt, 0.1, `Artboard ${index + 1} height mismatch`);
            }

            assert(cleanup.closedCount >= 1, `Place All PDF Pages fixture cleanup failed: ${JSON.stringify(cleanup)}`);
        }
    );

    await runSelectedScenario(
        scenarioLookup.place_all_ai_artboards_basic,
        selectedScenarioIds,
        results,
        async () => {
            const source = await createAiFixture(context);
            const setup = await prepareExistingDocument(context);
            const result = await runModuleCommand(Runtime, evaluate, {
                sourceType: 'ai',
                sourcePath: source.normalizedPath,
                sourceName: 'smoke-mixed-artboards'
            });
            const inspection = await inspectPlacement(context, {
                layerPrefix: 'AI Artboards - smoke-mixed-artboards',
                artboardPrefix: 'AI smoke-mixed-artboards - Artboard ',
                sourcePath: source.normalizedPath
            });
            const cleanup = await closeSmokeFixtureDocuments(Runtime);

            assert(result && result.success === true, `Place All Pages AI should succeed: ${JSON.stringify(result)}`);
            assert(result.data && result.data.sourceType === 'ai', `AI result source type mismatch: ${JSON.stringify(result)}`);
            assert(result.data && result.data.sourceUnitCount === 3, `AI result source count mismatch: ${JSON.stringify(result)}`);
            assert(inspection.artboardCount === setup.before.artboardCount + 3, `AI artboards were not appended exactly once: ${JSON.stringify(inspection)}`);
            assert(inspection.linkedItems.length === 3, `Expected three linked AI items: ${JSON.stringify(inspection)}`);
            assert(inspection.artboards.length === 3, `Expected three named AI artboards: ${JSON.stringify(inspection)}`);
            assert(inspection.existingPathFound === true, `Existing artwork was mutated by AI placement: ${JSON.stringify(inspection)}`);
            assert(inspection.sourceOpen === false, `AI source opened for inspection was not closed: ${JSON.stringify(inspection)}`);

            for (let index = 0; index < source.artboards.length; index += 1) {
                const expected = source.artboards[index];
                const item = inspection.linkedItems[index];
                const artboard = inspection.artboards[index];

                assert(item.name === `Artboard ${String(index + 1).padStart(3, '0')}`, `AI linked item order/name mismatch: ${JSON.stringify(inspection.linkedItems)}`);
                assert(item.filePath.replace(/\\/g, '/').toLowerCase() === source.normalizedPath.toLowerCase(), `Placed item is not linked to the source AI: ${JSON.stringify(item)}`);
                assertNear(item.widthPt, expected.widthPt, 2, `Linked AI artboard ${index + 1} width mismatch`);
                assertNear(item.heightPt, expected.heightPt, 2, `Linked AI artboard ${index + 1} height mismatch`);
                assertNear(artboard.widthPt, expected.widthPt, 0.1, `AI output artboard ${index + 1} width mismatch`);
                assertNear(artboard.heightPt, expected.heightPt, 0.1, `AI output artboard ${index + 1} height mismatch`);
            }

            assert(cleanup.closedCount >= 1, `Place All Pages AI fixture cleanup failed: ${JSON.stringify(cleanup)}`);
        }
    );

    await runSelectedScenario(
        scenarioLookup.place_all_ai_pdf_compatibility_fail,
        selectedScenarioIds,
        results,
        async () => {
            const source = await createAiFixture(context, { pdfCompatible: false });
            const setup = await prepareExistingDocument(context);
            const result = await runModuleCommand(Runtime, evaluate, {
                sourceType: 'ai',
                sourcePath: source.normalizedPath,
                sourceName: 'smoke-no-pdf-compatible'
            });
            const inspection = await inspectPlacement(context, {
                layerPrefix: 'AI Artboards - smoke-no-pdf-compatible',
                artboardPrefix: 'AI smoke-no-pdf-compatible - Artboard ',
                sourcePath: source.normalizedPath
            });
            const cleanup = await closeSmokeFixtureDocuments(Runtime);

            assert(result && result.success === false, `Non-compatible AI should fail: ${JSON.stringify(result)}`);
            assert(
                result.errorCode === 'PLACE_ALL_AI_PDF_COMPATIBILITY_REQUIRED',
                `Unexpected non-compatible AI error: ${JSON.stringify(result)}`
            );
            assert(inspection.artboardCount === setup.before.artboardCount, `AI failure rollback left artboards: ${JSON.stringify(inspection)}`);
            assert(inspection.linkedItems.length === 0 && inspection.layerName === '', `AI failure rollback left linked items or layer: ${JSON.stringify(inspection)}`);
            assert(inspection.existingPathFound === true, `AI failure rollback removed existing artwork: ${JSON.stringify(inspection)}`);
            assert(inspection.sourceOpen === false, `Non-compatible AI source was left open: ${JSON.stringify(inspection)}`);
            assert(cleanup.closedCount >= 1, `Non-compatible AI fixture cleanup failed: ${JSON.stringify(cleanup)}`);
        }
    );

    await runSelectedScenario(
        scenarioLookup.place_all_pdf_pages_rollback,
        selectedScenarioIds,
        results,
        async () => {
            const source = await createPdfFixture({ fs, os, path, tempOutputRoots });
            const setup = await prepareExistingDocument(context);
            const invalidPages = source.pages.map((page) => ({ ...page }));
            invalidPages[1].widthPt = 600;
            const result = await runModuleCommand(Runtime, evaluate, {
                sourceType: 'pdf',
                sourcePath: source.normalizedPath,
                sourceName: 'smoke-mixed-pages',
                pageCount: invalidPages.length,
                cropBox: 'trim',
                pages: invalidPages
            });
            const inspection = await inspectPlacement(context);
            const cleanup = await closeSmokeFixtureDocuments(Runtime);

            assert(result && result.success === false, `Forced placement mismatch should fail: ${JSON.stringify(result)}`);
            assert(result.errorCode === 'PLACE_ALL_PDF_PLACE_FAILED', `Unexpected rollback error code: ${JSON.stringify(result)}`);
            assert(inspection.artboardCount === setup.before.artboardCount, `Rollback left extra artboards: ${JSON.stringify(inspection)}`);
            assert(inspection.linkedItems.length === 0 && inspection.layerName === '', `Rollback left linked items or output layer: ${JSON.stringify(inspection)}`);
            assert(inspection.existingPathFound === true, `Rollback removed existing artwork: ${JSON.stringify(inspection)}`);
            assert(cleanup.closedCount >= 1, `Rollback fixture cleanup failed: ${JSON.stringify(cleanup)}`);
        }
    );

    await runSelectedScenario(
        scenarioLookup.place_all_pdf_pages_artboard_limit,
        selectedScenarioIds,
        results,
        async () => {
            const source = await createPdfFixture({ fs, os, path, tempOutputRoots });
            const setup = await prepareExistingDocument(context);
            const pages = [];

            for (let index = 0; index < 1000; index += 1) {
                pages.push({
                    pageNumber: index + 1,
                    widthPt: 100,
                    heightPt: 100,
                    rotationDegrees: 0
                });
            }

            const result = await runModuleCommand(Runtime, evaluate, {
                sourceType: 'pdf',
                sourcePath: source.normalizedPath,
                sourceName: 'smoke-mixed-pages',
                pageCount: pages.length,
                cropBox: 'trim',
                pages
            });
            const inspection = await inspectPlacement(context);
            const cleanup = await closeSmokeFixtureDocuments(Runtime);

            assert(result && result.errorCode === 'PLACE_ALL_PDF_ARTBOARD_LIMIT', `Artboard limit should block before mutation: ${JSON.stringify(result)}`);
            assert(inspection.artboardCount === setup.before.artboardCount, `Artboard limit precheck mutated the document: ${JSON.stringify(inspection)}`);
            assert(inspection.linkedItems.length === 0 && inspection.layerName === '', `Artboard limit precheck created output: ${JSON.stringify(inspection)}`);
            assert(inspection.existingPathFound === true, `Artboard limit precheck removed existing artwork: ${JSON.stringify(inspection)}`);
            assert(cleanup.closedCount >= 1, `Artboard limit fixture cleanup failed: ${JSON.stringify(cleanup)}`);
        }
    );
}

module.exports = { runPlaceAllPdfPagesSmokeSuite };
