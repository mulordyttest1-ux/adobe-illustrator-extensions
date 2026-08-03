import { CompactFormBuilder } from "../components/compact-form/CompactFormBuilder.js";
import { SchemaTabComponents } from "../components/schema-tab/SchemaTabComponents.js";
import { updateReadyState, waitForReadyState } from "./readyState.js";
import { wireActionButtons, wireSchemaActions } from "./wireActions.js";

function getDocumentRef(deps = {}) {
    return deps.document || document;
}

function getReadyStateUpdater(deps = {}) {
    return deps.updateReadyState || ((patch) => updateReadyState(patch, deps));
}

export function markTabsBooting(deps = {}) {
    getReadyStateUpdater(deps)({ phase: "tabs" });
}

export function initCompactTab({ hostFacade, schema }, deps = {}) {
    const targetDocument = getDocumentRef(deps);
    const targetAppRuntimeState = deps.appRuntimeState || {};
    const updateReadyStateImpl = getReadyStateUpdater(deps);
    const CompactFormBuilderImpl = deps.CompactFormBuilder || CompactFormBuilder;
    const wireActionButtonsImpl = deps.wireActionButtons || wireActionButtons;

    updateReadyStateImpl({
        phase: "compact",
        compactReady: false
    });

    const compactContainer = targetDocument.getElementById("compact-content");
    targetAppRuntimeState.compactBuilder = null;
    if (!compactContainer || !schema) {
        return;
    }

    compactContainer.innerHTML = "";
    const compactBuilder = new CompactFormBuilderImpl({
        container: compactContainer,
        schema,
        onChange: () => {}
    }).build();
    targetAppRuntimeState.compactBuilder = compactBuilder;

    wireActionButtonsImpl({
        hostFacade,
        compactBuilder
    });

    updateReadyStateImpl({
        phase: "compact",
        compactReady: true
    });
}

export function initSchemaTab({ hostFacade, bridge }, deps = {}) {
    const targetDocument = getDocumentRef(deps);
    const updateReadyStateImpl = getReadyStateUpdater(deps);
    const SchemaTabComponentsImpl = deps.SchemaTabComponents || SchemaTabComponents;
    const wireSchemaActionsImpl = deps.wireSchemaActions || wireSchemaActions;

    updateReadyStateImpl({
        phase: "schema",
        schemaReady: false
    });

    const schemaContainer = targetDocument.getElementById("schema-content");
    if (!schemaContainer) {
        return;
    }

    const schemaRefs = {};
    const schemaBuilder = new SchemaTabComponentsImpl(schemaContainer, schemaRefs);
    schemaBuilder.render();
    wireSchemaActionsImpl({
        schemaRefs,
        hostFacade: hostFacade || bridge,
        bridge: hostFacade || bridge
    });

    updateReadyStateImpl({
        phase: "schema",
        schemaReady: true
    });
}

export async function waitForCompactReady(deps = {}) {
    const waitForReadyStateImpl = deps.waitForReadyState || ((predicate, options) => waitForReadyState(predicate, options, deps));

    await waitForReadyStateImpl(
        (state) => state.compactReady === true,
        {
            timeoutMs: 5000,
            pollMs: 50,
            phase: "compact",
            errorMessage: "Compact tab did not finish bootstrapping in time"
        }
    );
}
