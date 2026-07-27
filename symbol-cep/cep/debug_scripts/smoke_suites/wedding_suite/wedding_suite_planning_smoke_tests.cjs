function registerWeddingSuitePlanningSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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
}

module.exports = { registerWeddingSuitePlanningSmokeTests };
