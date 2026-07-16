import { DATE_NORMALIZER_LIMITS, normalizeDateValue } from './dateNormalizationSupport.js';

export const DateNormalizer = {
    LIMITS: DATE_NORMALIZER_LIMITS,

    normalize(value, options = {}) {
        return normalizeDateValue(value, options, this.LIMITS);
    }
};
