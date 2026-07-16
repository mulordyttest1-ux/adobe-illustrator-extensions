function createGetter(accessor) {
    return function getValue() {
        return accessor();
    };
}

export function registerToolkitTestApi(accessors, windowOverride = window) {
    windowOverride.__TOOLKIT_TEST_API__ = Object.freeze({
        getHostFacade: createGetter(accessors.getHostFacade),
        getHostRuntime: createGetter(accessors.getHostRuntime),
        getHostDebug: createGetter(accessors.getHostDebug),
        getPanelMode: createGetter(accessors.getPanelMode),
        getRuntimeState: createGetter(accessors.getRuntimeState),
        getShell: createGetter(accessors.getShell),
        getCatalog: createGetter(accessors.getCatalog)
    });

    return windowOverride.__TOOLKIT_TEST_API__;
}
