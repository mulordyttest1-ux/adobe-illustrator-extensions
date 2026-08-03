import { UIFeedback as sharedUIFeedback } from "@shared/cep-ui";
import { CompactFormBuilder } from "../components/compact-form/CompactFormBuilder.js";
import { TabbedPanel } from "../components/TabbedPanel.js";
import { SchemaTabComponents } from "../components/schema-tab/SchemaTabComponents.js";
import { SchemaLoader } from "../infrastructure/schemaLoader.js";
import { AddressAutocomplete } from "../logic/ux/AddressAutocomplete.js";
import { initEthnicNameNormalizer } from "./loadCepData.js";
import { resetReadyState, updateReadyState, waitForReadyState } from "./readyState.js";
import { loadStartupResources } from "./startupResources.js";
import {
    createStartupDeps
} from "./startupSupport.js";
import { bootTabbedShell, createCompactController, createSchemaController } from "./tabBoot.js";
import { wireActionButtons, wireSchemaActions } from "./wireActions.js";

export async function initApp({ hostFacade, appRuntimeState = {} }, overrides = {}) {
    const deps = createStartupDeps({
        appRuntimeState,
        overrides,
        defaults: {
            UIFeedback: sharedUIFeedback,
            AddressAutocomplete,
            SchemaLoader,
            TabbedPanel,
            CompactFormBuilder,
            SchemaTabComponents,
            initEthnicNameNormalizer,
            wireActionButtons,
            wireSchemaActions,
            updateReadyState,
            resetReadyState,
            waitForReadyState,
            createCompactController,
            createSchemaController,
            loadStartupResources,
            bootTabbedShell
        }
    });
    const { UIFeedback } = deps;
    const resolvedHostFacade = deps.hostFacade || hostFacade;

    deps.appRuntimeState.compactBuilder = null;
    deps.resetReadyState();
    deps.enableInputAutoSelect();

    try {
        await deps.waitForDOM();
        deps.updateReadyState({ phase: "dom" });

        const { schema } = await deps.loadStartupResources({
            hostFacade: resolvedHostFacade
        });

        await deps.bootTabbedShell({
            hostFacade: resolvedHostFacade,
            schema,
            appRuntimeState: deps.appRuntimeState
        });

        deps.updateReadyState({
            status: "ready",
            phase: "ready",
            error: null
        });
        UIFeedback.hideLoading();
    } catch (error) {
        deps.updateReadyState({
            status: "error",
            phase: "error",
            error: error.message
        });
        console.error("[App] Boot failed:", error);
        UIFeedback.showError(
            deps.getAppElement(),
            "Lỗi khởi động panel: " + error.message
        );
        UIFeedback.hideLoading();
    }
}

export { updateReadyState, createCompactController, createSchemaController };
