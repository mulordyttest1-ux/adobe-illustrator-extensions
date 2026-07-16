function registerConfigSmokeTests(context) {
    const { runner, cleanupSmokeArtifact, makeHostScenarioExpression, makePresetRoundtripExpression } = context;

    runner.addTest(
        'Config tab resets draft state when preset dropdown returns to blank',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }
    
                    setTimeout(() => {
                        const select = document.getElementById('load-preset-select');
                        const presetId = document.getElementById('preset_id');
                        const presetName = document.getElementById('preset_name');
                        const dryRun = document.getElementById('btn-dry-run');
    
                        if (!select || !presetId || !presetName || !dryRun) {
                            resolve({ reason: 'missing_config_controls' });
                            return;
                        }
    
                        const presetOption = Array.from(select.options).find(function(option) {
                            return !!option.value;
                        });
    
                        if (!presetOption) {
                            resolve({ reason: 'missing_saved_preset' });
                            return;
                        }
    
                        select.value = presetOption.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
    
                        setTimeout(() => {
                            const loadedSelect = document.getElementById('load-preset-select');
                            const loadedPresetId = document.getElementById('preset_id');
                            const loadedPresetName = document.getElementById('preset_name');
    
                            if (!loadedSelect || !loadedPresetId || !loadedPresetName) {
                                resolve({ reason: 'missing_loaded_controls' });
                                return;
                            }
    
                            const loadedState = {
                                selectedValue: loadedSelect.value,
                                presetId: loadedPresetId.value,
                                presetName: loadedPresetName.value
                            };
    
                            loadedSelect.value = '';
                            loadedSelect.dispatchEvent(new Event('change', { bubbles: true }));
    
                            setTimeout(() => {
                                const resetSelect = document.getElementById('load-preset-select');
                                const resetPresetId = document.getElementById('preset_id');
                                const resetPresetName = document.getElementById('preset_name');
                                const resetDryRun = document.getElementById('btn-dry-run');
    
                                resolve({
                                    loadedSelectedValue: loadedState.selectedValue,
                                    loadedPresetId: loadedState.presetId,
                                    loadedPresetName: loadedState.presetName,
                                    resetSelectedValue: resetSelect ? resetSelect.value : null,
                                    resetPresetId: resetPresetId ? resetPresetId.value : null,
                                    resetPresetName: resetPresetName ? resetPresetName.value : null,
                                    hasDryRun: !!resetDryRun,
                                    activeElementId: document.activeElement ? document.activeElement.id : null
                                });
                            }, 120);
                        }, 120);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Config test setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.loadedSelectedValue || !result.loadedPresetId || !result.loadedPresetName) {
                throw new Error(`Preset did not load before reset: ${JSON.stringify(result)}`);
            }
            if (result.resetSelectedValue !== '') {
                throw new Error(`Preset dropdown did not reset: ${JSON.stringify(result)}`);
            }
            if (result.resetPresetId !== '') {
                throw new Error(`preset_id was not cleared: ${JSON.stringify(result)}`);
            }
            if (result.resetPresetName !== '') {
                throw new Error(`preset_name was not cleared: ${JSON.stringify(result)}`);
            }
            if (!result.hasDryRun) {
                throw new Error(`Dry run button disappeared after reset: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Config save button persists a draft preset through reload without mutating tracked storage',
        makePresetRoundtripExpression(`
            const overlay = installPresetFsOverlay();
            if (overlay.reason) {
                return { reason: overlay.reason };
            }
    
            const configTab = window.Imposition && window.Imposition.configTab;
            const originalLastActive = window.localStorage.getItem(overlay.lastActiveKey);
    
            try {
                const toastContainer = document.getElementById('toast-container');
                const presetLabel = 'Codex Roundtrip Save ' + Date.now();
    
                if (!configTab || typeof configTab.resetDraft !== 'function') {
                    return { reason: 'missing_roundtrip_surface' };
                }
    
                if (typeof switchTab === 'function') {
                    switchTab('config');
                }
    
                await wait(100);
                if (toastContainer) {
                    toastContainer.innerHTML = '';
                }
    
                configTab.resetDraft();
                await wait(140);
    
                setInputValue('preset_name', presetLabel);
                setInputValue('finish_w', '123');
                setInputValue('finish_h', '234');
                setInputValue('safe_top', '7');
                setCheckboxValue('opt_custom_rotate', true);
                await wait(40);
                setInputValue('custom_rotate_angle', '90');
    
                const saveButton = document.getElementById('btn-save');
                if (!saveButton) {
                    return { reason: 'missing_save_button' };
                }
    
                if (toastContainer) {
                    toastContainer.innerHTML = '';
                }
    
                const saveForm = document.getElementById('config-form');
                saveButton.click();
                await wait(100);
                if (saveForm && !document.getElementById('preset_id').value && typeof saveForm.requestSubmit === 'function') {
                    saveForm.requestSubmit(saveButton);
                    await wait(220);
                } else {
                    await wait(180);
                }
    
                await waitFor(() => collectToastTexts().some((text) => text.indexOf(presetLabel) !== -1), 900, 50);
    
                const toastTextsAfterSave = collectToastTexts();
    
                const select = document.getElementById('load-preset-select');
                const presetId = document.getElementById('preset_id');
                if (!select || !presetId) {
                    return { reason: 'missing_saved_controls' };
                }
    
                const savedOption = findOptionByText(select, presetLabel);
                const savedId = presetId.value;
                const lastActiveAfterSave = window.localStorage.getItem(overlay.lastActiveKey);
    
                configTab.resetDraft();
                await wait(140);
    
                const reloadSelect = document.getElementById('load-preset-select');
                if (!reloadSelect || !savedOption) {
                    return {
                        reason: savedOption ? 'missing_reload_select' : 'missing_saved_option',
                        presetLabel,
                        savedId,
                        lastActiveAfterSave,
                        toastTexts: collectToastTexts()
                    };
                }
    
                reloadSelect.value = savedOption.value;
                reloadSelect.dispatchEvent(new Event('change', { bubbles: true }));
                await wait(180);
    
                return {
                    presetLabel,
                    savedId,
                    optionValue: savedOption.value,
                    lastActiveAfterSave,
                    toastTextsAfterSave,
                    toastTexts: collectToastTexts(),
                    reloadedPresetId: document.getElementById('preset_id') ? document.getElementById('preset_id').value : null,
                    reloadedPresetName: document.getElementById('preset_name') ? document.getElementById('preset_name').value : null,
                    reloadedFinishW: document.getElementById('finish_w') ? document.getElementById('finish_w').value : null,
                    reloadedFinishH: document.getElementById('finish_h') ? document.getElementById('finish_h').value : null,
                    reloadedSafeTop: document.getElementById('safe_top') ? document.getElementById('safe_top').value : null,
                    reloadedRotateEnabled: document.getElementById('opt_custom_rotate') ? document.getElementById('opt_custom_rotate').checked : null,
                    reloadedRotateAngle: document.getElementById('custom_rotate_angle') ? document.getElementById('custom_rotate_angle').value : null
                };
            } finally {
                overlay.restore();
                if (typeof switchTab === 'function') {
                    switchTab('config');
                }
                await wait(60);
                if (configTab && typeof configTab.resetDraft === 'function') {
                    configTab.resetDraft();
                    await wait(80);
                }
                if (originalLastActive === null) {
                    window.localStorage.removeItem(overlay.lastActiveKey);
                } else {
                    window.localStorage.setItem(overlay.lastActiveKey, originalLastActive);
                }
            }
        `),
        async (result) => {
            if (result.reason) {
                throw new Error(`Preset save roundtrip setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.savedId || result.savedId !== result.optionValue) {
                throw new Error(`Saved preset did not roundtrip into the dropdown: ${JSON.stringify(result)}`);
            }
            if (result.lastActiveAfterSave !== result.savedId) {
                throw new Error(`Save flow did not update last_active: ${JSON.stringify(result)}`);
            }
            const saveToastTexts = []
                .concat(Array.isArray(result.toastTextsAfterSave) ? result.toastTextsAfterSave : [])
                .concat(Array.isArray(result.toastTexts) ? result.toastTexts : []);
            if (!saveToastTexts.some((text) => text.includes(result.presetLabel))) {
                throw new Error(`Save flow did not surface a success toast for the saved preset: ${JSON.stringify(result)}`);
            }
            if (result.reloadedPresetId !== result.savedId) {
                throw new Error(`Reloaded preset id drifted after save: ${JSON.stringify(result)}`);
            }
            if (result.reloadedPresetName !== result.presetLabel) {
                throw new Error(`Reloaded preset label drifted after save: ${JSON.stringify(result)}`);
            }
            if (result.reloadedFinishW !== '123' || result.reloadedFinishH !== '234') {
                throw new Error(`Saved size values did not reload into the form: ${JSON.stringify(result)}`);
            }
            if (result.reloadedSafeTop !== '7') {
                throw new Error(`Saved margin value did not reload into the form: ${JSON.stringify(result)}`);
            }
            if (result.reloadedRotateEnabled !== true || result.reloadedRotateAngle !== '90') {
                throw new Error(`Saved processing toggle drifted after reload: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Saved preset roundtrips into manager mode and resolves the same preset on run',
        makePresetRoundtripExpression(`
            const overlay = installPresetFsOverlay();
            if (overlay.reason) {
                return { reason: overlay.reason };
            }
    
            const configTab = window.Imposition && window.Imposition.configTab;
            const actionTab = window.Imposition && window.Imposition.actionTab;
            const originalLastActive = window.localStorage.getItem(overlay.lastActiveKey);
    
            try {
                const presetLabel = 'Codex Roundtrip Manage ' + Date.now();
    
                if (!configTab || typeof configTab.resetDraft !== 'function' || !actionTab || typeof actionTab.runWithPreset !== 'function') {
                    return { reason: 'missing_roundtrip_surface' };
                }
    
                if (typeof switchTab === 'function') {
                    switchTab('config');
                }
    
                await wait(100);
                configTab.resetDraft();
                await wait(140);
    
                setInputValue('preset_name', presetLabel);
                setInputValue('finish_w', '150');
                setInputValue('finish_h', '220');
                setInputValue('safe_top', '5');
    
                const saveButton = document.getElementById('btn-save');
                if (!saveButton) {
                    return { reason: 'missing_save_button' };
                }
    
                const saveForm = document.getElementById('config-form');
                saveButton.click();
                await wait(100);
                if (saveForm && !document.getElementById('preset_id').value && typeof saveForm.requestSubmit === 'function') {
                    saveForm.requestSubmit(saveButton);
                    await wait(220);
                } else {
                    await wait(180);
                }
    
                const savedId = document.getElementById('preset_id') ? document.getElementById('preset_id').value : null;
                if (!savedId) {
                    return { reason: 'missing_saved_id', presetLabel };
                }
    
                if (typeof switchTab === 'function') {
                    switchTab('action');
                }
    
                await wait(100);
                const manageMode = document.getElementById('btn-mode-manage');
                if (manageMode && manageMode.getAttribute('aria-pressed') !== 'true') {
                    manageMode.click();
                }
    
                await wait(140);
    
                const runButton = document.querySelector('.manager-run-btn[data-id="' + savedId + '"]');
                const managerCard = runButton ? runButton.closest('.manager-card') : null;
                const title = managerCard ? managerCard.querySelector('.manager-card-title') : null;
                if (!runButton || !managerCard || !title) {
                    return { reason: 'missing_manager_card', presetLabel, savedId };
                }
    
                const originalRun = actionTab.runWithPreset;
                let capturedPreset = null;
                actionTab.runWithPreset = async function(preset) {
                    capturedPreset = preset;
                    return { success: true };
                };
    
                runButton.click();
                await wait(120);
                actionTab.runWithPreset = originalRun;
    
                return {
                    presetLabel,
                    savedId,
                    cardTitle: title.textContent.replace(/\\s+/g, ' ').trim(),
                    runButtonId: runButton.getAttribute('data-id'),
                    capturedPresetId: capturedPreset ? capturedPreset.id : null
                };
            } finally {
                overlay.restore();
                if (typeof switchTab === 'function') {
                    switchTab('config');
                }
                await wait(60);
                if (configTab && typeof configTab.resetDraft === 'function') {
                    configTab.resetDraft();
                    await wait(80);
                }
                if (originalLastActive === null) {
                    window.localStorage.removeItem(overlay.lastActiveKey);
                } else {
                    window.localStorage.setItem(overlay.lastActiveKey, originalLastActive);
                }
            }
        `),
        async (result) => {
            if (result.reason) {
                throw new Error(`Preset manager roundtrip setup failed: ${JSON.stringify(result)}`);
            }
            if (result.cardTitle !== result.presetLabel) {
                throw new Error(`Manager card title drifted from the saved preset label: ${JSON.stringify(result)}`);
            }
            if (result.runButtonId !== result.savedId) {
                throw new Error(`Manager run button data-id drifted from the saved preset: ${JSON.stringify(result)}`);
            }
            if (result.capturedPresetId !== result.savedId) {
                throw new Error(`Manager mode resolved the wrong preset on run: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Dry run from a reloaded preset matches the saved runtime shape',
        makePresetRoundtripExpression(`
            const overlay = installPresetFsOverlay();
            if (overlay.reason) {
                return { reason: overlay.reason };
            }
    
            const configTab = window.Imposition && window.Imposition.configTab;
            const actionTab = window.Imposition && window.Imposition.actionTab;
            const debug = getDebug();
            const originalLastActive = window.localStorage.getItem(overlay.lastActiveKey);
    
            try {
                const presetLabel = 'Codex Roundtrip Dry Run ' + Date.now();
    
                if (!configTab || typeof configTab.resetDraft !== 'function' || !actionTab || typeof actionTab.runWithPreset !== 'function' || !debug || typeof debug.inspectPresetRuntime !== 'function' || typeof debug.inspectPresetShape !== 'function') {
                    return { reason: 'missing_roundtrip_surface' };
                }
    
                if (typeof switchTab === 'function') {
                    switchTab('config');
                }
    
                await wait(100);
                configTab.resetDraft();
                await wait(140);
    
                setInputValue('preset_name', presetLabel);
                setInputValue('finish_w', '111');
                setInputValue('finish_h', '222');
                setInputValue('safe_top', '4');
                setInputValue('safe_left', '3');
                setCheckboxValue('opt_custom_rotate', true);
                await wait(40);
                setInputValue('custom_rotate_angle', '45');
    
                const saveButton = document.getElementById('btn-save');
                if (!saveButton) {
                    return { reason: 'missing_save_button' };
                }
    
                const saveForm = document.getElementById('config-form');
                saveButton.click();
                await wait(100);
                if (saveForm && !document.getElementById('preset_id').value && typeof saveForm.requestSubmit === 'function') {
                    saveForm.requestSubmit(saveButton);
                    await wait(220);
                } else {
                    await wait(180);
                }
    
                const select = document.getElementById('load-preset-select');
                const savedOption = select ? findOptionByText(select, presetLabel) : null;
                const savedId = document.getElementById('preset_id') ? document.getElementById('preset_id').value : null;
                if (!select || !savedOption || !savedId) {
                    return { reason: 'missing_saved_preset', presetLabel, savedId };
                }
    
                configTab.resetDraft();
                await wait(140);
    
                const reloadSelect = document.getElementById('load-preset-select');
                if (!reloadSelect) {
                    return { reason: 'missing_reload_select', presetLabel, savedId };
                }
    
                reloadSelect.value = savedOption.value;
                reloadSelect.dispatchEvent(new Event('change', { bubbles: true }));
                await wait(180);
    
                const originalRun = actionTab.runWithPreset;
                let capturedPreset = null;
                actionTab.runWithPreset = async function(preset) {
                    capturedPreset = preset;
                    return { success: true };
                };
    
                const dryRunButton = document.getElementById('btn-dry-run');
                if (!dryRunButton) {
                    actionTab.runWithPreset = originalRun;
                    return { reason: 'missing_dry_run_button', presetLabel, savedId };
                }
    
                dryRunButton.click();
                await wait(120);
                actionTab.runWithPreset = originalRun;
    
                return {
                    presetLabel,
                    savedId,
                    dryRunPresetId: capturedPreset ? capturedPreset.id : null,
                    savedRuntime: debug.inspectPresetRuntime(savedId),
                    dryRunRuntime: capturedPreset ? debug.inspectPresetShape(capturedPreset) : null
                };
            } finally {
                overlay.restore();
                if (typeof switchTab === 'function') {
                    switchTab('config');
                }
                await wait(60);
                if (configTab && typeof configTab.resetDraft === 'function') {
                    configTab.resetDraft();
                    await wait(80);
                }
                if (window.Imposition && typeof window.Imposition.disableDebug === 'function') {
                    window.Imposition.disableDebug();
                }
                if (originalLastActive === null) {
                    window.localStorage.removeItem(overlay.lastActiveKey);
                } else {
                    window.localStorage.setItem(overlay.lastActiveKey, originalLastActive);
                }
            }
        `),
        async (result) => {
            function stripTransientRawValues(rawValues) {
                const next = { ...(rawValues || {}) };
                delete next.preset_id;
                delete next.preset_name;
                return next;
            }
    
            if (result.reason) {
                throw new Error(`Dry-run parity setup failed: ${JSON.stringify(result)}`);
            }
            if (result.dryRunPresetId !== 'dry_run_temp') {
                throw new Error(`Dry run did not use the expected temporary preset id: ${JSON.stringify(result)}`);
            }
            if (!result.savedRuntime || !result.dryRunRuntime) {
                throw new Error(`Dry-run parity snapshots were not captured: ${JSON.stringify(result)}`);
            }
            if (JSON.stringify(result.dryRunRuntime.processingOptions) !== JSON.stringify(result.savedRuntime.processingOptions)) {
                throw new Error(`Dry run processing options drifted from the saved preset: ${JSON.stringify(result)}`);
            }
            if (JSON.stringify(result.dryRunRuntime.compiledRules) !== JSON.stringify(result.savedRuntime.compiledRules)) {
                throw new Error(`Dry run compiled rules drifted from the saved preset: ${JSON.stringify(result)}`);
            }
            if (JSON.stringify(result.dryRunRuntime.embeddedSchemaSnapshot) !== JSON.stringify(result.savedRuntime.embeddedSchemaSnapshot)) {
                throw new Error(`Dry run embedded schema drifted from the saved preset: ${JSON.stringify(result)}`);
            }
            if (JSON.stringify(stripTransientRawValues(result.dryRunRuntime.rawValues)) !== JSON.stringify(stripTransientRawValues(result.savedRuntime.rawValues))) {
                throw new Error(`Dry run raw values drifted from the saved preset: ${JSON.stringify(result)}`);
            }
        }
    );

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

    runner.addTest(
        'Sparse legacy rawValues preserve decisions and hydrate dense snapshot',
        `
            (function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.inspectPresetShape !== 'function' || typeof debug.cloneActiveSchema !== 'function') {
                    return { reason: 'missing_runtime_debug' };
                }
    
                const schema = debug.cloneActiveSchema();
                if (!schema || !schema.sections) {
                    return { reason: 'missing_active_schema' };
                }
    
                return debug.inspectPresetShape({
                    id: 'legacy_sparse',
                    label: 'Legacy Sparse',
                    schemaId: 'embedded',
                    schema: schema,
                    rawValues: {
                        preset_name: 'Legacy Sparse',
                        opt_cleanup: true,
                        opt_k100: true,
                        align_position: 'tc',
                        custom_rotate_angle: '90'
                    }
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Sparse legacy hydration setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.hasProcessingOptions || !result.processingOptions) {
                throw new Error(`Preset did not hydrate processingOptions: ${JSON.stringify(result)}`);
            }
    
            if (result.originalRawKeys.indexOf('opt_symbol_mode') !== -1 || result.originalRawKeys.indexOf('opt_n_up') !== -1) {
                throw new Error(`Legacy sparse fixture was not sparse: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.output.mode !== 'group' || result.rawValues.opt_symbol_mode !== false) {
                throw new Error(`Sparse symbol_mode was not preserved: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.layout.mode !== 'single' || result.rawValues.opt_n_up !== false) {
                throw new Error(`Sparse n_up was not preserved: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.marks.enabled !== false || result.rawValues.opt_draw_marks !== false) {
                throw new Error(`Sparse draw_marks was not preserved: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.marks.hybrid !== false || result.rawValues.mark_style_hybrid !== false) {
                throw new Error(`Sparse mark_style_hybrid was not preserved: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Legacy preset without rawValues hydrates from mirrors and defaults',
        `
            (function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.inspectPresetShape !== 'function') {
                    return { reason: 'missing_runtime_debug' };
                }
    
                return debug.inspectPresetShape({
                    id: 'legacy_no_raw',
                    label: 'Legacy No Raw',
                    schemaId: 'embedded',
                    geometry: {
                        finish: { w: 50, h: 70 },
                        safe: [1, 2, 3, 4]
                    },
                    options: {
                        cleanup: false,
                        k100: true,
                        clone: true
                    },
                    info_template: '{count} - {width}x{height}'
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Legacy mirror hydration setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.processingOptions) {
                throw new Error(`Missing processingOptions from mirror hydration: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.cleanup !== false || result.processingOptions.k100 !== true) {
                throw new Error(`Legacy options were not restored: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.output.mode !== 'symbol' || result.processingOptions.layout.mode !== 'nup') {
                throw new Error(`Default runtime decisions were not applied: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.marks.enabled !== true || result.processingOptions.marks.hybrid !== true) {
                throw new Error(`Default mark settings were not applied: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.postflight.pasteboardInfoTemplate !== '{count} - {width}x{height}') {
                throw new Error(`Legacy info_template was not restored: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.postflight.pasteboardMode !== 'standard' || result.rawPasteboardMode !== 'standard') {
                throw new Error(`Legacy pasteboard mode did not default to standard: ${JSON.stringify(result)}`);
            }
            if (!result.rawValues || result.rawValues.opt_cleanup !== false || result.rawValues.opt_draw_marks !== true) {
                throw new Error(`Hydrated rawValues did not become dense: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Current form serializes explicit checkbox state and normalized processing options',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }
    
                    setTimeout(() => {
                        const presetSelect = document.getElementById('load-preset-select');
                        if (presetSelect && presetSelect.value) {
                            presetSelect.value = '';
                            presetSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, 80);
    
                    setTimeout(() => {
                        const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                        const configTab = window.Imposition && window.Imposition.configTab;
    
                        if (!debug || typeof debug.inspectCurrentFormRuntime !== 'function' || !configTab || typeof configTab.setFormState !== 'function' || typeof configTab.render !== 'function') {
                            resolve({ reason: 'missing_runtime_debug' });
                            return;
                        }
    
                        const current = debug.inspectCurrentFormRuntime();
                        configTab.setFormState({
                            ...(current && current.rawValues ? current.rawValues : {}),
                            opt_symbol_mode: false,
                            opt_n_up: false,
                            opt_layout_head_to_head: true,
                            opt_custom_rotate: true,
                            custom_rotate_angle: 90,
                            align_position: 'bc',
                            opt_draw_marks: false
                        });
                        configTab.render();
    
                        setTimeout(() => {
                            resolve(debug.inspectCurrentFormRuntime());
                        }, 120);
                    }, 220);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Current form normalization setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.rawValues || result.rawValues.opt_symbol_mode !== false || result.rawValues.opt_n_up !== false || result.rawValues.opt_draw_marks !== false) {
                throw new Error(`Checkbox state is still sparse: ${JSON.stringify(result)}`);
            }
            if (!result.processingOptions) {
                throw new Error(`Missing processingOptions snapshot: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.output.mode !== 'group') {
                throw new Error(`Symbol mode should normalize to group: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.layout.mode !== 'single' || result.processingOptions.layout.align !== 'bc') {
                throw new Error(`Layout normalization failed: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.layout.headToHead !== true) {
                throw new Error(`Head-to-head normalization failed: ${JSON.stringify(result)}`);
            }
            if (!result.processingOptions.rotate.enabled || result.processingOptions.rotate.angle !== 90) {
                throw new Error(`Rotate normalization failed: ${JSON.stringify(result)}`);
            }
            if (result.processingOptions.marks.enabled !== false) {
                throw new Error(`Marks normalization failed: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Margin rules preserve draw-border metadata only for positive offsets',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }
    
                    setTimeout(() => {
                        const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                        if (!debug || typeof debug.inspectCurrentFormRuntime !== 'function') {
                            resolve({ reason: 'missing_runtime_debug' });
                            return;
                        }
    
                        const safeTop = document.getElementById('safe_top');
                        const drawBorder = document.getElementById('row_safe_draw_border');
                        const borderStyle = document.getElementById('row_safe_border_style');
    
                        if (!safeTop || !drawBorder || !borderStyle) {
                            resolve({ reason: 'missing_border_controls' });
                            return;
                        }
    
                        safeTop.value = '10';
                        safeTop.dispatchEvent(new Event('input', { bubbles: true }));
                        safeTop.dispatchEvent(new Event('change', { bubbles: true }));
                        drawBorder.checked = true;
                        drawBorder.dispatchEvent(new Event('change', { bubbles: true }));
                        borderStyle.value = 'solid';
                        borderStyle.dispatchEvent(new Event('change', { bubbles: true }));
    
                        setTimeout(() => {
                            resolve(debug.inspectCurrentFormRuntime());
                        }, 40);
                    }, 120);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Draw-border normalization setup failed: ${JSON.stringify(result)}`);
            }
            const safeTopRule = (result.compiledRules || []).find((rule) => rule.id === 'safe_top');
            if (!safeTopRule) {
                throw new Error(`safe_top rule was not compiled: ${JSON.stringify(result)}`);
            }
            if (safeTopRule.val !== 10) {
                throw new Error(`Expected positive offset rule for safe_top: ${JSON.stringify(result)}`);
            }
            if (safeTopRule.drawBorder !== true || safeTopRule.borderStyle !== 'solid') {
                throw new Error(`Draw-border metadata was dropped: ${JSON.stringify(result)}`);
            }
            if ((result.compiledRules || []).some((rule) => rule.id !== 'safe_top')) {
                throw new Error(`Unexpected zero-offset sibling borders were compiled: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Legacy schema load and blank reset keep canonical info_template field',
        `
            (function() {
                return new Promise((resolve) => {
                    if (typeof switchTab === 'function') {
                        switchTab('config');
                    }
    
                    setTimeout(() => {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                        if (!debug || typeof debug.inspectActiveSchema !== 'function' || typeof debug.cloneActiveSchema !== 'function' || typeof debug.applyEphemeralPreset !== 'function') {
                            resolve({ reason: 'missing_runtime_debug' });
                            return;
                        }
    
                        const legacySchema = debug.cloneActiveSchema();
                        if (!legacySchema || !legacySchema.sections) {
                            resolve({ reason: 'missing_active_schema' });
                            return;
                        }
    
                        const optionsSection = legacySchema.sections.find((section) => section && section.id === 'sec_options');
                        if (!optionsSection || !Array.isArray(optionsSection.fields)) {
                            resolve({ reason: 'missing_options_section' });
                            return;
                        }
    
                        optionsSection.fields = optionsSection.fields.filter((field) => field && field.id !== 'info_template');
                        delete optionsSection.readOnlySummary;
                        debug.applyEphemeralPreset({
                            id: 'legacy_schema',
                            label: 'Legacy Schema',
                            schemaId: 'embedded',
                            schema: legacySchema,
                            rawValues: {
                                preset_name: 'Legacy Schema'
                            }
                        });
    
                        setTimeout(() => {
                            const loadedState = {
                                hasInfoTemplate: !!document.getElementById('info_template'),
                                hasSummary: !!document.querySelector('[data-readonly-summary="sec_options"]')
                            };
    
                            window.Imposition.configTab.resetDraft();
    
                            setTimeout(() => {
                                resolve({
                                    loadedState,
                                    resetHasInfoTemplate: !!document.getElementById('info_template'),
                                    resetHasSummary: !!document.querySelector('[data-readonly-summary="sec_options"]'),
                                    activeSchema: debug.inspectActiveSchema()
                                });
                            }, 120);
                        }, 120);
                    }, 80);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Legacy schema reset setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.loadedState.hasInfoTemplate || !result.loadedState.hasSummary) {
                throw new Error(`Merged preset schema did not restore canonical fields: ${JSON.stringify(result)}`);
            }
            if (!result.resetHasInfoTemplate || !result.resetHasSummary) {
                throw new Error(`Blank draft did not return to canonical schema: ${JSON.stringify(result)}`);
            }
            if (!result.activeSchema || !result.activeSchema.options || !result.activeSchema.options.hasInfoTemplateField) {
                throw new Error(`Active schema snapshot is missing info_template after reset: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Pasteboard preview resolves width and height from normalized result data',
        `
            (function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.normalizePostflightResultData !== 'function' || typeof debug.previewPasteboardLegend !== 'function') {
                    return { reason: 'missing_postflight_debug' };
                }
    
                const normalized = debug.normalizePostflightResultData({
                    itemsProcessed: 4,
                    finishSize: { w: 210, h: 297 }
                });
                const preview = debug.previewPasteboardLegend(normalized, {
                    label: 'Preview',
                    info_template: '{count} tem - Kho {width}x{height}'
                });
    
                return {
                    normalized,
                    preview
                };
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Postflight debug setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.normalized || !result.normalized.finishSize || result.normalized.finishSize.width !== 210 || result.normalized.finishSize.height !== 297) {
                throw new Error(`finishSize was not normalized correctly: ${JSON.stringify(result)}`);
            }
            if (!result.preview || !result.preview.includes('4 tem') || !result.preview.includes('210x297')) {
                throw new Error(`Pasteboard preview did not interpolate width/height: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Postflight hook summary is observable after the engine-success path runs',
        `
            (async function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.simulatePostflightSuccess !== 'function' || typeof debug.getLastPostflightSummary !== 'function') {
                    return { reason: 'missing_postflight_summary_debug' };
                }
    
                const hostCalls = [];
                const fakeHostGateway = {
                    drawPasteboardLegend: async (payloadBase64) => {
                        hostCalls.push({
                            name: 'drawPasteboardLegend',
                            payloadBase64
                        });
                        return btoa(JSON.stringify({ success: true }));
                    }
                };
    
                const summary = await debug.simulatePostflightSuccess(
                    {
                        itemsProcessed: 3,
                        finishSize: { w: 120, h: 180 }
                    },
                    {
                        label: 'Smoke Postflight',
                        info_template: '{count} tem - {width}x{height}'
                    },
                    fakeHostGateway
                );
    
                return {
                    summary,
                    latest: debug.getLastPostflightSummary(),
                    hostCalls
                };
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Postflight summary debug setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.summary || result.summary.successCount !== 1 || result.summary.failedCount !== 0) {
                throw new Error(`Unexpected postflight summary: ${JSON.stringify(result)}`);
            }
            if (!result.latest || result.latest.successCount !== 1) {
                throw new Error(`Latest postflight summary was not retained: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.hostCalls) || result.hostCalls.length !== 1) {
                throw new Error(`Postflight hook did not invoke the host gateway exactly once: ${JSON.stringify(result)}`);
            }
            if (result.hostCalls[0].name !== 'drawPasteboardLegend' || !result.hostCalls[0].payloadBase64) {
                throw new Error(`PasteboardInfoRule did not emit the expected host gateway call: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Postflight off mode clears pasteboard slug through the host bridge',
        `
            (async function() {
                const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                if (!debug || typeof debug.simulatePostflightSuccess !== 'function' || typeof debug.getLastPostflightSummary !== 'function') {
                    return { reason: 'missing_postflight_summary_debug' };
                }
    
                const hostCalls = [];
                const fakeHostGateway = {
                    drawPasteboardLegend: async (payloadBase64) => {
                        hostCalls.push(JSON.parse(atob(payloadBase64)));
                        return btoa(JSON.stringify({ success: true, cleared: true }));
                    }
                };
    
                const summary = await debug.simulatePostflightSuccess(
                    {
                        itemsProcessed: 2,
                        finishSize: { w: 90, h: 120 }
                    },
                    {
                        label: 'Blank Legend',
                        rawValues: {
                            pasteboard_mode: 'off'
                        },
                        info_template: '   \\n\\t  '
                    },
                    fakeHostGateway
                );
    
                return {
                    summary,
                    latest: debug.getLastPostflightSummary(),
                    hostCalls
                };
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Pasteboard off-mode postflight debug setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.summary || result.summary.successCount !== 1 || result.summary.skippedCount !== 0 || result.summary.failedCount !== 0) {
                throw new Error(`Unexpected off-mode postflight summary: ${JSON.stringify(result)}`);
            }
            if (!result.latest || result.latest.successCount !== 1 || result.latest.skippedCount !== 0 || result.latest.failedCount !== 0) {
                throw new Error(`Latest off-mode postflight summary was not retained: ${JSON.stringify(result)}`);
            }
            if (!Array.isArray(result.hostCalls) || result.hostCalls.length !== 1 || result.hostCalls[0].mode !== 'off' || result.hostCalls[0].text !== '') {
                throw new Error(`Off-mode should emit one clear payload: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Storage warning renders in both tabs when health is mocked degraded',
        `
            (function() {
                return new Promise((resolve) => {
                    const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                    const actionContainer = document.getElementById('action-container');
                    const configContainer = document.getElementById('config-container');
    
                    if (!debug || typeof debug.setStorageHealthOverride !== 'function' || typeof debug.clearStorageHealthOverride !== 'function') {
                        resolve({ reason: 'missing_storage_debug' });
                        return;
                    }
    
                    if (!actionContainer || !configContainer) {
                        resolve({ reason: 'missing_storage_containers' });
                        return;
                    }
    
                    debug.setStorageHealthOverride({
                        reason: 'usage_write_denied',
                        canReadPresets: true,
                        canWritePresets: true,
                        canWriteUsage: false,
                        message: 'Mock usage warning'
                    });
    
                    setTimeout(() => {
                        const actionWarning = actionContainer.querySelector('[data-storage-warning]');
                        const configWarning = configContainer.querySelector('[data-storage-warning]');
                        debug.clearStorageHealthOverride();
    
                        resolve({
                            actionWarning: actionWarning ? actionWarning.textContent.replace(/\\s+/g, ' ').trim() : null,
                            configWarning: configWarning ? configWarning.textContent.replace(/\\s+/g, ' ').trim() : null
                        });
                    }, 100);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Storage warning setup failed: ${JSON.stringify(result)}`);
            }
            if (result.actionWarning !== 'Mock usage warning') {
                throw new Error(`Action warning did not render mocked health: ${JSON.stringify(result)}`);
            }
            if (result.configWarning !== 'Mock usage warning') {
                throw new Error(`Config warning did not render mocked health: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Dry run remains available when main preset storage is degraded',
        `
            (function() {
                return new Promise((resolve) => {
                    const debug = window.Imposition && (window.Imposition.debug || (typeof window.Imposition.enableDebug === 'function' && window.Imposition.enableDebug()));
                    const actionTab = window.Imposition && window.Imposition.actionTab;
                    const configContainer = document.getElementById('config-container');
    
                    if (!debug || typeof debug.setStorageHealthOverride !== 'function' || typeof debug.clearStorageHealthOverride !== 'function') {
                        resolve({ reason: 'missing_storage_debug' });
                        return;
                    }
    
                    if (!actionTab || !configContainer) {
                        resolve({ reason: 'missing_dry_run_controls' });
                        return;
                    }
    
                    const originalRun = actionTab.runWithPreset;
                    let captured = null;
                    actionTab.runWithPreset = async function(preset) {
                        captured = preset;
                        return { success: true };
                    };
    
                    debug.setStorageHealthOverride({
                        reason: 'write_denied',
                        canReadPresets: true,
                        canWritePresets: false,
                        canWriteUsage: false,
                        message: 'Mock main warning'
                    });
    
                    const nameInput = document.getElementById('preset_name');
                    const dryRun = document.getElementById('btn-dry-run');
                    if (!nameInput || !dryRun) {
                        actionTab.runWithPreset = originalRun;
                        debug.clearStorageHealthOverride();
                        resolve({ reason: 'missing_dry_run_controls_after_render' });
                        return;
                    }
    
                    nameInput.value = 'Dry Run Degraded';
                    dryRun.click();
    
                    setTimeout(() => {
                        const warning = configContainer.querySelector('[data-storage-warning]');
                        actionTab.runWithPreset = originalRun;
                        debug.clearStorageHealthOverride();
    
                        resolve({
                            called: !!captured,
                            label: captured ? captured.label : null,
                            warningText: warning ? warning.textContent.replace(/\\s+/g, ' ').trim() : null
                        });
                    }, 140);
                });
            })()
        `,
        async (result) => {
            if (result.reason) {
                throw new Error(`Dry run degraded setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.called || result.label !== 'Dry Run Degraded (Nháp)') {
                throw new Error(`Dry run was blocked by storage degradation: ${JSON.stringify(result)}`);
            }
            if (result.warningText !== 'Mock main warning') {
                throw new Error(`Expected degraded storage warning during dry run: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerConfigSmokeTests };
