const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const moduleRoot = path.resolve(__dirname, '..', 'modules', 'place_all_pdf_pages');

function readModuleFile(relativePath) {
    return fs.readFileSync(path.join(moduleRoot, relativePath), 'utf8');
}

test('Place All PDF Pages host files remain ES3-compatible', () => {
    const jsxFiles = [
        'run.jsx',
        'internal/request.jsx',
        'internal/ai_source.jsx',
        'internal/layout.jsx',
        'internal/placement.jsx',
        'internal/result.jsx'
    ];

    for (const relativePath of jsxFiles) {
        const source = readModuleFile(relativePath);
        assert.doesNotMatch(source, /\b(?:const|let)\b/);
        assert.doesNotMatch(source, /=>|\?\.|\?\?|\.\.\./);
    }
});

test('Place All Pages inspects AI artboards without closing an already-open source', () => {
    const namespace = {};
    const targetDoc = {
        fullName: { fsName: 'C:/target/target.ai' },
        activate() {}
    };
    const sourceDoc = {
        fullName: { fsName: 'C:/source/source.ai' },
        saved: true,
        artboards: [
            { name: 'Front', artboardRect: [0, 300, 200, 0] },
            { name: 'Back', artboardRect: [250, 400, 350, 200] }
        ],
        close() {
            throw new Error('already-open source must not be closed');
        }
    };
    const context = {
        Math,
        Error,
        SaveOptions: { DONOTSAVECHANGES: 'DONOTSAVECHANGES' },
        UserInteractionLevel: { DONTDISPLAYALERTS: 'DONTDISPLAYALERTS' },
        app: {
            activeDocument: targetDoc,
            documents: [targetDoc, sourceDoc],
            userInteractionLevel: 'DISPLAYALERTS',
            open() {
                throw new Error('already-open source must not be opened again');
            }
        },
        $: {
            global: {
                __TOOLKIT_PLACE_ALL_PDF_PAGES__: namespace
            }
        }
    };

    vm.runInNewContext(readModuleFile('internal/request.jsx'), context);
    vm.runInNewContext(readModuleFile('internal/ai_source.jsx'), context);

    const pages = namespace.inspectAiArtboards(
        { fsName: 'C:/source/source.ai' },
        targetDoc
    );

    assert.deepEqual(JSON.parse(JSON.stringify(pages)), [
        {
            pageNumber: 1,
            widthPt: 200,
            heightPt: 300,
            rotationDegrees: 0,
            sourceLabel: 'Front'
        },
        {
            pageNumber: 2,
            widthPt: 100,
            heightPt: 200,
            rotationDegrees: 0,
            sourceLabel: 'Back'
        }
    ]);
});

test('Place All Pages rejects self-linked and unsaved open AI sources', () => {
    const namespace = {};
    const targetDoc = {
        fullName: { fsName: 'C:/target/target.ai' },
        saved: true,
        artboards: [{ name: 'Target', artboardRect: [0, 100, 100, 0] }],
        activate() {}
    };
    const unsavedSource = {
        fullName: { fsName: 'C:/source/source.ai' },
        saved: false,
        artboards: [{ name: 'Source', artboardRect: [0, 100, 100, 0] }]
    };
    const context = {
        Math,
        Error,
        SaveOptions: { DONOTSAVECHANGES: 'DONOTSAVECHANGES' },
        UserInteractionLevel: { DONTDISPLAYALERTS: 'DONTDISPLAYALERTS' },
        app: {
            activeDocument: targetDoc,
            documents: [targetDoc, unsavedSource],
            userInteractionLevel: 'DISPLAYALERTS'
        },
        $: {
            global: {
                __TOOLKIT_PLACE_ALL_PDF_PAGES__: namespace
            }
        }
    };

    vm.runInNewContext(readModuleFile('internal/request.jsx'), context);
    vm.runInNewContext(readModuleFile('internal/ai_source.jsx'), context);

    assert.throws(
        () => namespace.inspectAiArtboards(
            { fsName: 'C:/target/target.ai' },
            targetDoc
        ),
        (error) => error.placeAllPdfErrorCode === 'PLACE_ALL_AI_SAME_AS_TARGET'
    );
    assert.throws(
        () => namespace.inspectAiArtboards(
            { fsName: 'C:/source/source.ai' },
            targetDoc
        ),
        (error) => error.placeAllPdfErrorCode === 'PLACE_ALL_AI_SOURCE_UNSAVED'
    );
});

