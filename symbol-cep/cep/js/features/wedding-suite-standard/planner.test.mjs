import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildWeddingSuiteBuildRequest,
    buildWeddingSuitePlan,
    buildTimestampedWeddingSuiteStem,
    stripWeddingSuiteTimestampSuffix
} from './planner.js';

function createManifest(pageCount = 5) {
    const pages = [
        { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
        { pageNumber: 2, sourceIndex: 1, name: 'Info', widthMm: 150, heightMm: 100 },
        { pageNumber: 3, sourceIndex: 2, name: 'Moi 1', widthMm: 100, heightMm: 150 },
        { pageNumber: 4, sourceIndex: 3, name: 'Moi 2', widthMm: 150, heightMm: 100 },
        { pageNumber: 5, sourceIndex: 4, name: 'Moi 3', widthMm: 100, heightMm: 150 }
    ].slice(0, pageCount);

    return {
        success: true,
        sourcePath: 'C:/Inputs/source.pdf',
        sourceName: 'source.pdf',
        totalPages: pageCount,
        pages,
        lastPage: pages.length ? { ...pages[pages.length - 1] } : null
    };
}

function createManifestWithPages(pages) {
    return {
        success: true,
        sourcePath: 'C:/Inputs/source.pdf',
        sourceName: 'source.pdf',
        totalPages: pages.length,
        pages,
        lastPage: pages.length ? { ...pages[pages.length - 1] } : null
    };
}

function createSevenPagePairManifest() {
    return createManifestWithPages([
        { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
        { pageNumber: 2, sourceIndex: 1, name: 'To bao 1', widthMm: 150, heightMm: 100 },
        { pageNumber: 3, sourceIndex: 2, name: 'Moi 1', widthMm: 100, heightMm: 150 },
        { pageNumber: 4, sourceIndex: 3, name: 'To bao 2', widthMm: 150, heightMm: 100 },
        { pageNumber: 5, sourceIndex: 4, name: 'Moi 2', widthMm: 100, heightMm: 150 },
        { pageNumber: 6, sourceIndex: 5, name: 'To bao 3', widthMm: 150, heightMm: 100 },
        { pageNumber: 7, sourceIndex: 6, name: 'Moi 3', widthMm: 100, heightMm: 150 }
    ]);
}

function createValidState(overrides = {}) {
    return {
        sourcePath: 'C:/Inputs/source.pdf',
        manifest: createManifest(5),
        paperStock: 'anh_kim_483x320',
        envelopeCount: 1,
        infoCount: 3,
        invitePages: [
            { pageNumber: 3, label: 'Thiệp A', quantity: 4 },
            { pageNumber: 4, label: 'Thiệp B', quantity: 2 },
            { pageNumber: 5, label: '', quantity: 0 }
        ],
        outputDirectory: 'C:/Output',
        filenameStem: '',
        ...overrides
    };
}

test('buildWeddingSuitePlan maps fixed pages and ignores pages after page 5', () => {
    const state = createValidState({
        manifest: {
            ...createManifest(7),
            pages: [
                ...createManifest(5).pages,
                { pageNumber: 6, sourceIndex: 5, name: 'Draft 1', widthMm: 100, heightMm: 150 },
                { pageNumber: 7, sourceIndex: 6, name: 'Draft 2', widthMm: 100, heightMm: 150 }
            ],
            lastPage: { pageNumber: 7, sourceIndex: 6, name: 'Draft 2', widthMm: 100, heightMm: 150 }
        }
    });
    const plan = buildWeddingSuitePlan(state);

    assert.equal(plan.valid, true);
    assert.equal(plan.usableWidthMm, 473);
    assert.equal(plan.usableHeightMm, 310);
    assert.equal(plan.sourcePages.envelope.pageNumber, 1);
    assert.equal(plan.sourcePages.info.pageNumber, 2);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.pageNumber), [3, 4, 5]);
    assert.equal(plan.productionSheets.length, 2);
    assert.equal(plan.qaPreviewPages.length, 3);
    assert.equal(plan.qaArtboard.widthMm, 246.5);
    assert.equal(plan.qaArtboard.heightMm, 332);
});

test('buildWeddingSuitePlan keeps only the invite pages that actually exist in a 4-page source PDF', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        manifest: createManifest(4),
        invitePages: [
            { pageNumber: 3, label: 'Thiệp A', quantity: 4 },
            { pageNumber: 4, label: 'Thiệp B', quantity: 2 },
            { pageNumber: 5, label: 'Thiệp C', quantity: 9 }
        ]
    }));

    assert.equal(plan.valid, true);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.pageNumber), [3, 4]);
    assert.equal(plan.productionSheets.length, 2);
    assert.deepEqual(
        plan.qaPreviewPages.map((page) => page.label),
        ['To bao / info x3', 'Thiệp A x4', 'Thiệp B x2']
    );
});

