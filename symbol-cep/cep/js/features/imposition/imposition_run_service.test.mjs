import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildSaveTimestampSuffix,
    compilePresetRules,
    handleEngineFailure,
    handleEngineSuccess,
    resolveSaveOutputFormat,
    resolveSmartSaveFilenamePrefix,
    restoreAutoGrouping,
    runImpositionEngineAsync,
    runPreflight,
    runPresetExecutionFlow,
    saveDocumentAfterSuccessfulRun,
    stripGeneratedSaveTimestampSuffix
} from './imposition_run_service.js';

function encodeUtf8Base64(value) {
    return Buffer.from(value, 'utf8').toString('base64');
}

if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
}

test('compilePresetRules injects compiled rules only when non-empty', () => {
    const preset = { schema: { id: 'schema' }, rawValues: { label: 'A4' } };
    const rules = compilePresetRules(preset, {
        configEngine: {
            compileRules() {
                return [{ id: 'rule_1' }];
            }
        },
        logger: { log() {}, error() {} }
    });

    assert.deepEqual(rules, [{ id: 'rule_1' }]);
    assert.deepEqual(preset.rules, [{ id: 'rule_1' }]);
});

test('compilePresetRules swallows compile errors and preserves existing preset shape', () => {
    const preset = { schema: { id: 'schema' }, rawValues: { label: 'A4' } };

    const rules = compilePresetRules(preset, {
        configEngine: {
            compileRules() {
                throw new Error('compile failed');
            }
        },
        logger: { log() {}, error() {} }
    });

    assert.deepEqual(rules, []);
    assert.equal('rules' in preset, false);
});

test('runPreflight short-circuits when orchestrator marks the flow unsafe', async () => {
    const context = await runPreflight({
        async runAll() {
            return { safe: false, context: { autoGrouped: true } };
        }
    }, { eval() {} }, { logger: { log() {}, warn() {} } });

    assert.equal(context, null);
});

test('runImpositionEngineAsync preserves the engine dispatch script and returns invalid format fallback', async () => {
    let dispatchedScript = null;

    const invalidResult = await runImpositionEngineAsync({ label: 'A4', id: 'preset_a4' }, {
        csInterface: {
            evalScript(script, callback) {
                dispatchedScript = script;
                callback('not-base64');
            }
        },
        encodeUtf8Base64,
        logger: { log() {}, error() {} }
    });

    assert.match(dispatchedScript, /^\$\._imposition\.engine\.run\("[A-Za-z0-9+/=]+"\)$/);
    assert.deepEqual(invalidResult, {
        success: false,
        error: 'Invalid Engine Response Format',
        raw: 'not-base64'
    });
});

test('restoreAutoGrouping uses the exact bridge script and warns when autoGroupName is missing', async () => {
    const warnings = [];
    let restoreScript = null;

    await restoreAutoGrouping({ autoGrouped: true }, {
        bridgeInst: {
            async eval(script) {
                restoreScript = script;
                return encodeUtf8Base64(JSON.stringify({ success: true }));
            }
        },
        encodeUtf8Base64,
        logger: { log() {}, warn() {} },
        showToast(message, tone) {
            warnings.push({ message, tone });
        },
        autoGroupRestoreWarning: 'restore warning'
    });

    assert.deepEqual(warnings, [{ message: 'restore warning', tone: 'warning' }]);

    warnings.length = 0;
    await restoreAutoGrouping({ autoGrouped: true, autoGroupName: 'AUTO_GROUP_1' }, {
        bridgeInst: {
            async eval(script) {
                restoreScript = script;
                return encodeUtf8Base64(JSON.stringify({ success: true }));
            }
        },
        encodeUtf8Base64,
        logger: { log() {}, warn() {} },
        showToast(message, tone) {
            warnings.push({ message, tone });
        },
        autoGroupRestoreWarning: 'restore warning'
    });

    assert.equal(warnings.length, 0);
    assert.match(restoreScript, /^\$\.global\.Bridge\.ungroupAutoGrouped\("[A-Za-z0-9+/=]+"\)$/);
});

test('handleEngineFailure formats the toast and always restores auto-grouping', async () => {
    const toasts = [];
    const restored = [];

    await handleEngineFailure({ error: 'kernel failed' }, { autoGrouped: true }, {
        formatRuntimeError(error) {
            return `runtime:${error}`;
        },
        showToast(message, tone) {
            toasts.push({ message, tone });
        },
        restoreAutoGrouping(context) {
            restored.push(context);
            return Promise.resolve();
        },
        logger: { error() {} }
    });

    assert.deepEqual(toasts, [{ message: 'runtime:kernel failed', tone: 'error' }]);
    assert.deepEqual(restored, [{ autoGrouped: true }]);
});

