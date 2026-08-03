import { NameNormalizer } from "./normalizers/NameNormalizer.js";
import { AddressNormalizer } from "./normalizers/AddressNormalizer.js";
import { DateNormalizer } from "./normalizers/DateNormalizer.js";
import { NameValidator } from "./validators/NameValidator.js";
import { AddressValidator } from "./validators/AddressValidator.js";
import { DateValidator } from "./validators/DateValidator.js";
import { FieldTypeResolver } from "./input/FieldTypeResolver.js";

const DATE_FIELD_TYPES = Object.freeze({
    date_day: "day",
    date_month: "month",
    date_year: "year",
    date_hour: "hour",
    date_minute: "minute"
});

const DEFAULT_NORMALIZERS = Object.freeze({
    date: DateNormalizer,
    name: NameNormalizer,
    address: AddressNormalizer
});

const DEFAULT_VALIDATORS = Object.freeze({
    date: DateValidator,
    name: NameValidator,
    address: AddressValidator
});

function resolveNormalizers(overrides = {}) {
    return {
        ...DEFAULT_NORMALIZERS,
        ...overrides
    };
}

function resolveValidators(overrides = {}) {
    return {
        ...DEFAULT_VALIDATORS,
        ...overrides
    };
}

function validResult() {
    return { valid: true, warnings: [] };
}

function createDateHandler(dateType, normalizers, validators) {
    return {
        normalize({ value, options }) {
            return normalizers.date.normalize(value, { ...options, type: dateType });
        },
        validate({ value }) {
            if (dateType === "day" || dateType === "month" || dateType === "year") {
                return validators.date.validate(value, dateType);
            }
            return validResult();
        }
    };
}

function createNameHandler(fieldType, allowSaintName, normalizers, validators) {
    return {
        normalize({ value, options, fieldKey }) {
            return normalizers.name.normalize(value, {
                ...options,
                fieldKey,
                allowSaintName
            });
        },
        validate({ value, options, fieldKey }) {
            return validators.name.validate(value, fieldType, {
                ...options,
                fieldKey
            });
        }
    };
}

function createAddressHandler(normalizers, validators) {
    return {
        normalize({ value, options, fieldKey }) {
            return normalizers.address.normalize(value, {
                ...options,
                fieldKey
            });
        },
        validate({ value, options, fieldKey }) {
            return validators.address.validate(value, {
                ...options,
                fieldKey
            });
        }
    };
}

function createFieldHandlers(normalizers, validators) {
    const handlers = {
        name: createNameHandler("name", true, normalizers, validators),
        person_name: createNameHandler("person_name", true, normalizers, validators),
        venue_name: createNameHandler("venue_name", false, normalizers, validators),
        address: createAddressHandler(normalizers, validators),
        text: {
            normalize({ value }) {
                return {
                    value: typeof value === "string" ? value.trim() : "",
                    applied: []
                };
            },
            validate: validResult
        }
    };

    Object.keys(DATE_FIELD_TYPES).forEach((fieldType) => {
        handlers[fieldType] = createDateHandler(
            DATE_FIELD_TYPES[fieldType],
            normalizers,
            validators
        );
    });

    return Object.freeze(handlers);
}

export function createInputEngine(deps = {}) {
    const fieldTypeResolver = deps.fieldTypeResolver || FieldTypeResolver;
    const normalizers = resolveNormalizers(deps.normalizers);
    const validators = resolveValidators(deps.validators);
    const handlers = createFieldHandlers(normalizers, validators);

    return Object.freeze({
        process(value, fieldKey, options = {}, schema = null) {
            const fieldType = fieldTypeResolver.detect(fieldKey, schema);
            const handler = handlers[fieldType] || handlers.text;
            const context = { value, options, fieldKey };
            const normalizeResult = handler.normalize(context);
            const validateResult = handler.validate({
                ...context,
                value: normalizeResult.value
            });

            return {
                value: normalizeResult.value,
                original: value,
                fieldType,
                applied: normalizeResult.applied,
                warnings: validateResult.warnings,
                valid: validateResult.valid
            };
        },

        validateDateLogic(data) {
            return validators.date.validateDateLogic(data);
        }
    });
}

export const InputEngine = createInputEngine();
