import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createInputEngine, InputEngine } from "./InputEngine.js";

describe("InputEngine", () => {
    it("routes date fields through the date normalizer and validator", () => {
        const calls = [];
        const engine = createInputEngine({
            fieldTypeResolver: {
                detect() {
                    return "date_day";
                }
            },
            normalizers: {
                date: {
                    normalize(value, options) {
                        calls.push(["normalize.date", value, options.type]);
                        return { value: "05", applied: ["pad"] };
                    }
                }
            },
            validators: {
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
            }
        });

        const result = engine.process("5", "date.tiec.ngay");
        const logicResult = engine.validateDateLogic({ date: "packet" });

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

    it("routes year fields through the year normalizer and validator", () => {
        const engine = createInputEngine({
            fieldTypeResolver: {
                detect() {
                    return "date_year";
                }
            },
            normalizers: {
                date: {
                    normalize(value, options) {
                        assert.equal(options.type, "year");
                        return { value, applied: [] };
                    }
                }
            },
            validators: {
                date: {
                    validate(value, type) {
                        assert.equal(value, "2027");
                        assert.equal(type, "year");
                        return { valid: true, warnings: [] };
                    },
                    validateDateLogic() {
                        return { valid: true, warnings: [] };
                    }
                }
            }
        });

        assert.equal(engine.process("2027", "date.tiec.nam").valid, true);
    });

    it("routes schema-overridden address fields through address handlers with field context", () => {
        const calls = [];
        const engine = createInputEngine({
            fieldTypeResolver: {
                detect(key, schema) {
                    calls.push(["detect", key, schema.id]);
                    return "address";
                }
            },
            normalizers: {
                address: {
                    normalize(value, options) {
                        calls.push(["normalize.address", value, options.scope, options.fieldKey]);
                        return { value: "addr", applied: ["trim"] };
                    }
                }
            },
            validators: {
                address: {
                    validate(value, options) {
                        calls.push(["validate.address", value, options.scope, options.fieldKey]);
                        return { valid: false, warnings: [{ type: "check", severity: "warning" }] };
                    }
                }
            }
        });

        const result = engine.process(" A ", "ceremony.ten", { scope: "schema" }, { id: "schema-1" });

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
        const engine = createInputEngine({
            fieldTypeResolver: {
                detect(key) {
                    return key === "venue.ten" ? "venue_name" : "person_name";
                }
            },
            normalizers: {
                name: {
                    normalize(value, options) {
                        calls.push(["normalize.name", value, options.fieldKey, options.allowSaintName]);
                        return { value, applied: [] };
                    }
                }
            },
            validators: {
                name: {
                    validate(value, type, options) {
                        calls.push(["validate.name", value, type, options.fieldKey, options.formData?.id]);
                        return { valid: true, warnings: [] };
                    }
                }
            }
        });

        engine.process("te-re-xa Nguyen Thi An", "pos1.con_full", { formData: { id: "form-1" } });
        engine.process("te-re-xa garden", "venue.ten");

        assert.deepEqual(calls, [
            ["normalize.name", "te-re-xa Nguyen Thi An", "pos1.con_full", true],
            ["validate.name", "te-re-xa Nguyen Thi An", "person_name", "pos1.con_full", "form-1"],
            ["normalize.name", "te-re-xa garden", "venue.ten", false],
            ["validate.name", "te-re-xa garden", "venue_name", "venue.ten", undefined]
        ]);
    });

    it("falls back to trimmed text when no specialized handler matches", () => {
        const engine = createInputEngine({
            fieldTypeResolver: {
                detect() {
                    return "text";
                }
            }
        });

        const result = engine.process("  hello  ", "ui.label");

        assert.deepEqual(result, {
            value: "hello",
            original: "  hello  ",
            fieldType: "text",
            applied: [],
            warnings: [],
            valid: true
        });
    });

    it("exposes only the stable public methods on the default engine", () => {
        assert.deepEqual(Object.keys(InputEngine).sort(), ["process", "validateDateLogic"]);
        assert.equal("normalizers" in InputEngine, false);
        assert.equal("validators" in InputEngine, false);
        assert.equal("fieldTypeResolver" in InputEngine, false);
        assert.equal(Object.isFrozen(InputEngine), true);
    });

    it("keeps factory-created engines isolated from each other", () => {
        const firstEngine = createInputEngine({
            fieldTypeResolver: { detect: () => "address" },
            normalizers: {
                address: {
                    normalize() {
                        return { value: "first", applied: ["first"] };
                    }
                }
            },
            validators: {
                address: {
                    validate() {
                        return { valid: true, warnings: [] };
                    }
                }
            }
        });
        const secondEngine = createInputEngine({
            fieldTypeResolver: { detect: () => "address" },
            normalizers: {
                address: {
                    normalize() {
                        return { value: "second", applied: ["second"] };
                    }
                }
            },
            validators: {
                address: {
                    validate() {
                        return { valid: true, warnings: [] };
                    }
                }
            }
        });

        assert.equal(firstEngine.process("x", "a").value, "first");
        assert.equal(secondEngine.process("x", "a").value, "second");
        assert.equal(firstEngine.process("x", "a").applied[0], "first");
    });
});
