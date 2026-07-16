import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { AddressAutocomplete } from "./AddressAutocomplete.js";

const originalFuse = AddressAutocomplete.fuse;
const originalReady = AddressAutocomplete.isReady;
const originalData = AddressAutocomplete.data;

afterEach(() => {
    AddressAutocomplete.fuse = originalFuse;
    AddressAutocomplete.isReady = originalReady;
    AddressAutocomplete.data = originalData;
});

describe("AddressAutocomplete", () => {
    it("builds the search index from host-loaded data", async () => {
        const calls = [];

        await AddressAutocomplete.init({
            host: {
                async readExtensionText(relativePath, options) {
                    calls.push(["readExtensionText", relativePath, options.strategy]);
                    return {
                        absolutePath: "C:/fixture/data/vn_address_custom.json",
                        content: JSON.stringify([{ c: "Ward", p: "District - City", a: "ward" }])
                    };
                }
            },
            createIndex(data) {
                calls.push(["createIndex", data.length, data[0].c]);
                return { search() { return []; } };
            }
        });

        assert.equal(AddressAutocomplete.isReady, true);
        assert.deepEqual(calls, [
            ["readExtensionText", "data/vn_address_custom.json", "cep-fs"],
            ["createIndex", 1, "Ward"]
        ]);
    });

    it("fails softly when the search index cannot be created", async () => {
        AddressAutocomplete.data = [{ c: 'stale', p: 'old', a: 'old' }];
        const warnings = [];
        const originalWarn = console.warn;
        console.warn = (...args) => warnings.push(args);

        try {
            await AddressAutocomplete.init({
                host: {
                    async readExtensionText() {
                        return {
                            absolutePath: "C:/fixture/data/vn_address_custom.json",
                            content: JSON.stringify([{ c: "Ward", p: "District - City", a: "ward" }])
                        };
                    }
                },
                createIndex() {
                    throw new Error("Fuse missing");
                }
            });
        } finally {
            console.warn = originalWarn;
        }

        assert.equal(AddressAutocomplete.isReady, false);
        assert.equal(AddressAutocomplete.fuse, null);
        assert.deepEqual(AddressAutocomplete.data, []);
        assert.equal(String(warnings[0][0]).includes("[AddressAutocomplete] init failed:"), true);
        assert.equal(String(warnings[0][1]), "Fuse missing");
    });

    it("returns an empty array when the index is unavailable or query is empty", () => {
        AddressAutocomplete.fuse = null;
        assert.deepEqual(AddressAutocomplete.search("Tan Lap"), []);
        assert.deepEqual(AddressAutocomplete.search(""), []);
    });

    it("normalizes multiline queries and limits results to top 15", () => {
        let capturedQuery = null;
        AddressAutocomplete.fuse = {
            search(query) {
                capturedQuery = query;
                return Array.from({ length: 20 }, (_, index) => ({
                    item: { id: index, label: `item-${index}` }
                }));
            }
        };

        const results = AddressAutocomplete.search("TDP Doan Ket\nLSL");

        assert.equal(capturedQuery, "tdp doan ket lsl");
        assert.equal(results.length, 15);
        assert.deepEqual(results[0], { id: 0, label: "item-0" });
        assert.deepEqual(results[14], { id: 14, label: "item-14" });
    });

    it("formats addresses with the inherited separator and normalizes embedded hyphens", () => {
        const match = {
            c: "Phuong Tan Lap",
            p: "Quan 1 - TP.HCM"
        };

        assert.equal(
            AddressAutocomplete.format(match, ", "),
            "Phuong Tan Lap, Quan 1, TP.HCM"
        );
        assert.equal(
            AddressAutocomplete.format(match, " - "),
            "Phuong Tan Lap - Quan 1 - TP.HCM"
        );
    });

    it("returns null when there is no match to format", () => {
        assert.equal(AddressAutocomplete.format(null), null);
    });
});
