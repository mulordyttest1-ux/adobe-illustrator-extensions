import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadStartupResources } from "./startupResources.js";

describe("startupResources", () => {
    it("loads startup resources in the expected phase order and passes hostFacade through", async () => {
        const hostFacade = {
            id: "host-facade-mock",
            async testConnection() {
                calls.push(["hostFacade.testConnection"]);
            }
        };
        const phases = [];
        const calls = [];

        const result = await loadStartupResources(
            {
                hostFacade
            },
            {
                updateReadyState: (patch) => phases.push(patch.phase),
                initCalendarEngine: async ({ hostFacade: resolvedHostFacade }) => calls.push(["initCalendarEngine", resolvedHostFacade]),
                AddressAutocomplete: {
                    init: async ({ hostFacade: resolvedHostFacade }) => calls.push(["AddressAutocomplete.init", resolvedHostFacade])
                },
                initEthnicNameNormalizer: async ({ hostFacade: resolvedHostFacade }) => calls.push(["initEthnicNameNormalizer", resolvedHostFacade]),
                SchemaLoader: {
                    load: async ({ hostFacade: resolvedHostFacade }) => {
                        calls.push(["SchemaLoader.load", resolvedHostFacade]);
                        return { id: "schema-mock" };
                    }
                }
            }
        );

        assert.deepEqual(phases, ["calendar", "bridge", "autocomplete", "schema"]);
        assert.deepEqual(calls, [
            ["initCalendarEngine", hostFacade],
            ["hostFacade.testConnection"],
            ["AddressAutocomplete.init", hostFacade],
            ["initEthnicNameNormalizer", hostFacade],
            ["SchemaLoader.load", hostFacade]
        ]);
        assert.deepEqual(result, {
            schema: { id: "schema-mock" }
        });
    });

    it("keeps hostFacade ping best-effort when the connection check fails", async () => {
        const warnings = [];

        const result = await loadStartupResources(
            {
                hostFacade: {
                    async testConnection() {
                        throw new Error("hostFacade unavailable");
                    }
                }
            },
            {
                updateReadyState: () => {},
                console: {
                    warn: (...args) => warnings.push(args)
                },
                initCalendarEngine: async () => {},
                AddressAutocomplete: {
                    init: async () => {}
                },
                initEthnicNameNormalizer: async () => {},
                SchemaLoader: {
                    load: async () => ({ id: "schema-mock" })
                }
            }
        );

        assert.deepEqual(result, {
            schema: { id: "schema-mock" }
        });
        assert.equal(warnings.length, 1);
        assert.equal(String(warnings[0][0]).includes("HostFacade connection failed silently"), true);
    });

    it("throws when schema loading fails", async () => {
        await assert.rejects(
            loadStartupResources(
                {
                    hostFacade: {
                        async testConnection() {
                            return true;
                        }
                    }
                },
                {
                    updateReadyState: () => {},
                    initCalendarEngine: async () => {},
                    AddressAutocomplete: {
                        init: async () => {}
                    },
                    initEthnicNameNormalizer: async () => {},
                    SchemaLoader: {
                        load: async () => {
                            throw new Error("schema exploded");
                        }
                    }
                }
            ),
            /schema exploded/
        );
    });
});
