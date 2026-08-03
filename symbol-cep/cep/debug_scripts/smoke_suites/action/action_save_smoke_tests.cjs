function registerActionSaveSmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

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
}

module.exports = { registerActionSaveSmokeTests };
