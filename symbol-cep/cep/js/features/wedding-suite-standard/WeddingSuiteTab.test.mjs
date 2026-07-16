import test from 'node:test';
import assert from 'node:assert/strict';

import { UIFeedback } from '@shared/cep-ui';
import { WeddingSuiteTab } from './WeddingSuiteTab.js';

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalShowToast = UIFeedback.showToast;
const originalToastQueue = UIFeedback._toastQueue;
const originalIsShowingToast = UIFeedback._isShowingToast;

function createStorage() {
    const data = new Map();
    return {
        getItem(key) {
            return data.has(key) ? data.get(key) : null;
        },
        setItem(key, value) {
            data.set(key, String(value));
        },
        removeItem(key) {
            data.delete(key);
        }
    };
}

function installTestGlobals() {
    globalThis.window = {
        localStorage: createStorage()
    };
    globalThis.document = {
        getElementById() {
            return null;
        }
    };
}

function createPairManifest() {
    return {
        success: true,
        sourcePath: 'C:/Inputs/pair-fixture.pdf',
        sourceName: 'pair-fixture.pdf',
        totalPages: 7,
        pages: [
            { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
            { pageNumber: 2, sourceIndex: 1, name: 'To bao 1', widthMm: 150, heightMm: 100 },
            { pageNumber: 3, sourceIndex: 2, name: 'Thiep moi 1', widthMm: 100, heightMm: 150 },
            { pageNumber: 4, sourceIndex: 3, name: 'To bao 2', widthMm: 150, heightMm: 100 },
            { pageNumber: 5, sourceIndex: 4, name: 'Thiep moi 2', widthMm: 100, heightMm: 150 },
            { pageNumber: 6, sourceIndex: 5, name: 'To bao 3', widthMm: 150, heightMm: 100 },
            { pageNumber: 7, sourceIndex: 6, name: 'Thiep moi 3', widthMm: 100, heightMm: 150 }
        ],
        lastPage: { pageNumber: 7, sourceIndex: 6, name: 'Thiep moi 3', widthMm: 100, heightMm: 150 }
    };
}

test.afterEach(() => {
    UIFeedback.showToast = originalShowToast;
    UIFeedback._toastQueue = originalToastQueue;
    UIFeedback._isShowingToast = originalIsShowingToast;

    if (typeof originalWindow === 'undefined') {
        delete globalThis.window;
    } else {
        globalThis.window = originalWindow;
    }

    if (typeof originalDocument === 'undefined') {
        delete globalThis.document;
    } else {
        globalThis.document = originalDocument;
    }
});

test('pair mode checkbox syncs invite rows to paired info/invite pages', () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.container = { innerHTML: '' };
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/pair-fixture.pdf',
        manifest: createPairManifest(),
        invitePages: [
            { pageNumber: 3, label: 'Cap 1', quantity: 2 },
            { pageNumber: 5, label: 'Cap 2', quantity: 4 }
        ]
    };

    suiteTab._handleFieldChange({
        target: {
            name: 'pairInfoInvitePages',
            checked: true,
            value: 'on'
        }
    });

    assert.equal(suiteTab.state.pairInfoInvitePages, true);
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.pageNumber),
        [3, 5, 7]
    );
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.infoPageNumber),
        [2, 4, 6]
    );
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.quantity),
        [2, 4, 0]
    );
    assert.match(suiteTab.container.innerHTML, /name="pairInfoInvitePages" checked/);
    assert.match(suiteTab.container.innerHTML, /page 2-3/);
});

test('single-page full-suite checkbox syncs rows from page 2 and disables paired-page mode', () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.container = { innerHTML: '' };
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/full-suite-fixture.pdf',
        manifest: createPairManifest(),
        pairInfoInvitePages: true,
        invitePages: [
            { pageNumber: 3, label: 'Cap cu', quantity: 2 }
        ]
    };

    suiteTab._handleFieldChange({
        target: {
            name: 'combinedInfoInvitePage',
            checked: true,
            value: 'on'
        }
    });

    assert.equal(suiteTab.state.combinedInfoInvitePage, true);
    assert.equal(suiteTab.state.pairInfoInvitePages, false);
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.pageNumber),
        [2, 3, 4, 5, 6, 7]
    );
    assert.equal(suiteTab.state.invitePages[0].combinedInfoInvitePage, true);
    assert.match(suiteTab.container.innerHTML, /name="combinedInfoInvitePage" checked/);
    assert.match(suiteTab.container.innerHTML, /1 page du bo/);
});

test('refreshSourceManifest uses the panel PDF scanner for PDF sources and does not call host inspect', async () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    let hostInspectCalls = 0;
    let scannerCalls = 0;

    suiteTab.setHostAdapterForTest({
        async inspectSource() {
            hostInspectCalls += 1;
            return {
                success: true
            };
        }
    });
    suiteTab.setPdfScannerForTest(async (sourcePath) => {
        scannerCalls += 1;
        return {
            success: true,
            sourcePath,
            sourceName: 'fixture.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 },
                { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 150, heightMm: 100 }
            ],
            lastPage: { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 150, heightMm: 100 }
        };
    });

    suiteTab.state.sourcePath = 'C:/Inputs/fixture.pdf';
    await suiteTab.refreshSourceManifest();

    assert.equal(scannerCalls, 1);
    assert.equal(hostInspectCalls, 0);
    assert.equal(suiteTab.state.manifest.totalPages, 4);
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.pageNumber),
        [3, 4]
    );
});

test('refreshSourceManifest auto-checks the draft card when the last page is smaller than half of the previous page', async () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);

    suiteTab.setPdfScannerForTest(async (sourcePath) => ({
        success: true,
        sourcePath,
        sourceName: 'draft-fixture.pdf',
        totalPages: 4,
        pages: [
            { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
            { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
            { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 },
            { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 60, heightMm: 90 }
        ],
        lastPage: { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 60, heightMm: 90 }
    }));

    suiteTab.state.sourcePath = 'C:/Inputs/draft-fixture.pdf';
    await suiteTab.refreshSourceManifest();

    assert.equal(suiteTab.state.hasDraftCard, true);
    assert.equal(suiteTab.state.draftCardDetectionMode, 'auto');
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.pageNumber),
        [3]
    );
});

test('manual draft-card override wins over auto-detection on the next manifest refresh', async () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    const manifest = {
        success: true,
        sourcePath: 'C:/Inputs/draft-fixture.pdf',
        sourceName: 'draft-fixture.pdf',
        totalPages: 4,
        pages: [
            { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
            { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
            { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 },
            { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 60, heightMm: 90 }
        ],
        lastPage: { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 60, heightMm: 90 }
    };

    suiteTab.setPdfScannerForTest(async () => manifest);
    suiteTab.state.sourcePath = 'C:/Inputs/draft-fixture.pdf';

    await suiteTab.refreshSourceManifest();
    suiteTab._handleFieldChange({
        target: {
            name: 'hasDraftCard',
            checked: false,
            value: 'off'
        }
    });
    await suiteTab.refreshSourceManifest();

    assert.equal(suiteTab.state.hasDraftCard, false);
    assert.equal(suiteTab.state.draftCardDetectionMode, 'manual');
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.pageNumber),
        [3, 4]
    );
});

test('render keeps the draft checkbox visible for a regular-sized last page so users can enable it manually', () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.container = { innerHTML: '' };
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/manual-draft.pdf',
        manifest: {
            success: true,
            sourcePath: 'C:/Inputs/manual-draft.pdf',
            sourceName: 'manual-draft.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 },
                { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 100, heightMm: 150 }
            ],
            lastPage: { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 100, heightMm: 150 }
        },
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 },
            { pageNumber: 4, sourceIndex: 3, sourceName: 'Page 4', widthMm: 100, heightMm: 150, label: 'Thiep 2', quantity: 1 }
        ],
        hasDraftCard: false
    };

    suiteTab.render();

    assert.match(suiteTab.container.innerHTML, /name="hasDraftCard"/);
    assert.doesNotMatch(suiteTab.container.innerHTML, /name="hasDraftCard" checked/);
    assert.match(suiteTab.container.innerHTML, /name="draftCardCount"/);
    assert.match(suiteTab.container.innerHTML, /value="1" disabled/);
});

test('draft page count input trims invite rows before multiple trailing draft pages', () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.container = { innerHTML: '' };
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/multi-draft.pdf',
        manifest: {
            success: true,
            sourcePath: 'C:/Inputs/multi-draft.pdf',
            sourceName: 'multi-draft.pdf',
            totalPages: 6,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 },
                { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 100, heightMm: 150 },
                { pageNumber: 5, sourceIndex: 4, name: 'An nhap 1', widthMm: 60, heightMm: 90 },
                { pageNumber: 6, sourceIndex: 5, name: 'An nhap 2', widthMm: 70, heightMm: 95 }
            ],
            lastPage: { pageNumber: 6, sourceIndex: 5, name: 'An nhap 2', widthMm: 70, heightMm: 95 }
        },
        hasDraftCard: true,
        draftCardCount: 1,
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 },
            { pageNumber: 4, sourceIndex: 3, sourceName: 'Page 4', widthMm: 100, heightMm: 150, label: 'Thiep 2', quantity: 1 },
            { pageNumber: 5, sourceIndex: 4, sourceName: 'An nhap 1', widthMm: 60, heightMm: 90, label: 'Old draft', quantity: 9 }
        ]
    };

    suiteTab._handleFieldChange({
        target: {
            name: 'draftCardCount',
            value: '2'
        }
    });

    assert.equal(suiteTab.state.draftCardCount, 2);
    assert.deepEqual(
        suiteTab.state.invitePages.map((page) => page.pageNumber),
        [3, 4]
    );
    assert.match(suiteTab.container.innerHTML, /name="draftCardCount" min="1" step="1" value="2"/);
});

test('render avoids duplicating source and save actions once a source PDF is loaded', () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.container = { innerHTML: '' };
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        outputDirectory: 'C:/Exports',
        filenameStem: 'bai in source',
        manifest: {
            success: true,
            sourcePath: 'C:/Inputs/source.pdf',
            sourceName: 'source.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 },
                { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 100, heightMm: 150 }
            ],
            lastPage: { pageNumber: 4, sourceIndex: 3, name: 'Page 4', widthMm: 100, heightMm: 150 }
        },
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 },
            { pageNumber: 4, sourceIndex: 3, sourceName: 'Page 4', widthMm: 100, heightMm: 150, label: 'Thiep 2', quantity: 1 }
        ]
    };

    suiteTab.render();

    const markup = suiteTab.container.innerHTML;
    assert.equal((markup.match(/data-action="pick-output-directory"/g) || []).length, 1);
    assert.equal((markup.match(/data-action="use-active-pdf-source"/g) || []).length, 1);
    assert.equal((markup.match(/data-action="pick-source-file"/g) || []).length, 1);
    assert.equal((markup.match(/data-action="reset-workflow"/g) || []).length, 1);
    assert.equal((markup.match(/data-action="build-pdf"/g) || []).length, 1);
});

test('render loads paper stock options from the injected catalog', () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab({
        paperStockCatalog: {
            defaultStockId: 'operator_f180',
            stocks: [
                {
                    id: 'operator_f180',
                    label: 'Operator F180 320 x 480',
                    widthMm: 320,
                    heightMm: 480
                }
            ]
        }
    });
    suiteTab.container = { innerHTML: '' };
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        outputDirectory: 'C:/Exports',
        filenameStem: 'bai in source',
        manifest: {
            success: true,
            sourcePath: 'C:/Inputs/source.pdf',
            sourceName: 'source.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 150, heightMm: 100 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
            ],
            lastPage: { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
        },
        paperStock: 'operator_f180',
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 }
        ]
    };

    suiteTab.render();

    assert.match(suiteTab.container.innerHTML, /Operator F180 320 x 480/);
    assert.match(suiteTab.container.innerHTML, /Kho giay huu dung: 310 x 470 mm/);
});

test('refreshSourceManifest rejects AI input in PDF-only V1 without falling back to host inspect', async () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);
    let hostInspectCalls = 0;
    let scannerCalls = 0;

    suiteTab.setHostAdapterForTest({
        async inspectSource() {
            hostInspectCalls += 1;
            return {
                success: true
            };
        }
    });
    suiteTab.setPdfScannerForTest(async () => {
        scannerCalls += 1;
        return {
            success: true
        };
    });

    suiteTab.state.sourcePath = 'C:/Inputs/source.ai';
    suiteTab.state.manifest = { success: true };
    suiteTab.state.invitePages = [{ pageNumber: 3 }];

    await suiteTab.refreshSourceManifest();

    assert.equal(scannerCalls, 0);
    assert.equal(hostInspectCalls, 0);
    assert.equal(suiteTab.state.manifest, null);
    assert.deepEqual(suiteTab.state.invitePages, []);
});

