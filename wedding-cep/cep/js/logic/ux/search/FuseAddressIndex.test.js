import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FuseAddressIndex } from "./FuseAddressIndex.js";

describe("FuseAddressIndex", () => {
    it("creates a Fuse index with the expected options", () => {
        const calls = [];

        class FakeFuse {
            constructor(data, options) {
                calls.push([data, options]);
            }
        }

        const data = [{ c: "Ward", p: "District - City", a: "ward" }];
        const index = FuseAddressIndex.create(data, { FuseCtor: FakeFuse });

        assert.ok(index instanceof FakeFuse);
        assert.equal(calls.length, 1);
        assert.equal(calls[0][0], data);
        assert.equal(Array.isArray(calls[0][1].keys), true);
        assert.equal(calls[0][1].threshold, 0.4);
    });

    it("falls back to globalThis.Fuse when no constructor override is provided", () => {
        const originalFuse = globalThis.Fuse;
        const calls = [];

        class FakeFuse {
            constructor(data, options) {
                calls.push([data, options]);
            }
        }

        globalThis.Fuse = FakeFuse;
        try {
            const data = [{ c: "Ward", p: "District - City", a: "ward" }];
            const index = FuseAddressIndex.create(data);

            assert.ok(index instanceof FakeFuse);
            assert.equal(calls.length, 1);
            assert.equal(calls[0][0], data);
        } finally {
            if (typeof originalFuse === "undefined") {
                delete globalThis.Fuse;
            } else {
                globalThis.Fuse = originalFuse;
            }
        }
    });

    it("throws a clear error when no Fuse constructor is available", () => {
        const originalFuse = globalThis.Fuse;
        try {
            delete globalThis.Fuse;
            assert.throws(
                () => FuseAddressIndex.create([{ c: "Ward", p: "District - City", a: "ward" }]),
                /Fuse constructor is unavailable/
            );
        } finally {
            if (typeof originalFuse === "undefined") {
                delete globalThis.Fuse;
            } else {
                globalThis.Fuse = originalFuse;
            }
        }
    });

    it("normalizes query text, limits results, and maps items", () => {
        let capturedQuery = null;
        const index = {
            search(query) {
                capturedQuery = query;
                return Array.from({ length: 20 }, (_, indexValue) => ({
                    item: { id: indexValue }
                }));
            }
        };

        const results = FuseAddressIndex.search(index, "Ward\nCity");

        assert.equal(capturedQuery, "ward city");
        assert.equal(results.length, 15);
        assert.deepEqual(results[0], { id: 0 });
        assert.deepEqual(results[14], { id: 14 });
    });
});
