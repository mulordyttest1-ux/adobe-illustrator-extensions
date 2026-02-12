/**
 * MODULE: DataResolver
 * LAYER: Logic/Domain
 * PURPOSE: Resolve priority between content and metadata (Content > Metadata > Empty)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: DataResolver.resolve(), .hasConflict()
 */

export const DataResolver = {
    SOURCE: {
        CONTENT: 'CONTENT',
        METADATA: 'METADATA',
        FALLBACK: 'FALLBACK',
        NONE: 'NONE'
    },

    /**
     * Phân xử dữ liệu giữa Content (hiển thị) và Metadata (ẩn).
     * Quy tắc: Content > Metadata > Empty
     * @param {string} cleanContent - Nội dung đã làm sạch
     * @param {string} cleanMeta - Metadata đã làm sạch
     * @returns {Object} { value, source, isConflict }
     */
    resolve(cleanContent, cleanMeta) {
        const cVal = String(cleanContent || '').trim();
        const mVal = String(cleanMeta || '').trim();

        // Case 1: Content có dữ liệu -> Ưu tiên Content
        if (cVal.length > 0) {
            return {
                value: cVal,
                source: this.SOURCE.CONTENT,
                isConflict: mVal.length > 0 && cVal !== mVal
            };
        }

        // Case 2: Content rỗng nhưng Meta có -> Fallback
        if (mVal.length > 0) {
            return {
                value: mVal,
                source: this.SOURCE.METADATA,
                isConflict: false
            };
        }

        // Case 3: Cả hai đều rỗng
        return {
            value: '',
            source: this.SOURCE.NONE,
            isConflict: false
        };
    },

    /**
     * Kiểm tra nhanh xem có conflict không.
     */
    hasConflict(cleanContent, cleanMeta) {
        return this.resolve(cleanContent, cleanMeta).isConflict;
    }
};

