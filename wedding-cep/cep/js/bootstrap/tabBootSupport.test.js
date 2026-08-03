import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    initCompactTab,
    initSchemaTab,
    markTabsBooting,
    waitForCompactReady
} from "./tabBootSupport.js";

function createFakeDocument(elements = {}) {
    return {
        readyState: "complete",
        elements,
        addEventListener() {},
        getElementById(id) {
            return this.elements[id] || null;
        }
    };
}

describe("tabBootSupport", () => {
    it("marks the tabs phase through the injected ready-state updater", () => {
        const calls = [];

        markTabsBooting({
            updateReadyState: (patch) => calls.push(patch)
        });

        assert.deepEqual(calls, [{ phase: "tabs" }]);
    });

    it("initializes the compact tab through the injected builder and action wiring", () => {
        const appRuntimeState = {};
        const compactContainer = { innerHTML: "seed" };
        const fakeDocument = createFakeDocument({ "compact-content": compactContainer });
        const schema = { id: "schema-mock" };
        const bridge = { id: "bridge-mock" };
        const builtBuilder = { refs: { marker: true } };
        const calls = [];

        class FakeCompactFormBuilder {
            constructor(options) {
                calls.push(["builder", options.container, options.schema]);
            }

            build() {
                return builtBuilder;
            }
        }

        initCompactTab(
            { hostFacade: bridge, schema },
            {
                document: fakeDocument,
                appRuntimeState,
                updateReadyState: (patch) => calls.push(["ready", patch]),
                CompactFormBuilder: FakeCompactFormBuilder,
                wireActionButtons: (args) => calls.push(["wire", args])
            }
        );

        assert.equal(compactContainer.innerHTML, "");
        assert.equal(appRuntimeState.compactBuilder, builtBuilder);
        assert.deepEqual(calls, [
            ["ready", { phase: "compact", compactReady: false }],
            ["builder", compactContainer, schema],
            ["wire", { hostFacade: bridge, compactBuilder: builtBuilder }],
            ["ready", { phase: "compact", compactReady: true }]
        ]);
    });

    it("initializes the schema tab through the injected renderer and action wiring", () => {
        const schemaContainer = { id: "schema-container" };
        const fakeDocument = createFakeDocument({ "schema-content": schemaContainer });
        const bridge = { id: "bridge-mock" };
        const calls = [];

        class FakeSchemaTabComponents {
            constructor(container, schemaRefs) {
                calls.push(["builder", container]);
                this.schemaRefs = schemaRefs;
            }

            render() {
                this.schemaRefs.inject = "ready";
                calls.push(["render"]);
            }
        }

        initSchemaTab(
            { bridge },
            {
                document: fakeDocument,
                updateReadyState: (patch) => calls.push(["ready", patch]),
                SchemaTabComponents: FakeSchemaTabComponents,
                wireSchemaActions: (args) => calls.push(["wire", args])
            }
        );

        assert.deepEqual(calls, [
            ["ready", { phase: "schema", schemaReady: false }],
            ["builder", schemaContainer],
            ["render"],
            ["wire", { schemaRefs: { inject: "ready" }, hostFacade: bridge, bridge }],
            ["ready", { phase: "schema", schemaReady: true }]
        ]);
    });

    it("waits for compact readiness with the stable predicate and timeout contract", async () => {
        const calls = [];

        await waitForCompactReady({
            waitForReadyState: async (predicate, options) => {
                calls.push(["wait", options]);
                assert.equal(predicate({ compactReady: true }), true);
                assert.equal(predicate({ compactReady: false }), false);
                return { compactReady: true };
            }
        });

        assert.deepEqual(calls, [[
            "wait",
            {
                timeoutMs: 5000,
                pollMs: 50,
                phase: "compact",
                errorMessage: "Compact tab did not finish bootstrapping in time"
            }
        ]]);
    });
});
