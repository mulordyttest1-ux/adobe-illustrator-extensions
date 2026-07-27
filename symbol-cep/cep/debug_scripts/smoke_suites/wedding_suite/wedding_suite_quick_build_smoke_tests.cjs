function registerWeddingSuiteQuickBuildSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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
            if (result.jobQuantityControl) {
                throw new Error(`Wedding Suite should no longer render quantity input: ${JSON.stringify(result)}`);
            }
            if (!result.summaryGrid) {
                throw new Error(`Wedding Suite should keep the current output summary panel: ${JSON.stringify(result)}`);
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
}

module.exports = { registerWeddingSuiteQuickBuildSmokeTests };
