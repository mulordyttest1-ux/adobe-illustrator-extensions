import { InjectSchemaAction } from "../actions/InjectSchemaAction.js";
import { ManualInjectAction } from "../actions/ManualInjectAction.js";
import { ScanAction } from "../actions/ScanAction.js";
import { SwapAction } from "../actions/SwapAction.js";
import { UpdateAction } from "../actions/UpdateAction.js";
import { SCHEMA_TAB_BUTTONS_BY_ID } from "../components/schema-tab/schemaTabConfig.js";

function wireButton(button, handler) {
    if (button && handler) {
        button.addEventListener("click", handler);
    }
}

export function wireActionButtons({ hostFacade, compactBuilder }) {
    const scanBtn = document.getElementById("btn-compact-scan");
    wireButton(scanBtn, () => {
        ScanAction.execute({
            hostFacade,
            builder: compactBuilder,
            button: scanBtn
        });
    });

    const updateBtn = document.getElementById("btn-compact-update");
    wireButton(updateBtn, () => {
        UpdateAction.execute({
            hostFacade,
            builder: compactBuilder,
            button: updateBtn
        });
    });

    const swapBtn = document.getElementById("btn-compact-swap");
    wireButton(swapBtn, () => {
        SwapAction.execute({
            builder: compactBuilder
        });
    });

    const reloadBtn = document.getElementById("btn-reload-panel");
    wireButton(reloadBtn, () => location.reload());
}

function createSchemaActionHandler(buttonConfig, button, hostFacade, deps = {}) {
    const injectSchemaAction = deps.InjectSchemaAction || InjectSchemaAction;
    const manualInjectAction = deps.ManualInjectAction || ManualInjectAction;

    switch (buttonConfig.actionKind) {
        case "autoInject":
            return () => {
                injectSchemaAction.execute({ hostFacade, button });
            };
        case "bulkInject":
            return () => {
                manualInjectAction.injectBulk({
                    hostFacade,
                    button,
                    prefix: buttonConfig.prefix
                });
            };
        case "compoundInject":
            return () => {
                manualInjectAction.injectCompound({
                    hostFacade,
                    button,
                    schemaValue: button.dataset.schema
                });
            };
        case "dateClone":
            return () => {
                manualInjectAction.injectDateClone({
                    hostFacade,
                    button,
                    targetMoc: button.dataset.cloneTarget
                });
            };
        case "singleInject":
            return () => {
                manualInjectAction.injectSingle({
                    hostFacade,
                    button,
                    schemaValue: button.dataset.schema
                });
            };
        default:
            return null;
    }
}

export function wireSchemaActions({ schemaRefs, hostFacade, bridge }, deps = {}) {
    const resolvedHostFacade = hostFacade || bridge;
    Object.entries(schemaRefs).forEach(([key, button]) => {
        const buttonConfig = SCHEMA_TAB_BUTTONS_BY_ID[key];
        if (!buttonConfig) {
            return;
        }

        const handler = createSchemaActionHandler(buttonConfig, button, resolvedHostFacade, deps);
        wireButton(button, handler);
    });
}

export { createSchemaActionHandler };
