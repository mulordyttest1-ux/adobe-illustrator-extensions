import { initToolkitApp } from './bootstrap/startup.js';
import { registerToolkitTestApi } from './bootstrap/testApi.js';
import { createHostFacade } from './infrastructure/hostFacade.js';

const runtimeState = {
    ready: false,
    shell: null,
    catalog: null,
    hostRuntime: null,
    services: null,
    lastResult: null,
    error: null
};

const { hostFacade, hostRuntime, debugHost, requestServices, panelMode } = createHostFacade();

registerToolkitTestApi({
    getHostFacade: () => hostFacade,
    getHostRuntime: () => hostRuntime,
    getHostDebug: () => debugHost,
    getPanelMode: () => panelMode,
    getRuntimeState: () => runtimeState,
    getShell: () => runtimeState.shell,
    getCatalog: () => runtimeState.catalog
});

void initToolkitApp({
    hostFacade,
    hostRuntime,
    debugHost,
    requestServices,
    panelMode,
    runtimeState
});
