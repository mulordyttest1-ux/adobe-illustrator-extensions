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

export function createCommandRunner({ hostFacade, UIFeedback, runtimeState }) {
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

            const hostResult = await runHostCommandWithRuntimeSyncFallback({
                hostFacade,
                runtimeState,
                request: {
                    id: manifest.id,
                    payload: {}
                }
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
