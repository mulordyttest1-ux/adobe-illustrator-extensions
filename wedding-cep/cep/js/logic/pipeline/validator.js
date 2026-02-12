/**
 * MODULE: Validator
 * LAYER: Logic/Pipeline
 * PURPOSE: Validate required fields before sending to Illustrator
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: Validator.validate(), .isFieldValid()
 */

export const Validator = {
    /**
     * Validate packet dữ liệu.
     * @param {Object} packet - Dữ liệu cần validate
     * @param {Object} schema - Schema định nghĩa các luật
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validate(packet, _schema) {
        const errors = [];

        // Rule 1: Phải có tên lễ (nếu là wedding)
        if (!packet['info.ten_le']) {
            errors.push('Chưa chọn loại Lễ');
        }

        // Rule 2: Phải có ngày tiệc
        if (!packet['date.tiec']) {
            errors.push('Chưa nhập ngày Tiệc');
        }

        // Rule 3: Phải có ít nhất 1 tên con (pos1 hoặc pos2)
        const hasPos1Con = !!(packet['pos1.con_full'] && String(packet['pos1.con_full']).trim());
        const hasPos2Con = !!(packet['pos2.con_full'] && String(packet['pos2.con_full']).trim());
        if (!hasPos1Con && !hasPos2Con) {
            errors.push('Chưa nhập tên Cô Dâu/Chú Rể');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate nhanh một field.
     * @param {string} key - Tên field
     * @param {*} value - Giá trị
     * @returns {boolean}
     */
    isFieldValid(key, value) {
        if (value === null || value === undefined) return false;
        return String(value).trim().length > 0;
    }
};