test('buildWeddingSuitePlan can pair info and invite pages in sequence', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        pairInfoInvitePages: true,
        manifest: createSevenPagePairManifest(),
        invitePages: [],
        jobQuantity: 2
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.pairInfoInvitePages, true);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.pageNumber), [3, 5, 7]);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.infoPage.pageNumber), [2, 4, 6]);
    assert.deepEqual(plan.productionSheets.map((sheet) => sheet.topPage.sourceIndex), [1, 3, 5]);
    assert.deepEqual(plan.productionSheets.map((sheet) => sheet.bottomPage.sourceIndex), [2, 4, 6]);
    assert.equal(plan.qaPreviewPages.length, 6);
    assert.equal(plan.qaNotes.some((entry) => entry.includes('cac to thiep bao')), false);
});

test('buildWeddingSuitePlan can impose one-page full-suite designs as 2x2 sheets', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        combinedInfoInvitePage: true,
        manifest: createManifestWithPages([
            { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
            { pageNumber: 2, sourceIndex: 1, name: 'Bo ngay 1', widthMm: 300, heightMm: 150 },
            { pageNumber: 3, sourceIndex: 2, name: 'Bo ngay 2', widthMm: 300, heightMm: 150 },
            { pageNumber: 4, sourceIndex: 3, name: 'Bo ngay 3', widthMm: 300, heightMm: 150 }
        ]),
        invitePages: [],
        jobQuantity: 2
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.combinedInfoInvitePage, true);
    assert.equal(plan.pairInfoInvitePages, false);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.pageNumber), [2, 3, 4]);
    assert.deepEqual(plan.productionSheets.map((sheet) => sheet.layoutMode), [
        'single_page_suite_2x2',
        'single_page_suite_2x2',
        'single_page_suite_2x2'
    ]);
    assert.deepEqual(plan.productionSheets.map((sheet) => sheet.sourcePage.sourceIndex), [1, 2, 3]);
    assert.deepEqual(plan.productionSheets.map((sheet) => sheet.sourcePage.shouldRotate90), [false, false, false]);
    assert.equal(plan.productionSheets[0].topPage, undefined);
    assert.equal(plan.productionSheets[0].bottomPage, undefined);
    assert.equal(plan.qaPreviewPages.length, 3);
    assert.deepEqual(plan.qaPreviewPages.map((page) => page.kind), ['suite', 'suite', 'suite']);
    assert.deepEqual(plan.qaPreviewPages.map((page) => page.shouldRotate90), [false, false, false]);
    assert.equal(plan.qaNotes.some((entry) => entry.includes('cac to thiep bao')), false);
    assert.ok(plan.qaNotes.some((entry) => entry.includes('gom thiep bao')));
});

test('buildWeddingSuitePlan rejects pair mode when the last pair is incomplete', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        pairInfoInvitePages: true,
        manifest: createManifest(4),
        invitePages: [],
        jobQuantity: 1
    }));

    assert.equal(plan.valid, false);
    assert.ok(plan.errors.some((entry) => entry.includes('thieu page thiep moi')));
});

test('buildWeddingSuitePlan turns a 2-page source into the single-card 8-up variant', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        manifest: createManifest(2),
        invitePages: []
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.workflowVariant, 'single_card_8up');
    assert.deepEqual(plan.sourcePages.invites, []);
    assert.equal(plan.qaPreviewPages.length, 1);
    assert.equal(plan.qaPreviewPages[0].label, 'Thiep x3');
    assert.deepEqual(plan.qaNotes, ['CHU Y: 8 con / 1 to']);
    assert.equal(plan.productionSheets.length, 1);
    assert.equal(plan.productionSheets[0].layoutMode, 'single_card_8up');
    assert.equal(plan.productionSheets[0].topPage.sourceIndex, 1);
    assert.equal(plan.productionSheets[0].bottomPage.sourceIndex, 1);
    assert.equal(plan.artboards.length, 3);
});