test('handleEngineSuccess retains postflight summary, warns on hook failures, and restores auto-grouping', async () => {
    const toasts = [];
    const restored = [];
    let savedSummary = null;
    const hostGateway = { drawPasteboardLegend() {} };
    const runAllContexts = [];

    await handleEngineSuccess({ data: { itemsProcessed: 4 } }, { label: 'Preset A' }, { autoGrouped: true }, {
        bridgeInst: { eval() {} },
        hostGateway,
        logger: { log() {}, warn() {} },
        postflightOrchestrator: {
            async runAll(context) {
                runAllContexts.push(context);
                return { successCount: 0, skippedCount: 0, failedCount: 1 };
            }
        },
        postflightWarning: 'postflight warning',
        restoreAutoGrouping(context) {
            restored.push(context);
            return Promise.resolve();
        },
        setLastPostflightSummary(summary) {
            savedSummary = summary;
        },
        showToast(message, tone) {
            toasts.push({ message, tone });
        },
        wait() {
            return Promise.resolve();
        }
    });

    assert.deepEqual(savedSummary, { successCount: 0, skippedCount: 0, failedCount: 1 });
    assert.deepEqual(toasts, [{ message: 'postflight warning', tone: 'warning' }]);
    assert.deepEqual(restored, [{ autoGrouped: true }]);
    assert.equal(runAllContexts.length, 1);
    assert.equal(runAllContexts[0].hostGateway, hostGateway);
});

test('buildSaveTimestampSuffix formats local timestamp parts predictably', () => {
    const suffix = buildSaveTimestampSuffix({
        now() {
            return new Date(2026, 3, 10, 9, 8, 7, 6);
        }
    });

    assert.equal(suffix, "9'08 10 4");
});

test('stripGeneratedSaveTimestampSuffix removes only the generated save timestamp tail', () => {
    assert.equal(stripGeneratedSaveTimestampSuffix("thien nin m15_15'55 3 6.ai"), 'thien nin m15');
    assert.equal(stripGeneratedSaveTimestampSuffix('regular customer file.ai'), 'regular customer file');
});

test('resolveSmartSaveFilenamePrefix derives prefix from saved active document and keeps new files blank', () => {
    assert.equal(resolveSmartSaveFilenamePrefix({
        documentIdentity: {
            documentPath: "C:/Output/thien nin m15_15'55 3 6.ai",
            documentName: "thien nin m15_15'55 3 6.ai"
        }
    }), 'thien nin m15');
    assert.equal(resolveSmartSaveFilenamePrefix({
        documentIdentity: {
            documentPath: '',
            documentName: 'Untitled-1'
        }
    }), '');
});

test('resolveSaveOutputFormat keeps smart Save As in the active document format', () => {
    assert.equal(resolveSaveOutputFormat({
        saveMode: 'save_as_new',
        jobSaveContext: {
            documentIdentity: {
                documentPath: "C:/Output/thien nin m15_15'55 3 6.pdf",
                documentName: "thien nin m15_15'55 3 6.pdf"
            }
        }
    }), 'pdf');

    assert.equal(resolveSaveOutputFormat({
        saveMode: 'overwrite',
        jobSaveContext: {
            rememberedTarget: {
                targetPath: 'C:/Output/remembered.pdf'
            },
            documentIdentity: {
                documentPath: 'C:/Output/current.ai',
                documentName: 'current.ai'
            }
        }
    }), 'pdf');

    assert.equal(resolveSaveOutputFormat({
        saveMode: 'save_as_new',
        jobSaveContext: {
            documentIdentity: {
                documentPath: 'C:/Output/current.eps',
                documentName: 'current.eps'
            }
        }
    }), 'ai');
});

test('saveDocumentAfterSuccessfulRun warns when directory is missing', async () => {
    const toasts = [];

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: ''
        }
    }, {
        saveMode: 'save_as_new',
        showToast(message, tone) {
            toasts.push({ message, tone });
        }
    });

    assert.equal(result.status, 'skipped');
    assert.equal(result.reason, 'missing_directory');
    assert.deepEqual(toasts, [{
        message: 'Preset chua co thu muc luu. Hay chon thu muc roi Luu Preset lai.',
        tone: 'warning'
    }]);
});

