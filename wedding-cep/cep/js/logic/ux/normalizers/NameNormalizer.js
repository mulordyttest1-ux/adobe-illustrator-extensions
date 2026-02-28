/**
 * MODULE: NameNormalizer
 * LAYER: Logic/UX/Normalizers
 * PURPOSE: Vietnamese name normalization (Title Case, Unicode NFC, ethnic name support)
 * DEPENDENCIES: UnicodeNormalizer (optional)
 * SIDE EFFECTS: None (pure)
 * EXPORTS: NameNormalizer.normalize(), .extractFirstName()
 */


import { StringUtils } from '@wedding/domain';

export const NameNormalizer = {
    /**
     * Normalize a Vietnamese name (AUTO tier)
     * @param {string} value - Raw name input
     * @param {Object} options - Options
     * @param {boolean} options.skipNormalize - If true, skip normalization (MANUAL mode)
     * @returns {Object} { value, applied: [] }
     */
    normalize(value, options = {}) {
        if (!value || typeof value !== 'string') {
            return { value: '', applied: [] };
        }

        // MANUAL mode - skip normalization
        if (options.skipNormalize) {
            return { value, applied: [] };
        }

        const applied = [];
        let result = value;

        // Step 1: Unicode NFC + basic cleanup (trim + collapse double spaces)
        // We now use StringUtils.toNFC for standard normalization
        const originalNFC = result;
        result = StringUtils.toNFC(result.trim().replace(/\s{2,}/g, ' '));
        if (result !== originalNFC) {
            applied.push('unicode_nfc');
        }

        // Step 2: Smart Title Case (capitalize-UP only, never lowercase)
        const originalTitle = result;
        result = StringUtils.toSmartTitleCase(result);
        if (result !== originalTitle) {
            applied.push('title_case');
        }

        return { value: result, applied };
    },

    /**
       * Smart Title Case: (Deprecated - moved to StringUtils)
       * @private
       */
    _toTitleCase(str) {
        return StringUtils.toSmartTitleCase(str);
    },

    /**
     * Extract first name from full name (Vietnamese style)
     * "Nguyễn Văn A" → "A" (last word)
     * @param {string} fullName - Full name
     * @param {number} splitIdx - 0 = last word (default), 1 = first word
     * @returns {string}
     */
    extractFirstName(fullName, splitIdx = 0) {
        if (!fullName) return '';

        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 0) return '';

        if (splitIdx === 0) {
            // Vietnamese style: last word is first name
            return parts[parts.length - 1];
        } else {
            // Western/Highland style: first word is first name
            return parts[0];
        }
    }
};