test('buildWeddingSuitePlan treats the last page as draft when hasDraftCard is enabled', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        hasDraftCard: true,
        manifest: {
            ...createManifest(4),
            lastPage: { pageNumber: 4, sourceIndex: 3, name: 'An nhap', widthMm: 60, heightMm: 90 }
        },
        invitePages: [
            { pageNumber: 3, label: 'Thiệp A', quantity: 4 },
            { pageNumber: 4, label: 'An nhap', quantity: 2 }
        ]
    }));

    assert.equal(plan.valid, true);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.pageNumber), [3]);
    assert.equal(plan.sourcePages.draft.pageNumber, 4);
    assert.equal(plan.qaPreviewPages.length, 3);
    assert.equal(plan.qaPreviewPages[2].kind, 'draft');
    assert.equal(plan.qaPreviewPages[2].widthMm, 60);
    assert.equal(plan.qaPreviewPages[2].heightMm, 90);
    assert.equal(plan.draftArtboard.artboardName, 'Thiep an nhap');
    assert.equal(plan.draftArtboard.widthMm, 60);
    assert.equal(plan.draftArtboard.heightMm, 90);
    assert.equal(plan.artboards[plan.artboards.length - 1].kind, 'draft');
    assert.ok(plan.qaNotes.includes('Co them 1 artboard thiep an nhap.'));
});

test('buildWeddingSuitePlan supports multiple distinct trailing draft pages', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        hasDraftCard: true,
        draftCardCount: 2,
        manifest: createManifestWithPages([
            { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
            { pageNumber: 2, sourceIndex: 1, name: 'Info', widthMm: 150, heightMm: 100 },
            { pageNumber: 3, sourceIndex: 2, name: 'Moi 1', widthMm: 100, heightMm: 150 },
            { pageNumber: 4, sourceIndex: 3, name: 'Moi 2', widthMm: 150, heightMm: 100 },
            { pageNumber: 5, sourceIndex: 4, name: 'An nhap ngay 1', widthMm: 60, heightMm: 90 },
            { pageNumber: 6, sourceIndex: 5, name: 'An nhap ngay 2', widthMm: 70, heightMm: 95 }
        ]),
        invitePages: [
            { pageNumber: 3, label: 'Thiệp A', quantity: 4 },
            { pageNumber: 4, label: 'Thiệp B', quantity: 2 },
            { pageNumber: 5, label: 'An nhap ngay 1', quantity: 9 }
        ]
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.draftCardCount, 2);
    assert.deepEqual(plan.sourcePages.invites.map((page) => page.pageNumber), [3, 4]);
    assert.deepEqual(plan.sourcePages.drafts.map((page) => page.pageNumber), [5, 6]);
    assert.deepEqual(plan.draftArtboards.map((artboard) => artboard.sourceIndex), [4, 5]);
    assert.deepEqual(plan.draftArtboards.map((artboard) => artboard.widthMm), [60, 70]);
    assert.deepEqual(plan.artboards.slice(-2).map((artboard) => artboard.name), ['Thiep an nhap 1', 'Thiep an nhap 2']);
    assert.deepEqual(
        plan.qaPreviewPages.filter((page) => page.kind === 'draft').map((page) => page.widthMm),
        [60, 70]
    );
    assert.ok(plan.qaNotes.includes('Co them 2 artboard thiep an nhap.'));
});

test('buildWeddingSuitePlan blocks draft mode when no invite page remains before the last page', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        hasDraftCard: true,
        manifest: {
            ...createManifest(4),
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Info', widthMm: 150, heightMm: 100 },
                { pageNumber: 4, sourceIndex: 3, name: 'An nhap', widthMm: 60, heightMm: 90 }
            ],
            lastPage: { pageNumber: 4, sourceIndex: 3, name: 'An nhap', widthMm: 60, heightMm: 90 }
        },
        invitePages: []
    }));

    assert.equal(plan.valid, false);
    assert.ok(plan.errors.some((entry) => entry.includes('Thiep an nhap')));
});

test('buildWeddingSuitePlan marks landscape info and invite pages for 90-degree rotation', () => {
    const plan = buildWeddingSuitePlan(createValidState());

    assert.equal(plan.sourcePages.info.widthMm > plan.sourcePages.info.heightMm, true);
    assert.equal(plan.productionSheets[0].topPage.shouldRotate90, true);
    assert.equal(plan.productionSheets[1].bottomPage.shouldRotate90, true);
    assert.equal(plan.productionSheets[0].bottomPage.shouldRotate90, false);
});

test('buildWeddingSuitePlan auto-fills invite labels from source pages', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        invitePages: [
            { pageNumber: 3, label: '', quantity: 1 }
        ]
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.sourcePages.invites[0].label, 'Moi 1');
});

test('buildWeddingSuitePlan uses one quantity for envelope, info, and invite pages', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        jobQuantity: 7,
        invitePages: []
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.counts.envelope, 7);
    assert.equal(plan.counts.info, 7);
    assert.equal(plan.sourcePages.invites[0].quantity, 7);
    assert.equal(plan.productionSheets.length, 3);
});

