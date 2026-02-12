/**
 * MODULE: NameNormalizer
 * LAYER: Logic/UX/Normalizers
 * PURPOSE: Vietnamese name normalization (Title Case, Unicode NFC, first name extraction)
 * DEPENDENCIES: UnicodeNormalizer (optional)
 * SIDE EFFECTS: None (pure)
 * EXPORTS: NameNormalizer.normalize(), .extractFirstName()
 */

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

        // Step 1: Unicode NFC + basic cleanup
        if (typeof UnicodeNormalizer !== 'undefined') {
            result = UnicodeNormalizer.normalize(result);
            applied.push('unicode_nfc');
        } else {
            result = result.trim().replace(/\s{2,}/g, ' ');
        }

        // Step 2: Title Case (Viết Hoa Chữ Cái Đầu)
        const original = result;
        result = this._toTitleCase(result);
        if (result !== original) {
            applied.push('title_case');
        }

        return { value: result, applied };
    },

    /**
       * Convert to Vietnamese Title Case
       * Fix: Hỗ trợ viết hoa sau dấu ngoặc đơn, kép, ngoặc nhọn...
       * @private
       */
    _toTitleCase(str) {
        if (!str) return '';

        // 1. Dải ký tự tiếng Việt đầy đủ (bao gồm cả các ký tự có dấu)
        // Thay vì \S, ta chỉ target vào các chữ cái a-z và tiếng Việt
        // const letterPattern = /[a-zA-ZÀ-ỹ]/;

        return str
            .toLowerCase()
            .replace(/(^|[\s'"{([\]])([a-zA-ZÀ-ỹ])/g, (match, prefix, char) => {
                // Logic: Nếu tìm thấy [Prefix + Chữ cái] thì viết hoa Chữ cái
                return prefix + char.toUpperCase();
            });
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

