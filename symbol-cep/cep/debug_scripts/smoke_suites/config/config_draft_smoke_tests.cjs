function registerConfigDraftSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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
                configTab.resetDraft();
                await wait(140);
    
                const reloadSelect = document.getElementById('load-preset-select');
                if (!reloadSelect || !savedOption) {
                    return {
                        reason: savedOption ? 'missing_reload_select' : 'missing_saved_option',
                        presetLabel,
                        savedId,
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
            }
        `),
        async (result) => {
            if (result.reason) {
                throw new Error(`Preset save roundtrip setup failed: ${JSON.stringify(result)}`);
            }
            if (!result.savedId || result.savedId !== result.optionValue) {
                throw new Error(`Saved preset did not roundtrip into the dropdown: ${JSON.stringify(result)}`);
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
}

module.exports = { registerConfigDraftSmokeTests };