test('_resolveSourceBrowseDirectory prefers the remembered PDF directory over the active document folder', async () => {
    installTestGlobals();
    const suiteTab = new WeddingSuiteTab(null);

    suiteTab.preferences.lastSourceDirectory = 'C:/Inputs';
    suiteTab.preferences.lastSaveDirectory = 'C:/Exports';
    suiteTab.setHostAdapterForTest({
        async getActiveDocumentDirectory() {
            return {
                success: true,
                directory: 'C:/ActiveSource'
            };
        }
    });

    const initialPath = await suiteTab._resolveSourceBrowseDirectory();

    assert.equal(initialPath, 'C:/Inputs');
});

test('_useActiveDocumentAsSource replaces the current source with the saved active PDF and refreshes manifest', async () => {
    installTestGlobals();
    const toastMessages = [];
    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };

    const suiteTab = new WeddingSuiteTab(null);
    let refreshCalls = 0;
    suiteTab.refreshSourceManifest = async () => {
        refreshCalls += 1;
    };
    suiteTab.setHostAdapterForTest({
        async getActiveDocumentSourceInfo() {
            return {
                success: true,
                path: 'C:/Active/source.pdf',
                name: 'source.pdf',
                isPdf: true,
                saved: true
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/old.pdf',
        outputDirectory: 'C:/Exports',
        filenameStem: 'bai in old',
        lastOutputPath: 'C:/Outputs/old.pdf'
    };

    await suiteTab._useActiveDocumentAsSource();

    assert.equal(suiteTab.state.sourcePath, 'C:/Active/source.pdf');
    assert.equal(suiteTab.state.outputDirectory, 'C:/Exports');
    assert.equal(suiteTab.state.filenameStem, 'bài in source');
    assert.equal(suiteTab.state.lastOutputPath, '');
    assert.equal(refreshCalls, 1);
    assert.deepEqual(toastMessages, [
        { message: 'Da lay file PDF dang mo lam source.', type: 'success' }
    ]);
});

test('_pickOutputDirectory stores a fixed save folder without depending on the source PDF directory', async () => {
    installTestGlobals();
    const toastMessages = [];
    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };

    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        outputDirectory: ''
    };
    suiteTab.setPickersForTest({
        pickDirectory(initialPath) {
            assert.equal(initialPath, 'C:/Inputs');
            return 'C:/Exports/Wedding';
        }
    });

    await suiteTab._pickOutputDirectory();

    assert.equal(suiteTab.state.outputDirectory, 'C:/Exports/Wedding');
    assert.equal(suiteTab.preferences.lastSaveDirectory, 'C:/Exports/Wedding');
    assert.deepEqual(toastMessages, [
        { message: 'Da cap nhat thu muc luu PDF co dinh.', type: 'success' }
    ]);
});

