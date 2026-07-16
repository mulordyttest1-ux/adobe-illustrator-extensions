const DEFAULT_READY_STATE = Object.freeze({
    status: 'booting',
    phase: 'initializing',
    catalogReady: false,
    catalogCount: 0,
    hostRuntimeReady: false,
    hostRuntimeHealthy: false,
    enabledModuleCount: 0,
    quarantinedModuleCount: 0,
    hostRuntime: null,
    searchFocused: false,
    error: null
});

function getWindowRef(windowOverride) {
    if (windowOverride) {
        return windowOverride;
    }

    return window;
}

export function resetReadyState(windowOverride) {
    const windowRef = getWindowRef(windowOverride);
    windowRef.__TOOLKIT_APP_READY__ = { ...DEFAULT_READY_STATE };
    return windowRef.__TOOLKIT_APP_READY__;
}

export function updateReadyState(patch, windowOverride) {
    const windowRef = getWindowRef(windowOverride);
    const previousState = windowRef.__TOOLKIT_APP_READY__ || resetReadyState(windowRef);
    windowRef.__TOOLKIT_APP_READY__ = {
        ...previousState,
        ...patch
    };
    return windowRef.__TOOLKIT_APP_READY__;
}
