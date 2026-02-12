/**
 * MODULE: NameValidator
 * LAYER: Logic/UX/Validators
 * PURPOSE: Validate Vietnamese names (numbers, special chars, surname, phonetics)
 * DEPENDENCIES: VietnamesePhonetics (optional)
 * SIDE EFFECTS: None (pure)
 * EXPORTS: NameValidator.validate()
 */

import { VietnamesePhonetics } from './VietnamesePhonetics.js';

export const NameValidator = {
    COMMON_SURNAMES: new Set([
        "Nguyễn", "Trần", "Lê", "Phạm", "Huỳnh", "Hoàng", "Phan", "Vũ", "Võ", "Đặng",
        "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"
    ]),

    ETHNIC_PATTERN: /\b(H'|Y'|K'|M'|Niê|Êban|Kbuôr|Ksor|Siu|Rơ|Kpă|Ama|Ami|H|Y)\b/i,

    validate(value, type = 'person_name') {
        if (!value || typeof value !== 'string') return { valid: true, warnings: [] };

        const warnings = [];
        const trimmed = value.trim();
        const isEthnic = this.ETHNIC_PATTERN.test(trimmed);
        const isVenue = type === 'venue_name';

        // 1. Check cơ bản
        // Venue được phép có số (vd: Nhà hàng 123)
        if (!isVenue && /\d/.test(trimmed)) warnings.push({ type: 'has_number', message: 'Tên chứa số?', severity: 'error' });

        if (!/\s/.test(trimmed) && trimmed.length > 0) warnings.push({ type: 'too_short', message: 'Tên quá ngắn?', severity: 'info' });

        // 2. Check Ký tự đặc biệt (Có phân loại)
        if (isEthnic) {
            // Với tên dân tộc:
            // - Cho phép: Chữ cái, khoảng trắng, dấu (-), dấu nháy đơn (')
            // - Chặn: Số (đã check ở trên), các ký tự đặc biệt khác (!@#...)
            // Regex này chặn các ký tự đặc biệt KHÔNG phải là ' hoặc -
            if (/[!@#$%^&*()_+=/[\]{};:"\\|.<>?]/.test(trimmed)) {
                warnings.push({
                    type: 'special_chars',
                    message: 'Ký tự lạ (trừ dấu \' và -)',
                    severity: 'warning'
                });
            }
        } else {
            // Với tên Kinh hoặc Venue:
            // Chặt chẽ hơn, không cho phép dấu '
            if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)) {
                warnings.push({ type: 'special_chars', message: 'Tên có ký tự đặc biệt', severity: 'warning' });
            }
        }

        // 3. Check Họ (Chỉ người Kinh + Không phải Venue)
        if (!isVenue && !isEthnic && trimmed.includes(' ')) {
            const surname = trimmed.split(/\s+/)[0];
            const normSurname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
            if (!this.COMMON_SURNAMES.has(normSurname)) {
                warnings.push({ type: 'uncommon_surname', message: `Họ lạ: "${surname}"?`, severity: 'info' });
            }
        }

        // 4. Check Ngữ âm (Dùng thư viện chung)
        // QUAN TRỌNG: Bỏ qua check ngữ âm với Tên Dân Tộc (vì cấu trúc ngữ âm khác hẳn tiếng Kinh)
        if (typeof VietnamesePhonetics !== 'undefined') {
            if (!isEthnic) {
                const words = trimmed.split(/\s+/);
                for (const w of words) {
                    // Tên người không được phép viết tắt hay sai chính tả
                    if (w.includes('.') || w.length < 2) continue;

                    const error = VietnamesePhonetics.checkWord(w);
                    if (error) {
                        // Với tên người, lỗi ngữ âm là lỗi NGHIÊM TRỌNG (Error)
                        warnings.push({ type: error.code, message: error.message, severity: 'error' });
                    }
                }
            }
        }

        return {
            valid: warnings.filter(w => w.severity === 'error').length === 0,
            warnings
        };
    }
};

