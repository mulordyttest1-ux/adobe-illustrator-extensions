/**
 * MODULE: DateUtils
 * LAYER: Logic/Core
 * PURPOSE: Date parsing, formatting, day-of-week, diff, and arithmetic utilities
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: DateUtils.parseDate(), .formatDate(), .getDayOfWeek(), .getDiffDays(), .addDays()
 */

export const DateUtils = {
    /**
     * Parse chuỗi ngày "YYYY-MM-DD" an toàn sang Object Date.
     * @param {string} str - Chuỗi ngày (VD: "2026-10-20")
     * @returns {Date|null} Object Date hoặc null nếu không hợp lệ
     */
    parseDate(str) {
        if (!str || typeof str !== 'string') return null;

        // Match YYYY-MM-DD format
        const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!match) return null;

        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        const day = parseInt(match[3], 10);

        const date = new Date(year, month, day);

        // Validate the date is real (e.g., not Feb 30)
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            return null;
        }

        return date;
    },

    /**
     * Format ngày tháng theo pattern.
     * @param {Date} date - Object Date
     * @param {string} pattern - Pattern (DD/MM/YYYY, DD-MM-YYYY, v.v.)
     * @returns {string} Chuỗi ngày đã format
     */
    formatDate(date, pattern = 'DD/MM/YYYY') {
        if (!(date instanceof Date) || isNaN(date)) return '';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        const yearShort = year.slice(-2);

        return pattern
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year)
            .replace('YY', yearShort);
    },

    /**
     * Lấy tên thứ trong tuần (tiếng Việt).
     * @param {Date} date - Object Date
     * @returns {string} Tên thứ (VD: "Thứ Hai", "Chủ Nhật")
     */
    getDayOfWeek(date) {
        if (!(date instanceof Date) || isNaN(date)) return '';
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[date.getDay()];
    },

    /**
     * Tính khoảng cách giữa 2 ngày (số ngày).
     * @param {Date} d1 - Ngày bắt đầu
     * @param {Date} d2 - Ngày kết thúc
     * @returns {number} Số ngày chênh lệch
     */
    getDiffDays(d1, d2) {
        if (!(d1 instanceof Date) || !(d2 instanceof Date)) return 0;
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.round((d2 - d1) / msPerDay);
    },

    /**
     * Cộng/trừ ngày.
     * @param {Date} date - Object Date
     * @param {number} days - Số ngày cộng (+) hoặc trừ (-)
     * @returns {Date} Ngày mới
     */
    addDays(date, days) {
        if (!(date instanceof Date) || isNaN(date)) return null;
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
};

