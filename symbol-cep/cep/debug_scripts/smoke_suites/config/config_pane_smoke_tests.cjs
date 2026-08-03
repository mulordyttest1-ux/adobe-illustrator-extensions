function registerConfigPaneSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Config tab shows read-only invariant summary instead of invariant inputs',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }

                    setTimeout(() => {
                        const summary = document.querySelector('[data-readonly-summary="sec_options"]');
                        resolve({
                            hasCloneInput: !!document.getElementById('opt_clone'),
                            hasCheckpointInput: !!document.getElementById('opt_mod_layout_checkpoint'),
                            hasSummary: !!summary,
                            summaryText: summary ? summary.textContent.replace(/\\s+/g, ' ').trim() : null
                        });
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.hasCloneInput) {
                throw new Error(`Invariant clone input should not be rendered: ${JSON.stringify(result)}`);
            }
            if (result.hasCheckpointInput) {
                throw new Error(`Invariant checkpoint input should not be rendered: ${JSON.stringify(result)}`);
            }
            if (!result.hasSummary) {
                throw new Error(`Missing read-only invariant summary: ${JSON.stringify(result)}`);
            }
            if (!result.summaryText || !result.summaryText.includes('Luồng cố định')) {
                throw new Error(`Unexpected summary content: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Config pane uses compact placeholders for numeric groups',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }

                    setTimeout(() => {
                        resolve({
                            hasPaneHost: !!document.querySelector('.config-pane-host'),
                            abw: document.getElementById('ab_w') ? document.getElementById('ab_w').getAttribute('placeholder') : null,
                            abh: document.getElementById('ab_h') ? document.getElementById('ab_h').getAttribute('placeholder') : null,
                            finishW: document.getElementById('finish_w') ? document.getElementById('finish_w').getAttribute('placeholder') : null,
                            safeTop: document.getElementById('safe_top') ? document.getElementById('safe_top').getAttribute('placeholder') : null,
                            safeLeft: document.getElementById('safe_left') ? document.getElementById('safe_left').getAttribute('placeholder') : null,
                            sheetLeft: document.getElementById('sheet_m_left') ? document.getElementById('sheet_m_left').getAttribute('placeholder') : null,
                            sheetBottom: document.getElementById('sheet_m_bot') ? document.getElementById('sheet_m_bot').getAttribute('placeholder') : null
                        });
                    }, 100);
                });
            })()
        `,
        async (result) => {
            if (!result.hasPaneHost) {
                throw new Error(`Config pane host did not mount: ${JSON.stringify(result)}`);
            }
            if (result.abw !== 'W' || result.abh !== 'H') {
                throw new Error(`Artboard placeholders are not compact: ${JSON.stringify(result)}`);
            }
            if (result.finishW !== 'W') {
                throw new Error(`Finish width placeholder is not compact: ${JSON.stringify(result)}`);
            }
            if (result.safeTop !== 'T' || result.safeLeft !== 'L') {
                throw new Error(`Safe margin placeholders are not compact: ${JSON.stringify(result)}`);
            }
            if (result.sheetLeft !== 'L' || result.sheetBottom !== 'B') {
                throw new Error(`Sheet margin placeholders are not compact: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Processing rows wrap long labels without clipping into controls',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }

                    setTimeout(() => {
                        const rotateRow = document.querySelector('.pane-setting-row[data-field-id="opt_custom_rotate"]');
                        const rotateLabel = rotateRow ? rotateRow.querySelector('.pane-setting-label') : null;
                        const rotateControl = rotateRow ? rotateRow.querySelector('.pane-setting-control') : null;
                        const angleRow = document.querySelector('.pane-setting-row[data-field-id="custom_rotate_angle"]');
                        const legacyBinding = document.querySelector('.tp-lblv[data-field-id="opt_custom_rotate"]');

                        if (!rotateRow || !rotateLabel || !rotateControl || !angleRow) {
                            resolve({ reason: 'missing_processing_rows' });
                            return;
                        }

                        const labelStyle = window.getComputedStyle(rotateLabel);
                        const labelRect = rotateLabel.getBoundingClientRect();
                        const controlRect = rotateControl.getBoundingClientRect();
                        const sameRow = Math.abs(labelRect.top - controlRect.top) < 18;

                        resolve({
                            hasLegacyBinding: !!legacyBinding,
                            rotateLabel: rotateLabel.textContent.replace(/\\s+/g, ' ').trim(),
                            angleLabel: angleRow.querySelector('.pane-setting-label')
                                ? angleRow.querySelector('.pane-setting-label').textContent.replace(/\\s+/g, ' ').trim()
                                : null,
                            labelWhiteSpace: labelStyle.whiteSpace,
                            labelWraps: rotateLabel.clientHeight > 18,
                            sameRow,
                            labelRight: labelRect.right,
                            controlLeft: controlRect.left,
                            labelBottom: labelRect.bottom,
                            controlTop: controlRect.top
                        });
                    }, 120);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Processing layout setup failed: ${JSON.stringify(result)}`);
            }
            if (result.hasLegacyBinding) {
                throw new Error(`Processing row is still using legacy Tweakpane binding layout: ${JSON.stringify(result)}`);
            }
            if (result.rotateLabel !== '08. Xoay toàn bộ thiết kế (Custom Rotation)') {
                throw new Error(`Unexpected processing label text: ${JSON.stringify(result)}`);
            }
            if (result.angleLabel !== 'Góc xoay (độ)') {
                throw new Error(`Nested angle label still carries legacy prefix hacks: ${JSON.stringify(result)}`);
            }
            if (result.labelWhiteSpace !== 'normal') {
                throw new Error(`Processing label is not allowed to wrap: ${JSON.stringify(result)}`);
            }
            if (!result.labelWraps) {
                throw new Error(`Long processing label did not wrap in compact panel width: ${JSON.stringify(result)}`);
            }
            if (result.sameRow && result.labelRight > result.controlLeft + 1) {
                throw new Error(`Processing label is overlapping its control: ${JSON.stringify(result)}`);
            }
            if (!result.sameRow && result.controlTop < result.labelBottom - 1) {
                throw new Error(`Processing control is still intruding into the label block: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Schema controls stay hidden until edit mode is enabled',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }

                    setTimeout(() => {
                        const toggle = document.getElementById('btn-toggle-edit');
                        if (!toggle) {
                            resolve({ reason: 'missing_edit_toggle' });
                            return;
                        }

                        const beforeButtons = document.querySelectorAll('.pane-schema-btn').length;
                        toggle.click();

                        setTimeout(() => {
                            resolve({
                                beforeButtons,
                                afterButtons: document.querySelectorAll('.pane-schema-btn').length,
                                afterRemovals: document.querySelectorAll('.pane-schema-remove').length
                            });
                        }, 120);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Schema mode setup failed: ${JSON.stringify(result)}`);
            }
            if (result.beforeButtons !== 0) {
                throw new Error(`Schema controls should stay hidden by default: ${JSON.stringify(result)}`);
            }
            if (result.afterButtons === 0) {
                throw new Error(`Schema controls did not appear in edit mode: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Config pane internal buttons do not submit the preset form',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }

                    setTimeout(() => {
                        const select = document.getElementById('load-preset-select');
                        if (!select) {
                            resolve({ reason: 'missing_preset_select' });
                            return;
                        }

                        const presetOption = Array.from(select.options).find((option) => !!option.value);
                        if (!presetOption) {
                            resolve({ reason: 'missing_saved_preset' });
                            return;
                        }

                        select.value = presetOption.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(() => {
                            const paneButton = document.querySelector('.config-pane-host button');
                            if (!paneButton) {
                                resolve({ reason: 'missing_pane_button' });
                                return;
                            }

                            paneButton.click();

                            setTimeout(() => {
                                const toastTexts = Array.from(document.querySelectorAll('#toast-container .toast'))
                                    .map((toast) => toast.textContent.replace(/\\s+/g, ' ').trim());

                                resolve({
                                    buttonType: paneButton.type,
                                    toastTexts
                                });
                            }, 180);
                        }, 160);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Pane button guard setup failed: ${JSON.stringify(result)}`);
            }
            if (result.buttonType !== 'button') {
                throw new Error(`Pane internal button can still submit the form: ${JSON.stringify(result)}`);
            }
            if ((result.toastTexts || []).some((text) => text.includes('Da Cap nhat') || text.includes('Đã cập nhật'))) {
                throw new Error(`Clicking pane internals still triggered preset save: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerConfigPaneSmokeTests };
