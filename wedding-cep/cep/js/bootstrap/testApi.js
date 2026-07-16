import { ManualInjectAction } from "../actions/ManualInjectAction.js";
import { SchemaInjector } from "../logic/schema/SchemaInjector.js";
import { InputEngine } from "../logic/ux/InputEngine.js";
import { NameValidator } from "../logic/ux/validators/NameValidator.js";

const DEFAULT_MODULES = Object.freeze({
    inputEngine: InputEngine,
    nameValidator: NameValidator,
    schemaInjector: SchemaInjector,
    manualInjectAction: ManualInjectAction
});

function getWindowRef(deps = {}) {
    return deps.window || window;
}

export function createWeddingTestApi({ hostFacade, debugHost, bridge, appRuntimeState, modules = {} }) {
    const resolvedModules = Object.freeze({
        ...DEFAULT_MODULES,
        ...modules
    });
    const runtimeState = appRuntimeState || {};
    const resolvedHostFacade = hostFacade || bridge || null;
    const resolvedDebugHost = debugHost || null;

    return Object.freeze({
        getBridge() {
            return resolvedHostFacade;
        },
        getHostFacade() {
            return resolvedHostFacade;
        },
        getHostDebug() {
            return resolvedDebugHost;
        },
        getCompactBuilder() {
            return runtimeState.compactBuilder || null;
        },
        modules: resolvedModules
    });
}

export function registerWeddingTestApi(options, deps = {}) {
    const targetWindow = getWindowRef(deps);
    const api = createWeddingTestApi(options);
    targetWindow.__WEDDING_TEST_API__ = api;
    return api;
}
