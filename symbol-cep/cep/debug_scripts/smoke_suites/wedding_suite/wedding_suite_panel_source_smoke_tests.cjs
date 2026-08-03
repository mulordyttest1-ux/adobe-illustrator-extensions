function registerWeddingSuitePanelSourceSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
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
}

module.exports = { registerWeddingSuitePanelSourceSmokeTests };
