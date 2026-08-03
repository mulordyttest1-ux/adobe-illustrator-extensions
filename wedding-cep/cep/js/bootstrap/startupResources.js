import { SchemaLoader } from "../infrastructure/schemaLoader.js";
import { AddressAutocomplete } from "../logic/ux/AddressAutocomplete.js";
import { initEthnicNameNormalizer } from "./loadCepData.js";
import {
    loadAutocompleteResources,
    runBestEffortHostPing,
    runStartupPhase
} from "./startupResourceSupport.js";

export async function loadStartupResources({ hostFacade }, deps = {}) {
    const resolvedHostFacade = deps.hostFacade || hostFacade;
    const updateReadyState = deps.updateReadyState || (() => {});
    const consoleImpl = deps.console || console;
    const AddressAutocompleteImpl = deps.AddressAutocomplete || AddressAutocomplete;
    const SchemaLoaderImpl = deps.SchemaLoader || SchemaLoader;
    const initEthnicNameNormalizerImpl = deps.initEthnicNameNormalizer || initEthnicNameNormalizer;

    await runStartupPhase(updateReadyState, "bridge", () => runBestEffortHostPing(resolvedHostFacade, consoleImpl));

    await runStartupPhase(updateReadyState, "autocomplete", () =>
        loadAutocompleteResources({
            hostFacade: resolvedHostFacade,
            AddressAutocomplete: AddressAutocompleteImpl,
            initEthnicNameNormalizer: initEthnicNameNormalizerImpl
        })
    );

    const schema = await runStartupPhase(updateReadyState, "schema", () =>
        SchemaLoaderImpl.load({ hostFacade: resolvedHostFacade })
    );

    return { schema };
}
