import { parseBase64JsonUtf8 } from './bridge_codec.js';
import { formatRuntimeError, impositionCopy } from './imposition_copy.js';

function defaultLogger(logger) {
    return logger || console;
}

function padTimestampPart(value, width) {
    let text = String(value);
    while (text.length < width) {
        text = `0${text}`;
    }
    return text;
}

export function encodeUtf8Base64(value, deps = {}) {
    if (typeof deps.encodeUtf8Base64 === 'function') {
        return deps.encodeUtf8Base64(value);
    }

    if (typeof deps.btoa === 'function') {
        return deps.btoa(unescape(encodeURIComponent(value)));
    }

    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(unescape(encodeURIComponent(value)));
    }

    throw new Error('Base64 encoder unavailable');
}

export function compilePresetRules(preset, deps = {}) {
    const logger = defaultLogger(deps.logger);
    if (!deps.configEngine || !preset || !preset.rawValues || !preset.schema) {
        return [];
    }

    try {
        logger.log('-> Compiling Rules...');
        const rules = deps.configEngine.compileRules(preset.schema, preset.rawValues);
        if (rules.length > 0) {
            preset.rules = rules;
            logger.log('[ActionTab] Rules injected via ConfigEngine:', rules.length);
        }
        return rules;
    } catch (error) {
        logger.error('ConfigEngine Compilation Failed:', error);
        return [];
    }
}

export function parseEngineResult(resultRaw, deps = {}) {
    const parser = deps.parseBase64JsonUtf8 || parseBase64JsonUtf8;
    return parser(resultRaw);
}

export function runImpositionEngineAsync(preset, deps = {}) {
    const logger = defaultLogger(deps.logger);

    return new Promise((resolve) => {
        const payloadStr = JSON.stringify(preset);
        const payloadBase64 = encodeUtf8Base64(payloadStr, deps);
        const hostGateway = deps.hostGateway;

        logger.log(`[ActionTab] Dispatching [${preset.label}] to imposition engine...`);
        const runPromise = hostGateway && typeof hostGateway.runImpositionEngine === 'function'
            ? hostGateway.runImpositionEngine(payloadBase64)
            : new Promise((innerResolve) => {
                deps.csInterface.evalScript(`$._imposition.engine.run("${payloadBase64}")`, (resultRaw) => {
                    innerResolve(resultRaw);
                });
            });

        Promise.resolve(runPromise).then((resultRaw) => {
            let result;
            try {
                result = parseEngineResult(resultRaw, deps);
            } catch (error) {
                logger.error('Failed to parse engine structured return payload:', error, resultRaw);
                resolve({ success: false, error: 'Invalid Engine Response Format', raw: resultRaw });
                return;
            }
            resolve(result);
        });
    });
}

export async function runPreflight(preflightOrchestrator, bridgeInst, deps = {}) {
    const logger = defaultLogger(deps.logger);
    if (!preflightOrchestrator || !bridgeInst) {
        return {};
    }

    logger.log('[ActionTab] Running Preflight Orchestrator...');
    const result = await preflightOrchestrator.runAll({ bridge: bridgeInst });
    if (!result || !result.safe) {
        logger.warn('[ActionTab] Preflight failed or user cancelled. Halting.');
        return null;
    }

    return result.context || {};
}

export async function executeImposition(preset, deps = {}) {
    const logger = defaultLogger(deps.logger);
    const runner = deps.runImpositionEngineAsync || runImpositionEngineAsync;

    logger.log('[ActionTab] Executing Imposition:', preset.label);
    const engineResult = await runner(preset, deps);
    if (engineResult && engineResult.logs) {
        logger.log('[ActionTab] JSX LOGS:\n' + engineResult.logs.join('\n'));
    }

    return engineResult;
}

export function buildSaveTimestampSuffix(deps = {}) {
    const nowFactory = typeof deps.now === 'function' ? deps.now : () => new Date();
    const now = nowFactory();
    return `${now.getHours()}'${padTimestampPart(now.getMinutes(), 2)} ${now.getDate()} ${now.getMonth() + 1}`;
}

