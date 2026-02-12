/**
 * MODULE: StringUtils
 * LAYER: Logic/Core
 * PURPOSE: String manipulation utilities (clean, proper case, accents, empty check)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: StringUtils.clean(), .toProperCase(), .removeAccents(), .isEmpty()
 */

export const StringUtils = {
    /**
     * Xóa khoảng trắng thừa và trim 2 đầu.
     * @param {string} str - Chuỗi cần xử lý
     * @returns {string} Chuỗi đã sạch
     * @example clean("  Nguyễn   Văn   A  ") => "Nguyễn Văn A"
     */
    clean(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/\s+/g, ' ').trim();
    },

    /**
     * Viết Hoa Chữ Cái Đầu (Proper Case).
     * Hỗ trợ tiếng Việt Unicode.
     * @param {string} str - Chuỗi cần xử lý
     * @returns {string} Chuỗi đã Proper Case
     * @example toProperCase("nguyễn văn a") => "Nguyễn Văn A"
     */
    toProperCase(str) {
        if (!str || typeof str !== 'string') return '';
        const cleaned = this.clean(str);
        return cleaned
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    /**
     * Bỏ dấu tiếng Việt (dùng để tạo key hoặc sort).
     * @param {string} str - Chuỗi tiếng Việt
     * @returns {string} Chuỗi không dấu
     * @example removeAccents("Nguyễn Văn A") => "Nguyen Van A"
     */
    removeAccents(str) {
        if (!str || typeof str !== 'string') return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    },

    /**
     * Kiểm tra chuỗi có rỗng không (sau khi trim).
     * @param {string} str - Chuỗi cần kiểm tra
     * @returns {boolean}
     */
    isEmpty(str) {
        return !str || this.clean(str) === '';
    }
};

