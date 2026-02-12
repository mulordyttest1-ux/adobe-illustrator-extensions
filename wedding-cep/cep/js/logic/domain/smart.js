/**
 * MODULE: SmartContent
 * LAYER: Logic/Domain
 * PURPOSE: Detect and analyze keywords (Lễ, Vị Thứ Nam/Nữ) in text content
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: SmartContent.detectKeywords(), .analyze()
 */

export const SmartContent = {
    /**
     * Phát hiện keywords (Lễ, Vị thứ Nam, Vị thứ Nữ) trong text.
     * @param {string} content - Nội dung cần quét
     * @param {Object} schema - Schema chứa LISTS
     * @returns {Object} { le, nam, nu } - Mỗi item có { val, index }
     */
    detectKeywords(content, schema) {
        const result = { le: null, nam: null, nu: null };
        if (!content || !schema?.LISTS) return result;

        const contentLower = content.toLowerCase();

        // 1. Detect Lễ
        for (const kw of (schema.LISTS.LE || [])) {
            const idx = contentLower.indexOf(kw.toLowerCase());
            if (idx !== -1) {
                result.le = { val: kw, index: idx };
                break;
            }
        }

        // 2. Detect Nam
        for (const kw of (schema.LISTS.VITHU_NAM || [])) {
            const idx = contentLower.indexOf(kw.toLowerCase());
            if (idx !== -1) {
                result.nam = { val: kw, index: idx };
                break;
            }
        }

        // 3. Detect Nữ
        for (const kw of (schema.LISTS.VITHU_NU || [])) {
            const idx = contentLower.indexOf(kw.toLowerCase());
            if (idx !== -1) {
                result.nu = { val: kw, index: idx };
                break;
            }
        }

        return result;
    },

    /**
     * Analyze text để tìm keywords và lưu vào object.
     * @param {string} content - Nội dung
     * @param {Object} currentFound - Object để lưu kết quả
     * @param {Object} schema - Schema
     */
    analyze(content, currentFound, schema) {
        const detected = this.detectKeywords(content, schema);

        if (detected.le && !currentFound.le) {
            currentFound.le = detected.le.val;
        }
        if (detected.nam && !currentFound.nam) {
            currentFound.nam = detected.nam.val;
        }
        if (detected.nu && !currentFound.nu) {
            currentFound.nu = detected.nu.val;
        }
    }
};

