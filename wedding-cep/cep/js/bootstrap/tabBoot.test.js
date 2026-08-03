import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bootTabbedShell, createCompactController, createSchemaController } from "./tabBoot.js";

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

describe("tabBoot", () => {
    it("createCompactController builds the compact form, wires actions, and marks readiness", () => {
        const fakeWindow = {};
        const appRuntimeState = {};
        const compactContainer = { innerHTML: "seed" };
        const fakeDocument = createFakeDocument({ "compact-content": compactContainer });
        const builtBuilder = { refs: { marker: true } };
        const bridge = { id: "bridge-mock" };
        const schema = { id: "schema-mock" };
        const wireCalls = [];
        let builderOptions = null;

        class FakeCompactFormBuilder {
            constructor(options) {
                builderOptions = options;
            }

            build() {
                return builtBuilder;
            }
        }

        const controller = createCompactController(
            { hostFacade: bridge, schema },
            {
                window: fakeWindow,
                document: fakeDocument,
                appRuntimeState,
                CompactFormBuilder: FakeCompactFormBuilder,
                wireActionButtons: (args) => {
                    wireCalls.push(args);
                }
            }
        );

        controller.init();

        assert.equal(compactContainer.innerHTML, "");
        assert.equal(appRuntimeState.compactBuilder, builtBuilder);
        assert.equal(fakeWindow.compactBuilder, undefined);
        assert.equal(builderOptions.container, compactContainer);
        assert.equal(builderOptions.schema, schema);
        assert.deepEqual(wireCalls, [{
            hostFacade: bridge,
            compactBuilder: builtBuilder
        }]);
        assert.equal(fakeWindow.__WEDDING_APP_READY__.phase, "compact");
        assert.equal(fakeWindow.__WEDDING_APP_READY__.compactReady, true);
    });

    it("createSchemaController renders schema UI, wires actions, and marks readiness", () => {
        const fakeWindow = {};
        const schemaContainer = { id: "schema-container" };
        const fakeDocument = createFakeDocument({ "schema-content": schemaContainer });
        const bridge = { id: "bridge-mock" };
        let renderCalled = false;
        let wireCall = null;

        class FakeSchemaTabComponents {
            constructor(container, schemaRefs) {
                assert.equal(container, schemaContainer);
                this.schemaRefs = schemaRefs;
            }

            render() {
                renderCalled = true;
                this.schemaRefs.inject = "ready";
            }
        }

        const controller = createSchemaController(
            { bridge },
            {
                window: fakeWindow,
                document: fakeDocument,
                SchemaTabComponents: FakeSchemaTabComponents,
                wireSchemaActions: (args) => {
                    wireCall = args;
                }
            }
        );

        controller.init();

        assert.equal(renderCalled, true);
        assert.deepEqual(wireCall, {
            schemaRefs: { inject: "ready" },
            hostFacade: bridge,
            bridge
        });
        assert.equal(fakeWindow.__WEDDING_APP_READY__.phase, "schema");
        assert.equal(fakeWindow.__WEDDING_APP_READY__.schemaReady, true);
    });

    it("bootTabbedShell creates the tab shell and waits for compact readiness", async () => {
        const events = [];
        const bridge = { id: "bridge-mock" };
        const schema = { id: "schema-mock" };

        await bootTabbedShell(
            { hostFacade: bridge, bridge, schema },
            {
                updateReadyState: (patch) => events.push(["updateReadyState", patch.phase]),
                createCompactController: ({ hostFacade: currentHostFacade, schema: currentSchema }) => {
                    events.push(["createCompactController", currentHostFacade, currentSchema]);
                    return {
                        init() {
                            events.push("compact.init");
                        }
                    };
                },
                createSchemaController: ({ bridge: currentBridge }) => {
                    events.push(["createSchemaController", currentBridge]);
                    return {
                        init() {
                            events.push("schema.init");
                        }
                    };
                },
                TabbedPanel: class {
                    constructor(options) {
                        events.push("TabbedPanel");
                        options.controllers.compact.init();
                    }
                },
                waitForReadyState: async (predicate, options) => {
                    events.push(["waitForReadyState", options.phase, options.errorMessage]);
                    assert.equal(predicate({ compactReady: true }), true);
                    return { compactReady: true };
                }
            }
        );

        assert.deepEqual(events, [
            ["updateReadyState", "tabs"],
            ["createCompactController", bridge, schema],
            ["createSchemaController", bridge],
            "TabbedPanel",
            "compact.init",
            ["waitForReadyState", "compact", "Compact tab did not finish bootstrapping in time"]
        ]);
    });
});
