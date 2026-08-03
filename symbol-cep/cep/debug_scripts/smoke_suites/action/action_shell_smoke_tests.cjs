function registerActionShellSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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
}

module.exports = { registerActionShellSmokeTests };
