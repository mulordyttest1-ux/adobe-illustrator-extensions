function registerActionRunSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Live run happy path resolves the clicked preset and retains postflight summary',
        `
            (function() {
                return new Promise((resolve) => {
                    const actionTab = window.Imposition && window.Imposition.actionTab;
                    const toastContainer = document.getElementById('toast-container');
                    if (!actionTab || !actionTab.preflightOrchestrator || !actionTab.postflightOrchestrator || !actionTab.csInterface) {
                        resolve({ reason: 'missing_live_run_surface' });
                        return;
                    }

                    if (typeof switchTab === 'function') {
                        switchTab('action');
                    }

                    setTimeout(() => {
                        const runMode = document.getElementById('btn-mode-run');
                        if (runMode && runMode.getAttribute('aria-pressed') !== 'true') {
                            runMode.click();
                        }

                        setTimeout(() => {
                            const input = document.getElementById('action-search');
                            if (!input) {
                                resolve({ reason: 'missing_action_search' });
                                return;
                            }

                            input.value = '';
                            input.dispatchEvent(new Event('input', { bubbles: true }));

                            setTimeout(() => {
                                const item = document.querySelector('.dropdown-item');
                                if (!item) {
                                    resolve({ reason: 'missing_dropdown_item' });
                                    return;
                                }

                                const clickedId = item.dataset.id;
                                const originalPreflight = actionTab.preflightOrchestrator.runAll;
                                const originalPostflight = actionTab.postflightOrchestrator.runAll;
                                const originalEvalScript = actionTab.csInterface.evalScript;
                                const originalBridgeEval = actionTab.bridgeInst ? actionTab.bridgeInst.eval : null;
                                const engineScripts = [];
                                const restoreScripts = [];
                                let capturedPreset = null;
                                let postflightCalls = 0;

                                actionTab.lastPostflightSummary = { stale: true };
                                if (toastContainer) {
                                    toastContainer.innerHTML = '';
                                }

                                actionTab.preflightOrchestrator.runAll = async function() {
                                    return { safe: true, context: {} };
                                };
                                actionTab.postflightOrchestrator.runAll = async function(context) {
                                    postflightCalls += 1;
                                    return {
                                        successCount: 1,
                                        skippedCount: 0,
                                        failedCount: 0,
                                        label: context && context.preset ? context.preset.label : null
                                    };
                                };
                                actionTab.csInterface.evalScript = function(script, callback) {
                                    engineScripts.push(script);
                                    const match = script.match(/run\\("([A-Za-z0-9+/=]+)"\\)$/);
                                    if (match) {
                                        try {
                                            capturedPreset = JSON.parse(decodeURIComponent(escape(window.atob(match[1]))));
                                        } catch (error) {
                                            capturedPreset = { parseError: String(error) };
                                        }
                                    }
                                    callback(window.btoa(JSON.stringify({
                                        success: true,
                                        data: {
                                            itemsProcessed: 2,
                                            finishSize: { w: 50, h: 70 }
                                        }
                                    })));
                                };
                                if (actionTab.bridgeInst) {
                                    actionTab.bridgeInst.eval = async function(script) {
                                        if (script && script.indexOf('Bridge.ungroupAutoGrouped') !== -1) {
                                            restoreScripts.push(script);
                                        }
                                        return window.btoa(JSON.stringify({ success: true }));
                                    };
                                }

                                item.click();

                                setTimeout(() => {
                                    actionTab.preflightOrchestrator.runAll = originalPreflight;
                                    actionTab.postflightOrchestrator.runAll = originalPostflight;
                                    actionTab.csInterface.evalScript = originalEvalScript;
                                    if (actionTab.bridgeInst) {
                                        actionTab.bridgeInst.eval = originalBridgeEval;
                                    }

                                    resolve({
                                        clickedId,
                                        engineCalls: engineScripts.length,
                                        restoreCalls: restoreScripts.length,
                                        postflightCalls,
                                        capturedPresetId: capturedPreset ? capturedPreset.id : null,
                                        capturedPresetLabel: capturedPreset ? capturedPreset.label : null,
                                        latestSummary: actionTab.lastPostflightSummary
                                    });
                                }, 760);
                            }, 80);
                        }, 80);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Live run happy-path setup failed: ${JSON.stringify(result)}`);
            }
            if (result.engineCalls !== 1) {
                throw new Error(`Happy path should hit engine exactly once: ${JSON.stringify(result)}`);
            }
            if (result.postflightCalls !== 1) {
                throw new Error(`Happy path should run postflight exactly once: ${JSON.stringify(result)}`);
            }
            if (result.restoreCalls !== 0) {
                throw new Error(`Happy path should not restore when preflight context is empty: ${JSON.stringify(result)}`);
            }
            if (!result.capturedPresetId || result.capturedPresetId !== result.clickedId) {
                throw new Error(`Engine payload drifted from clicked preset: ${JSON.stringify(result)}`);
            }
            if (!result.capturedPresetLabel) {
                throw new Error(`Resolved preset label was not preserved: ${JSON.stringify(result)}`);
            }
            if (!result.latestSummary || result.latestSummary.successCount !== 1 || result.latestSummary.failedCount !== 0) {
                throw new Error(`Happy path did not retain postflight summary: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Unsafe preflight from a real preset click blocks the engine and clears stale summary',
        `
            (function() {
                return new Promise((resolve) => {
                    const actionTab = window.Imposition && window.Imposition.actionTab;
                    if (!actionTab || !actionTab.preflightOrchestrator || !actionTab.csInterface) {
                        resolve({ reason: 'missing_live_run_surface' });
                        return;
                    }

                    if (typeof switchTab === 'function') {
                        switchTab('action');
                    }

                    setTimeout(() => {
                        const runMode = document.getElementById('btn-mode-run');
                        if (runMode && runMode.getAttribute('aria-pressed') !== 'true') {
                            runMode.click();
                        }

                        setTimeout(() => {
                            const input = document.getElementById('action-search');
                            if (!input) {
                                resolve({ reason: 'missing_action_search' });
                                return;
                            }

                            input.value = '';
                            input.dispatchEvent(new Event('input', { bubbles: true }));

                            setTimeout(() => {
                                const item = document.querySelector('.dropdown-item');
                                if (!item) {
                                    resolve({ reason: 'missing_dropdown_item' });
                                    return;
                                }

                                const originalPreflight = actionTab.preflightOrchestrator.runAll;
                                const originalEvalScript = actionTab.csInterface.evalScript;
                                const originalBridgeEval = actionTab.bridgeInst ? actionTab.bridgeInst.eval : null;
                                let engineCalls = 0;
                                let restoreCalls = 0;

                                actionTab.lastPostflightSummary = { failedCount: 99 };
                                actionTab.preflightOrchestrator.runAll = async function() {
                                    return { safe: false, context: { autoGrouped: true } };
                                };
                                actionTab.csInterface.evalScript = function(script, callback) {
                                    engineCalls += 1;
                                    callback(window.btoa(JSON.stringify({ success: true, data: {} })));
                                };
                                if (actionTab.bridgeInst) {
                                    actionTab.bridgeInst.eval = async function(script) {
                                        restoreCalls += 1;
                                        return window.btoa(JSON.stringify({ success: true }));
                                    };
                                }

                                item.click();

                                setTimeout(() => {
                                    const promptInput = document.getElementById('save-filename-prompt-input');
                                    const promptConfirm = document.querySelector('[data-save-filename-action="confirm"]');
                                    if (promptInput && promptConfirm) {
                                        promptInput.value = 'Smoke unsafe';
                                        promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                                        promptConfirm.click();
                                    }
                                }, 40);

                                setTimeout(() => {
                                    actionTab.preflightOrchestrator.runAll = originalPreflight;
                                    actionTab.csInterface.evalScript = originalEvalScript;
                                    if (actionTab.bridgeInst) {
                                        actionTab.bridgeInst.eval = originalBridgeEval;
                                    }

                                    resolve({
                                        engineCalls,
                                        restoreCalls,
                                        latestSummary: actionTab.lastPostflightSummary
                                    });
                                }, 220);
                            }, 80);
                        }, 80);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Unsafe preflight setup failed: ${JSON.stringify(result)}`);
            }
            if (result.engineCalls !== 0) {
                throw new Error(`Unsafe preflight should block engine execution: ${JSON.stringify(result)}`);
            }
            if (result.restoreCalls !== 0) {
                throw new Error(`Unsafe preflight should not trigger restore: ${JSON.stringify(result)}`);
            }
            if (result.latestSummary !== null) {
                throw new Error(`Unsafe preflight should leave lastPostflightSummary cleared: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerActionRunSmokeTests };
