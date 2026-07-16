import {
    createFieldValidationWarnings,
    hasBlockingDateWarnings,
    parseDateFields,
    pushExistenceWarnings,
    pushExperienceWarnings,
    pushSequenceWarnings
} from './dateValidationSupport.js';

export const DateValidator = {
    validate(value, type) {
        const warnings = createFieldValidationWarnings(value, type);
        return {
            valid: !hasBlockingDateWarnings(warnings),
            warnings
        };
    },

    validateDateLogic(data) {
        const warnings = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();

        const tiec = parseDateFields(data, 'date.tiec', currentYear);
        const le = parseDateFields(data, 'date.le', currentYear);
        const nhap = parseDateFields(data, 'date.nhap', currentYear);

        pushExistenceWarnings(warnings, [tiec, le, nhap]);
        if (warnings.length > 0) {
            return { valid: false, warnings };
        }

        pushSequenceWarnings(warnings, data, { tiec, le, nhap });
        if (warnings.length > 0) {
            return { valid: false, warnings };
        }

        pushExperienceWarnings(warnings, { today, currentYear, tiec, le });

        return {
            valid: !hasBlockingDateWarnings(warnings),
            warnings
        };
    }
};
