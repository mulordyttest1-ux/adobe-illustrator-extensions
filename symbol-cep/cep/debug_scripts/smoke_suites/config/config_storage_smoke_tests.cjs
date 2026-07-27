function registerConfigStorageSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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

module.exports = { registerConfigStorageSmokeTests };