test('Place All Pages closes AI sources opened only for inspection and restores the target', () => {
    const namespace = {};
    let closeCount = 0;
    let activateCount = 0;
    const targetDoc = {
        fullName: { fsName: 'C:/target/target.ai' },
        activate() {
            activateCount += 1;
        }
    };
    const sourceDoc = {
        fullName: { fsName: 'C:/source/source.ai' },
        saved: true,
        artboards: [
            { name: 'Only', artboardRect: [0, 200, 100, 0] }
        ],
        close(saveOption) {
            assert.equal(saveOption, 'DONOTSAVECHANGES');
            closeCount += 1;
        }
    };
    const context = {
        Math,
        Error,
        SaveOptions: { DONOTSAVECHANGES: 'DONOTSAVECHANGES' },
        UserInteractionLevel: { DONTDISPLAYALERTS: 'DONTDISPLAYALERTS' },
        app: {
            activeDocument: targetDoc,
            documents: [targetDoc],
            userInteractionLevel: 'DISPLAYALERTS',
            open() {
                return sourceDoc;
            }
        },
        $: {
            global: {
                __TOOLKIT_PLACE_ALL_PDF_PAGES__: namespace
            }
        }
    };

    vm.runInNewContext(readModuleFile('internal/request.jsx'), context);
    vm.runInNewContext(readModuleFile('internal/ai_source.jsx'), context);

    const pages = namespace.inspectAiArtboards(
        { fsName: 'C:/source/source.ai' },
        targetDoc
    );

    assert.equal(pages.length, 1);
    assert.equal(closeCount, 1);
    assert.equal(activateCount, 1);
    assert.equal(context.app.userInteractionLevel, 'DISPLAYALERTS');
});

test('Place All PDF Pages layout preserves each page size below existing artboards', () => {
    const namespace = {
        artboardGap: 20
    };
    const context = {
        Math,
        $: {
            global: {
                __TOOLKIT_PLACE_ALL_PDF_PAGES__: namespace
            }
        }
    };
    const doc = {
        artboards: [
            { artboardRect: [0, 500, 100, 400] },
            { artboardRect: [200, 500, 300, 400] }
        ]
    };
    const pages = [
        { pageNumber: 1, widthPt: 100, heightPt: 200 },
        { pageNumber: 2, widthPt: 300, heightPt: 120 },
        { pageNumber: 3, widthPt: 80, heightPt: 80 }
    ];

    vm.runInNewContext(readModuleFile('internal/layout.jsx'), context);
    const layout = namespace.buildPlacements(doc, pages);

    assert.equal(layout.columnCount, 2);
    assert.equal(layout.rowCount, 2);
    assert.deepEqual(
        JSON.parse(JSON.stringify(layout.placements.map((placement) => Array.from(placement.rect)))),
        [
            [0, 380, 100, 180],
            [120, 380, 420, 260],
            [0, 160, 80, 80]
        ]
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(layout.placements.map((placement) => [
            placement.rect[2] - placement.rect[0],
            placement.rect[1] - placement.rect[3]
        ]))),
        pages.map((page) => [page.widthPt, page.heightPt])
    );
});

test('Place All PDF Pages applies PDF page rotation clockwise before validating size', () => {
    const namespace = {
        pageItemPrefix: 'Page '
    };
    const context = {
        Math,
        ElementPlacement: {
            PLACEATEND: 'PLACEATEND'
        },
        PDFBoxType: {},
        app: {
            preferences: {}
        },
        $: {
            global: {
                __TOOLKIT_PLACE_ALL_PDF_PAGES__: namespace
            }
        }
    };
    const calls = [];
    const item = {
        geometricBounds: [0, 120, 300, 0],
        rotate(angle) {
            calls.push(['rotate', angle]);
            this.geometricBounds = [0, 300, 120, 0];
        },
        translate(deltaX, deltaY) {
            calls.push(['translate', deltaX, deltaY]);
        },
        move(layer, placement) {
            calls.push(['move', layer.name, placement]);
        }
    };
    const doc = {
        placedItems: {
            add() {
                return item;
            }
        }
    };
    const layer = { name: 'PDF Pages' };
    const page = {
        pageNumber: 2,
        widthPt: 120,
        heightPt: 300,
        rotationDegrees: 90
    };

    vm.runInNewContext(readModuleFile('internal/placement.jsx'), context);
    namespace.snapshotPdfOptions = () => ({});
    namespace.setPdfPageOptions = () => {};
    namespace.restorePdfOptions = () => {
        calls.push(['restore']);
    };

    const placed = namespace.placePage(doc, layer, {
        sourceFile: { fsName: 'fixture.pdf' },
        sourceType: 'pdf'
    }, {
        page,
        contentRect: [10, 400, 130, 100]
    });

    assert.equal(placed, item);
    assert.deepEqual(calls[0], ['rotate', -90]);
    assert.deepEqual(calls.at(-2), ['move', 'PDF Pages', 'PLACEATEND']);
    assert.deepEqual(calls.at(-1), ['restore']);
});
