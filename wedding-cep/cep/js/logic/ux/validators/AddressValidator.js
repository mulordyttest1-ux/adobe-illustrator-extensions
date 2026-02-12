/**
 * MODULE: AddressValidator
 * LAYER: Logic/UX/Validators
 * PURPOSE: Validate Vietnamese addresses (separators, typo detection, Telex errors)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: AddressValidator.validate()
 */

export const AddressValidator = {
    // Dữ liệu cộng đồng: Các từ khoá địa chỉ hay bị gõ sai
    TYPO_DICTIONARY: {
        "đường": ["duong", "đuong", "đương", "đương", "đưuong", "dduong", "đừơng"],
        "phố": ["pho", "phô", "phó"],
        "ngõ": ["ngo", "ngỏ"],
        "ngách": ["ngach"],
        "hẻm": ["hem"],
        "số": ["so", "só"],
        "nhà": ["nha"],
        "ấp": ["ap"],
        "thôn": ["thon"],
        "buôn": ["buon"],
        "xã": ["xa"],
        "huyện": ["huyen"],
        "tỉnh": ["tinh"]
    },

    validate(value) {
        if (!value || typeof value !== 'string') {
            return { valid: true, warnings: [] };
        }

        const warnings = [];
        const trimmed = value.trim();

        // --- 1. LOGIC CŨ (GIỮ NGUYÊN) ---
        if (/,/.test(trimmed) && /-/.test(trimmed)) {
            warnings.push({ type: 'mixed_separators', message: 'Hỗn hợp dấu phẩy và gạch ngang', severity: 'warning' });
        }
        if (trimmed.length > 0 && trimmed.length < 5) {
            warnings.push({ type: 'address_too_short', message: 'Địa chỉ quá ngắn?', severity: 'info' });
        }
        if (/-[^\s\d]/.test(trimmed)) {
            warnings.push({ type: 'dash_no_space', message: 'Thiếu space sau gạch ngang', severity: 'info' });
        }
        if (/[,\-.;]+$/.test(trimmed)) {
            warnings.push({ type: 'trailing_punct', message: 'Dư dấu câu cuối cùng', severity: 'info' });
        }

        // --- 2. LOGIC MỚI: PHÁT HIỆN LỖI CHÍNH TẢ (TYPO) ---

        // 2.1 Check Telex lỗi (vd: dduowng, soos)
        // Chỉ check những lỗi telex điển hình thường gặp ở đầu từ
        if (/\b(ddu|uow|oof|oos|ddi|dda|aa|ee|oo)\b/i.test(trimmed)) {
            warnings.push({ type: 'typo_telex', message: 'Lỗi bộ gõ (ddu, uow...)?', severity: 'warning' });
        }

        // 2.2 Check từ điển lỗi (Fuzzy logic đơn giản)
        for (const [correct, wrongs] of Object.entries(this.TYPO_DICTIONARY)) {
            for (const wrong of wrongs) {
                // Regex: Tìm từ sai đứng độc lập (bọc bởi đầu dòng, space hoặc dấu câu)
                // Ví dụ: "só nhà" -> match "só"
                const regex = new RegExp(`(^|\\s|[.,])${wrong}(\\s|[.,]|$)`, 'i');
                if (regex.test(trimmed)) {
                    warnings.push({
                        type: 'typo_keyword',
                        message: `Sai chính tả: "${wrong}" → "${correct}"?`,
                        severity: 'warning'
                    });
                    // Break inner loop để tránh báo nhiều lỗi cho cùng 1 từ gốc
                    break;
                }
            }
        }

        return {
            valid: warnings.filter(w => w.severity === 'error').length === 0,
            warnings
        };
    }
};

