/**
 * InputEngine.js - Central Orchestrator for UX Automation
 */

import { NameNormalizer } from "./normalizers/NameNormalizer.js";
import { AddressNormalizer } from "./normalizers/AddressNormalizer.js";
import { DateNormalizer } from "./normalizers/DateNormalizer.js";
import { NameValidator } from "./validators/NameValidator.js";
import { AddressValidator } from "./validators/AddressValidator.js";
import { DateValidator } from "./validators/DateValidator.js";
import { FieldTypeResolver } from "./input/FieldTypeResolver.js";

export const InputEngine = {
    fieldTypeResolver: FieldTypeResolver,
    normalizers: {
        date: DateNormalizer,
        name: NameNormalizer,
        address: AddressNormalizer
    },
    validators: {
        date: DateValidator,
        name: NameValidator,
        address: AddressValidator
    },

    process(value, fieldKey, options = {}, schema = null) {
        const fieldType = this.fieldTypeResolver.detect(fieldKey, schema);

        // Step 1: Normalize (AUTO tier)
        const normalizeResult = this._normalize(value, fieldType, options, fieldKey);

        // Step 2: Validate (WARNING tier)
        const validateResult = this._validate(normalizeResult.value, fieldType, options, fieldKey);

        return {
            value: normalizeResult.value,
            original: value,
            fieldType,
            applied: normalizeResult.applied,
            warnings: validateResult.warnings,
            valid: validateResult.valid
        };
    },

    _normalize(value, fieldType, options, fieldKey) {
        const { date, name, address } = this.normalizers;

        if (["date_day", "date_month", "date_year", "date_hour", "date_minute"].includes(fieldType)) {
            const type = fieldType.replace("date_", "");
            return date.normalize(value, { ...options, type });
        }

        switch (fieldType) {
            case "name":
            case "person_name":
                return name.normalize(value, { ...options, fieldKey, allowSaintName: true });
            case "venue_name":
                return name.normalize(value, { ...options, fieldKey, allowSaintName: false });
            case "address":
                return address.normalize(value, { ...options, fieldKey });
            default:
                return { value: value?.trim() || "", applied: [] };
        }
    },

    _validate(value, fieldType, options, fieldKey) {
        const { date, name, address } = this.validators;

        if (["date_day", "date_month"].includes(fieldType)) {
            return date.validate(value, fieldType.replace("date_", ""));
        }

        switch (fieldType) {
            case "name":
            case "person_name":
            case "venue_name":
                return name.validate(value, fieldType, { ...options, fieldKey });
            case "address":
                return address.validate(value, { ...options, fieldKey });
            default:
                return { valid: true, warnings: [] };
        }
    },

    validateDateLogic(data) {
        return this.validators.date.validateDateLogic(data);
    }
};
