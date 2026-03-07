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

    validate(value, options = {}) {
        if (!value || typeof value !== 'string') {
            return { valid: true, warnings: [] };
        }

        const warnings = [];
        const trimmed = value.trim();

        this._checkFormat(trimmed, warnings);
        this._checkTypos(trimmed, warnings);

        if (options && options.formData) {
            this._checkGlobalConsistency(trimmed, options.formData, warnings);
        }

        return {
            valid: warnings.filter(w => w.severity === 'error').length === 0,
            warnings
        };
    },

    _checkFormat(trimmed, warnings) {
        if (/,/.test(trimmed) && /-/.test(trimmed)) {
            warnings.push({ type: 'mixed_separators', message: 'Chứa cả dấu phẩy (,) và gạch ngang (-). Hãy thống nhất dùng 1 loại phân cách!', severity: 'warning' });
        }
        if (trimmed.length > 0 && trimmed.length < 5) {
            warnings.push({ type: 'address_too_short', message: 'Địa chỉ quá ngắn?', severity: 'info' });
        }
        if (/([^\s\d]-|-[^\s\d])/.test(trimmed)) {
            warnings.push({ type: 'dash_no_space', message: 'Nên có khoảng trắng quanh dấu gạch ngang (VD: A - B)', severity: 'info' });
        }
        if (/[,\-.;]+$/.test(trimmed)) {
            warnings.push({ type: 'trailing_punct', message: 'Dư dấu câu cuối cùng', severity: 'info' });
        }
    },

    _checkGlobalConsistency(currentValue, formData, warnings) {
        if (!currentValue || typeof currentValue !== 'string') return;

        const hasComma = /,/.test(currentValue);
        const hasDash = /-/.test(currentValue);

        if (!hasComma && !hasDash) return;

        const addressKeys = ['pos1.diachi', 'pos2.diachi', 'ceremony.diachi', 'venue.diachi'];

        const otherAddresses = addressKeys
            .map(k => formData[k])
            .filter(v => typeof v === 'string' && v !== currentValue)
            .join(' ');

        const conflict = (hasComma && !hasDash && /-/.test(otherAddresses)) ||
            (hasDash && !hasComma && /,/.test(otherAddresses));

        if (conflict) {
            warnings.push({ type: 'inconsistent_separators', message: 'Không đồng bộ: Đang dùng lẫn lộn phẩy và gạch ngang giữa các ô địa chỉ. Hãy thống nhất 1 kiểu!', severity: 'warning' });
        }
    },

    _checkTypos(trimmed, warnings) {
        if (/\b(ddu|uow|oof|oos|ddi|dda|aa|ee|oo)\b/i.test(trimmed)) {
            warnings.push({ type: 'typo_telex', message: 'Lỗi bộ gõ (ddu, uow...)?', severity: 'warning' });
        }

        for (const [correct, wrongs] of Object.entries(this.TYPO_DICTIONARY)) {
            for (const wrong of wrongs) {
                const regex = new RegExp(`(^|\\s|[.,])${wrong}(\\s|[.,]|$)`, 'i');
                if (regex.test(trimmed)) {
                    warnings.push({
                        type: 'typo_keyword',
                        message: `Sai chính tả: "${wrong}" → "${correct}"?`,
                        severity: 'warning'
                    });
                    break;
                }
            }
        }
    }
};