test('_useActiveDocumentAsSource warns and keeps the current source when the active PDF is unsaved', async () => {
    installTestGlobals();
    const toastMessages = [];
    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };

    const suiteTab = new WeddingSuiteTab(null);
    let refreshCalls = 0;
    suiteTab.refreshSourceManifest = async () => {
        refreshCalls += 1;
    };
    suiteTab.setHostAdapterForTest({
        async getActiveDocumentSourceInfo() {
            return {
                success: false,
                code: 'ACTIVE_DOCUMENT_UNSAVED',
                error: 'File PDF dang mo chua luu. Hay luu file roi bam lai.'
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/old.pdf'
    };

    await suiteTab._useActiveDocumentAsSource();

    assert.equal(suiteTab.state.sourcePath, 'C:/Inputs/old.pdf');
    assert.equal(refreshCalls, 0);
    assert.deepEqual(toastMessages, [
        { message: 'File PDF dang mo chua luu. Hay luu file roi bam lai.', type: 'warning' }
    ]);
});

test('_useActiveDocumentAsSource warns and keeps the current source when the active document is not a PDF', async () => {
    installTestGlobals();
    const toastMessages = [];
    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };

    const suiteTab = new WeddingSuiteTab(null);
    let refreshCalls = 0;
    suiteTab.refreshSourceManifest = async () => {
        refreshCalls += 1;
    };
    suiteTab.setHostAdapterForTest({
        async getActiveDocumentSourceInfo() {
            return {
                success: false,
                code: 'ACTIVE_DOCUMENT_NOT_PDF',
                error: 'File dang mo khong phai PDF nguon cho Bo Thiep.'
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/old.pdf'
    };

    await suiteTab._useActiveDocumentAsSource();

    assert.equal(suiteTab.state.sourcePath, 'C:/Inputs/old.pdf');
    assert.equal(refreshCalls, 0);
    assert.deepEqual(toastMessages, [
        { message: 'File dang mo khong phai PDF nguon cho Bo Thiep.', type: 'warning' }
    ]);
});

test('_runBuild flushes stale toasts before showing the unsaved-open-output warning', async () => {
    const toastMessages = [];
    const toastContainer = { innerHTML: 'stale toast' };
    installTestGlobals();
    globalThis.document = {
        getElementById(id) {
            return id === 'toast-container' ? toastContainer : null;
        }
    };

    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };
    UIFeedback._toastQueue = [{ message: 'Dang build PDF...', type: 'info' }];
    UIFeedback._isShowingToast = true;

    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.deps.now = () => new Date(2026, 5, 3, 16, 5, 0, 0);
    suiteTab.setHostAdapterForTest({
        async buildJob() {
            return {
                success: false,
                error: 'File bai in hien dang mo va chua luu. Hay luu hoac dong file do roi chay Binh Bo Thiep lai.',
                code: 'OUTPUT_FILE_UNSAVED_OPEN'
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        manifest: {
            sourceName: 'source.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 100, heightMm: 150 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
            ]
        },
        paperStock: 'f180_480x330',
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep moi 1', quantity: 1 }
        ],
        outputDirectory: 'C:/Outputs',
        filenameStem: 'bai in source'
    };

    await suiteTab._runBuild();

    assert.equal(toastContainer.innerHTML, '');
    assert.deepEqual(UIFeedback._toastQueue, []);
    assert.equal(UIFeedback._isShowingToast, false);
    assert.deepEqual(toastMessages, [
        { message: 'Dang build PDF...', type: 'info' },
        {
            message: 'File bai in hien dang mo va chua luu. Hay luu hoac dong file do roi chay Binh Bo Thiep lai.',
            type: 'error'
        }
    ]);
});

test('_runBuild stores the last PDF output path without enabling debug capture', async () => {
    installTestGlobals();
    const toastMessages = [];
    let capturedRequest = null;
    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };

    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.deps.now = () => new Date(2026, 5, 3, 16, 5, 0, 0);
    suiteTab.setHostAdapterForTest({
        async buildJob(request) {
            capturedRequest = request;
            return {
                success: true,
                outputPath: `C:/Outputs/${request.output.filenameStem}.pdf`,
                openedOutput: true
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        manifest: {
            sourceName: 'source.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 100, heightMm: 150 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
            ]
        },
        paperStock: 'f180_480x330',
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiệp 1', quantity: 1 }
        ],
        outputDirectory: 'C:/Outputs',
        filenameStem: 'bai in source'
    };

    await suiteTab._runBuild();

    assert.equal(capturedRequest.output.filenameStem, "bai in source_16'05 3 6");
    assert.equal(capturedRequest.output.baseFilenameStem, 'bai in source');
    assert.equal(capturedRequest.output.previousOutputPath, 'C:/Outputs/bai in source.pdf');
    assert.equal(capturedRequest.debug, undefined);
    assert.equal(suiteTab.state.lastOutputPath, "C:/Outputs/bai in source_16'05 3 6.pdf");
    assert.deepEqual(toastMessages, [
        { message: 'Dang build PDF...', type: 'info' },
        { message: "Da build va mo PDF: C:/Outputs/bai in source_16'05 3 6.pdf", type: 'success' }
    ]);
});

test('_runBuild reloads operator paper-stock config before planning the PDF', async () => {
    installTestGlobals();
    let loadCount = 0;
    let capturedRequest = null;
    const suiteTab = new WeddingSuiteTab({
        paperStockCatalogLoader() {
            loadCount += 1;
            return {
                defaultStockId: 'f180_480x330',
                stocksById: {
                    f180_480x330: {
                        id: 'f180_480x330',
                        label: loadCount === 1 ? 'F180 stale' : 'F180 480 x 320',
                        widthMm: loadCount === 1 ? 320 : 480,
                        heightMm: loadCount === 1 ? 480 : 320
                    }
                },
                stockOrder: ['f180_480x330']
            };
        }
    });
    suiteTab.deps.now = () => new Date(2026, 5, 3, 16, 5, 0, 0);
    suiteTab.setHostAdapterForTest({
        async buildJob(request) {
            capturedRequest = request;
            return {
                success: true,
                outputPath: 'C:/Outputs/bai in source.pdf',
                openedOutput: true
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        manifest: {
            sourceName: 'source.pdf',
            totalPages: 3,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 100, heightMm: 150 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
            ]
        },
        paperStock: 'f180_480x330',
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 }
        ],
        outputDirectory: 'C:/Outputs',
        filenameStem: 'bai in source'
    };

    await suiteTab._runBuild();

    assert.equal(loadCount, 2);
    assert.equal(capturedRequest.plan.paperStock.widthMm, 480);
    assert.equal(capturedRequest.plan.paperStock.heightMm, 320);
    assert.equal(capturedRequest.plan.productionSheets[0].widthMm, 480);
    assert.equal(capturedRequest.plan.productionSheets[0].heightMm, 320);
});

test('_runBuild keeps PDF success while surfacing open and temp cleanup warnings', async () => {
    installTestGlobals();
    const toastMessages = [];
    UIFeedback.showToast = (message, type = 'success') => {
        toastMessages.push({ message, type });
    };

    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.deps.now = () => new Date(2026, 5, 3, 16, 5, 0, 0);
    suiteTab.setHostAdapterForTest({
        async buildJob() {
            return {
                success: true,
                outputPath: 'C:/Outputs/bai in source.pdf',
                openedOutput: false,
                openOutputWarning: 'open failed',
                tempCleanupWarning: 'cleanup failed'
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        manifest: {
            sourceName: 'source.pdf',
            totalPages: 3,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 100, heightMm: 150 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
            ]
        },
        paperStock: 'f180_480x330',
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 }
        ],
        outputDirectory: 'C:/Outputs',
        filenameStem: 'bai in source'
    };

    await suiteTab._runBuild();

    assert.equal(suiteTab.state.lastOutputPath, 'C:/Outputs/bai in source.pdf');
    assert.deepEqual(toastMessages, [
        { message: 'Dang build PDF...', type: 'info' },
        { message: 'Da build PDF: C:/Outputs/bai in source.pdf', type: 'success' },
        { message: 'PDF da luu nhung khong tu mo duoc: open failed', type: 'warning' },
        { message: 'PDF da luu nhung con file tam can don: cleanup failed', type: 'warning' }
    ]);
});

test('_runBuild passes the resolved template path into the host build request', async () => {
    installTestGlobals();
    let capturedRequest = null;

    const suiteTab = new WeddingSuiteTab(null);
    suiteTab.deps.now = () => new Date(2026, 5, 3, 16, 5, 0, 0);
    suiteTab.setTemplatePathResolverForTest(
        () => 'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/wedding suite print template.ai'
    );
    suiteTab.setHostAdapterForTest({
        async buildJob(request) {
            capturedRequest = request;
            return {
                success: true,
                outputPath: 'C:/Outputs/bai in source.pdf',
                openedOutput: true
            };
        }
    });
    suiteTab.state = {
        ...suiteTab.state,
        sourcePath: 'C:/Inputs/source.pdf',
        manifest: {
            sourceName: 'source.pdf',
            totalPages: 4,
            pages: [
                { pageNumber: 1, sourceIndex: 0, name: 'Page 1', widthMm: 230, heightMm: 230 },
                { pageNumber: 2, sourceIndex: 1, name: 'Page 2', widthMm: 100, heightMm: 150 },
                { pageNumber: 3, sourceIndex: 2, name: 'Page 3', widthMm: 100, heightMm: 150 }
            ]
        },
        paperStock: 'f180_480x330',
        invitePages: [
            { pageNumber: 3, sourceIndex: 2, sourceName: 'Page 3', widthMm: 100, heightMm: 150, label: 'Thiep 1', quantity: 1 }
        ],
        outputDirectory: 'C:/Outputs',
        filenameStem: 'bai in source'
    };

    await suiteTab._runBuild();

    assert.ok(capturedRequest);
    assert.equal(
        capturedRequest.templatePath,
        'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/wedding suite print template.ai'
    );
    assert.equal(capturedRequest.output.filenameStem, "bai in source_16'05 3 6");
});
