/**
 * MODULE: IsolationChecker
 * LAYER: Logic/Domain
 * PURPOSE: Check TextFrame cleanliness, sync capability, and sync strategy analysis
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: IsolationChecker.isSyncable(), .isCandidateSafe(), .analyzeSyncStrategy()
 */

export const IsolationChecker = {
    /**
     * Kiểm tra xem một key có thể sync ngược không (dựa trên schema).
     * @param {string} key - Tên field  
     * @param {Object} schema - Schema chứa STRUCTURE
     * @returns {boolean}
     */
    isSyncable(key, schema) {
        if (!key || !schema?.STRUCTURE) return false;

        for (const group of schema.STRUCTURE) {
            const prefix = group.prefix ? `${group.prefix}.` : '';
            for (const item of (group.items || [])) {
                const fullKey = prefix + item.key;
                if (fullKey === key) {
                    return item.sync_mode === 'ISOLATED';
                }
            }
        }
        return false;
    },

    /**
     * Kiểm tra độ sạch của một candidate.
     * @param {Object} metaState - { mappings: [...] }
     * @param {string} cleanContent - Nội dung đã làm sạch
     * @returns {boolean}
     */
    isCandidateSafe(metaState, cleanContent) {
        if (!metaState?.mappings || metaState.mappings.length !== 1) return false;
        if (cleanContent.includes(':')) return false;
        if (cleanContent.length > 150) return false;
        return true;
    },

    /**
     * Phân tích chiến lược sync.
     * @param {string} metaVal - Giá trị metadata
     * @param {string} contentVal - Giá trị content
     * @returns {boolean} true nếu nên sync
     */
    analyzeSyncStrategy(metaVal, contentVal) {
        if (!metaVal) return true;

        const flatM = String(metaVal).replace(/\s+/g, ' ').trim().toLowerCase();
        const flatC = String(contentVal).replace(/\s+/g, ' ').trim().toLowerCase();

        if (!flatC) return true;

        // Check if content contains meta
        if (flatC.includes(flatM)) {
            const lenDiff = flatC.length - flatM.length;
            // Too much extra -> garbage
            if (lenDiff > 15 || (flatM.length > 0 && lenDiff > flatM.length * 0.5)) {
                return false;
            }
        }

        return true;
    }
};

