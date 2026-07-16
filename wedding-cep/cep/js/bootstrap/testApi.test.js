import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createWeddingTestApi, registerWeddingTestApi } from "./testApi.js";

describe("wedding test API", () => {
    it("exposes hostFacade compatibility aliases, debug host, compact builder state, and namespaced modules", () => {
        const hostFacade = { id: "host-facade-mock" };
        const debugHost = { id: "debug-host-mock" };
        const appRuntimeState = { compactBuilder: null };
        const api = createWeddingTestApi({
            hostFacade,
            debugHost,
            appRuntimeState,
            modules: {
                inputEngine: { id: "input-engine" }
            }
        });

        assert.equal(api.getBridge(), hostFacade);
        assert.equal(api.getHostFacade(), hostFacade);
        assert.equal(api.getHostDebug(), debugHost);
        assert.equal(api.getCompactBuilder(), null);
        assert.equal(api.modules.inputEngine.id, "input-engine");

        appRuntimeState.compactBuilder = { id: "builder-ready" };
        assert.deepEqual(api.getCompactBuilder(), { id: "builder-ready" });
    });

    it("registers the API on window using the stable namespaced contract", () => {
        const fakeWindow = {};
        const hostFacade = { id: "host-facade-mock" };
        const debugHost = { id: "debug-host-mock" };
        const appRuntimeState = {};

        const api = registerWeddingTestApi(
            {
                hostFacade,
                debugHost,
                appRuntimeState,
                modules: {
                    manualInjectAction: { injectSingle() {} }
                }
            },
            { window: fakeWindow }
        );

        assert.equal(fakeWindow.__WEDDING_TEST_API__, api);
        assert.equal(typeof api.getBridge, "function");
        assert.equal(typeof api.getHostFacade, "function");
        assert.equal(typeof api.getHostDebug, "function");
        assert.equal(typeof api.getCompactBuilder, "function");
        assert.equal(typeof api.modules.manualInjectAction.injectSingle, "function");
    });
});
