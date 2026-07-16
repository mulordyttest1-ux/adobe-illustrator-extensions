import { SchemaUtils } from "../../schema/SchemaUtils.js";

export const FieldTypeResolver = {
    FIELD_RULES: [
        { type: "date_hour", match: (key) => key.includes("gio") },
        { type: "date_minute", match: (key) => key.includes("phut") },
        { type: "date_day", match: (key) => key.includes("ngay") },
        { type: "date_month", match: (key) => key.includes("thang") },
        { type: "date_year", match: (key) => key.includes("nam") && !key.includes("ten") },
        { type: "name", match: (key) => ["ten", "ong", "ba", "ho_ten", "con"].some((segment) => key.includes(segment)) },
        { type: "address", match: (key) => ["diachi", "address", "venue", "ceremony"].some((segment) => key.includes(segment)) }
    ],

    getSchemaType(key, schema, schemaUtils = SchemaUtils) {
        return schemaUtils.getType(key, schema);
    },

    detect(key, schema, schemaUtils = SchemaUtils) {
        if (!key) return "text";

        const type = this.getSchemaType(key, schema, schemaUtils);
        if (type) return type;

        const lowerKey = key.toLowerCase();
        const rule = this.FIELD_RULES.find((candidate) => candidate.match(lowerKey));
        return rule ? rule.type : "text";
    },

    isAddressField(key, schema, schemaUtils = SchemaUtils) {
        return this.detect(key, schema, schemaUtils) === "address";
    }
};