export function stripGeneratedSaveTimestampSuffix(value) {
    return String(value || '')
        .replace(/\.[^.]+$/, '')
        .replace(/_\d{1,2}'\d{2}\s+\d{1,2}\s+\d{1,2}$/, '')
        .trim();
}

export function resolveSmartSaveFilenamePrefix(runContext = null) {
    const identity = runContext && runContext.documentIdentity ? runContext.documentIdentity : null;
    const documentPath = identity ? String(identity.documentPath || '').trim() : '';
    const documentName = identity ? String(identity.documentName || '').trim() : '';

    if (!documentPath) {
        return '';
    }

    return stripGeneratedSaveTimestampSuffix(documentName);
}

function resolveSaveAfterRunPreconditions(rawValues, hostGateway, saveCopy, showToast) {
    const outputDirectory = String(rawValues.save_output_dir || '').trim();

    if (!outputDirectory) {
        showToast(saveCopy.missingDirectory, 'warning');
        return { halted: true, result: { status: 'skipped', reason: 'missing_directory' } };
    }

    if (!hostGateway || typeof hostGateway.saveActiveDocumentAfterImposition !== 'function') {
        showToast(saveCopy.unavailable, 'error');
        return { halted: true, result: { status: 'failed', error: 'Save gateway unavailable' } };
    }

    return { halted: false, outputDirectory };
}

function resolveSaveFileNamePrefix(rawValues) {
    return String((rawValues && rawValues.save_filename_prefix) || '').trim();
}

function resolveSaveMode(deps = {}) {
    const mode = String(deps.saveMode || 'run_only').trim();
    if (mode === 'overwrite' || mode === 'save_as_new') {
        return mode;
    }

    return 'run_only';
}

function resolveRememberedTargetPath(deps = {}) {
    const rememberedTarget = deps.jobSaveContext && deps.jobSaveContext.rememberedTarget
        ? deps.jobSaveContext.rememberedTarget
        : null;

    return rememberedTarget ? String(rememberedTarget.targetPath || '').trim() : '';
}

function resolvePreviousDocumentPath(deps = {}) {
    const identity = deps.jobSaveContext && deps.jobSaveContext.documentIdentity
        ? deps.jobSaveContext.documentIdentity
        : null;

    return identity ? String(identity.documentPath || '').trim() : '';
}

function getSupportedSaveFormatFromPath(pathOrName) {
    const match = String(pathOrName || '').trim().match(/\.([^.\\/:*?"<>|]+)$/);
    const extension = match ? match[1].toLowerCase() : '';

    if (extension === 'pdf') {
        return 'pdf';
    }
    if (extension === 'ai') {
        return 'ai';
    }

    return '';
}

export function resolveSaveOutputFormat(deps = {}) {
    const saveMode = resolveSaveMode(deps);
    const targetPath = saveMode === 'overwrite' ? resolveRememberedTargetPath(deps) : '';
    const previousPath = saveMode === 'save_as_new' ? resolvePreviousDocumentPath(deps) : '';
    const identity = deps.jobSaveContext && deps.jobSaveContext.documentIdentity
        ? deps.jobSaveContext.documentIdentity
        : null;
    const documentName = identity ? String(identity.documentName || '').trim() : '';

    return getSupportedSaveFormatFromPath(targetPath) ||
        getSupportedSaveFormatFromPath(previousPath) ||
        getSupportedSaveFormatFromPath(documentName) ||
        'ai';
}

function buildSaveAfterRunPayload(outputDirectory, rawValues, deps) {
    const saveMode = resolveSaveMode(deps);
    const previousDocumentPath = saveMode === 'save_as_new' ? resolvePreviousDocumentPath(deps) : '';

    return encodeUtf8Base64(JSON.stringify({
        outputDirectory,
        filenamePrefix: resolveSaveFileNamePrefix(rawValues),
        targetPath: saveMode === 'overwrite' ? resolveRememberedTargetPath(deps) : '',
        previousDocumentPath,
        outputFormat: resolveSaveOutputFormat(deps),
        timestampSuffix: buildSaveTimestampSuffix(deps),
        deleteExistingFirst: true,
        deletePreviousAfterSave: saveMode === 'save_as_new' && !!previousDocumentPath,
        saveMode
    }), deps);
}

function finalizeSaveAfterRunFailure(error, saveCopy, showToast) {
    const errorMessage = error && error.message ? error.message : String(error || 'Unknown save error');
    showToast(saveCopy.failure(errorMessage), 'error');
    return {
        status: 'failed',
        error: errorMessage
    };
}

function finalizeSaveAfterRunResult(saveResult, saveCopy, showToast) {
    if (!saveResult || !saveResult.success) {
        showToast(saveCopy.failure(saveResult && saveResult.error), 'error');
        return {
            status: 'failed',
            error: saveResult && saveResult.error ? saveResult.error : 'Unknown save error',
            result: saveResult || null
        };
    }

    showToast(saveCopy.success(saveResult.outputName), 'success');
    if (saveResult.previousFileDeleteError) {
        showToast(saveCopy.previousDeleteWarning(saveResult.previousFileDeleteError), 'warning');
    }
    return {
        status: 'saved',
        result: saveResult
    };
}

function rememberJobSaveTargetOnSuccess(preset, saveResult, deps = {}) {
    if (!saveResult || !saveResult.success || typeof deps.rememberJobSaveTarget !== 'function') {
        return;
    }

    try {
        deps.rememberJobSaveTarget({
            preset,
            saveResult,
            jobSaveContext: deps.jobSaveContext || null
        });
    } catch (error) {
        defaultLogger(deps.logger).warn('[ActionTab] Failed to remember job save target:', error);
    }
}

// eslint-disable-next-line complexity
export async function saveDocumentAfterSuccessfulRun(preset, deps = {}) {
    const logger = defaultLogger(deps.logger);
    const showToast = deps.showToast || function noop() {};
    const hostGateway = deps.hostGateway;
    const saveCopy = deps.saveAfterRunCopy || impositionCopy.action.saveAfterRun;
    const rawValues = preset && preset.rawValues ? preset.rawValues : {};
    const saveMode = resolveSaveMode(deps);
    const rememberedTargetPath = resolveRememberedTargetPath(deps);
    const outputDirectory = String(rawValues.save_output_dir || '').trim();
    let resultRaw;
    let saveResult;

    if (saveMode === 'run_only') {
        return { status: 'skipped', reason: 'run_only' };
    }

    if (saveMode === 'overwrite' && !rememberedTargetPath) {
        showToast(saveCopy.missingOverwriteTarget, 'warning');
        return { status: 'skipped', reason: 'missing_target' };
    }

    if (saveMode === 'save_as_new') {
        const precondition = resolveSaveAfterRunPreconditions(rawValues, hostGateway, saveCopy, showToast);
        if (precondition.halted) {
            return precondition.result;
        }
    } else if (!hostGateway || typeof hostGateway.saveActiveDocumentAfterImposition !== 'function') {
        showToast(saveCopy.unavailable, 'error');
        return { status: 'failed', error: 'Save gateway unavailable' };
    }

    try {
        resultRaw = await hostGateway.saveActiveDocumentAfterImposition(
            buildSaveAfterRunPayload(outputDirectory, rawValues, deps)
        );
        saveResult = parseEngineResult(resultRaw, deps);
    } catch (error) {
        logger.error('[ActionTab] Save-after-run failed:', error);
        return finalizeSaveAfterRunFailure(error, saveCopy, showToast);
    }

    rememberJobSaveTargetOnSuccess(preset, saveResult, deps);
    return finalizeSaveAfterRunResult(saveResult, saveCopy, showToast);
}

// eslint-disable-next-line complexity
export async function restoreAutoGrouping(preflightContext, deps = {}) {
    const logger = defaultLogger(deps.logger);
    const showToast = deps.showToast || function noop() {};
    const warningMessage = deps.autoGroupRestoreWarning || impositionCopy.action.autoGroupRestoreWarning;
    const bridgeInst = deps.bridgeInst;
    const hostGateway = deps.hostGateway;

    if (!preflightContext || !preflightContext.autoGrouped || (!bridgeInst && !hostGateway)) {
        return;
    }

    const autoGroupName = preflightContext.autoGroupName;
    if (!autoGroupName) {
        logger.warn('[ActionTab] Missing autoGroupName, skipping restore.');
        showToast(warningMessage, 'warning');
        return;
    }

    logger.log('[ActionTab] Auto-ungrouping target:', autoGroupName);

    try {
        const resRaw = hostGateway && typeof hostGateway.restoreAutoGrouping === 'function'
            ? await hostGateway.restoreAutoGrouping(autoGroupName)
            : await bridgeInst.eval(`$.global.Bridge.ungroupAutoGrouped("${encodeUtf8Base64(autoGroupName, deps)}")`);

        if (typeof resRaw === 'string' && resRaw.toLowerCase().startsWith('evalscript')) {
            logger.warn('[ActionTab] Auto-group restore EvalScript error:', resRaw);
            showToast(warningMessage, 'warning');
            return;
        }

        const result = parseEngineResult(resRaw, deps);
        if (!result.success) {
            logger.warn('[ActionTab] Auto-group restore skipped:', result.error);
            showToast(warningMessage, 'warning');
            return;
        }

        logger.log('[ActionTab] Auto-group restored.');
    } catch (error) {
        logger.warn('[ActionTab] Auto-group restore failed:', error);
        showToast(warningMessage, 'warning');
    }
}

export async function handleEngineFailure(engineResult, preflightContext, deps = {}) {
    const logger = defaultLogger(deps.logger);
    const showToast = deps.showToast || function noop() {};
    const formatError = deps.formatRuntimeError || formatRuntimeError;
    const restore = deps.restoreAutoGrouping || restoreAutoGrouping;
    const errorMsg = engineResult ? engineResult.error : 'Unknown Error';

    logger.error('Imposition Error:', errorMsg);
    showToast(formatError(errorMsg), 'error');
    await restore(preflightContext, deps);
}

export async function handleEngineSuccess(engineResult, preset, preflightContext, deps = {}) {
    const logger = defaultLogger(deps.logger);
    const showToast = deps.showToast || function noop() {};
    const restore = deps.restoreAutoGrouping || restoreAutoGrouping;
    const wait = deps.wait || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const postflightWarning = deps.postflightWarning || impositionCopy.action.postflightWarning;

    logger.log('[ActionTab] Imposition Successful!', engineResult.data);
    await wait(500);

    if (deps.postflightOrchestrator && (deps.bridgeInst || deps.hostGateway)) {
        logger.log('[ActionTab] Running Postflight Orchestrator...');
        const summary = await deps.postflightOrchestrator.runAll({
            bridge: deps.bridgeInst,
            hostGateway: deps.hostGateway,
            resultData: engineResult.data,
            preset
        });
        if (typeof deps.setLastPostflightSummary === 'function') {
            deps.setLastPostflightSummary(summary);
        }
        if (summary && summary.failedCount > 0) {
            logger.warn('[ActionTab] Postflight completed with hook failures.', summary);
            showToast(postflightWarning, 'warning');
        }
    }

    await restore(preflightContext, deps);
}

function clearLastPostflightSummary(deps) {
    if (typeof deps.setLastPostflightSummary === 'function') {
        deps.setLastPostflightSummary(null);
    }
}

async function completeSuccessfulRun({ engineResult, hydratedPreset, preflightContext, deps, onSuccess, saveAfterRun }) {
    await onSuccess(engineResult, hydratedPreset, preflightContext, deps);
    return {
        status: 'success',
        engineResult,
        preflightContext,
        saveResult: await saveAfterRun(hydratedPreset, deps)
    };
}

export async function runPresetExecutionFlow(preset, deps = {}) {
    const logger = defaultLogger(deps.logger);
    const hydrate = deps.hydratePreset;
    const compile = deps.compilePresetRules || compilePresetRules;
    const preflightRunner = deps.runPreflight || runPreflight;
    const execute = deps.executeImposition || executeImposition;
    const onFailure = deps.handleEngineFailure || handleEngineFailure;
    const onSuccess = deps.handleEngineSuccess || handleEngineSuccess;
    const saveAfterRun = deps.saveDocumentAfterSuccessfulRun || saveDocumentAfterSuccessfulRun;

    try {
        clearLastPostflightSummary(deps);

        const hydratedPreset = hydrate(preset);
        logger.log('-> Preset:', preset.label);

        compile(hydratedPreset, deps);

        const preflightContext = await preflightRunner(deps.preflightOrchestrator, deps.bridgeInst, deps);
        if (preflightContext === null) {
            return { status: 'cancelled' };
        }

        const engineResult = await execute(hydratedPreset, deps);
        if (!engineResult || !engineResult.success) {
            await onFailure(engineResult, preflightContext, deps);
            return { status: 'failed', engineResult, preflightContext };
        }

        return completeSuccessfulRun({
            engineResult,
            hydratedPreset,
            preflightContext,
            deps,
            onSuccess,
            saveAfterRun
        });
    } catch (fatalErr) {
        logger.error('FATAL ERROR IN runWithPreset:', fatalErr);
        return { status: 'error', error: fatalErr };
    }
}
