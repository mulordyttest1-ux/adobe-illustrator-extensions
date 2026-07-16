export function getDocumentRef(deps = {}) {
    return deps.document || document;
}

export function resolveOverride(overrides, key, fallback) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        return overrides[key];
    }
    return fallback;
}

export async function waitForDOM(deps = {}) {
    const targetDocument = getDocumentRef(deps);
    if (targetDocument.readyState === 'loading') {
        await new Promise((resolve) => {
            targetDocument.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }
}

export function enableInputAutoSelect(deps = {}) {
    getDocumentRef(deps).addEventListener('focusin', (event) => {
        if (event.target.matches('input, textarea')) {
            event.target.select();
        }
    });
}

export function createStartupDeps({ appRuntimeState = {}, overrides = {}, defaults = {} } = {}) {
    const deps = {
        window: overrides.window,
        document: overrides.document,
        now: overrides.now,
        sleep: overrides.sleep,
        hostFacade: overrides.hostFacade || overrides.host,
        appRuntimeState,
        UIFeedback: resolveOverride(overrides, 'UIFeedback', defaults.UIFeedback),
        AddressAutocomplete: resolveOverride(overrides, 'AddressAutocomplete', defaults.AddressAutocomplete),
        SchemaLoader: resolveOverride(overrides, 'SchemaLoader', defaults.SchemaLoader),
        TabbedPanel: resolveOverride(overrides, 'TabbedPanel', defaults.TabbedPanel),
        CompactFormBuilder: resolveOverride(overrides, 'CompactFormBuilder', defaults.CompactFormBuilder),
        SchemaTabComponents: resolveOverride(overrides, 'SchemaTabComponents', defaults.SchemaTabComponents),
        initCalendarEngine: resolveOverride(overrides, 'initCalendarEngine', defaults.initCalendarEngine),
        initEthnicNameNormalizer: resolveOverride(overrides, 'initEthnicNameNormalizer', defaults.initEthnicNameNormalizer),
        wireActionButtons: resolveOverride(overrides, 'wireActionButtons', defaults.wireActionButtons),
        wireSchemaActions: resolveOverride(overrides, 'wireSchemaActions', defaults.wireSchemaActions)
    };

    deps.updateReadyState = resolveOverride(overrides, 'updateReadyState', (patch) => defaults.updateReadyState(patch, deps));
    deps.resetReadyState = resolveOverride(overrides, 'resetReadyState', () => defaults.resetReadyState(deps));
    deps.waitForDOM = resolveOverride(overrides, 'waitForDOM', () => waitForDOM(deps));
    deps.enableInputAutoSelect = resolveOverride(overrides, 'enableInputAutoSelect', () => enableInputAutoSelect(deps));
    deps.waitForReadyState = resolveOverride(
        overrides,
        'waitForReadyState',
        (predicate, options) => defaults.waitForReadyState(predicate, options, deps)
    );
    deps.createCompactController = resolveOverride(
        overrides,
        'createCompactController',
        (args) => defaults.createCompactController(args, deps)
    );
    deps.createSchemaController = resolveOverride(
        overrides,
        'createSchemaController',
        (args) => defaults.createSchemaController(args, deps)
    );
    deps.loadStartupResources = resolveOverride(
        overrides,
        'loadStartupResources',
        (args) => defaults.loadStartupResources(args, deps)
    );
    deps.bootTabbedShell = resolveOverride(
        overrides,
        'bootTabbedShell',
        (args) => defaults.bootTabbedShell(args, deps)
    );
    deps.getAppElement = resolveOverride(
        overrides,
        'getAppElement',
        () => getDocumentRef(deps).getElementById('app')
    );

    return deps;
}