test('saveDocumentAfterSuccessfulRun dispatches host save payload and returns saved metadata', async () => {
    let capturedPayload = null;
    let rememberedTarget = null;
    const toasts = [];

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output',
            save_filename_prefix: 'Bai in thiep'
        }
    }, {
        encodeUtf8Base64,
        hostGateway: {
            async saveActiveDocumentAfterImposition(payloadBase64) {
                capturedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    outputPath: "C:/output/file_9'08 10 4.ai",
                    outputName: "file_9'08 10 4.ai"
                }));
            }
        },
        now() {
            return new Date(2026, 3, 10, 9, 8, 7, 6);
        },
        saveMode: 'save_as_new',
        rememberJobSaveTarget(payload) {
            rememberedTarget = payload;
        },
        showToast(message, tone) {
            toasts.push({ message, tone });
        }
    });

    assert.deepEqual(capturedPayload, {
        outputDirectory: 'C:/output',
        filenamePrefix: 'Bai in thiep',
        targetPath: '',
        previousDocumentPath: '',
        outputFormat: 'ai',
        timestampSuffix: "9'08 10 4",
        deleteExistingFirst: true,
        deletePreviousAfterSave: false,
        saveMode: 'save_as_new'
    });
    assert.equal(result.status, 'saved');
    assert.equal(rememberedTarget.preset.rawValues.save_output_dir, 'C:/output');
    assert.equal(rememberedTarget.saveResult.outputPath, "C:/output/file_9'08 10 4.ai");
    assert.deepEqual(toasts, [{
        message: "Da luu bai in: file_9'08 10 4.ai",
        tone: 'success'
    }]);
});

test('saveDocumentAfterSuccessfulRun falls back to the active document name when filename prefix is blank', async () => {
    let capturedPayload = null;

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output',
            save_filename_prefix: '   '
        }
    }, {
        encodeUtf8Base64,
        hostGateway: {
            async saveActiveDocumentAfterImposition(payloadBase64) {
                capturedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    outputName: "fallback_9'08 10 4.ai"
                }));
            }
        },
        now() {
            return new Date(2026, 3, 10, 9, 8, 7, 6);
        },
        saveMode: 'save_as_new',
        showToast() {}
    });

    assert.equal(result.status, 'saved');
    assert.equal(capturedPayload.filenamePrefix, '');
    assert.equal(capturedPayload.targetPath, '');
    assert.equal(capturedPayload.outputFormat, 'ai');
});

test('saveDocumentAfterSuccessfulRun sends previous document cleanup metadata for save_as_new without using overwrite target', async () => {
    let capturedPayload = null;

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output',
            save_filename_prefix: 'thien nin m15'
        }
    }, {
        encodeUtf8Base64,
        hostGateway: {
            async saveActiveDocumentAfterImposition(payloadBase64) {
                capturedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    outputPath: "C:/output/thien nin m15_16'05 3 6.ai",
                    outputName: "thien nin m15_16'05 3 6.ai",
                    previousFileDeleted: true
                }));
            }
        },
        jobSaveContext: {
            documentIdentity: {
                documentPath: "C:/output/thien nin m15_15'55 3 6.ai"
            },
            rememberedTarget: {
                targetPath: "C:/output/thien nin m15_15'55 3 6.ai"
            }
        },
        now() {
            return new Date(2026, 5, 3, 16, 5, 0, 0);
        },
        saveMode: 'save_as_new',
        showToast() {}
    });

    assert.equal(result.status, 'saved');
    assert.equal(capturedPayload.targetPath, '');
    assert.equal(capturedPayload.previousDocumentPath, "C:/output/thien nin m15_15'55 3 6.ai");
    assert.equal(capturedPayload.outputFormat, 'ai');
    assert.equal(capturedPayload.deletePreviousAfterSave, true);
    assert.equal(capturedPayload.timestampSuffix, "16'05 3 6");
});

test('saveDocumentAfterSuccessfulRun keeps PDF format for smart save_as_new when the old file is PDF', async () => {
    let capturedPayload = null;

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output',
            save_filename_prefix: 'ticket'
        }
    }, {
        encodeUtf8Base64,
        hostGateway: {
            async saveActiveDocumentAfterImposition(payloadBase64) {
                capturedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    outputPath: "C:/output/ticket_16'05 3 6.pdf",
                    outputName: "ticket_16'05 3 6.pdf",
                    outputFormat: 'pdf',
                    previousFileDeleted: true
                }));
            }
        },
        jobSaveContext: {
            documentIdentity: {
                documentPath: "C:/output/ticket_15'55 3 6.pdf",
                documentName: "ticket_15'55 3 6.pdf"
            }
        },
        now() {
            return new Date(2026, 5, 3, 16, 5, 0, 0);
        },
        saveMode: 'save_as_new',
        showToast() {}
    });

    assert.equal(result.status, 'saved');
    assert.equal(capturedPayload.previousDocumentPath, "C:/output/ticket_15'55 3 6.pdf");
    assert.equal(capturedPayload.outputFormat, 'pdf');
    assert.equal(capturedPayload.deletePreviousAfterSave, true);
});

