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

        const pushWarning = (res) => {
            if (Array.isArray(res)) warnings.push(...res);
            else if (res) warnings.push(res);
        };

        pushWarning(this._checkNumber(trimmed, isVenue));
        pushWarning(this._checkLength(trimmed));
        pushWarning(this._checkSpecialChars(trimmed, isEthnic));
        pushWarning(this._checkSurname(trimmed, isVenue, isEthnic));
        pushWarning(this._checkPhonetics(trimmed, isEthnic));

        return {
            valid: warnings.filter(w => w.severity === 'error').length === 0,
            warnings
        };
    },

    /** INTERNAL RULES */
    _checkNumber(trimmed, isVenue) {
        if (!isVenue && /\d/.test(trimmed)) {
            return { type: 'has_number', message: 'Tên chứa số?', severity: 'error' };
        }
        return null;
    },

    _checkLength(trimmed) {
        if (!/\s/.test(trimmed) && trimmed.length > 0) {
            return { type: 'too_short', message: 'Tên quá ngắn?', severity: 'info' };
        }
        return null;
    },

    _checkSpecialChars(trimmed, isEthnic) {
        if (isEthnic) {
            if (/[!@#$%^&*()_+=/[\]{};:"\\|.<>?]/.test(trimmed)) {
                return { type: 'special_chars', message: 'Ký tự lạ (trừ dấu \' và -)', severity: 'warning' };
            }
        } else {
            if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)) {
                return { type: 'special_chars', message: 'Tên có ký tự đặc biệt', severity: 'warning' };
            }
        }
        return null;
    },

    _checkSurname(trimmed, isVenue, isEthnic) {
        if (!isVenue && !isEthnic && trimmed.includes(' ')) {
            const surname = trimmed.split(/\s+/)[0];
            const normSurname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
            if (!this.COMMON_SURNAMES.has(normSurname)) {
                return { type: 'uncommon_surname', message: `Họ lạ: "${surname}"?`, severity: 'info' };
            }
        }
        return null;
    },

    _checkPhonetics(trimmed, isEthnic) {
        if (typeof VietnamesePhonetics === 'undefined' || isEthnic) return null;

        const results = [];
        const words = trimmed.split(/\s+/);
        for (const w of words) {
            if (w.includes('.') || w.length < 2) continue;
            const error = VietnamesePhonetics.checkWord(w);
            if (error) {
                results.push({ type: error.code, message: error.message, severity: 'error' });
            }
        }
        return results;
    }
};

