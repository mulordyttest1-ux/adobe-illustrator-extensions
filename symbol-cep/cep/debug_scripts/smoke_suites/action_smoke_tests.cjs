function registerActionSmokeTests(context) {
    const { runner, cleanupSmokeArtifact, makeHostScenarioExpression, makePresetRoundtripExpression } = context;

    runner.addTest(
        'Action tab loads with readable search UI',
        `
            (function() {
                const input = document.getElementById('action-search');
                const list = document.getElementById('action-list');
                const runMode = document.getElementById('btn-mode-run');
                const manageMode = document.getElementById('btn-mode-manage');
    
                return {
                    hasInput: input !== null,
                    hasList: list !== null,
                    hasRunMode: runMode !== null,
                    hasManageMode: manageMode !== null,
                    placeholder: input ? input.getAttribute('placeholder') : null,
                    runModeText: runMode ? runMode.textContent.trim() : null,
                    manageModeText: manageMode ? manageMode.textContent.trim() : null
                };
            })()
        `,
        async (result) => {
            if (!result.hasInput || !result.hasList || !result.hasRunMode || !result.hasManageMode) {
                throw new Error(`UI failed to load: ${JSON.stringify(result)}`);
            }
            if (result.placeholder !== 'G\u00f5 t\u00ean Preset \u0111\u1ec3 ch\u1ea1y...') {
                throw new Error(`Unexpected placeholder: ${result.placeholder}`);
            }
            if (result.runModeText !== 'Ch\u1ea1y') {
                throw new Error(`Unexpected run mode label: ${result.runModeText}`);
            }
            if (result.manageModeText !== 'Qu\u1ea3n l\u00fd') {
                throw new Error(`Unexpected manage mode label: ${result.manageModeText}`);
            }
        }
    );

    runner.addTest(
        'Header tabs are semantic and keyboard-switchable',
        `
            (function() {
                return new Promise((resolve) => {
                    const actionTab = document.getElementById('tab-action-btn');
                    const configTab = document.getElementById('tab-config-btn');
                    if (!actionTab || !configTab) {
                        resolve({ reason: 'missing_tabs' });
                        return;
                    }
    
                    actionTab.focus();
                    actionTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    
                    setTimeout(() => {
                        resolve({
                            actionRole: actionTab.getAttribute('role'),
                            configRole: configTab.getAttribute('role'),
                            actionText: actionTab.textContent.trim(),
                            configText: configTab.textContent.trim(),
                            subtitle: document.querySelector('.panel-subtitle') ? document.querySelector('.panel-subtitle').textContent.trim() : null,
                            actionSelected: actionTab.getAttribute('aria-selected'),
                            configSelected: configTab.getAttribute('aria-selected'),
                            configHidden: document.getElementById('tab-config') ? document.getElementById('tab-config').hidden : null,
                            actionHidden: document.getElementById('tab-action') ? document.getElementById('tab-action').hidden : null
                        });
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Tab shell setup failed: ${JSON.stringify(result)}`);
            }
            if (result.actionRole !== 'tab' || result.configRole !== 'tab') {
                throw new Error(`Tab roles are missing: ${JSON.stringify(result)}`);
            }
            if (result.actionText !== 'Ch\u1ea1y' || result.configText !== 'C\u1ea5u h\u00ecnh') {
                throw new Error(`Tab labels are not standardized: ${JSON.stringify(result)}`);
            }
            if (result.subtitle !== 'Ch\u1ea1y Preset v\u00e0 ch\u1ec9nh c\u1ea5u h\u00ecnh') {
                throw new Error(`Header subtitle is inconsistent: ${JSON.stringify(result)}`);
            }
            if (result.actionSelected !== 'false' || result.configSelected !== 'true') {
                throw new Error(`Keyboard tab switch did not update selection: ${JSON.stringify(result)}`);
            }
            if (result.configHidden !== false || result.actionHidden !== true) {
                throw new Error(`Tab panels did not toggle correctly: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Manager mode keeps readable empty state and uses in-panel delete confirm',
        `
            (function() {
                return new Promise((resolve) => {
                    const input = document.getElementById('action-search');
                    const manageMode = document.getElementById('btn-mode-manage');
                    if (!input || !manageMode) {
                        resolve({ reason: 'missing_controls' });
                        return;
                    }
    
                    input.value = '___codex_no_match___';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
    
                    setTimeout(() => {
                        const emptyText = (document.getElementById('action-list') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim();
    
                        manageMode.click();
    
                        setTimeout(() => {
                            const deleteBtn = document.querySelector('.btn-delete');
                            if (!deleteBtn) {
                                resolve({ reason: 'missing_delete_button', emptyText });
                                return;
                            }
    
                            const beforeCount = document.querySelectorAll('.manager-card').length;
                            deleteBtn.click();
    
                            setTimeout(() => {
                                const overlay = document.getElementById('confirm-service-overlay');
                                const title = document.getElementById('confirm-service-title');
                                const cancelBtn = overlay ? overlay.querySelector('[data-confirm-action="cancel"]') : null;
                                const closeBtn = overlay ? overlay.querySelector('[data-confirm-close]') : null;
                                const payload = {
                                    beforeCount,
                                    emptyText,
                                    overlayOpen: !!(overlay && !overlay.hidden),
                                    modalTitle: title ? title.textContent.trim() : null,
                                    deleteText: deleteBtn.textContent.replace(/\\s+/g, ' ').trim(),
                                    cancelText: cancelBtn ? cancelBtn.textContent.replace(/\\s+/g, ' ').trim() : null,
                                    hasCloseButton: !!closeBtn
                                };
    
                                if (closeBtn) {
                                    closeBtn.click();
                                }
    
                                setTimeout(() => {
                                    const overlayAfterClose = document.getElementById('confirm-service-overlay');
                                    payload.closedByClose = !!(overlayAfterClose && overlayAfterClose.hidden);
                                    payload.closeDisplay = overlayAfterClose ? overlayAfterClose.style.display : null;
    
                                    deleteBtn.click();
    
                                    setTimeout(() => {
                                        const overlaySecondPass = document.getElementById('confirm-service-overlay');
                                        const cancelBtnSecondPass = overlaySecondPass ? overlaySecondPass.querySelector('[data-confirm-action="cancel"]') : null;
    
                                        if (cancelBtnSecondPass) {
                                            cancelBtnSecondPass.click();
                                        }
    
                                        setTimeout(() => {
                                            const overlayAfterCancel = document.getElementById('confirm-service-overlay');
                                            payload.closedByCancel = !!(overlayAfterCancel && overlayAfterCancel.hidden);
                                            payload.cancelDisplay = overlayAfterCancel ? overlayAfterCancel.style.display : null;
                                            payload.afterCount = document.querySelectorAll('.manager-card').length;
                                            resolve(payload);
                                        }, 40);
                                    }, 80);
                                }, 40);
                            }, 80);
                        }, 100);
                    }, 100);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Manager mode setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.emptyText || !result.emptyText.includes('Kh\u00f4ng t\u00ecm th\u1ea5y') || !result.emptyText.includes('ph\u00f9 h\u1ee3p.')) {
                throw new Error(`Unexpected empty state: ${JSON.stringify(result)}`);
            }
            if (result.emptyText.includes('c\u1ea5u h\u00ecnh')) {
                throw new Error(`Legacy empty-state copy leaked back in: ${JSON.stringify(result)}`);
            }
            if (!result.deleteText || !result.deleteText.includes('X\u00f3a')) {
                throw new Error(`Unexpected delete button text: ${result.deleteText}`);
            }
            if (!result.overlayOpen || result.modalTitle !== 'X\u00f3a Preset n\u00e0y?') {
                throw new Error(`Delete flow did not use panel confirm dialog: ${JSON.stringify(result)}`);
            }
            if (result.cancelText !== 'Gi\u1eef l\u1ea1i Preset') {
                throw new Error(`Cancel label is not explicit enough: ${JSON.stringify(result)}`);
            }
            if (!result.hasCloseButton || !result.closedByClose) {
                throw new Error(`Close button did not dismiss the dialog: ${JSON.stringify(result)}`);
            }
            if (result.closeDisplay !== 'none') {
                throw new Error(`Close button left the dialog visible in layout: ${JSON.stringify(result)}`);
            }
            if (!result.closedByCancel) {
                throw new Error(`Cancel button did not dismiss the dialog: ${JSON.stringify(result)}`);
            }
            if (result.cancelDisplay !== 'none') {
                throw new Error(`Cancel button left the dialog visible in layout: ${JSON.stringify(result)}`);
            }
            if (result.beforeCount !== result.afterCount) {
                throw new Error(`Preset count changed after cancel: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Runtime error toast stays readable and free of mojibake',
        `
            (async function() {
                const actionTab = window.Imposition && window.Imposition.actionTab;
                const toastContainer = document.getElementById('toast-container');
                if (!actionTab || typeof actionTab._handleEngineFailure !== 'function' || !toastContainer) {
                    return { reason: 'missing_runtime_surface' };
                }
    
                toastContainer.innerHTML = '';
                await actionTab._handleEngineFailure({
                    error: 'Layout Error: Không đủ chỗ trên khổ giấy để xếp.'
                }, {});
    
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const toast = toastContainer.querySelector('.toast span');
                        const closeBtn = toastContainer.querySelector('.toast-close');
                        const toastText = toast ? toast.textContent.replace(/\\s+/g, ' ').trim() : null;
    
                        if (closeBtn) {
                            closeBtn.click();
                        }
    
                        setTimeout(() => resolve({ toastText }), 360);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Runtime toast setup failed: ${JSON.stringify(result)}`);
            }
            if (result.toastText !== 'L\u1ed7i b\u1ed1 c\u1ee5c: Kh\u00f4ng \u0111\u1ee7 ch\u1ed7 tr\u00ean kh\u1ed5 gi\u1ea5y \u0111\u1ec3 x\u1ebfp.') {
                throw new Error(`Unexpected runtime error toast: ${JSON.stringify(result)}`);
            }
            if (/(?:\u00C3|\u00C6\u00B0|\u00E1\u00BB|\u00E2\u20AC|\u00F0\u0178)/u.test(result.toastText)) {
                throw new Error(`Runtime toast still contains mojibake markers: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Preflight warning toast stays readable and free of mojibake',
        `
            (async function() {
                const actionTab = window.Imposition && window.Imposition.actionTab;
                const toastContainer = document.getElementById('toast-container');
                if (!actionTab || typeof actionTab._restoreAutoGrouping !== 'function' || !toastContainer) {
                    return { reason: 'missing_warning_surface' };
                }
    
                toastContainer.innerHTML = '';
                await actionTab._restoreAutoGrouping({
                    autoGrouped: true,
                    autoGroupName: null
                });
    
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const toast = toastContainer.querySelector('.toast span');
                        const closeBtn = toastContainer.querySelector('.toast-close');
                        const toastText = toast ? toast.textContent.replace(/\\s+/g, ' ').trim() : null;
    
                        if (closeBtn) {
                            closeBtn.click();
                        }
    
                        setTimeout(() => resolve({ toastText }), 360);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Preflight warning setup failed: ${JSON.stringify(result)}`);
            }
            if (result.toastText !== 'C\u1ea3nh b\u00e1o: kh\u00f4ng th\u1ec3 kh\u00f4i ph\u1ee5c Auto-Group an to\u00e0n.') {
                throw new Error(`Unexpected preflight warning toast: ${JSON.stringify(result)}`);
            }
            if (/(?:\u00C3|\u00C6\u00B0|\u00E1\u00BB|\u00E2\u20AC|\u00F0\u0178)/u.test(result.toastText)) {
                throw new Error(`Preflight warning still contains mojibake markers: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Preflight infrastructure failure toast stays readable and visible',
        `
            (async function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                const toastContainer = document.getElementById('toast-container');
                if (!debug || typeof debug.simulatePreflightGroupCheckFailure !== 'function' || !toastContainer) {
                    return { reason: 'missing_preflight_failure_debug' };
                }
    
                toastContainer.innerHTML = '';
                await debug.simulatePreflightGroupCheckFailure('parse_failure');
    
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const toast = toastContainer.querySelector('.toast span');
                        const closeBtn = toastContainer.querySelector('.toast-close');
                        const toastText = toast ? toast.textContent.replace(/\\s+/g, ' ').trim() : null;
    
                        if (closeBtn) {
                            closeBtn.click();
                        }
    
                        setTimeout(() => {
                            if (window.Imposition && typeof window.Imposition.disableDebug === 'function') {
                                window.Imposition.disableDebug();
                            }
                            resolve({ toastText });
                        }, 360);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Preflight infra-failure setup failed: ${JSON.stringify(result)}`);
            }
            if (result.toastText !== 'Kh\u00f4ng th\u1ec3 ki\u1ec3m tra Group tr\u01b0\u1edbc khi ch\u1ea1y. Vui l\u00f2ng t\u1ea3i l\u1ea1i panel v\u00e0 th\u1eed l\u1ea1i.') {
                throw new Error(`Unexpected preflight infra-failure toast: ${JSON.stringify(result)}`);
            }
            if (/(?:\u00C3|\u00C6\u00B0|\u00E1\u00BB|\u00E2\u20AC|\u00F0\u0178)/u.test(result.toastText)) {
                throw new Error(`Preflight infra-failure toast still contains mojibake markers: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Debug surface is opt-in instead of mounted by default',
        `
            (function() {
                const app = window.Imposition;
                const hasDefaultDebug = !!(app && app.debug);
                const enabled = app && typeof app.enableDebug === 'function' ? app.enableDebug() : null;
    
                return {
                    hasDefaultDebug,
                    enabledKeys: enabled ? Object.keys(enabled).length : 0,
                    isDebugEnabled: app && typeof app.isDebugEnabled === 'function' ? app.isDebugEnabled() : false
                };
            })()
        `,
        async (result) => {
            if (result.hasDefaultDebug) {
                throw new Error(`Debug surface should not mount by default: ${JSON.stringify(result)}`);
            }
            if (!result.isDebugEnabled || result.enabledKeys === 0) {
                throw new Error(`Debug surface could not be enabled on demand: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Fuzzy search returns filtered presets',
        `
            (function() {
                return new Promise((resolve) => {
                    const input = document.getElementById('action-search');
                    input.value = 'a4';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
    
                    setTimeout(() => {
                        const items = document.querySelectorAll('.dropdown-item');
                        resolve(items.length > 0);
                    }, 100);
                });
            })()
        `,
        async (result) => {
            if (!result) throw new Error('Fuzzy search failed to filter items');
        }
    );

    runner.addTest(
        'Keyboard navigation highlights the next preset',
        `
            (function() {
                return new Promise((resolve) => {
                    const input = document.getElementById('action-search');
    
                    input.value = '';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
    
                    setTimeout(() => {
                        const eDown = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
                        input.dispatchEvent(eDown);
    
                        setTimeout(() => {
                            const items = document.querySelectorAll('.dropdown-item');
                            if (items.length < 2) return resolve(false);
    
                            const secondItemText = items[1].textContent;
                            resolve(secondItemText.includes('\u25b6'));
                        }, 50);
                    }, 50);
                });
            })()
        `,
        async (result) => {
            if (!result) throw new Error('Keyboard navigation did not highlight the next item');
        }
    );

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

    runner.addTest(
        'Run preset save modes route explicit Save As and Save payloads through the host gateway',
        `
            (async function() {
                const actionTab = window.Imposition && window.Imposition.actionTab;
                if (!actionTab || !actionTab.hostGateway || !actionTab.csInterface) {
                    return { reason: 'missing_save_after_run_surface' };
                }
    
                const originalPreflight = actionTab.preflightOrchestrator.runAll;
                const originalPostflight = actionTab.postflightOrchestrator.runAll;
                const originalEvalScript = actionTab.csInterface.evalScript;
                const originalSave = actionTab.hostGateway.saveActiveDocumentAfterImposition;
                const originalIdentity = actionTab.hostGateway.getActiveDocumentIdentity;
                const originalRemember = actionTab.jobSaveTargetStore ? actionTab.jobSaveTargetStore.remember : null;
                const originalGet = actionTab.jobSaveTargetStore ? actionTab.jobSaveTargetStore.get : null;
                const originalBuildKey = actionTab.jobSaveTargetStore ? actionTab.jobSaveTargetStore.buildKey : null;
                const toastContainer = document.getElementById('toast-container');
                const capturedPayloads = [];
                let rememberedTarget = null;
    
                actionTab.preflightOrchestrator.runAll = async function() {
                    return { safe: true, context: {} };
                };
                actionTab.postflightOrchestrator.runAll = async function() {
                    return { successCount: 1, skippedCount: 0, failedCount: 0 };
                };
                actionTab.csInterface.evalScript = function(script, callback) {
                    callback(window.btoa(JSON.stringify({
                        success: true,
                        data: { itemsProcessed: 1, finishSize: { w: 50, h: 70 } }
                    })));
                };
                actionTab.hostGateway.saveActiveDocumentAfterImposition = async function(payloadBase64) {
                    const payload = JSON.parse(decodeURIComponent(escape(window.atob(payloadBase64))));
                    capturedPayloads.push(payload);
                    return window.btoa(JSON.stringify({
                        success: true,
                        outputName: capturedPayloads.length === 1 ? "sample_9'08 10 4.ai" : 'sample.ai',
                        outputPath: "C:/Output/sample.ai"
                    }));
                };
                actionTab.hostGateway.getActiveDocumentIdentity = async function() {
                    return window.btoa(JSON.stringify({
                        success: true,
                        documentPath: 'C:/Output/sample.ai',
                        documentName: 'sample.ai',
                        isSaved: false
                    }));
                };
                if (actionTab.jobSaveTargetStore) {
                    actionTab.jobSaveTargetStore.buildKey = function(presetId, documentPath) {
                        return presetId + '::' + String(documentPath || '').toLowerCase();
                    };
                    actionTab.jobSaveTargetStore.get = function() {
                        return rememberedTarget;
                    };
                    actionTab.jobSaveTargetStore.remember = function(entry) {
                        rememberedTarget = entry;
                        return entry;
                    };
                }
    
                if (toastContainer) {
                    toastContainer.innerHTML = '';
                }
    
                try {
                    const preset = {
                        id: 'preset_save_after_run',
                        label: 'Preset Save After Run',
                        schema: { sections: [] },
                        rawValues: {
                            save_output_dir: 'C:/Output',
                            save_filename_prefix: 'Sample'
                        }
                    };
                    const saveAsResult = await actionTab.runWithPreset(preset, null, 'save_as_new');
                    const overwriteResult = await actionTab.runWithPreset(preset, {
                        rememberedTarget: {
                            targetPath: 'C:/Output/sample.ai'
                        }
                    }, 'overwrite');
    
                    return {
                        saveAsStatus: saveAsResult && saveAsResult.saveResult ? saveAsResult.saveResult.status : null,
                        overwriteStatus: overwriteResult && overwriteResult.saveResult ? overwriteResult.saveResult.status : null,
                        payloadCount: capturedPayloads.length,
                        firstPayload: capturedPayloads[0] || null,
                        secondPayload: capturedPayloads[1] || null,
                        rememberedTargetPath: rememberedTarget ? rememberedTarget.targetPath : null
                    };
                } finally {
                    actionTab.preflightOrchestrator.runAll = originalPreflight;
                    actionTab.postflightOrchestrator.runAll = originalPostflight;
                    actionTab.csInterface.evalScript = originalEvalScript;
                    actionTab.hostGateway.saveActiveDocumentAfterImposition = originalSave;
                    actionTab.hostGateway.getActiveDocumentIdentity = originalIdentity;
                    if (actionTab.jobSaveTargetStore) {
                        actionTab.jobSaveTargetStore.remember = originalRemember;
                        actionTab.jobSaveTargetStore.get = originalGet;
                        actionTab.jobSaveTargetStore.buildKey = originalBuildKey;
                    }
                }
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Save-after-run setup failed: ${JSON.stringify(result)}`);
            }
            if (result.saveAsStatus !== 'saved' || result.overwriteStatus !== 'saved') {
                throw new Error(`Save modes should both report saved status: ${JSON.stringify(result)}`);
            }
            if (result.payloadCount !== 2) {
                throw new Error(`Expected one Save As payload and one overwrite payload: ${JSON.stringify(result)}`);
            }
            if (!result.firstPayload || result.firstPayload.outputDirectory !== 'C:/Output' || result.firstPayload.deleteExistingFirst !== true || result.firstPayload.targetPath !== '') {
                throw new Error(`Save As payload drifted: ${JSON.stringify(result)}`);
            }
            if (!result.secondPayload || result.secondPayload.targetPath !== 'C:/Output/sample.ai') {
                throw new Error(`Overwrite payload should reuse the remembered target path: ${JSON.stringify(result)}`);
            }
            if (result.rememberedTargetPath !== 'C:/Output/sample.ai') {
                throw new Error(`Save As should remember the last successful target for overwrite: ${JSON.stringify(result)}`);
            }
            if (!/^\d{1,2}'\d{2} \d{1,2} \d{1,2}$/.test(result.firstPayload.timestampSuffix || '')) {
                throw new Error(`Timestamp suffix was not formatted correctly: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Run tab smart Save As strips generated timestamp and marks the old AI for cleanup',
        `
            (async function() {
                const actionTab = window.Imposition && window.Imposition.actionTab;
                if (!actionTab || !actionTab.hostGateway || !actionTab.presetRepository) {
                    return { reason: 'missing_smart_save_surface' };
                }
    
                const originalGetById = actionTab.presetRepository.getById;
                const originalIncrementUsage = actionTab.presetRepository.incrementUsage;
                const originalRenderList = actionTab.renderList;
                const originalRequestSaveFilenamePrefix = actionTab.requestSaveFilenamePrefix;
                const originalIdentity = actionTab.hostGateway.getActiveDocumentIdentity;
                const originalSave = actionTab.hostGateway.saveActiveDocumentAfterImposition;
                const calls = [];
                let capturedPayload = null;
    
                actionTab.presetRepository.getById = function(id) {
                    calls.push(['getById', id]);
                    return {
                        id,
                        label: 'Smart Save Preset',
                        schema: { sections: [] },
                        rawValues: {
                            save_output_dir: 'C:/Output',
                            save_filename_prefix: 'Preset fallback'
                        }
                    };
                };
                actionTab.presetRepository.incrementUsage = function(id) {
                    calls.push(['incrementUsage', id]);
                    return { success: true };
                };
                actionTab.renderList = function() {
                    calls.push(['renderList']);
                };
                actionTab.requestSaveFilenamePrefix = async function(options) {
                    calls.push(['prompt', options.initialValue]);
                    return options.initialValue;
                };
                actionTab.hostGateway.getActiveDocumentIdentity = async function() {
                    calls.push(['getActiveDocumentIdentity']);
                    return window.btoa(JSON.stringify({
                        success: true,
                        documentPath: "C:/Output/thien nin m15_15'55 3 6.ai",
                        documentName: "thien nin m15_15'55 3 6.ai",
                        isSaved: true
                    }));
                };
                actionTab.hostGateway.saveActiveDocumentAfterImposition = async function(payloadBase64) {
                    capturedPayload = JSON.parse(decodeURIComponent(escape(window.atob(payloadBase64))));
                    return window.btoa(JSON.stringify({
                        success: true,
                        outputName: "thien nin m15_16'05 3 6.ai",
                        outputPath: "C:/Output/thien nin m15_16'05 3 6.ai",
                        previousFileDeleted: true
                    }));
                };
    
                try {
                    await actionTab.handleTrigger('smart_save_preset', null, 'save_as_new');
                    return {
                        calls,
                        payload: capturedPayload
                    };
                } finally {
                    actionTab.presetRepository.getById = originalGetById;
                    actionTab.presetRepository.incrementUsage = originalIncrementUsage;
                    actionTab.renderList = originalRenderList;
                    actionTab.requestSaveFilenamePrefix = originalRequestSaveFilenamePrefix;
                    actionTab.hostGateway.getActiveDocumentIdentity = originalIdentity;
                    actionTab.hostGateway.saveActiveDocumentAfterImposition = originalSave;
                }
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Smart Save As setup failed: ${JSON.stringify(result)}`);
            }
            const promptCall = (result.calls || []).find((entry) => entry[0] === 'prompt');
            if (!promptCall || promptCall[1] !== 'thien nin m15') {
                throw new Error(`Smart Save As prompt did not strip timestamp: ${JSON.stringify(result)}`);
            }
            if (!result.payload || result.payload.filenamePrefix !== 'thien nin m15') {
                throw new Error(`Smart Save As payload did not use stripped prefix: ${JSON.stringify(result)}`);
            }
            if (result.payload.targetPath !== '') {
                throw new Error(`Smart Save As must not reuse overwrite targetPath: ${JSON.stringify(result)}`);
            }
            if (result.payload.previousDocumentPath !== "C:/Output/thien nin m15_15'55 3 6.ai") {
                throw new Error(`Smart Save As did not send previous document path for cleanup: ${JSON.stringify(result)}`);
            }
            if (result.payload.outputFormat !== 'ai') {
                throw new Error(`Smart Save As should preserve the previous AI output format: ${JSON.stringify(result)}`);
            }
            if (result.payload.deletePreviousAfterSave !== true) {
                throw new Error(`Smart Save As did not request old-file cleanup: ${JSON.stringify(result)}`);
            }
        }
    );

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

module.exports = { registerActionSmokeTests };
