import { initApp } from "./bootstrap/startup.js";
import { registerWeddingTestApi } from "./bootstrap/testApi.js";
import { createHostFacade } from "./infrastructure/hostFacade.js";

const { hostFacade, debugHost } = createHostFacade();
const APP_RUNTIME_STATE = {
    compactBuilder: null
};

registerWeddingTestApi({
    hostFacade,
    debugHost,
    appRuntimeState: APP_RUNTIME_STATE
});

initApp({
    hostFacade,
    appRuntimeState: APP_RUNTIME_STATE
});
