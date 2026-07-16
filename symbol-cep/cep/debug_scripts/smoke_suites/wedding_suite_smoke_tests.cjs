function registerWeddingSuiteSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Wedding Suite tab mounts as an isolated workspace shell',
        `
            (function() {
                window.localStorage.removeItem('wedding_suite_standard_prefs_v1');
                if (typeof window.switchTab === 'function') {
                    window.switchTab('suite');
                }
    
                const suiteTab = document.getElementById('tab-suite-btn');
                const suitePanel = document.getElementById('tab-suite');
                const suiteContainer = document.getElementById('suite-container');
                const workspace = window.Imposition && window.Imposition.weddingSuiteTab;
                const title = suiteContainer ? suiteContainer.textContent.replace(/\\s+/g, ' ').trim() : null;
    
                return {
                    hasButton: !!suiteTab,
                    hasPanel: !!suitePanel,
                    isSelected: suiteTab ? suiteTab.getAttribute('aria-selected') : null,
                    isHidden: suitePanel ? suitePanel.hidden : null,
                    hasWorkspace: !!workspace,
                    title
                };
            })()
        `,
        async (result) => {
            if (!result.hasButton || !result.hasPanel || !result.hasWorkspace) {
                throw new Error(`Wedding Suite shell failed to mount: ${JSON.stringify(result)}`);
            }
            if (result.isSelected !== 'true' || result.isHidden !== false) {
                throw new Error(`Wedding Suite tab did not activate correctly: ${JSON.stringify(result)}`);
            }
            if (!result.title || !result.title.includes('Wedding Suite Standard')) {
                throw new Error(`Wedding Suite workspace copy is missing: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Wedding Suite source button surfaces picker failures instead of failing silently',
        `
            (async function() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
                window.localStorage.removeItem('wedding_suite_standard_prefs_v1');
                if (typeof window.switchTab === 'function') {
                    window.switchTab('suite');
                }
    
                const suiteTab = window.Imposition && window.Imposition.weddingSuiteTab;
                if (!suiteTab) {
                    return { reason: 'missing_suite_tab' };
                }
                if (typeof suiteTab.resetDepsForTest === 'function') {
                    suiteTab.resetDepsForTest();
                }
                const originalHostAdapter = suiteTab.deps.hostAdapter;
                const originalPdfScanner = suiteTab.deps.pdfScanner;
                const originalPickSourceFile = suiteTab.deps.pickSourceFile;
    
                suiteTab.preferences = {
                    lastSaveDirectory: '',
                    lastSourceDirectory: ''
                };
                suiteTab._resetState(false);
                suiteTab.render();
                const toastContainer = document.getElementById('toast-container');
                if (toastContainer) {
                    toastContainer.innerHTML = '';
                }
                suiteTab.setHostAdapterForTest({
                    async getActiveDocumentDirectory() {
                        return {
                            success: true,
                            directory: ''
                        };
                    }
                });
    
                suiteTab.setPickersForTest({
                    pickSourceFile() {
                        return '__PICKER_ERROR__';
                    }
                });
    
                const button = document.querySelector('#tab-suite [data-action="pick-source-file"]');
                if (!button) {
                    return { reason: 'missing_pick_button' };
                }
    
                button.click();
                await wait(180);
    
                return {
                    sourcePath: suiteTab.state.sourcePath,
                    hasManifest: !!suiteTab.state.manifest,
                    toasts: Array.from(document.querySelectorAll('#toast-container .toast')).map((toast) => toast.textContent.replace(/\\s+/g, ' ').trim())
                };
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Wedding Suite picker-failure smoke setup failed: ${JSON.stringify(result)}`);
            }
            if (result.sourcePath || result.hasManifest) {
                throw new Error(`Wedding Suite should not hydrate source state after picker error: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.toasts) || !result.toasts.some((text) => text.includes('Khong mo duoc hop chon file nguon'))) {
                throw new Error(`Wedding Suite picker failure did not surface a visible toast: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Wedding Suite PDF source button hydrates manifest without calling host inspect',
        `
            (async function() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
                function normalizePath(value) {
                    let normalized = String(value || '').replace(/\\\\/g, '/');
                    if (normalized.indexOf('file:///') === 0) {
                        normalized = normalized.slice('file:///'.length);
                    } else if (normalized.indexOf('file://') === 0) {
                        normalized = normalized.slice('file://'.length);
                    }
                    if (normalized.charAt(0) === '/' && /^[A-Za-z]:/.test(normalized.slice(1))) {
                        normalized = normalized.slice(1);
                    }
                    return normalized;
                }
    
                function dirname(path) {
                    const normalized = normalizePath(path);
                    const lastSlash = normalized.lastIndexOf('/');
                    return lastSlash > 0 ? normalized.slice(0, lastSlash) : normalized;
                }
    
                function fileExists(path) {
                    return !!(window.cep && window.cep.fs && typeof window.cep.fs.stat === 'function' && window.cep.fs.stat(path).err === 0);
                }
    
                function getFileSize(path) {
                    if (typeof window !== 'undefined' && window.cep_node && typeof window.cep_node.require === 'function') {
                        try {
                            return window.cep_node.require('node:fs').statSync(path).size || 0;
                        } catch (nodeErr) { }
                    }
    
                    if (window.cep && window.cep.fs && typeof window.cep.fs.readFile === 'function' && fileExists(path)) {
                        try {
                            const result = window.cep.fs.readFile(path);
                            if (result && result.err === 0 && typeof result.data === 'string') {
                                return result.data.length;
                            }
                        } catch (readErr) { }
                    }
    
                    return 0;
                }
    
                if (typeof CSInterface === 'undefined') {
                    return { reason: 'missing_csinterface' };
                }
    
                const cs = new CSInterface();
                const extensionRoot = normalizePath(cs.getSystemPath(CSInterface.EXTENSION));
                const fixtureCandidates = [
                    extensionRoot + '/debug_scripts/fixtures/wedding_suite/runtime_probe_ascii.pdf'
                ];
                const fixturePath = fixtureCandidates.find((path) => fileExists(path));
    
                if (!fixturePath) {
                    return {
                        reason: 'missing_fixture_pdf',
                        fixtureCandidates
                    };
                }
    
                window.localStorage.removeItem('wedding_suite_standard_prefs_v1');
                if (typeof window.switchTab === 'function') {
                    window.switchTab('suite');
                }
    
                const suiteTab = window.Imposition && window.Imposition.weddingSuiteTab;
                if (!suiteTab) {
                    return { reason: 'missing_suite_tab' };
                }
                if (typeof suiteTab.resetDepsForTest === 'function') {
                    suiteTab.resetDepsForTest();
                }
                const originalHostAdapter = suiteTab.deps.hostAdapter;
                const originalPdfScanner = suiteTab.deps.pdfScanner;
                const originalPickSourceFile = suiteTab.deps.pickSourceFile;
    
                try {
                    suiteTab.preferences = {
                        lastSaveDirectory: '',
                        lastSourceDirectory: ''
                    };
                    suiteTab._resetState(false);
                    suiteTab.render();
                    const toastContainer = document.getElementById('toast-container');
                    if (toastContainer) {
                        toastContainer.innerHTML = '';
                    }
    
                    let hostInspectCalls = 0;
                    suiteTab.setHostAdapterForTest({
                        async getActiveDocumentDirectory() {
                            return {
                                success: true,
                                directory: ''
                            };
                        },
                        async inspectSource() {
                            hostInspectCalls += 1;
                            return {
                                success: false,
                                error: 'host inspect should not run for PDF'
                            };
                        }
                    });
                    suiteTab.setPickersForTest({
                        pickSourceFile() {
                            return fixturePath;
                        }
                    });
    
                    const button = document.querySelector('#tab-suite [data-action="pick-source-file"]');
                    if (!button) {
                        return { reason: 'missing_pick_button' };
                    }
    
                    button.click();
                    await wait(220);
    
                    return {
                        fixturePath,
                        hostInspectCalls,
                        sourcePath: suiteTab.state.sourcePath,
                        outputDirectory: suiteTab.state.outputDirectory,
                        filenameStem: suiteTab.state.filenameStem,
                        manifest: suiteTab.state.manifest,
                        sourceInputValue: document.querySelector('#tab-suite input[readonly]') ? document.querySelector('#tab-suite input[readonly]').value : null
                    };
                } finally {
                    suiteTab.setHostAdapterForTest(originalHostAdapter);
                    suiteTab.setPdfScannerForTest(originalPdfScanner);
                    suiteTab.setPickersForTest({ pickSourceFile: originalPickSourceFile });
                }
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Wedding Suite PDF scanner smoke setup failed: ${JSON.stringify(result)}`);
            }
            if (result.hostInspectCalls !== 0) {
                throw new Error(`Wedding Suite still called host inspect for PDF manifest: ${JSON.stringify(result)}`);
            }
            if (result.sourcePath !== result.fixturePath) {
                throw new Error(`Wedding Suite did not keep the picked PDF path: ${JSON.stringify(result)}`);
            }
            if (result.outputDirectory !== '') {
                throw new Error(`Wedding Suite should keep output directory empty until operator chooses a fixed save folder: ${JSON.stringify(result)}`);
            }
            if (!result.filenameStem || !result.filenameStem.includes('runtime_probe_ascii')) {
                throw new Error(`Wedding Suite did not derive a filename stem from the fixture PDF: ${JSON.stringify(result)}`);
            }
            if (!result.manifest || result.manifest.totalPages !== 4) {
                throw new Error(`Wedding Suite PDF scanner did not hydrate the 4-page fixture manifest: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.manifest.pages) || result.manifest.pages.map((page) => page.pageNumber).join(',') !== '1,2,3,4') {
                throw new Error(`Wedding Suite PDF scanner returned the wrong page order: ${JSON.stringify(result)}`);
            }
            if (result.sourceInputValue !== result.fixturePath) {
                throw new Error(`Wedding Suite source input did not reflect the picked PDF: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Wedding Suite draft checkbox auto-detects a small last page and sends it as a separate artboard',
        `
            (async function() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
                window.localStorage.removeItem('wedding_suite_standard_prefs_v1');
                if (typeof window.switchTab === 'function') {
                    window.switchTab('suite');
                }
    
                const suiteTab = window.Imposition && window.Imposition.weddingSuiteTab;
                if (!suiteTab) {
                    return { reason: 'missing_suite_tab' };
                }
                if (typeof suiteTab.resetDepsForTest === 'function') {
                    suiteTab.resetDepsForTest();
                }
    
                const originalHostAdapter = suiteTab.deps.hostAdapter;
                const originalPdfScanner = suiteTab.deps.pdfScanner;
                const originalPickSourceFile = suiteTab.deps.pickSourceFile;
                const originalPickDirectory = suiteTab.deps.pickDirectory;
    
                try {
                    suiteTab.preferences = {
                        lastSaveDirectory: '',
                        lastSourceDirectory: ''
                    };
                    suiteTab._resetState(false);
                    suiteTab.render();
    
                    const captured = [];
                    suiteTab.setHostAdapterForTest({
                        async buildJob(request) {
                            captured.push(JSON.parse(JSON.stringify(request)));
                            return {
                                success: true,
                                outputPath: request.output.directory + '/' + request.output.filenameStem + '.pdf',
                                openedOutput: true
                            };
                        }
                    });
                    suiteTab.setPdfScannerForTest(async (sourcePath) => ({
                        success: true,
                        sourcePath,
                        sourceName: 'DraftCard.pdf',
                        totalPages: 4,
                        pages: [
                            { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
                            { pageNumber: 2, sourceIndex: 1, name: 'Info', widthMm: 150, heightMm: 100 },
                            { pageNumber: 3, sourceIndex: 2, name: 'Moi 1', widthMm: 100, heightMm: 150 },
                            { pageNumber: 4, sourceIndex: 3, name: 'An nhap', widthMm: 60, heightMm: 90 }
                        ],
                        lastPage: { pageNumber: 4, sourceIndex: 3, name: 'An nhap', widthMm: 60, heightMm: 90 }
                    }));
                    suiteTab.setPickersForTest({
                        pickSourceFile() {
                            return 'C:/Inputs/draft-card.pdf';
                        },
                        pickDirectory() {
                            return 'C:/Exports/Wedding';
                        }
                    });
    
                    const clickAction = async (actionName) => {
                        const button = document.querySelector('#tab-suite [data-action="' + actionName + '"]');
                        if (!button) {
                            throw new Error('Missing action button: ' + actionName);
                        }
                        button.click();
                        await wait(80);
                    };
    
                    await clickAction('pick-source-file');
                    await clickAction('pick-output-directory');
                    const draftCheckbox = document.querySelector('#tab-suite input[name="hasDraftCard"]');
                    await clickAction('build-pdf');
                    await wait(80);
    
                    return {
                        reason: '',
                        request: captured[0] || null,
                        checkboxPresent: !!draftCheckbox,
                        checkboxChecked: !!(draftCheckbox && draftCheckbox.checked)
                    };
                } finally {
                    suiteTab.setHostAdapterForTest(originalHostAdapter);
                    suiteTab.setPdfScannerForTest(originalPdfScanner);
                    suiteTab.setPickersForTest({
                        pickSourceFile: originalPickSourceFile,
                        pickDirectory: originalPickDirectory
                    });
                }
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Wedding Suite draft smoke setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.checkboxPresent || !result.checkboxChecked) {
                throw new Error(`Wedding Suite draft checkbox did not auto-check for the small last page: ${JSON.stringify(result)}`);
            }
            if (!result.request || !result.request.plan) {
                throw new Error(`Wedding Suite draft smoke did not capture a build request: ${JSON.stringify(result)}`);
            }
            if (!result.request.plan.sourcePages || !result.request.plan.sourcePages.draft || result.request.plan.sourcePages.draft.pageNumber !== 4) {
                throw new Error(`Wedding Suite draft page did not route into plan.sourcePages.draft: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.request.plan.sourcePages.invites) || result.request.plan.sourcePages.invites.length !== 1 || result.request.plan.sourcePages.invites[0].pageNumber !== 3) {
                throw new Error(`Wedding Suite draft mode did not keep only the invite pages before the last page: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.request.plan.qaPreviewPages) || !result.request.plan.qaPreviewPages.some((page) => page.kind === 'draft')) {
                throw new Error(`Wedding Suite draft preview is missing from QA: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.request.plan.artboards) || result.request.plan.artboards[result.request.plan.artboards.length - 1].kind !== 'draft') {
                throw new Error(`Wedding Suite draft artboard was not appended at the end of the output plan: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Wedding Suite one-page full-suite mode sends 4-up single-page production sheets',
        `
            (async function() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const suiteTab = window.Imposition && window.Imposition.weddingSuiteTab;
                if (!suiteTab) {
                    return { reason: 'missing_wedding_suite_tab' };
                }
                if (typeof suiteTab.resetDepsForTest === 'function') {
                    suiteTab.resetDepsForTest();
                }
    
                const originalHostAdapter = suiteTab.deps.hostAdapter;
                const originalPdfScanner = suiteTab.deps.pdfScanner;
                const originalPickSourceFile = suiteTab.deps.pickSourceFile;
                const originalPickDirectory = suiteTab.deps.pickDirectory;
                const captured = [];
    
                try {
                    if (typeof switchTab === 'function') {
                        switchTab('suite');
                        await wait(80);
                    }
    
                    suiteTab.preferences = {
                        lastSourceDirectory: 'C:/Inputs',
                        lastSaveDirectory: 'C:/Exports/Wedding'
                    };
                    suiteTab._resetState(false);
                    suiteTab.render();
    
                    suiteTab.setHostAdapterForTest({
                        async buildJob(request) {
                            captured.push(JSON.parse(JSON.stringify(request)));
                            return {
                                success: true,
                                outputPath: request.output.directory + '/' + request.output.filenameStem + '.pdf',
                                openedOutput: true
                            };
                        }
                    });
                    suiteTab.setPdfScannerForTest(async (sourcePath) => ({
                        success: true,
                        sourcePath,
                        sourceName: 'Full Suite.pdf',
                        totalPages: 4,
                        pages: [
                            { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
                            { pageNumber: 2, sourceIndex: 1, name: 'Bo ngay 1', widthMm: 300, heightMm: 150 },
                            { pageNumber: 3, sourceIndex: 2, name: 'Bo ngay 2', widthMm: 300, heightMm: 150 },
                            { pageNumber: 4, sourceIndex: 3, name: 'Bo ngay 3', widthMm: 300, heightMm: 150 }
                        ],
                        lastPage: { pageNumber: 4, sourceIndex: 3, name: 'Bo ngay 3', widthMm: 300, heightMm: 150 }
                    }));
                    suiteTab.setPickersForTest({
                        pickSourceFile() {
                            return 'C:/Inputs/Full Suite.pdf';
                        },
                        pickDirectory() {
                            return 'C:/Exports/Wedding';
                        }
                    });
    
                    const clickAction = async (actionName) => {
                        const button = document.querySelector('#tab-suite [data-action="' + actionName + '"]');
                        if (!button) {
                            throw new Error('Missing action button: ' + actionName);
                        }
                        button.click();
                        await wait(100);
                    };
    
                    await clickAction('pick-source-file');
                    const combinedCheckbox = document.querySelector('#tab-suite input[name="combinedInfoInvitePage"]');
                    if (!combinedCheckbox) {
                        return { reason: 'missing_combined_checkbox' };
                    }
                    combinedCheckbox.checked = true;
                    combinedCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    await wait(100);
    
                    await clickAction('pick-output-directory');
                    await clickAction('build-pdf');
                    await wait(100);
    
                    const request = captured[0] || null;
                    return {
                        request,
                        combinedState: suiteTab.state.combinedInfoInvitePage,
                        pairState: suiteTab.state.pairInfoInvitePages,
                        combinedChecked: !!(document.querySelector('#tab-suite input[name="combinedInfoInvitePage"]') || {}).checked,
                        pairDisabled: !!(document.querySelector('#tab-suite input[name="pairInfoInvitePages"]') || {}).disabled,
                        helperText: document.querySelector('#tab-suite') ? document.querySelector('#tab-suite').textContent.replace(/\\s+/g, ' ').trim() : ''
                    };
                } finally {
                    suiteTab.setHostAdapterForTest(originalHostAdapter);
                    suiteTab.setPdfScannerForTest(originalPdfScanner);
                    suiteTab.setPickersForTest({
                        pickSourceFile: originalPickSourceFile,
                        pickDirectory: originalPickDirectory
                    });
                }
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Wedding Suite one-page full-suite smoke setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.combinedState || result.pairState || !result.combinedChecked || !result.pairDisabled) {
                throw new Error(`One-page full-suite UI did not activate the exclusive combined mode: ${JSON.stringify(result)}`);
            }
            if (!result.request || !result.request.plan || !result.request.plan.combinedInfoInvitePage || result.request.plan.pairInfoInvitePages) {
                throw new Error(`One-page full-suite build request did not use combined mode: ${JSON.stringify(result)}`);
            }
            if ((result.request.plan.qaNotes || []).some((entry) => String(entry).includes('cac to thiep bao'))) {
                throw new Error(`Removed pair-mode QA note leaked into one-page full-suite mode: ${JSON.stringify(result)}`);
            }
            const sheets = result.request.plan.productionSheets || [];
            if (sheets.length !== 3) {
                throw new Error(`One-page full-suite should create one sheet per source page from page 2 onward: ${JSON.stringify(result)}`);
            }
            if (!sheets.every((sheet) => sheet.layoutMode === 'single_page_suite_2x2' && sheet.sourcePage && !sheet.topPage && !sheet.bottomPage)) {
                throw new Error(`One-page full-suite sheets must use a single sourcePage, not top/bottom pages: ${JSON.stringify(result)}`);
            }
            if (sheets.map((sheet) => sheet.sourcePage.sourceIndex).join(',') !== '1,2,3') {
                throw new Error(`One-page full-suite sheets should map sheet 1=page 2, sheet 2=page 3, sheet 3=page 4: ${JSON.stringify(result)}`);
            }
            if (!sheets.every((sheet) => sheet.sourcePage.shouldRotate90 === false)) {
                throw new Error(`One-page full-suite pages are already wide and must not auto-rotate: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Wedding Suite quick-build workflow uses fixed pages, remembers directories, and hides the old operator UI',
        `
            (async function() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
                window.localStorage.removeItem('wedding_suite_standard_prefs_v1');
                if (typeof window.switchTab === 'function') {
                    window.switchTab('suite');
                }
    
                const suiteTab = window.Imposition && window.Imposition.weddingSuiteTab;
                if (!suiteTab) {
                    return { reason: 'missing_suite_tab' };
                }
                if (typeof suiteTab.resetDepsForTest === 'function') {
                    suiteTab.resetDepsForTest();
                }
    
                const originalHostAdapter = suiteTab.deps.hostAdapter;
                const originalPdfScanner = suiteTab.deps.pdfScanner;
                const originalPickSourceFile = suiteTab.deps.pickSourceFile;
                const originalPickDirectory = suiteTab.deps.pickDirectory;
    
                try {
    
                suiteTab.preferences = {
                    lastSaveDirectory: '',
                    lastSourceDirectory: ''
                };
                suiteTab._resetState(false);
                suiteTab.render();
                const toastContainer = document.getElementById('toast-container');
                if (toastContainer) {
                    toastContainer.innerHTML = '';
                }
    
                const captured = [];
                const sourcePickInitialPaths = [];
                let hostInspectCalls = 0;
                suiteTab.setHostAdapterForTest({
                    async getActiveDocumentDirectory() {
                        return {
                            success: true,
                            directory: 'C:/ActiveSource'
                        };
                    },
                    async inspectSource(sourcePath) {
                        hostInspectCalls += 1;
                        return {
                            success: false,
                            sourcePath
                        };
                    },
                    async buildJob(request) {
                        captured.push(JSON.parse(JSON.stringify(request)));
                        return {
                            success: true,
                            outputPath: request.output.directory + '/' + request.output.filenameStem + '.pdf',
                            openedOutput: true
                        };
                    }
                });
                suiteTab.setPdfScannerForTest(async (sourcePath) => ({
                    success: true,
                    sourcePath,
                    sourceName: 'External.pdf',
                    totalPages: 6,
                    pages: [
                        { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
                        { pageNumber: 2, sourceIndex: 1, name: 'Info', widthMm: 150, heightMm: 100 },
                        { pageNumber: 3, sourceIndex: 2, name: 'Moi 1', widthMm: 100, heightMm: 150 },
                        { pageNumber: 4, sourceIndex: 3, name: 'Moi 2', widthMm: 160, heightMm: 100 },
                        { pageNumber: 5, sourceIndex: 4, name: 'Moi 3', widthMm: 100, heightMm: 150 }
                    ]
                }));
                suiteTab.setPickersForTest({
                    pickSourceFile(initialPath) {
                        sourcePickInitialPaths.push(initialPath);
                        return 'C:/Inputs/source.pdf';
                    },
                    pickDirectory() {
                        return 'C:/Exports/Wedding';
                    }
                });
    
                const clickAction = async (actionName) => {
                    const button = document.querySelector('#tab-suite [data-action="' + actionName + '"]');
                    if (!button) {
                        throw new Error('Missing action button: ' + actionName);
                    }
                    button.click();
                    await wait(80);
                };
    
                await clickAction('pick-source-file');
                await clickAction('pick-output-directory');
                await wait(80);
    
                const sourceModeControl = document.querySelector('#tab-suite select[name="sourceMode"]');
                const bindingControl = document.querySelector('#tab-suite select[name="binding:envelope"]');
                const recipeSave = document.querySelector('#tab-suite [data-action="recipe-save"]');
                const dryRun = document.querySelector('#tab-suite [data-action="dry-run"]');
                const jobQuantityControl = document.querySelector('#tab-suite input[name="jobQuantity"]');
                const summaryGrid = document.querySelector('#tab-suite .wss-summary-grid');
    
                suiteTab.state.invitePages[0].label = 'Thiệp ABC';
                suiteTab.state.invitePages[1].label = 'Thiệp XYZ';
                suiteTab.render();
    
                const manifestAfterPick = suiteTab.state.manifest && suiteTab.state.manifest.pages ? suiteTab.state.manifest.pages.length : 0;
                const inviteRowCount = document.querySelectorAll('#tab-suite input[name^="invite:"]').length / 2;
                const firstErrorBox = document.querySelector('#tab-suite .wss-error-box');
                await clickAction('build-pdf');
                await wait(80);
    
                suiteTab.setHostAdapterForTest({
                    async getActiveDocumentDirectory() {
                        return {
                            success: true,
                            directory: ''
                        };
                    },
                    async inspectSource(sourcePath) {
                        hostInspectCalls += 1;
                        return {
                            success: false,
                            sourcePath
                        };
                    },
                    async buildJob(request) {
                        captured.push(JSON.parse(JSON.stringify(request)));
                        return {
                            success: true,
                            outputPath: request.output.directory + '/' + request.output.filenameStem + '.pdf',
                            openedOutput: true
                        };
                    }
                });
                suiteTab.setPdfScannerForTest(async (sourcePath) => ({
                    success: true,
                    sourcePath,
                    sourceName: 'Second.pdf',
                    totalPages: 5,
                    pages: [
                        { pageNumber: 1, sourceIndex: 0, name: 'Bao thu', widthMm: 230, heightMm: 230 },
                        { pageNumber: 2, sourceIndex: 1, name: 'Info', widthMm: 150, heightMm: 100 },
                        { pageNumber: 3, sourceIndex: 2, name: 'Moi 1', widthMm: 100, heightMm: 150 }
                    ]
                }));
                await clickAction('pick-source-file');
                await wait(80);
    
                suiteTab.preferences.lastSourceDirectory = '';
                suiteTab.setPickersForTest({
                    pickSourceFile(initialPath) {
                        sourcePickInitialPaths.push(initialPath);
                        return '';
                    },
                    pickDirectory() {
                        return 'C:/Exports/Wedding';
                    }
                });
                await clickAction('pick-source-file');
    
                const savedPrefs = JSON.parse(window.localStorage.getItem('wedding_suite_standard_prefs_v1') || '{}');
                suiteTab._resetState(false);
                suiteTab.render();
                return {
                    requestCount: captured.length,
                    firstRequest: captured[0] || null,
                    savedPrefs,
                    outputAfterReset: suiteTab.state.outputDirectory || null,
                    manifestAfterPick,
                    inviteRowCount,
                    firstError: firstErrorBox ? firstErrorBox.textContent.replace(/\\s+/g, ' ').trim() : null,
                    sourceModeControl: !!sourceModeControl,
                    bindingControl: !!bindingControl,
                    recipeSave: !!recipeSave,
                    dryRun: !!dryRun,
                    jobQuantityControl: !!jobQuantityControl,
                    summaryGrid: !!summaryGrid,
                    printButtonPresentAfterBuild: !!document.querySelector('#tab-suite [data-action="print-qa-check"]'),
                    hostInspectCalls,
                    sourcePickInitialPaths,
                    toasts: Array.from(document.querySelectorAll('#toast-container .toast')).map((toast) => toast.textContent.replace(/\\s+/g, ' ').trim())
                };
                } finally {
                    suiteTab.setHostAdapterForTest(originalHostAdapter);
                    suiteTab.setPdfScannerForTest(originalPdfScanner);
                    suiteTab.setPickersForTest({
                        pickSourceFile: originalPickSourceFile,
                        pickDirectory: originalPickDirectory
                    });
                }
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Wedding Suite build smoke setup failed: ${JSON.stringify(result)}`);
            }
            if (result.requestCount !== 1) {
                throw new Error(`Wedding Suite should only build once in this smoke: ${JSON.stringify(result)}`);
            }
            const firstOutput = result.firstRequest && result.firstRequest.output ? result.firstRequest.output : null;
            if (
                !firstOutput ||
                firstOutput.baseFilenameStem !== 'bài in External' ||
                !/^bài in External_\d{1,2}'\d{2} \d{1,2} \d{1,2}$/.test(firstOutput.filenameStem || '')
            ) {
                throw new Error(`Default filename stem should keep base name and add a timestamp: ${JSON.stringify(result)}`);
            }
            if (firstOutput.previousOutputPath !== 'C:/Exports/Wedding/bài in External.pdf') {
                throw new Error(`Wedding Suite should pass the previous non-timestamped output path for cleanup: ${JSON.stringify(result)}`);
            }
            if (result.firstRequest.plan.artboards[0].kind !== 'qa' || result.firstRequest.plan.artboards[1].kind !== 'envelope') {
                throw new Error(`Artboard order is wrong: ${JSON.stringify(result)}`);
            }
            if (result.firstRequest.plan.qaPreviewPages.length !== 4) {
                throw new Error(`QA preview pages are incomplete: ${JSON.stringify(result)}`);
            }
            const expectedQaWidth = 10 + (Math.min(2, result.firstRequest.plan.qaPreviewPages.length) * (result.firstRequest.plan.usableWidthMm / 4));
            const expectedQaHeight = 10 + 12 + (Math.max(1, Math.ceil(result.firstRequest.plan.qaPreviewPages.length / 2)) * (result.firstRequest.plan.usableHeightMm / 2));
            if (
                Math.abs(result.firstRequest.plan.qaArtboard.widthMm - expectedQaWidth) > 0.01 ||
                Math.abs(result.firstRequest.plan.qaArtboard.heightMm - expectedQaHeight) > 0.01
            ) {
                throw new Error(`QA artboard should now fit the 2-column preview grid instead of staying at stock size: ${JSON.stringify(result)}`);
            }
            if (result.firstRequest.plan.productionSheets.length !== 3) {
                throw new Error(`Production sheets did not cover fixed page 3-5 output: ${JSON.stringify(result)}`);
            }
            if (result.firstRequest.plan.productionSheets[1].bottomPage.shouldRotate90 !== true) {
                throw new Error(`Landscape invite page was not marked for 90-degree rotation: ${JSON.stringify(result)}`);
            }
            if (!result.savedPrefs || result.savedPrefs.lastSaveDirectory !== 'C:/Exports/Wedding') {
                throw new Error(`Last save directory was not remembered after build: ${JSON.stringify(result)}`);
            }
            if (result.savedPrefs.lastSourceDirectory !== 'C:/Inputs') {
                throw new Error(`Last source directory was not remembered after picking a file: ${JSON.stringify(result)}`);
            }
            if (result.outputAfterReset !== 'C:/Exports/Wedding') {
                throw new Error(`Remembered save directory did not hydrate back into the workspace: ${JSON.stringify(result)}`);
            }
            if (result.manifestAfterPick !== 5 || result.inviteRowCount !== 0) {
                throw new Error(`Fixed-page workflow should hide manual invite controls while still hydrating page 3-5: ${JSON.stringify(result)}`);
            }
            if (result.sourceModeControl || result.bindingControl || result.recipeSave || result.dryRun) {
                throw new Error(`Legacy Wedding Suite controls leaked into the one-button workflow: ${JSON.stringify(result)}`);
            }
            if (result.jobQuantityControl || result.summaryGrid) {
                throw new Error(`Wedding Suite should no longer render quantity input or summary panel: ${JSON.stringify(result)}`);
            }
            if (result.printButtonPresentAfterBuild) {
                throw new Error(`Wedding Suite should not expose the removed QA print button anymore: ${JSON.stringify(result)}`);
            }
            if (result.hostInspectCalls !== 0) {
                throw new Error(`Wedding Suite quick-build still called host inspect for PDF manifests: ${JSON.stringify(result)}`);
            }
            if (result.sourcePickInitialPaths.length !== 3 || result.sourcePickInitialPaths.join('|') !== 'C:/ActiveSource|C:/Inputs|C:/Inputs') {
                throw new Error(`Source picker precedence drifted: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Wedding Suite host build opens the PDF and retains AI only as a temporary smoke artifact',
        `
            (async function() {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
                function normalizePath(value) {
                    let normalized = String(value || '').replace(/\\\\/g, '/');
                    if (normalized.indexOf('file:///') === 0) {
                        normalized = normalized.slice('file:///'.length);
                    } else if (normalized.indexOf('file://') === 0) {
                        normalized = normalized.slice('file://'.length);
                    }
                    if (normalized.charAt(0) === '/' && /^[A-Za-z]:/.test(normalized.slice(1))) {
                        normalized = normalized.slice(1);
                    }
                    return normalized;
                }
    
                function dirname(path) {
                    const normalized = normalizePath(path);
                    const lastSlash = normalized.lastIndexOf('/');
                    return lastSlash > 0 ? normalized.slice(0, lastSlash) : normalized;
                }
    
                function fileExists(path) {
                    return !!(window.cep && window.cep.fs && typeof window.cep.fs.stat === 'function' && window.cep.fs.stat(path).err === 0);
                }
    
                function getFileSize(path) {
                    if (typeof window !== 'undefined' && window.cep_node && typeof window.cep_node.require === 'function') {
                        try {
                            return window.cep_node.require('node:fs').statSync(path).size || 0;
                        } catch (nodeErr) { }
                    }
    
                    if (window.cep && window.cep.fs && typeof window.cep.fs.readFile === 'function' && fileExists(path)) {
                        try {
                            const result = window.cep.fs.readFile(path);
                            if (result && result.err === 0 && typeof result.data === 'string') {
                                return result.data.length;
                            }
                        } catch (readErr) { }
                    }
    
                    return 0;
                }
    
                function deleteIfExists(path) {
                    if (!window.cep || !window.cep.fs || typeof window.cep.fs.deleteFile !== 'function') {
                        return;
                    }
                    if (fileExists(path)) {
                        window.cep.fs.deleteFile(path);
                    }
                }
    
                function collectToasts() {
                    return Array.from(document.querySelectorAll('#toast-container .toast')).map((toast) => toast.textContent.replace(/\\s+/g, ' ').trim());
                }
    
                function decodeBridgeJson(raw) {
                    if (!raw) {
                        throw new Error('Empty host payload');
                    }
                    if (raw.indexOf('EvalScript') === 0 || raw.indexOf('ReferenceError') === 0) {
                        throw new Error(raw);
                    }
    
                    function decodeBinary(binary) {
                        let decoded = '';
    
                        if (typeof TextDecoder === 'function') {
                            const bytes = new Uint8Array(binary.length);
                            for (let index = 0; index < binary.length; index += 1) {
                                bytes[index] = binary.charCodeAt(index);
                            }
                            decoded = new TextDecoder('utf-8').decode(bytes);
                        } else {
                            let encoded = '';
                            for (let index = 0; index < binary.length; index += 1) {
                                const hex = binary.charCodeAt(index).toString(16).padStart(2, '0');
                                encoded += '%' + hex;
                            }
                            decoded = decodeURIComponent(encoded);
                        }
    
                        return decoded.replace(/^\\uFEFF/, '').trim();
                    }
    
                    function tryParse(value) {
                        return JSON.parse(String(value || '').replace(/^\\uFEFF/, '').trim());
                    }
    
                    try {
                        return tryParse(raw);
                    } catch (rawJsonErr) { }
    
                    try {
                        return tryParse(decodeURIComponent(raw));
                    } catch (rawEncodedErr) { }
    
                    const binary = window.atob(raw);
                    const decoded = decodeBinary(binary);
    
                    try {
                        return tryParse(decoded);
                    } catch (base64JsonErr) { }
    
                    return tryParse(decodeURIComponent(decoded));
                }
    
                async function inspectAiOutput(aiPath) {
                    const bridge = window.Imposition && window.Imposition.actionTab && window.Imposition.actionTab.bridgeInst;
                    if (!bridge || typeof bridge.eval !== 'function') {
                        return { success: false, error: 'missing_bridge' };
                    }
    
                    const escapedPath = String(aiPath || '')
                        .replace(/\\\\/g, '/')
                        .replace(/'/g, "\\\\'");
    
                    const script = "(function(){ var file = new File('" + escapedPath + "'); var doc = null; var result = { success:false }; try { if (!file.exists) { return $.global.WeddingSuiteStandard._encodeResult({ success:false, error:'missing_output' }); } doc = app.open(file); var artboards = []; var i; var j; for (i = 0; i < doc.artboards.length; i++) { var ab = doc.artboards[i]; var rect = ab.artboardRect; var info = { index:i, name:ab.name, rectMm:[$.global.WeddingSuiteStandard._ptToMm(rect[0]), $.global.WeddingSuiteStandard._ptToMm(rect[1]), $.global.WeddingSuiteStandard._ptToMm(rect[2]), $.global.WeddingSuiteStandard._ptToMm(rect[3])], textCount:0, placedCount:0, pathCount:0, guideCount:0, placedBoundsMm:[], placedMatrices:[], guideBoundsMm:[], guideMatrices:[] }; for (j = 0; j < doc.textFrames.length; j++) { var tf = doc.textFrames[j]; try { if ($.global.WeddingSuiteStandard._intersects(rect, tf.visibleBounds)) { info.textCount++; } } catch (tfErr) {} } for (j = 0; j < doc.pathItems.length; j++) { var path = doc.pathItems[j]; try { var pathBounds = path.visibleBounds; if ($.global.WeddingSuiteStandard._intersects(rect, pathBounds)) { if (path.guides) { info.guideCount++; info.guideBoundsMm.push([$.global.WeddingSuiteStandard._ptToMm(pathBounds[0]), $.global.WeddingSuiteStandard._ptToMm(pathBounds[1]), $.global.WeddingSuiteStandard._ptToMm(pathBounds[2]), $.global.WeddingSuiteStandard._ptToMm(pathBounds[3])]); info.guideMatrices.push({ mValueA:path.matrix.mValueA, mValueB:path.matrix.mValueB, mValueC:path.matrix.mValueC, mValueD:path.matrix.mValueD, mValueTX:path.matrix.mValueTX, mValueTY:path.matrix.mValueTY }); } else { info.pathCount++; } } } catch (pathErr) {} } for (j = 0; j < doc.placedItems.length; j++) { var pi = doc.placedItems[j]; try { var bounds = $.global.WeddingSuiteStandard._getItemBounds(pi); if (bounds && $.global.WeddingSuiteStandard._intersects(rect, bounds)) { info.placedCount++; info.placedBoundsMm.push([$.global.WeddingSuiteStandard._ptToMm(bounds[0]), $.global.WeddingSuiteStandard._ptToMm(bounds[1]), $.global.WeddingSuiteStandard._ptToMm(bounds[2]), $.global.WeddingSuiteStandard._ptToMm(bounds[3])]); info.placedMatrices.push({ mValueA:pi.matrix.mValueA, mValueB:pi.matrix.mValueB, mValueC:pi.matrix.mValueC, mValueD:pi.matrix.mValueD, mValueTX:pi.matrix.mValueTX, mValueTY:pi.matrix.mValueTY }); } } catch (piErr) {} } artboards.push(info); } result = { success:true, artboards:artboards }; } catch (e) { result = { success:false, error:e.message }; } finally { try { if (doc) { doc.close(SaveOptions.DONOTSAVECHANGES); } } catch (closeErr) {} } return $.global.WeddingSuiteStandard._encodeResult(result); })()";
    
                    try {
                        const raw = await bridge.eval(script);
                        return decodeBridgeJson(raw);
                    } catch (error) {
                        return {
                            success: false,
                            error: error && error.message ? error.message : String(error)
                        };
                    }
                }
    
                async function inspectOpenOutput(aiPath) {
                    const bridge = window.Imposition && window.Imposition.actionTab && window.Imposition.actionTab.bridgeInst;
                    if (!bridge || typeof bridge.eval !== 'function') {
                        return { success: false, error: 'missing_bridge' };
                    }
    
                    const payload = window.btoa(encodeURIComponent(String(aiPath || '')));
    
                    try {
                        const raw = await bridge.eval('$.global.WeddingSuiteStandard.inspectOpenOutput("' + payload + '")');
                        return decodeBridgeJson(raw);
                    } catch (error) {
                        return {
                            success: false,
                            error: error && error.message ? error.message : String(error)
                        };
                    }
                }
    
                async function markOpenOutputDirty(aiPath) {
                    const bridge = window.Imposition && window.Imposition.actionTab && window.Imposition.actionTab.bridgeInst;
                    if (!bridge || typeof bridge.eval !== 'function') {
                        return { success: false, error: 'missing_bridge' };
                    }
    
                    const payload = window.btoa(encodeURIComponent(String(aiPath || '')));
    
                    try {
                        const raw = await bridge.eval('$.global.WeddingSuiteStandard.markOpenOutputDirty("' + payload + '")');
                        return decodeBridgeJson(raw);
                    } catch (error) {
                        return {
                            success: false,
                            error: error && error.message ? error.message : String(error)
                        };
                    }
                }
    
                async function ensureOutputOpen(outputPath) {
                    const bridge = window.Imposition && window.Imposition.actionTab && window.Imposition.actionTab.bridgeInst;
                    if (!bridge || typeof bridge.eval !== 'function') {
                        return { success: false, error: 'missing_bridge' };
                    }
    
                    const payload = window.btoa(encodeURIComponent(String(outputPath || '')));
    
                    try {
                        const raw = await bridge.eval('$.global.WeddingSuiteStandard.ensureOutputOpen("' + payload + '")');
                        return decodeBridgeJson(raw);
                    } catch (error) {
                        return {
                            success: false,
                            error: error && error.message ? error.message : String(error)
                        };
                    }
                }
    
                if (typeof CSInterface === 'undefined') {
                    return { reason: 'missing_csinterface' };
                }
    
                const cs = new CSInterface();
                const extensionRoot = normalizePath(cs.getSystemPath(CSInterface.EXTENSION));
                const fixtureCandidates = [
                    extensionRoot + '/debug_scripts/fixtures/wedding_suite/runtime_probe_ascii.pdf'
                ];
                const fixturePath = fixtureCandidates.find((path) => fileExists(path));
    
                if (!fixturePath) {
                    return {
                        reason: 'missing_fixture_pdf',
                        fixtureCandidates
                    };
                }
    
                if (typeof window.switchTab === 'function') {
                    window.switchTab('suite');
                }
    
                const suiteTab = window.Imposition && window.Imposition.weddingSuiteTab;
                if (!suiteTab) {
                    return { reason: 'missing_suite_tab' };
                }
                if (typeof suiteTab.resetDepsForTest === 'function') {
                    suiteTab.resetDepsForTest();
                }
    
                const originalHostAdapter = suiteTab.deps.hostAdapter;
                const originalPdfScanner = suiteTab.deps.pdfScanner;
                const originalPickSourceFile = suiteTab.deps.pickSourceFile;
                const originalNow = suiteTab.deps.now;
                if (!window.cep_node || typeof window.cep_node.require !== 'function') {
                    return { reason: 'missing_node_runtime_for_temp_output' };
                }
                const nodeRequire = window.cep_node.require;
                const nodeFs = nodeRequire('node:fs');
                const nodeOs = nodeRequire('node:os');
                const nodePath = nodeRequire('node:path');
                const outputDirectory = normalizePath(nodePath.join(
                    nodeOs.tmpdir(),
                    'symbol_cep_smoke_outputs',
                    'smoke_linked_build_' + Date.now()
                ));
                nodeFs.mkdirSync(outputDirectory, { recursive: true });
                const outputStem = 'smoke_linked_build_' + Date.now() + '_long_operator_filename_' + 'x'.repeat(64);
                const legacyOutputPath = outputDirectory + '/' + outputStem + '.pdf';
                const expectedOutputPath = outputDirectory + '/' + outputStem + "_16'05 3 6.pdf";
                const buildResults = [];
    
                try {
                    window.localStorage.removeItem('wedding_suite_standard_prefs_v1');
                    suiteTab.preferences = {
                        lastSaveDirectory: '',
                        lastSourceDirectory: ''
                    };
                    suiteTab._resetState(false);
                    suiteTab.render();
                    const toastContainer = document.getElementById('toast-container');
                    if (toastContainer) {
                        toastContainer.innerHTML = '';
                    }
    
                    suiteTab.deps.now = function() {
                        return new Date(2026, 5, 3, 16, 5, 0, 0);
                    };
    
                    deleteIfExists(legacyOutputPath);
                    deleteIfExists(expectedOutputPath);
    
                    suiteTab.setHostAdapterForTest({
                        ...originalHostAdapter,
                        async buildJob(request) {
                            const staleRequest = JSON.parse(JSON.stringify(request));
                            if (staleRequest.plan && staleRequest.plan.paperStock && staleRequest.plan.paperStock.id === 'f180_480x330') {
                                staleRequest.plan.paperStock.label = 'F180 320 x 480';
                                staleRequest.plan.paperStock.widthMm = 320;
                                staleRequest.plan.paperStock.heightMm = 480;
                                staleRequest.plan.usableWidthMm = 310;
                                staleRequest.plan.usableHeightMm = 470;
                                if (staleRequest.plan.productionSheets) {
                                    staleRequest.plan.productionSheets.forEach((sheet) => {
                                        sheet.widthMm = 320;
                                        sheet.heightMm = 480;
                                        sheet.artboardName = String(sheet.artboardName || '').replace(/F180 480 x 320$/, 'F180 320 x 480');
                                    });
                                }
                            }
                            const result = await originalHostAdapter.buildJob({
                                ...staleRequest,
                                debug: {
                                    captureAiArtifact: true
                                }
                            });
                            buildResults.push(result);
                            return result;
                        }
                    });
                    suiteTab.setPdfScannerForTest(originalPdfScanner);
                    suiteTab.setPickersForTest({
                        pickSourceFile() {
                            return fixturePath;
                        }
                    });
    
                    const pickButton = document.querySelector('#tab-suite [data-action="pick-source-file"]');
                    if (!pickButton) {
                        return { reason: 'missing_pick_button' };
                    }
    
                    pickButton.click();
                    await wait(250);
    
                    suiteTab.state.jobQuantity = 1;
                    suiteTab.state.paperStock = 'f180_480x330';
                    suiteTab.state.outputDirectory = outputDirectory;
                    suiteTab.state.filenameStem = outputStem;
                    suiteTab.render();
    
                    let buildButton = null;
                    for (let attempt = 0; attempt < 20; attempt += 1) {
                        buildButton = document.querySelector('#tab-suite [data-action="build-pdf"]');
                        if (buildButton) {
                            break;
                        }
                        await wait(100);
                    }
                    if (!buildButton) {
                        return { reason: 'missing_build_button' };
                    }
    
                    const buildStart = Date.now();
                    buildButton.click();
    
                    let buildCompleted = false;
                    for (let attempt = 0; attempt < 180; attempt += 1) {
                        if (
                            buildResults.length >= 1 &&
                            buildResults[0] &&
                            buildResults[0].outputPath &&
                            fileExists(buildResults[0].outputPath)
                        ) {
                            buildCompleted = true;
                            break;
                        }
                        const toasts = collectToasts();
                        if (toasts.some((text) => /cancelled|that bai|khong the build/i.test(text))) {
                            break;
                        }
                        await wait(250);
                    }
    
                    if (buildCompleted) {
                        await wait(500);
                        for (let attempt = 0; attempt < 20; attempt += 1) {
                            if (buildResults.length >= 1) {
                                break;
                            }
                            await wait(100);
                        }
                    }
    
                    const outputPath = buildCompleted && buildResults[0] ? buildResults[0].outputPath : '';
                    const debugArtifactPath = buildCompleted && buildResults[0] && buildResults[0].debugArtifact
                        ? buildResults[0].debugArtifact.path
                        : '';
                    const inspection = buildCompleted && debugArtifactPath ? await inspectAiOutput(debugArtifactPath) : null;
                    const ensureOpenState = buildCompleted ? await ensureOutputOpen(outputPath) : null;
                    const openState = buildCompleted ? await inspectOpenOutput(outputPath) : null;
                    const dirtyState = buildCompleted ? await markOpenOutputDirty(outputPath) : null;
                    const outputBytesBeforeBlockedBuild = buildCompleted ? getFileSize(outputPath) : 0;
    
                    if (buildCompleted && dirtyState && dirtyState.success) {
                        const toastContainer = document.getElementById('toast-container');
                        const retryBuildButton = document.querySelector('#tab-suite [data-action="build-pdf"]');
                        if (toastContainer) {
                            toastContainer.innerHTML = '';
                        }
    
                        if (retryBuildButton) {
                            retryBuildButton.click();
                        }
                        if (buildResults.length < 2) {
                            await suiteTab._runBuild();
                        }
                        for (let attempt = 0; attempt < 30; attempt += 1) {
                            if (buildResults.length >= 2 || collectToasts().length) {
                                break;
                            }
                            await wait(100);
                        }
                    }
    
                    return {
                        fixturePath,
                        buildCompleted,
                        buildMs: Date.now() - buildStart,
                        outputPath,
                        outputExists: fileExists(outputPath),
                        legacyOutputPath,
                        legacyOutputExists: fileExists(legacyOutputPath),
                        expectedOutputPath,
                        expectedOutputExists: fileExists(expectedOutputPath),
                        outputBytes: getFileSize(outputPath),
                        stagingSiblingFiles: nodeFs.readdirSync(outputDirectory).filter((name) => /^__wss_(?:pdf|backup)_/i.test(name)),
                        debugArtifactPath,
                        debugArtifactExists: debugArtifactPath ? fileExists(debugArtifactPath) : false,
                        debugArtifactBytes: debugArtifactPath ? getFileSize(debugArtifactPath) : 0,
                        outputBytesBeforeBlockedBuild,
                        buildResult: buildResults[0] || null,
                        buildResults,
                        manifest: suiteTab.state.manifest,
                        paperStock: suiteTab.paperStockCatalog && suiteTab.paperStockCatalog.stocksById
                            ? suiteTab.paperStockCatalog.stocksById[suiteTab.state.paperStock]
                            : null,
                        ensureOpenState,
                        openState,
                        inspection,
                        dirtyState,
                        toasts: collectToasts()
                    };
                } finally {
                    suiteTab.setHostAdapterForTest(originalHostAdapter);
                    suiteTab.setPdfScannerForTest(originalPdfScanner);
                    suiteTab.setPickersForTest({ pickSourceFile: originalPickSourceFile });
                    suiteTab.deps.now = originalNow;
                }
            })()
        `,
        async (result) => {
            const sortBoundsTopLeft = (boundsList) => [...(Array.isArray(boundsList) ? boundsList : [])]
                .sort((a, b) => {
                    if (Math.abs((b?.[1] ?? 0) - (a?.[1] ?? 0)) > 0.01) {
                        return (b?.[1] ?? 0) - (a?.[1] ?? 0);
                    }
                    return (a?.[0] ?? 0) - (b?.[0] ?? 0);
                });
    
            if (result.reason) {
                throw new Error(`Wedding Suite linked-build smoke setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.manifest || result.manifest.totalPages !== 4) {
                throw new Error(`Wedding Suite linked-build smoke did not hydrate the real 4-page fixture first: ${JSON.stringify(result)}`);
            }
            if (!result.buildCompleted || !result.outputExists) {
                throw new Error(`Wedding Suite linked-build smoke did not write its output PDF: ${JSON.stringify(result)}`);
            }
            if (!result.outputBytes || result.outputBytes < 50000) {
                throw new Error(`Wedding Suite linked-build smoke wrote an unexpectedly tiny PDF, which usually means content was not placed: ${JSON.stringify(result)}`);
            }
            if (!result.debugArtifactPath || !result.debugArtifactExists || !result.debugArtifactBytes || result.debugArtifactBytes < 1000000) {
                throw new Error(`Wedding Suite linked-build smoke did not retain a usable temporary AI artifact for geometry inspection: ${JSON.stringify(result)}`);
            }
            if (
                !result.buildResult ||
                !/\.pdf$/i.test(result.buildResult.outputPath || '') ||
                result.buildResult.reviewPath ||
                !result.buildResult.debugArtifact ||
                !/\.ai$/i.test(result.buildResult.debugArtifact.path || '')
            ) {
                throw new Error(`Wedding Suite linked-build smoke drifted from the PDF-only + temporary debug-artifact contract: ${JSON.stringify(result)}`);
            }
            if (result.buildResult.openedOutput !== true || result.buildResult.openOutputWarning) {
                throw new Error(`Wedding Suite should open the generated PDF without an open-output warning: ${JSON.stringify(result)}`);
            }
            if ((result.outputPath || '').replace(/\\/g, '/') !== (result.expectedOutputPath || '').replace(/\\/g, '/')) {
                throw new Error(`Wedding Suite linked-build smoke should write the timestamped output path returned by host: ${JSON.stringify(result)}`);
            }
            if (Array.isArray(result.stagingSiblingFiles) && result.stagingSiblingFiles.length) {
                throw new Error(`Wedding Suite should not stage long-name PDF or backup siblings beside operator output: ${JSON.stringify(result)}`);
            }
            if (result.buildResult.previousOutputPath !== result.legacyOutputPath) {
                throw new Error(`Wedding Suite linked-build smoke should pass the previous output path to host cleanup: ${JSON.stringify(result)}`);
            }
            if (result.legacyOutputExists) {
                throw new Error(`Wedding Suite linked-build smoke should not leave the old non-timestamped output around: ${JSON.stringify(result)}`);
            }
            if (!/wedding suite print template\.ai$/i.test((result.buildResult.templatePathUsed || '').replace(/\\/g, '/'))) {
                throw new Error(`Wedding Suite should now clone from the setting-only AI template before rendering: ${JSON.stringify(result)}`);
            }
            if (Array.isArray(result.toasts) && result.toasts.some((text) => /cancelled|that bai|khong the build/i.test(text))) {
                throw new Error(`Wedding Suite linked-build smoke surfaced a build failure toast: ${JSON.stringify(result)}`);
            }
            if (!result.ensureOpenState || result.ensureOpenState.success !== true || result.ensureOpenState.isOpen !== true) {
                throw new Error(`Wedding Suite smoke could not restore the generated PDF before testing the dirty-file guard: ${JSON.stringify(result)}`);
            }
            if (!result.openState || result.openState.success !== true || result.openState.isOpen !== true) {
                throw new Error(`Wedding Suite should leave the generated PDF open after build: ${JSON.stringify(result)}`);
            }
            if (!result.dirtyState || result.dirtyState.success !== true || result.dirtyState.marked !== true || result.dirtyState.saved !== false) {
                throw new Error(`Wedding Suite smoke could not mark the open output dirty before retrying build: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.toasts) || !result.toasts.some((text) => text.includes('File bai in hien dang mo va chua luu'))) {
                throw new Error(`Wedding Suite should stop build and show one clear unsaved-output warning: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.buildResults) || result.buildResults.length < 2) {
                throw new Error(`Wedding Suite should attempt a second build before surfacing the unsaved-output warning: ${JSON.stringify(result)}`);
            }
            if (!result.buildResults[1] || result.buildResults[1].success !== false || result.buildResults[1].code !== 'OUTPUT_FILE_UNSAVED_OPEN') {
                throw new Error(`Wedding Suite should stop the retry with OUTPUT_FILE_UNSAVED_OPEN: ${JSON.stringify(result)}`);
            }
            if (result.outputBytesBeforeBlockedBuild !== result.outputBytes) {
                throw new Error(`Wedding Suite should not rewrite the PDF when the open output is dirty: ${JSON.stringify(result)}`);
            }
            if (result.openState.activeMatchesTarget !== true) {
                throw new Error(`Wedding Suite should keep the generated PDF active after build: ${JSON.stringify(result)}`);
            }
            if (result.openState.activeArtboardIndex !== 0) {
                throw new Error(`Wedding Suite should leave QA as the active artboard after build: ${JSON.stringify(result)}`);
            }
            if (!result.inspection || result.inspection.success !== true) {
                throw new Error(`Wedding Suite linked-build smoke could not inspect the temporary AI artifact: ${JSON.stringify(result)}`);
            }
            const qa = result.inspection.artboards[0];
            const envelope = result.inspection.artboards[1];
            const productions = result.inspection.artboards.slice(2);
            if (!qa || !envelope || !productions.length) {
                throw new Error(`Wedding Suite linked-build smoke did not produce the expected artboards: ${JSON.stringify(result)}`);
            }
            if (qa.textCount !== 1 || qa.pathCount !== 0 || qa.placedCount !== 3 || qa.guideCount !== 3) {
                throw new Error(`QA artboard drifted from the debug contract: ${JSON.stringify(result)}`);
            }
            if (!result.paperStock || !(result.paperStock.widthMm > 0) || !(result.paperStock.heightMm > 0)) {
                throw new Error(`Wedding Suite linked-build smoke could not resolve its configured paper stock: ${JSON.stringify(result)}`);
            }
            const expectedQaWidth = 10 + (Math.min(2, qa.placedCount) * ((result.paperStock.widthMm - 10) / 4));
            const expectedQaHeight = 22 + (Math.max(1, Math.ceil(qa.placedCount / 2)) * ((result.paperStock.heightMm - 10) / 2));
            if (
                Math.abs(Math.abs(qa.rectMm[2] - qa.rectMm[0]) - expectedQaWidth) > 0.3 ||
                Math.abs(Math.abs(qa.rectMm[1] - qa.rectMm[3]) - expectedQaHeight) > 0.3
            ) {
                throw new Error(`QA artboard should now fit the 2-column preview grid: ${JSON.stringify(result)}`);
            }
            if (envelope.textCount !== 0 || envelope.pathCount !== 0 || envelope.placedCount !== 1 || envelope.guideCount !== 2) {
                throw new Error(`Envelope artboard drifted from the print-only contract: ${JSON.stringify(result)}`);
            }
            for (const production of productions) {
                if (production.textCount !== 0 || production.pathCount !== 0 || production.placedCount !== 8 || production.guideCount !== 8) {
                    throw new Error(`Production artboard drifted from the print-only contract: ${JSON.stringify(result)}`);
                }
                if (
                    Math.abs(Math.abs(production.rectMm[2] - production.rectMm[0]) - result.paperStock.widthMm) > 0.3 ||
                    Math.abs(Math.abs(production.rectMm[1] - production.rectMm[3]) - result.paperStock.heightMm) > 0.3
                ) {
                    throw new Error(`Wedding Suite host did not reconcile stale panel stock dimensions from JSON: ${JSON.stringify(result)}`);
                }
            }
            const envelopePlaced = Array.isArray(envelope.placedBoundsMm) && envelope.placedBoundsMm[0] ? envelope.placedBoundsMm[0] : null;
            if (!envelopePlaced) {
                throw new Error(`Wedding Suite linked-build smoke could not read envelope bounds: ${JSON.stringify(result)}`);
            }
            const envelopeWidth = Math.abs(envelopePlaced[2] - envelopePlaced[0]);
            const envelopeHeight = Math.abs(envelopePlaced[1] - envelopePlaced[3]);
            const envelopeReference = result.openState && result.openState.envelopeReference ? result.openState.envelopeReference : null;
            const actualEnvelopeLeftOffset = envelopePlaced[0] - envelope.rectMm[0];
            const actualEnvelopeTopOffset = envelope.rectMm[1] - envelopePlaced[1];
            const envelopeMatrix = Array.isArray(envelope.placedMatrices) && envelope.placedMatrices[0] ? envelope.placedMatrices[0] : null;
            if (
                !envelopeReference ||
                Math.abs(actualEnvelopeLeftOffset - envelopeReference.leftOffsetMm) > 0.3 ||
                Math.abs(actualEnvelopeTopOffset - envelopeReference.topOffsetMm) > 0.3 ||
                envelopeWidth <= 300 ||
                envelopeHeight <= 300
            ) {
                throw new Error(`Wedding Suite envelope transform drifted from the golden AI reference: ${JSON.stringify(result)}`);
            }
            if (!envelopeMatrix || Math.abs(envelopeMatrix.mValueB) < 0.2 || Math.abs(envelopeMatrix.mValueC) < 0.2) {
                throw new Error(`Wedding Suite envelope no longer rotates into the diamond overflow placement: ${JSON.stringify(result)}`);
            }
            const envelopeGuides = sortBoundsTopLeft(envelope.guideBoundsMm);
            if (envelopeGuides.length !== 2) {
                throw new Error(`Wedding Suite envelope guide is missing from the generated AI: ${JSON.stringify(result)}`);
            }
            const expectedEnvelopeGuideLocals = [
                { left: 0.089063, top: 0.087505, right: 229.913192, bottom: 229.911634 },
                { left: 4.105644, top: 4.015097, right: 223.057181, bottom: 222.970164 }
            ];
            for (let guideIndex = 0; guideIndex < expectedEnvelopeGuideLocals.length; guideIndex += 1) {
                const guide = envelopeGuides[guideIndex];
                const expected = expectedEnvelopeGuideLocals[guideIndex];
                if (!guide) {
                    throw new Error(`Wedding Suite envelope guide ${guideIndex + 1} is missing from the generated AI: ${JSON.stringify(result)}`);
                }
                const localGuide = {
                    left: guide[0] - envelope.rectMm[0],
                    top: envelope.rectMm[1] - guide[1],
                    right: guide[2] - envelope.rectMm[0],
                    bottom: envelope.rectMm[1] - guide[3]
                };
                if (
                    Math.abs(localGuide.left - expected.left) > 0.6 ||
                    Math.abs(localGuide.top - expected.top) > 0.6 ||
                    Math.abs(localGuide.right - expected.right) > 0.6 ||
                    Math.abs(localGuide.bottom - expected.bottom) > 0.6
                ) {
                    throw new Error(`Wedding Suite envelope guide ${guideIndex + 1} no longer matches the golden AI path geometry: ${JSON.stringify(result)}`);
                }
            }
            const qaFirstPlaced = Array.isArray(qa.placedBoundsMm) && qa.placedBoundsMm[0] ? qa.placedBoundsMm[0] : null;
            const qaSecondPlaced = Array.isArray(qa.placedBoundsMm) && qa.placedBoundsMm[1] ? qa.placedBoundsMm[1] : null;
            const qaGuides = sortBoundsTopLeft(qa.guideBoundsMm);
            const qaFirstGuide = qaGuides[0] || null;
            if (!qaFirstPlaced) {
                throw new Error(`Wedding Suite linked-build smoke could not read QA preview bounds: ${JSON.stringify(result)}`);
            }
            if (!qaFirstGuide) {
                throw new Error(`Wedding Suite linked-build smoke could not read QA guide bounds: ${JSON.stringify(result)}`);
            }
            const qaCellWidth = Math.abs(qaFirstPlaced[2] - qaFirstPlaced[0]);
            const qaCellHeight = Math.abs(qaFirstPlaced[1] - qaFirstPlaced[3]);
            const qaHorizontalPitch = qaSecondPlaced ? Math.abs(qaSecondPlaced[0] - qaFirstPlaced[0]) : 0;
            const qaThirdPlaced = Array.isArray(qa.placedBoundsMm) && qa.placedBoundsMm[2] ? qa.placedBoundsMm[2] : null;
            const qaThirdWidth = qaThirdPlaced ? Math.abs(qaThirdPlaced[2] - qaThirdPlaced[0]) : 0;
            const qaThirdHeight = qaThirdPlaced ? Math.abs(qaThirdPlaced[1] - qaThirdPlaced[3]) : 0;
            const qaGuideWidth = Math.abs(qaFirstGuide[2] - qaFirstGuide[0]);
            const qaGuideHeight = Math.abs(qaFirstGuide[1] - qaFirstGuide[3]);
            const qaPreviewCount = Math.max(1, Array.isArray(qa.placedBoundsMm) ? qa.placedBoundsMm.length : (qa.placedCount || 1));
            const qaColumns = Math.min(2, qaPreviewCount);
            const qaRows = Math.max(1, Math.ceil(qaPreviewCount / 2));
            const qaWidth = Math.abs(qa.rectMm[2] - qa.rectMm[0]);
            const qaHeight = Math.abs(qa.rectMm[1] - qa.rectMm[3]);
            const expectedQaCellWidth = (qaWidth - 10) / qaColumns;
            const expectedQaCellHeight = (qaHeight - 22) / qaRows;
            const expectedQaGuideWidth = expectedQaCellWidth - 10;
            const expectedQaGuideHeight = expectedQaCellHeight - 10;
            const draftReference = result.manifest && result.manifest.lastPage ? result.manifest.lastPage : null;
            const hasDraftArtboard = !!(
                result.buildResult &&
                Array.isArray(result.buildResult.artboards) &&
                result.buildResult.artboards.some((artboard) => artboard && artboard.kind === 'draft')
            );
            if (
                Math.abs(qaFirstPlaced[0] - (qa.rectMm[0] + 5)) > 0.3 ||
                Math.abs(qaFirstPlaced[1] - (qa.rectMm[1] - 17)) > 0.3 ||
                Math.abs(qaCellWidth - expectedQaCellWidth) > 0.3 ||
                Math.abs(qaCellHeight - expectedQaCellHeight) > 0.3 ||
                (qaSecondPlaced && Math.abs(qaHorizontalPitch - expectedQaCellWidth) > 0.3) ||
                Math.abs(qaGuideWidth - expectedQaGuideWidth) > 0.5 ||
                Math.abs(qaGuideHeight - expectedQaGuideHeight) > 0.5 ||
                Math.abs(qaFirstGuide[0] - (qa.rectMm[0] + 10)) > 0.5 ||
                Math.abs(qaFirstGuide[1] - (qa.rectMm[1] - 22)) > 0.5 ||
                (qaThirdPlaced && Math.abs(qaThirdPlaced[1] - (qa.rectMm[1] - 17 - expectedQaCellHeight)) > 0.3) ||
                (hasDraftArtboard && draftReference && qaThirdPlaced && Math.abs(qaThirdWidth - draftReference.widthMm) > 0.5) ||
                (hasDraftArtboard && draftReference && qaThirdPlaced && Math.abs(qaThirdHeight - draftReference.heightMm) > 0.5)
            ) {
                throw new Error(`QA previews drifted from the fixed-grid main card layout or the draft card natural-size contract: ${JSON.stringify(result)}`);
            }
            const production = productions[0];
            const firstPlaced = Array.isArray(production.placedBoundsMm) && production.placedBoundsMm[0] ? production.placedBoundsMm[0] : null;
            const productionGuides = sortBoundsTopLeft(production.guideBoundsMm);
            const firstGuide = productionGuides[0] || null;
            if (!firstPlaced) {
                throw new Error(`Wedding Suite linked-build smoke could not read production cell bounds: ${JSON.stringify(result)}`);
            }
            if (!firstGuide) {
                throw new Error(`Wedding Suite linked-build smoke could not read production guide bounds: ${JSON.stringify(result)}`);
            }
            const cellWidth = Math.abs(firstPlaced[2] - firstPlaced[0]);
            const cellHeight = Math.abs(firstPlaced[1] - firstPlaced[3]);
            const guideWidth = Math.abs(firstGuide[2] - firstGuide[0]);
            const guideHeight = Math.abs(firstGuide[1] - firstGuide[3]);
            const secondPlaced = production.placedBoundsMm[1];
            const fifthPlaced = production.placedBoundsMm[4];
            const horizontalPitch = secondPlaced ? Math.abs(secondPlaced[0] - firstPlaced[0]) : 0;
            const bottomRowTop = fifthPlaced ? fifthPlaced[1] : 0;
            const topInset = Math.abs(firstPlaced[1] - (production.rectMm[1] - 5));
            const firstPlacedLeft = firstPlaced[0];
            const firstPlacedTop = firstPlaced[1];
            const productionWidth = Math.abs(production.rectMm[2] - production.rectMm[0]);
            const productionHeight = Math.abs(production.rectMm[1] - production.rectMm[3]);
            const expectedCellWidth = (productionWidth - 10) / 4;
            const expectedCellHeight = (productionHeight - 10) / 2;
            const expectedGuideWidth = expectedCellWidth - 10;
            const expectedGuideHeight = expectedCellHeight - 10;
            if (
                Math.abs(firstPlacedLeft - (production.rectMm[0] + 5)) > 0.3 ||
                Math.abs(firstPlacedTop - (production.rectMm[1] - 5)) > 0.3 ||
                Math.abs(cellWidth - expectedCellWidth) > 0.3 ||
                Math.abs(cellHeight - expectedCellHeight) > 0.3 ||
                Math.abs(guideWidth - expectedGuideWidth) > 0.5 ||
                Math.abs(guideHeight - expectedGuideHeight) > 0.5 ||
                Math.abs(firstGuide[0] - (production.rectMm[0] + 10)) > 0.5 ||
                Math.abs(firstGuide[1] - (production.rectMm[1] - 10)) > 0.5 ||
                Math.abs(horizontalPitch - expectedCellWidth) > 0.3 ||
                Math.abs(bottomRowTop - (production.rectMm[1] - 5 - expectedCellHeight)) > 0.3
            ) {
                throw new Error(`Wedding Suite production grid no longer follows the active paper-stock slot geometry: ${JSON.stringify(result)}`);
            }
            if (topInset > 0.3) {
                throw new Error(`Wedding Suite production cells no longer keep the outer 5mm top paper margin: ${JSON.stringify(result)}`);
            }
    
            cleanupSmokeArtifact(result.debugArtifactPath);
            cleanupSmokeOutput(result.outputPath);
        }
    );
}

module.exports = { registerWeddingSuiteSmokeTests };
