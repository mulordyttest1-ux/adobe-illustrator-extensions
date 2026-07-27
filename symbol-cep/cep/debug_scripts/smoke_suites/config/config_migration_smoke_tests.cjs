function registerConfigMigrationSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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
}

module.exports = { registerConfigMigrationSmokeTests };
