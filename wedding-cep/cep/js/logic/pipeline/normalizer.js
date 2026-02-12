/**
 * MODULE: Normalizer
 * LAYER: Logic/Pipeline
 * PURPOSE: Clean and normalize raw form data (trim, whitespace collapse)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: Normalizer.normalize(), .applyProperCase()
 */

export const Normalizer = {
    /**
     * Làm sạch toàn bộ packet dữ liệu.
     * @param {Object} packet - Dữ liệu thô từ form
     * @param {Object} schema - Schema định nghĩa các field
     * @returns {Object} Packet đã được làm sạch
     */
    normalize(packet, _schema) {
        if (!packet || typeof packet !== 'object') return {};

        const result = { ...packet };

        // Iterate through all fields and clean based on type
        for (const key in result) {
            if (!Object.prototype.hasOwnProperty.call(result, key)) continue;

            const value = result[key];

            // Skip non-string values
            if (typeof value !== 'string') continue;

            // Clean: Remove extra spaces, trim
            result[key] = value.replace(/[^\S\r\n]+/g, ' ').trim();
        }

        return result;
    },

    /**
     * Áp dụng Proper Case cho các trường tên.
     * @param {Object} packet - Dữ liệu
     * @param {Array} nameFields - Danh sách key cần Proper Case
     * @returns {Object} Packet đã xử lý
     */
    applyProperCase(packet, nameFields = []) {
        if (!packet || typeof packet !== 'object') return packet;

        for (const key of nameFields) {
            if (packet[key] && typeof packet[key] === 'string') {
                packet[key] = packet[key]
                    .toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }

        return packet;
    }
};

