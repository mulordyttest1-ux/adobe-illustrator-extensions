/**
 * UnicodeNormalizer.js - Unicode & Basic Text Normalization
 * 
 * Handles Unicode NFC normalization and basic text cleanup.
 * This is the foundation layer used by all other normalizers.
 * 
 * @module UX/Core/UnicodeNormalizer
 */

export const UnicodeNormalizer = {
    /**
     * Normalize string to NFC form + basic cleanup
     * @param {string} value - Input string
     * @returns {string} Normalized string
     */
    normalize(value) {
        if (!value || typeof value !== 'string') return '';

        // Step 1: Unicode NFC normalization (combines diacritics)
        let result = value.normalize('NFC');

        // Step 2: Trim leading/trailing whitespace
        result = result.trim();

        // Step 3: Collapse multiple spaces into single space
        result = result.replace(/\s{2,}/g, ' ');

        return result;
    },

    /**
     * Remove all diacritics (for search/comparison)
     * @param {string} value - Input string
     * @returns {string} String without diacritics
     */
    removeDiacritics(value) {
        if (!value) return '';

        // NFD decomposes characters, then remove combining marks
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    },

    /**
     * Check if string contains Vietnamese characters
     * @param {string} value - Input string
     * @returns {boolean}
     */
    hasVietnamese(value) {
        if (!value) return false;

        // Check for common Vietnamese-specific diacritics
        return /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i.test(value);
    },

    /**
     * Convert to lowercase (Vietnamese-aware)
     * @param {string} value - Input string
     * @returns {string}
     */
    toLowerCase(value) {
        if (!value) return '';
        return value.toLowerCase();
    },

    /**
     * Convert to uppercase (Vietnamese-aware)
     * @param {string} value - Input string
     * @returns {string}
     */
    toUpperCase(value) {
        if (!value) return '';
        return value.toUpperCase();
    }
};