test('saveDocumentAfterSuccessfulRun warns when old-file cleanup fails after successful save_as_new', async () => {
    const toasts = [];

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output',
            save_filename_prefix: 'Bai in thiep'
        }
    }, {
        encodeUtf8Base64,
        hostGateway: {
            async saveActiveDocumentAfterImposition() {
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    outputPath: "C:/output/file_9'08 10 4.ai",
                    outputName: "file_9'08 10 4.ai",
                    previousFileDeleteError: 'previous file is locked'
                }));
            }
        },
        saveMode: 'save_as_new',
        showToast(message, tone) {
            toasts.push({ message, tone });
        }
    });

    assert.equal(result.status, 'saved');
    assert.deepEqual(toasts, [{
        message: "Da luu bai in: file_9'08 10 4.ai",
        tone: 'success'
    }, {
        message: 'Da luu ban moi, nhung chua xoa duoc file cu: previous file is locked',
        tone: 'warning'
    }]);
});

test('saveDocumentAfterSuccessfulRun prefers the remembered target path for overwrite saves', async () => {
    let capturedPayload = null;

    const result = await saveDocumentAfterSuccessfulRun({
        id: 'preset_a',
        rawValues: {
            save_output_dir: 'C:/output',
            save_filename_prefix: 'Bai in thiep'
        }
    }, {
        encodeUtf8Base64,
        hostGateway: {
            async saveActiveDocumentAfterImposition(payloadBase64) {
                capturedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    outputPath: 'C:/output/remembered.ai',
                    outputName: 'remembered.ai'
                }));
            }
        },
        jobSaveContext: {
            rememberedTarget: {
                targetPath: 'C:/output/remembered.ai'
            }
        },
        saveMode: 'overwrite',
        showToast() {}
    });

    assert.equal(result.status, 'saved');
    assert.equal(capturedPayload.targetPath, 'C:/output/remembered.ai');
    assert.equal(capturedPayload.outputFormat, 'ai');
});

test('saveDocumentAfterSuccessfulRun skips cleanly in run_only mode', async () => {
    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output'
        }
    }, {
        showToast() {}
    });

    assert.equal(result.status, 'skipped');
    assert.equal(result.reason, 'run_only');
});

test('saveDocumentAfterSuccessfulRun blocks overwrite when no remembered target exists', async () => {
    const toasts = [];

    const result = await saveDocumentAfterSuccessfulRun({
        rawValues: {
            save_output_dir: 'C:/output'
        }
    }, {
        saveMode: 'overwrite',
        showToast(message, tone) {
            toasts.push({ message, tone });
        }
    });

    assert.equal(result.status, 'skipped');
    assert.equal(result.reason, 'missing_target');
    assert.deepEqual(toasts, [{
        message: 'File hien tai chua co duong dan luu. Hay Save file nay hoac dung Luu moi lan dau.',
        tone: 'warning'
    }]);
});

test('runPresetExecutionFlow stops after unsafe preflight and leaves summary cleared', async () => {
    let savedSummary = 'stale';
    let executed = false;

    const result = await runPresetExecutionFlow({ label: 'Unsafe Preset' }, {
        bridgeInst: { eval() {} },
        hydratePreset(preset) {
            return { ...preset };
        },
        logger: { log() {}, warn() {}, error() {} },
        preflightOrchestrator: {
            async runAll() {
                return { safe: false, context: { autoGrouped: true } };
            }
        },
        setLastPostflightSummary(summary) {
            savedSummary = summary;
        },
        executeImposition() {
            executed = true;
            return Promise.resolve({ success: true });
        }
    });

    assert.equal(result.status, 'cancelled');
    assert.equal(savedSummary, null);
    assert.equal(executed, false);
});

test('runPresetExecutionFlow keeps success status when post-success save fails', async () => {
    const toasts = [];

    const result = await runPresetExecutionFlow({
        label: 'Save Fail Preset',
        rawValues: {
            save_output_dir: 'C:/output'
        }
    }, {
        encodeUtf8Base64,
        hydratePreset(preset) {
            return { ...preset };
        },
        hostGateway: {
            async saveActiveDocumentAfterImposition() {
                return encodeUtf8Base64(JSON.stringify({ success: false, error: 'cloud locked' }));
            }
        },
        logger: { log() {}, warn() {}, error() {} },
        postflightOrchestrator: {
            async runAll() {
                return { successCount: 1, skippedCount: 0, failedCount: 0 };
            }
        },
        preflightOrchestrator: {
            async runAll() {
                return { safe: true, context: {} };
            }
        },
        executeImposition() {
            return Promise.resolve({ success: true, data: { itemsProcessed: 1 } });
        },
        restoreAutoGrouping() {
            return Promise.resolve();
        },
        saveMode: 'save_as_new',
        showToast(message, tone) {
            toasts.push({ message, tone });
        },
        wait() {
            return Promise.resolve();
        }
    });

    assert.equal(result.status, 'success');
    assert.equal(result.saveResult.status, 'failed');
    assert.deepEqual(toasts, [{
        message: 'Binh xong nhung luu that bai: cloud locked',
        tone: 'error'
    }]);
});
