import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { InputEngine } from "./InputEngine.js";

const originalResolver = InputEngine.fieldTypeResolver;
const originalNormalizers = InputEngine.normalizers;
const originalValidators = InputEngine.validators;

afterEach(() => {
    InputEngine.fieldTypeResolver = originalResolver;
    InputEngine.normalizers = originalNormalizers;
    InputEngine.validators = originalValidators;
});

describe("InputEngine", () => {
    it("routes date fields through the date normalizer and validator", () => {
        const calls = [];
        InputEngine.fieldTypeResolver = {
            detect() {
                return "date_day";
            }
        };
        InputEngine.normalizers = {
            ...originalNormalizers,
            date: {
                normalize(value, options) {
                    calls.push(["normalize.date", value, options.type]);
                    return { value: "05", applied: ["pad"] };
                }
            }
        };
        InputEngine.validators = {
            ...originalValidators,
            date: {
                validate(value, type) {
                    calls.push(["validate.date", value, type]);
                    return { valid: true, warnings: [] };
                },
                validateDateLogic(data) {
                    calls.push(["validateDateLogic", data]);
                    return { valid: true, warnings: [] };
                }
            }
        };

        const result = InputEngine.process("5", "date.tiec.ngay");
        const logicResult = InputEngine.validateDateLogic({ date: "packet" });

        assert.deepEqual(calls, [
            ["normalize.date", "5", "day"],
            ["validate.date", "05", "day"],
            ["validateDateLogic", { date: "packet" }]
        ]);
        assert.deepEqual(result, {
            value: "05",
            original: "5",
            fieldType: "date_day",
            applied: ["pad"],
            warnings: [],
            valid: true
        });
        assert.deepEqual(logicResult, { valid: true, warnings: [] });
    });

    it("routes schema-overridden address fields through address handlers with field context", () => {
        const calls = [];
        InputEngine.fieldTypeResolver = {
            detect(key, schema) {
                calls.push(["detect", key, schema.id]);
                return "address";
            }
        };
        InputEngine.normalizers = {
            ...originalNormalizers,
            address: {
                normalize(value, options) {
                    calls.push(["normalize.address", value, options.scope, options.fieldKey]);
                    return { value: "addr", applied: ["trim"] };
                }
            }
        };
        InputEngine.validators = {
            ...originalValidators,
            address: {
                validate(value, options) {
                    calls.push(["validate.address", value, options.scope, options.fieldKey]);
                    return { valid: false, warnings: [{ type: "check", severity: "warning" }] };
                }
            }
        };

        const result = InputEngine.process(" A ", "ceremony.ten", { scope: "schema" }, { id: "schema-1" });

        assert.deepEqual(calls, [
            ["detect", "ceremony.ten", "schema-1"],
            ["normalize.address", " A ", "schema", "ceremony.ten"],
            ["validate.address", "addr", "schema", "ceremony.ten"]
        ]);
        assert.equal(result.fieldType, "address");
        assert.equal(result.valid, false);
        assert.deepEqual(result.warnings, [{ type: "check", severity: "warning" }]);
    });

    it("enables saint-name detection for person names but not venue names", () => {
        const calls = [];
        InputEngine.fieldTypeResolver = {
            detect(key) {
                return key === "venue.ten" ? "venue_name" : "person_name";
            }
        };
        InputEngine.normalizers = {
            ...originalNormalizers,
            name: {
                normalize(value, options) {
                    calls.push(["normalize.name", value, options.fieldKey, options.allowSaintName]);
                    return { value, applied: [] };
                }
            }
        };
        InputEngine.validators = {
            ...originalValidators,
            name: {
                validate(value, type, options) {
                    calls.push(["validate.name", value, type, options.fieldKey, options.formData?.id]);
                    return { valid: true, warnings: [] };
                }
            }
        };

        InputEngine.process("te-re-xa Nguyen Thi An", "pos1.con_full", { formData: { id: "form-1" } });
        InputEngine.process("te-re-xa garden", "venue.ten");

        assert.deepEqual(calls, [
            ["normalize.name", "te-re-xa Nguyen Thi An", "pos1.con_full", true],
            ["validate.name", "te-re-xa Nguyen Thi An", "person_name", "pos1.con_full", "form-1"],
            ["normalize.name", "te-re-xa garden", "venue.ten", false],
            ["validate.name", "te-re-xa garden", "venue_name", "venue.ten", undefined]
        ]);
    });

    it("falls back to trimmed text when no specialized handler matches", () => {
        InputEngine.fieldTypeResolver = {
            detect() {
                return "text";
            }
        };

        const result = InputEngine.process("  hello  ", "ui.label");

        assert.deepEqual(result, {
            value: "hello",
            original: "  hello  ",
            fieldType: "text",
            applied: [],
            warnings: [],
            valid: true
        });
    });
});
