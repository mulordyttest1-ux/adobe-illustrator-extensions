import { CalendarEngine, NameAnalysis } from "@wedding/domain";
import { EthnicNameNormalizer } from "../logic/ux/normalizers/EthnicNameNormalizer.js";
import { NameValidator } from "../logic/ux/validators/NameValidator.js";

function ensureHostFacade(hostFacade) {
    if (!hostFacade) {
        throw new Error("HostFacade is required");
    }
    return hostFacade;
}

export async function initCalendarEngine({ hostFacade, host } = {}) {
    try {
        const { absolutePath, content } = await ensureHostFacade(hostFacade || host).readExtensionText("data/ngay.csv", {
            strategy: "node-fs"
        });
        if (!content) {
            console.warn("[App] CalendarEngine database not found:", absolutePath);
            return;
        }

        CalendarEngine.loadDatabase(content);
    } catch (error) {
        console.error("[App] Failed to init CalendarEngine:", error);
    }
}

export async function initEthnicNameNormalizer({ hostFacade, host } = {}) {
    try {
        const { absolutePath, content } = await ensureHostFacade(hostFacade || host).readExtensionText("data/ethnic_names.json", {
            strategy: "node-fs"
        });
        if (!content) {
            console.warn("[App] ethnic_names.json not found:", absolutePath);
            return;
        }

        EthnicNameNormalizer.init(JSON.parse(content));
        NameAnalysis.setSuggestIdxFn((name) => NameValidator.suggestIdx(name));
        console.log("[App] EthnicNameNormalizer ready");
    } catch (error) {
        console.error("[App] Failed to init EthnicNameNormalizer:", error);
    }
}
