import { evaluateCommandPreflight } from './commandPreflight.js';

function normalizeResult(result, manifest) {
    const message = result.message || manifest.successMessage || 'Command complete.';
    return {
        success: result.success !== false,
        message,
        errorCode: result.errorCode || null,
        data: typeof result.data === 'undefined' ? null : result.data
    };
}

function resolveToastTone(result) {
    if (result.success) {
        return 'success';
    }

    if (typeof result.errorCode === 'string' && /CANCELLED$/.test(result.errorCode)) {
        return 'warning';
    }

    return 'error';
}

function shouldRetryAfterRuntimeSync(result) {
    return result?.success === false && result?.errorCode === 'UNKNOWN_TOOLKIT_COMMAND';
}

function normalizeSyncFailure(error, fallbackResult) {
    return {
        success: false,
        message: error?.message || fallbackResult?.message || 'Toolkit host runtime sync failed.',
        errorCode: error?.errorCode || 'TOOLKIT_HOST_RUNTIME_SYNC_FAILED',
        data: fallbackResult && typeof fallbackResult.data !== 'undefined' ? fallbackResult.data : null
    };
}

async function runHostCommandWithRuntimeSyncFallback({ hostFacade, runtimeState, request }) {
    let hostResult = await hostFacade.runCommand(request);
    const reloadAndSyncHostRuntime = runtimeState?.services?.reloadAndSyncHostRuntime;

    if (!shouldRetryAfterRuntimeSync(hostResult) || typeof reloadAndSyncHostRuntime !== 'function') {
        return hostResult;
    }

    try {
        await reloadAndSyncHostRuntime();
    } catch (error) {
        return normalizeSyncFailure(error, hostResult);
    }

    hostResult = await hostFacade.runCommand(request);
    return hostResult;
}

function createDisabledResult(manifest) {
    const message = manifest.disabledReason || 'This toolkit module is unavailable.';
    return {
        success: false,
        message,
        errorCode: manifest.status === 'quarantined'
            ? 'QUARANTINED_TOOLKIT_COMMAND'
            : 'TOOLKIT_COMMAND_DISABLED',
        data: null,
        blocked: true
    };
}

function createRequestPreparationFailure(error) {
    return {
        success: false,
        message: error && error.message ? error.message : 'Toolkit request preparation failed.',
        errorCode: error && error.errorCode
            ? error.errorCode
            : 'TOOLKIT_REQUEST_PREPARATION_FAILED',
        data: null,
        blocked: true
    };
}

async function prepareCommandRequest({ manifest, requestAdapters, requestServices }) {
    const prepareRequest = requestAdapters?.[manifest.id];

    if (typeof prepareRequest !== 'function') {
        return {
            request: {
                id: manifest.id,
                payload: {}
            }
        };
    }

    try {
        const prepared = await prepareRequest({
            manifest,
            services: requestServices
        });

        if (prepared?.cancelled) {
            return {
                cancelled: true,
                result: {
                    success: false,
                    message: prepared.message || `${manifest.buttonLabel} cancelled.`,
                    errorCode: prepared.errorCode || 'TOOLKIT_REQUEST_CANCELLED',
                    data: null,
                    blocked: true
                }
            };
        }

        if (!prepared || typeof prepared !== 'object' || !prepared.payload || typeof prepared.payload !== 'object') {
            throw new Error(`Request adapter for "${manifest.id}" returned an invalid payload.`);
        }

        return {
            request: {
                id: manifest.id,
                payload: prepared.payload
            }
        };
    } catch (error) {
        return {
            preparationError: createRequestPreparationFailure(error)
        };
    }
}

export function createCommandRunner({
    hostFacade,
    UIFeedback,
    runtimeState,
    requestAdapters = {},
    requestServices = {}
}) {
    return {
        async runManifest(manifest) {
            if (manifest.enabled === false) {
                const blockedResult = createDisabledResult(manifest);
                runtimeState.lastResult = blockedResult;
                UIFeedback.showToast(blockedResult.message, 'warning');
                return blockedResult;
            }

            const executionContext = await hostFacade.getExecutionContext();
            const preflight = evaluateCommandPreflight(manifest, executionContext);

            if (!preflight.ok) {
                const blockedResult = {
                    success: false,
                    message: preflight.message,
                    errorCode: preflight.code,
                    data: null,
                    blocked: true
                };
                runtimeState.lastResult = blockedResult;
                UIFeedback.showToast(preflight.message, 'warning');
                return blockedResult;
            }

            const preparedRequest = await prepareCommandRequest({
                manifest,
                requestAdapters,
                requestServices
            });

            if (preparedRequest.cancelled || preparedRequest.preparationError) {
                const requestResult = preparedRequest.cancelled
                    ? preparedRequest.result
                    : preparedRequest.preparationError;
                runtimeState.lastResult = requestResult;
                UIFeedback.showToast(
                    requestResult.message,
                    resolveToastTone(requestResult)
                );
                return requestResult;
            }

            const hostResult = await runHostCommandWithRuntimeSyncFallback({
                hostFacade,
                runtimeState,
                request: preparedRequest.request
            });
            const normalizedResult = normalizeResult(hostResult, manifest);
            runtimeState.lastResult = normalizedResult;

            UIFeedback.showToast(
                normalizedResult.message,
                resolveToastTone(normalizedResult)
            );

            return normalizedResult;
        }
    };
}
