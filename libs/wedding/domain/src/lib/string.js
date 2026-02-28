/**
 * MODULE: StringUtils
 * LAYER: Domain/Shared
 * PURPOSE: Standardized string manipulation (NFC, Smart Title Case)
 * DEPENDENCIES: None (Pure JS)
 */

export const StringUtils = {
    /**
     * Normalize to Unicode NFC standard.
     * Essential for consistent Vietnamese character handling across different Input Methods (Telex/VNI).
     * @param {string} str 
     * @returns {string}
     */
    toNFC(str) {
        if (!str || typeof str !== 'string') return '';
        return str.normalize('NFC');
    },

    /**
     * Smart Title Case: Capitalize the first letter of each word, 
     * but NEVER lowercase existing capital letters (preserves acronyms/ethnic names like BlO).
     * @param {string} str 
     * @returns {string}
     */
    toSmartTitleCase(str) {
        if (!str) return '';

        // Step 1: Normalize to NFC first for safety
        const nfcStr = this.toNFC(str);

        // Step 2: Capitalize after spaces, quotes, parens, or apostrophes
        // This handles "h'hen" -> "H'Hen" and "ama pui" -> "Ama Pui"
        return nfcStr.replace(/(^|[\s'"({[-])([a-zÀ-ỹ])/g, (match, prefix, char) => {
            return prefix + char.toUpperCase();
        });
    }
};
