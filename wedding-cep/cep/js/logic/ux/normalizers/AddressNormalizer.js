/**
 * MODULE: AddressNormalizer
 * LAYER: Logic/UX/Normalizers
 * PURPOSE: Vietnamese address normalization (Title Case, abbreviation uppercase)
 * DEPENDENCIES: UnicodeNormalizer (optional), UX_ABBREVIATIONS (global constant)
 * SIDE EFFECTS: None (pure)
 * EXPORTS: AddressNormalizer.normalize()
 */

import { UX_ABBREVIATIONS } from '../constants/abbreviations.js';

export const AddressNormalizer = {
    normalize(value, options = {}) {
        if (!value || typeof value !== 'string') {
            return { value: '', applied: [] };
        }

        if (options.skipNormalize) {
            return { value, applied: [] };
        }

        const applied = [];
        let result = value;

        // Step 1: Unicode & Trim
        if (typeof UnicodeNormalizer !== 'undefined') {
            result = UnicodeNormalizer.normalize(result);
        } else {
            result = result.trim().replace(/\s{2,}/g, ' ');
        }

        // Step 2: Fix dấu câu cơ bản
        result = result.replace(/,{2,}/g, ',');
        result = result.replace(/,([^\s])/g, ', $1');
        result = result.replace(/-([a-zA-ZÀ-ỹ])/g, ' - $1');
        result = result.replace(/[,\-.;]+$/, '');

        // --- Step 3: Title Case (Viết hoa chữ cái đầu cho toàn bộ địa chỉ) ---
        // Biến "p. bình hưng" -> "P. Bình Hưng"
        const beforeTitle = result;
        result = this._applyTitleCase(result);
        if (result !== beforeTitle) applied.push('title_case');

        // Step 4: Viết hoa hoàn toàn các TỪ VIẾT TẮT (Ghi đè lên bước 3)
        // Biến "Sn" -> "SN", "Tp" -> "TP"
        if (options.expandAbbr !== false && typeof UX_ABBREVIATIONS !== 'undefined') {
            const beforeAbbr = result;
            result = this._uppercaseAbbreviations(result);
            if (result !== beforeAbbr) applied.push('uppercase_abbr');
        }

        // Step 5: Dọn dẹp cuối cùng
        result = result.replace(/\s{2,}/g, ' ').trim();

        return { value: result, applied };
    },

    /**
     * Viết hoa chữ cái đầu của mỗi từ (Hỗ trợ tiếng Việt)
     */
    _applyTitleCase(str) {
        // Regex tìm tất cả các từ tiếng Việt và Latin
        return str.replace(/[a-zA-ZÀ-ỹ]+/g, (word) => {
            // Giữ nguyên logic: Chữ đầu viết hoa, các chữ sau giữ nguyên
            return word.charAt(0).toUpperCase() + word.slice(1);
        });
    },

    /**
      * Chỉ viết hoa các từ viết tắt có trong danh sách
      * Fix: Loại bỏ Lookbehind (?<!) gây lỗi trên CEP cũ
      * Fix: Bổ sung logic xử lý Capture Group
      */
    _uppercaseAbbreviations(str) {
        // Kiểm tra biến toàn cục UX_ABBREVIATIONS
        if (!str || typeof UX_ABBREVIATIONS === 'undefined') return str;

        let result = str;
        // Sắp xếp key dài trước ngắn sau (ví dụ: match "TP" trước "P")
        const keys = Object.keys(UX_ABBREVIATIONS).sort((a, b) => b.length - a.length);

        // [LOGIC REGEX]
        // Group 1 (^|[^a-zA-ZÀ-ỹ0-9]): Bắt đầu dòng HOẶC ký tự không phải chữ/số (để xác định ranh giới từ).
        // Group 2 (${keys.join('|')}): Các từ viết tắt.
        // Lookahead (?=[\\.\\s,-]|$): Phía sau phải là dấu chấm, khoảng trắng, phẩy, gạch ngang hoặc hết dòng.

        const pattern = new RegExp(`(^|[^a-zA-ZÀ-ỹ0-9])(${keys.join('|')})(?=[\\.\\s,-]|$)`, 'gi');

        result = result.replace(pattern, (match, prefix, abbr) => {
            // match: Chuỗi khớp (VD: " tp")
            // prefix: Ký tự phân cách đứng trước (VD: " " hoặc đầu dòng rỗng)
            // abbr: Từ viết tắt tìm thấy (VD: "tp")

            // Trả về: Ký tự phân cách gốc + Từ viết tắt đã viết hoa
            return prefix + abbr.toUpperCase();
        });

        return result;
    }
};
