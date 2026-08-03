import { TabbedPanel } from "../components/TabbedPanel.js";
import {
    initCompactTab,
    initSchemaTab,
    markTabsBooting,
    waitForCompactReady
} from "./tabBootSupport.js";

export function createCompactController({ hostFacade, schema }, deps = {}) {
    return {
        init: () => initCompactTab({ hostFacade, schema }, deps)
    };
}

export function createSchemaController({ hostFacade, bridge }, deps = {}) {
    const resolvedHostFacade = hostFacade || bridge;
    return {
        init: () => initSchemaTab({ hostFacade: resolvedHostFacade, bridge: resolvedHostFacade }, deps)
    };
}

export async function bootTabbedShell({ hostFacade, bridge, schema }, deps = {}) {
    const resolvedSchemaHostFacade = hostFacade || bridge;
    const TabbedPanelImpl = deps.TabbedPanel || TabbedPanel;
    const createCompactControllerImpl = deps.createCompactController || ((args) => createCompactController(args, deps));
    const createSchemaControllerImpl = deps.createSchemaController || ((args) => createSchemaController(args, deps));

    markTabsBooting(deps);
    new TabbedPanelImpl({
        tabsSelector: ".ds-tab",
        panelsSelector: ".ds-tab-panel",
        controllers: {
            compact: createCompactControllerImpl({ hostFacade, schema }),
            schema: createSchemaControllerImpl({ hostFacade: resolvedSchemaHostFacade, bridge: resolvedSchemaHostFacade }),
            settings: { init: () => {} }
        },
        onTabChange: () => {}
    });

    await waitForCompactReady(deps);
}
