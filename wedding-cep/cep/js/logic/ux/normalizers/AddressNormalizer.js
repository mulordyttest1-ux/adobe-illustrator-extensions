import { UX_ABBREVIATIONS } from '../constants/abbreviations.js';
import { UnicodeNormalizer } from '../core/UnicodeNormalizer.js';
import { normalizeAddressValue } from './addressNormalizationSupport.js';

export const AddressNormalizer = {
    normalize(value, options = {}) {
        return normalizeAddressValue(value, options, {
            abbreviations: UX_ABBREVIATIONS,
            normalizeUnicode: (raw) => UnicodeNormalizer.normalize(raw)
        });
    }
};
