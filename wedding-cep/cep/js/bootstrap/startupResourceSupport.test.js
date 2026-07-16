import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    loadAutocompleteResources,
    runBestEffortHostPing,
    runStartupPhase
} from "./startupResourceSupport.js";

describe("startupResourceSupport", () => {
    it("updates ready state before running a startup phase task", async () => {
        const phases = [];
        const result = await runStartupPhase(
            (patch) => phases.push(patch.phase),
            "autocomplete",
            async () => "done"
        );

        assert.deepEqual(phases, ["autocomplete"]);
        assert.equal(result, "done");
    });

    it("keeps hostFacade ping best-effort and logs the warning when it fails", async () => {
        const warnings = [];

        await runBestEffortHostPing(
            {
                async testConnection() {
                    throw new Error("hostFacade unavailable");
                }
            },
            {
                warn: (...args) => warnings.push(args)
            }
        );

        assert.equal(warnings.length, 1);
        assert.equal(String(warnings[0][0]).includes("HostFacade connection failed silently"), true);
        assert.equal(warnings[0][1] instanceof Error, true);
    });

    it("loads address autocomplete and ethnic-name resources through the same hostFacade", async () => {
        const calls = [];
        const hostFacade = { id: "host-facade-mock" };

        await loadAutocompleteResources({
            hostFacade,
            AddressAutocomplete: {
                init: async ({ hostFacade: resolvedHostFacade }) => calls.push(["AddressAutocomplete.init", resolvedHostFacade])
            },
            initEthnicNameNormalizer: async ({ hostFacade: resolvedHostFacade }) =>
                calls.push(["initEthnicNameNormalizer", resolvedHostFacade])
        });

        assert.deepEqual(calls, [
            ["AddressAutocomplete.init", hostFacade],
            ["initEthnicNameNormalizer", hostFacade]
        ]);
    });
});
