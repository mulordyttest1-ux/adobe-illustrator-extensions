export async function runStartupPhase(updateReadyState, phase, task) {
    updateReadyState({ phase });
    return task();
}

export async function runBestEffortHostPing(hostFacade, consoleImpl) {
    try {
        await hostFacade.testConnection();
    } catch (error) {
        consoleImpl.warn('[App] HostFacade connection failed silently', error);
    }
}

export async function loadAutocompleteResources({
    hostFacade,
    AddressAutocomplete,
    initEthnicNameNormalizer
}) {
    await AddressAutocomplete.init({ hostFacade });
    await initEthnicNameNormalizer({ hostFacade });
}
