function registerActionFailureSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Engine failure from a real preset click still restores auto-group and shows an error toast',
        `
            (function() {
                return new Promise((resolve) => {
                    const actionTab = window.Imposition && window.Imposition.actionTab;
                    const toastContainer = document.getElementById('toast-container');
                    if (!actionTab || !actionTab.preflightOrchestrator || !actionTab.csInterface || !toastContainer) {
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
                                const restoreScripts = [];
    
                                actionTab.lastPostflightSummary = { successCount: 99 };
                                toastContainer.innerHTML = '';
    
                                actionTab.preflightOrchestrator.runAll = async function() {
                                    return {
                                        safe: true,
                                        context: {
                                            autoGrouped: true,
                                            autoGroupName: 'AUTO_GROUP_SMOKE'
                                        }
                                    };
                                };
                                actionTab.csInterface.evalScript = function(script, callback) {
                                    engineCalls += 1;
                                    callback(window.btoa(JSON.stringify({
                                        success: false,
                                        error: 'Boom failure'
                                    })));
                                };
                                if (actionTab.bridgeInst) {
                                    actionTab.bridgeInst.eval = async function(script) {
                                        restoreScripts.push(script);
                                        return window.btoa(JSON.stringify({ success: true }));
                                    };
                                }
    
                                item.click();
    
                                setTimeout(() => {
                                    const promptInput = document.getElementById('save-filename-prompt-input');
                                    const promptConfirm = document.querySelector('[data-save-filename-action="confirm"]');
                                    if (promptInput && promptConfirm) {
                                        promptInput.value = 'Smoke engine fail';
                                        promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                                        promptConfirm.click();
                                    }
                                }, 40);
    
                                setTimeout(() => {
                                    const toastTexts = Array.from(toastContainer.querySelectorAll('.toast'))
                                        .map((toast) => toast.textContent.replace(/\\s+/g, ' ').trim());
    
                                    actionTab.preflightOrchestrator.runAll = originalPreflight;
                                    actionTab.csInterface.evalScript = originalEvalScript;
                                    if (actionTab.bridgeInst) {
                                        actionTab.bridgeInst.eval = originalBridgeEval;
                                    }
    
                                    resolve({
                                        engineCalls,
                                        restoreCalls: restoreScripts.length,
                                        restoreScript: restoreScripts[0] || null,
                                        latestSummary: actionTab.lastPostflightSummary,
                                        toastTexts
                                    });
                                }, 420);
                            }, 80);
                        }, 80);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Engine failure setup failed: ${JSON.stringify(result)}`);
            }
            if (result.engineCalls !== 1) {
                throw new Error(`Engine failure path should hit engine exactly once: ${JSON.stringify(result)}`);
            }
            if (result.restoreCalls !== 1) {
                throw new Error(`Engine failure path should still restore auto-group once: ${JSON.stringify(result)}`);
            }
            if (!result.restoreScript || !result.restoreScript.includes('Bridge.ungroupAutoGrouped')) {
                throw new Error(`Restore path did not use the expected bridge call: ${JSON.stringify(result)}`);
            }
            if (result.latestSummary !== null) {
                throw new Error(`Engine failure path should leave lastPostflightSummary cleared: ${JSON.stringify(result)}`);
            }
            if (Array.isArray(result.toastTexts) && result.toastTexts.length > 0 && !result.toastTexts.some((text) => text.includes('Boom failure'))) {
                throw new Error(`Engine failure toast text drifted from the runtime error: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerActionFailureSmokeTests };
