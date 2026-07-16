import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { FieldTypeResolver } from "./FieldTypeResolver.js";
import { SchemaUtils } from "../../schema/SchemaUtils.js";

afterEach(() => {
    SchemaUtils._typeMap = null;
});

describe("FieldTypeResolver", () => {
    it("prefers schema type when schema metadata exists", () => {
        const schema = {
            STRUCTURE: [
                {
                    prefix: "ceremony",
                    items: [{ key: "ten", type: "address" }]
                }
            ]
        };

        assert.equal(FieldTypeResolver.detect("ceremony.ten", schema), "address");
    });

    it("falls back to legacy date heuristics when schema type is absent", () => {
        assert.equal(FieldTypeResolver.detect("date.tiec.gio"), "date_hour");
        assert.equal(FieldTypeResolver.detect("date.tiec.phut"), "date_minute");
        assert.equal(FieldTypeResolver.detect("date.tiec.ngay"), "date_day");
        assert.equal(FieldTypeResolver.detect("date.tiec.thang"), "date_month");
        assert.equal(FieldTypeResolver.detect("date.tiec.nam"), "date_year");
    });

    it("does not misclassify ten as a year field", () => {
        assert.equal(FieldTypeResolver.detect("ceremony.ten"), "name");
    });

    it("maps common person-name and address keys via heuristics", () => {
        assert.equal(FieldTypeResolver.detect("pos1.ong"), "name");
        assert.equal(FieldTypeResolver.detect("ceremony.diachi"), "address");
        assert.equal(FieldTypeResolver.isAddressField("ceremony.diachi"), true);
        assert.equal(FieldTypeResolver.isAddressField("venue.ten"), false);
    });

    it("returns text when no rule matches", () => {
        assert.equal(FieldTypeResolver.detect("ui.misc"), "text");
        assert.equal(FieldTypeResolver.detect("", null), "text");
    });

    it("uses schema type as the single source of truth for address-field decisions", () => {
        const schemaUtils = {
            getType: () => 'address'
        };

        assert.equal(FieldTypeResolver.isAddressField('ceremony.ten', {}, schemaUtils), true);
        assert.equal(FieldTypeResolver.isAddressField('venue.ten', {}, { getType: () => 'name' }), false);
    });
});
