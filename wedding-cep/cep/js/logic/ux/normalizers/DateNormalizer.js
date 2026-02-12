/**
 * MODULE: DateNormalizer
 * LAYER: Logic/UX/Normalizers
 * PURPOSE: Smart date/time normalization (typo recovery, zero padding, text extraction)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: DateNormalizer.normalize()
 */

export const DateNormalizer = {
    // Định nghĩa giới hạn cho từng loại
    LIMITS: {
        day: 31,
        month: 12,
        hour: 23,
        minute: 59,
        year: 9999
    },

    normalize(value, options = {}) {
        if (value === null || value === undefined) {
            return { value: '', applied: [] };
        }

        const type = options.type || 'day'; // day, month, year, hour, minute
        const applied = [];
        let result = String(value).trim();
        // const original = result;

        // Step 1: Extract number from text (e.g., "15h" → "15")
        result = this._extractNumber(result, type);

        // Step 2: SMART TYPO CORRECTION (Suffix Recovery)
        // Xử lý trường hợp nhập nối: 131 -> 1, 1412 -> 12
        if (type !== 'year') {
            const limit = this.LIMITS[type] || 31;
            const fixed = this._smartFixTypo(result, limit);
            if (fixed !== result) {
                result = fixed;
                applied.push('smart_typo_fix');
            }
        }

        // Step 3: Pad to 2 digits (01, 05...)
        if (type !== 'year' && result && /^\d+$/.test(result)) {
            // Chỉ pad nếu là số hợp lệ
            if (result.length === 1) {
                result = result.padStart(2, '0');
                applied.push('pad_zero');
            }
        }

        return { value: result, applied };
    },

    /**
     * Logic sửa lỗi nhập nhanh (Typo Recovery)
     * Nếu giá trị vượt quá giới hạn, thử lấy các số đuôi.
     */
    _smartFixTypo(valStr, maxLimit) {
        const num = parseInt(valStr, 10);

        // 1. Nếu là số hợp lệ hoặc rỗng -> Giữ nguyên
        if (!valStr || isNaN(num)) return valStr;
        if (num <= maxLimit) return valStr;

        // 2. Nếu vượt quá giới hạn -> Phân tích chuỗi
        // Ví dụ: Hour (Max 23). Input "131" (User gõ 13, sai, gõ thêm 1)

        // Thử lấy 2 số cuối (Priority 1)
        if (valStr.length >= 2) {
            const last2 = valStr.slice(-2);
            const num2 = parseInt(last2, 10);
            if (num2 <= maxLimit) return String(num2); // Trả về dạng string để sau này pad '0'
        }

        // Thử lấy 1 số cuối (Priority 2)
        const last1 = valStr.slice(-1);
        const num1 = parseInt(last1, 10);
        if (num1 <= maxLimit) return String(num1);

        // Không cứu được -> Trả về gốc để Validator báo lỗi
        return valStr;
    },

    _extractNumber(str, type) {
        if (!str) return '';
        if (/^\d+$/.test(str)) return str;

        let match;
        if (type === 'day') match = str.match(/(?:ngày|ng\.?)\s*(\d{1,2})/i);
        else if (type === 'month') match = str.match(/(?:tháng|th\.?)\s*(\d{1,2})/i);
        else if (type === 'hour') match = str.match(/(\d{1,2})\s*(?:h|giờ)/i);
        else match = str.match(/(\d+)/);

        return match ? match[1] : str;
    }
};

