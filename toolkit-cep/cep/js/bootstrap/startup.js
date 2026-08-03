import { UIFeedback } from '@shared/cep-ui';
import { loadGeneratedToolkitCatalog } from '../features/catalog/generatedCatalogLoader.js';
import { loadGeneratedToolkitRequestAdapters } from '../features/run/generatedRequestAdapters.js';
import { createCommandRunner } from '../features/run/commandRunner.js';
import { createToolkitShell } from '../features/shell/toolkitShell.js';
import { resetReadyState, updateReadyState } from './readyState.js';

function onDocumentReady(documentRef) {
    if (documentRef.readyState === 'complete' || documentRef.readyState === 'interactive') {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        documentRef.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
}

function buildRuntimeReadyPatch({ catalog, hostRuntimeMeta, runtimeState, documentRef }) {
    const searchInput = runtimeState.shell?.elements?.searchInput || null;

    return {
        catalogReady: true,
        catalogCount: catalog.modules.length,
        hostRuntimeReady: true,
        hostRuntimeHealthy: hostRuntimeMeta.quarantinedCount === 0,
        enabledModuleCount: catalog.enabledCount,
        quarantinedModuleCount: catalog.quarantinedCount,
        hostRuntime: hostRuntimeMeta,
        status: runtimeState.shell ? 'ready' : 'booting',
        phase: runtimeState.shell ? 'ready' : 'host-runtime-ready',
        searchFocused: Boolean(searchInput && documentRef.activeElement === searchInput),
        error: null
    };
}

export function createHostRuntimeSyncService({
    hostRuntime,
    runtimeState,
    documentRef = document,
    windowRef = window,
    loadCatalog = loadGeneratedToolkitCatalog
}) {
    return async function reloadAndSyncHostRuntime(options = {}) {
        updateReadyState({
            status: runtimeState.shell ? 'ready' : 'booting',
            phase: 'loading-host-runtime',
            hostRuntimeReady: false,
            error: null
        }, windowRef);

        await hostRuntime.reload(options);

        updateReadyState({
            status: runtimeState.shell ? 'ready' : 'booting',
            phase: 'inspecting-host-runtime',
            error: null
        }, windowRef);

        const hostRuntimeMeta = await hostRuntime.inspect();
        const catalog = loadCatalog(hostRuntimeMeta);

        runtimeState.catalog = catalog;
        runtimeState.hostRuntime = hostRuntimeMeta;

        if (runtimeState.shell && typeof runtimeState.shell.updateCatalog === 'function') {
            runtimeState.shell.updateCatalog(catalog);
        }

        updateReadyState(
            buildRuntimeReadyPatch({
                catalog,
                hostRuntimeMeta,
                runtimeState,
                documentRef
            }),
            windowRef
        );

        return {
            catalog,
            hostRuntimeMeta
        };
    };
}

export function createHostRuntimeInspectService({
    hostRuntime,
    runtimeState,
    documentRef = document,
    windowRef = window,
    loadCatalog = loadGeneratedToolkitCatalog
}) {
    return async function inspectAndSyncHostRuntime() {
        updateReadyState({
            status: runtimeState.shell ? 'ready' : 'booting',
            phase: 'inspecting-host-runtime',
            hostRuntimeReady: false,
            error: null
        }, windowRef);

        const hostRuntimeMeta = await hostRuntime.inspect();
        const catalog = loadCatalog(hostRuntimeMeta);

        runtimeState.catalog = catalog;
        runtimeState.hostRuntime = hostRuntimeMeta;

        if (runtimeState.shell && typeof runtimeState.shell.updateCatalog === 'function') {
            runtimeState.shell.updateCatalog(catalog);
        }

        updateReadyState(
            buildRuntimeReadyPatch({
                catalog,
                hostRuntimeMeta,
                runtimeState,
                documentRef
            }),
            windowRef
        );

        return {
            catalog,
            hostRuntimeMeta
        };
    };
}

function createWorkPanelReload(windowRef = window) {
    return async function reloadPanel() {
        windowRef.location.reload();
    };
}

async function createStartupRuntime({
    hostFacade,
    hostRuntime,
    runtimeState,
    documentRef,
    windowRef,
    UIFeedbackRef,
    loadCatalog,
    requestAdapters,
    requestServices,
    createCommandRunnerFn,
    createToolkitShellFn
}) {
    const commandRunner = createCommandRunnerFn({
        hostFacade,
        UIFeedback: UIFeedbackRef,
        runtimeState,
        requestAdapters,
        requestServices
    });
    const inspectAndSyncHostRuntime = createHostRuntimeInspectService({
        hostRuntime,
        runtimeState,
        documentRef,
        windowRef,
        loadCatalog
    });
    const reloadAndSyncHostRuntime = createHostRuntimeSyncService({
        hostRuntime,
        runtimeState,
        documentRef,
        windowRef,
        loadCatalog
    });
    const initialRuntime = await inspectAndSyncHostRuntime();
    const reloadPanel = createWorkPanelReload(windowRef);
    const shell = createToolkitShellFn({
        documentRef,
        catalog: initialRuntime.catalog,
        commandRunner,
        reloadPanel
    });

    return {
        commandRunner,
        inspectAndSyncHostRuntime,
        reloadAndSyncHostRuntime,
        reloadPanel,
        shell
    };
}

function finalizeSuccessfulStartup({
    runtimeState,
    shell,
    commandRunner,
    inspectAndSyncHostRuntime,
    reloadPanel,
    reloadAndSyncHostRuntime,
    documentRef,
    windowRef,
    loadingOverlay,
    UIFeedbackRef
}) {
    runtimeState.shell = shell;
    runtimeState.services = {
        commandRunner,
        inspectAndSyncHostRuntime,
        reloadPanel,
        reloadAndSyncHostRuntime
    };
    runtimeState.error = null;

    shell.renderInitial();
    shell.focusSearch();

    updateReadyState({
        ...buildRuntimeReadyPatch({
            catalog: runtimeState.catalog,
            hostRuntimeMeta: runtimeState.hostRuntime,
            runtimeState,
            documentRef
        }),
        status: 'ready',
        phase: 'ready',
        searchFocused: documentRef.activeElement === shell.elements.searchInput
    }, windowRef);

    runtimeState.ready = true;
    loadingOverlay?.setAttribute('hidden', 'hidden');
    UIFeedbackRef.hideLoading();
}

function handleStartupFailure({
    runtimeState,
    error,
    windowRef,
    UIFeedbackRef,
    summaryElement,
    loadingOverlay
}) {
    const message = error && error.message ? error.message : 'Toolkit startup failed';

    runtimeState.ready = false;
    runtimeState.error = error;
    updateReadyState({
        status: 'error',
        phase: 'failed',
        error: message
    }, windowRef);
    loadingOverlay?.setAttribute('hidden', 'hidden');
    UIFeedbackRef.hideLoading();
    UIFeedbackRef.showError(summaryElement, message);
}

export async function initToolkitApp({
    hostFacade,
    hostRuntime,
    runtimeState,
    documentRef = document,
    windowRef = window,
    UIFeedbackRef = UIFeedback,
    loadCatalog = loadGeneratedToolkitCatalog,
    loadRequestAdapters = loadGeneratedToolkitRequestAdapters,
    requestServices = {},
    createCommandRunnerFn = createCommandRunner,
    createToolkitShellFn = createToolkitShell
} = {}) {
    resetReadyState(windowRef);
    await onDocumentReady(documentRef);

    const loadingOverlay = documentRef.getElementById('loading-overlay');
    const summaryElement = documentRef.getElementById('toolkit-execution-summary');

    try {
        const startupRuntime = await createStartupRuntime({
            hostFacade,
            hostRuntime,
            runtimeState,
            documentRef,
            windowRef,
            UIFeedbackRef,
            loadCatalog,
            requestAdapters: loadRequestAdapters(),
            requestServices,
            createCommandRunnerFn,
            createToolkitShellFn
        });

        finalizeSuccessfulStartup({
            runtimeState,
            shell: startupRuntime.shell,
            commandRunner: startupRuntime.commandRunner,
            inspectAndSyncHostRuntime: startupRuntime.inspectAndSyncHostRuntime,
            reloadPanel: startupRuntime.reloadPanel,
            reloadAndSyncHostRuntime: startupRuntime.reloadAndSyncHostRuntime,
            documentRef,
            windowRef,
            loadingOverlay,
            UIFeedbackRef
        });
    } catch (error) {
        handleStartupFailure({
            runtimeState,
            error,
            windowRef,
            UIFeedbackRef,
            summaryElement,
            loadingOverlay
        });
    }
}