test('buildWeddingSuitePlan keeps F180 usable area from the paper stock catalog', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        paperStock: 'f180_480x330'
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.paperStock.label, 'F180 480 x 320');
    assert.equal(plan.usableWidthMm, 470);
    assert.equal(plan.usableHeightMm, 310);
    assert.equal(plan.qaArtboard.widthMm, 245);
    assert.equal(plan.qaArtboard.heightMm, 332);
    assert.equal(plan.productionSheets[0].widthMm, 480);
    assert.equal(plan.productionSheets[0].heightMm, 320);
});

test('buildWeddingSuitePlan can use an injected paper stock catalog without code changes', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        paperStock: 'operator_stock',
        paperStockCatalog: {
            defaultStockId: 'operator_stock',
            stocks: [
                {
                    id: 'operator_stock',
                    label: 'Operator Stock 300 x 500',
                    widthMm: 300,
                    heightMm: 500
                }
            ]
        }
    }));

    assert.equal(plan.valid, true);
    assert.equal(plan.paperStock.label, 'Operator Stock 300 x 500');
    assert.equal(plan.usableWidthMm, 290);
    assert.equal(plan.usableHeightMm, 490);
    assert.equal(plan.productionSheets[0].widthMm, 300);
    assert.equal(plan.productionSheets[0].heightMm, 500);
});

test('buildWeddingSuitePlan requires a positive quantity for the fixed workflow', () => {
    const plan = buildWeddingSuitePlan(createValidState({
        invitePages: [
            { pageNumber: 3, label: 'Thiệp A', quantity: 0 },
            { pageNumber: 4, label: 'Thiệp B', quantity: 0 },
            { pageNumber: 5, label: 'Thiệp C', quantity: 0 }
        ]
    }));

    assert.equal(plan.valid, false);
    assert.ok(plan.errors.some((entry) => entry.includes('so luong')));
});

test('stripWeddingSuiteTimestampSuffix removes the generated timestamp tail only', () => {
    assert.equal(stripWeddingSuiteTimestampSuffix("bai in source_15'55 3 6"), 'bai in source');
    assert.equal(stripWeddingSuiteTimestampSuffix("bai in source_15'55 3 6.pdf"), 'bai in source');
    assert.equal(stripWeddingSuiteTimestampSuffix('bai in source'), 'bai in source');
});

test('buildTimestampedWeddingSuiteStem appends the current timestamp without stacking old timestamps', () => {
    const stem = buildTimestampedWeddingSuiteStem("bai in source_15'55 3 6", {
        now() {
            return new Date(2026, 5, 3, 16, 5, 0, 0);
        }
    });

    assert.equal(stem, "bai in source_16'05 3 6");
});

test('buildWeddingSuiteBuildRequest defaults filename stem to timestamped info', () => {
    const request = buildWeddingSuiteBuildRequest(createValidState({ filenameStem: '   ' }), {
        now() {
            return new Date(2026, 3, 10, 9, 8, 7, 6);
        }
    });

    assert.equal(request.output.filenameStem, "info_9'08 10 4");
    assert.equal(request.output.baseFilenameStem, 'info');
    assert.equal(request.output.previousOutputPath, 'C:/Output/info.pdf');
    assert.equal(request.output.directory, 'C:/Output');
    assert.equal(request.sourcePath, 'C:/Inputs/source.pdf');
    assert.equal(request.templatePath, '');
});

test('buildWeddingSuiteBuildRequest carries previous output path for overwrite cleanup', () => {
    const request = buildWeddingSuiteBuildRequest(createValidState({
        filenameStem: "bai in source_15'55 3 6",
        lastOutputPath: "C:/Output/bai in source_15'55 3 6.pdf"
    }), {
        now() {
            return new Date(2026, 5, 3, 16, 5, 0, 0);
        }
    });

    assert.equal(request.output.filenameStem, "bai in source_16'05 3 6");
    assert.equal(request.output.baseFilenameStem, 'bai in source');
    assert.equal(request.output.previousOutputPath, "C:/Output/bai in source_15'55 3 6.pdf");
});

test('buildWeddingSuiteBuildRequest carries the optional template path into the host request', () => {
    const request = buildWeddingSuiteBuildRequest(createValidState(), {
        templatePath: 'C:/Projects/adobe-illustrator-extensions/symbol-cep/wedding suite print template.ai'
    });

    assert.equal(
        request.templatePath,
        'C:/Projects/adobe-illustrator-extensions/symbol-cep/wedding suite print template.ai'
    );
});
