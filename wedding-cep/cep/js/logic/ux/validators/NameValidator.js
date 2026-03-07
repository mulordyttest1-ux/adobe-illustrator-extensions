/**
 * MODULE: NameValidator
 * LAYER: Logic/UX/Validators
 * PURPOSE: Validate Vietnamese names (numbers, special chars, surname, phonetics)
 * DEPENDENCIES: VietnamesePhonetics (optional)
 * SIDE EFFECTS: None (pure)
 * EXPORTS: NameValidator.validate()
 */

import { VietnamesePhonetics } from './VietnamesePhonetics.js';
import { EthnicNameNormalizer } from '../normalizers/EthnicNameNormalizer.js';
import { UnicodeNormalizer } from '../core/UnicodeNormalizer.js';

export const NameValidator = {
    COMMON_SURNAMES: new Set([
        "Nguyễn", "Trần", "Lê", "Phạm", "Huỳnh", "Hoàng", "Phan", "Vũ", "Võ", "Đặng",
        "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lương", "Đàm", "Cao", "Đặng", "Lý"
    ]),

    ETHNIC_PATTERN: /(^|\s)(H'|Y'|K'|M'|S'|R'|N'|L'|Nie|Eban|Kbuor|Ksor|Siu|Ro|Kpa|Ama|Ami|H|Y)(\s|$)/i,

    validate(value, type = 'person_name') {
        if (!value || typeof value !== 'string') return { valid: true, warnings: [] };

        const warnings = [];
        const trimmed = value.trim();
        const isEthnic = this.isEthnicName(trimmed);
        const isVenue = type === 'venue_name';

        const context = { trimmed, isEthnic, isVenue, validator: this };

        // Execute rules
        Object.keys(this.NAME_RULES).forEach(ruleKey => {
            const res = this.NAME_RULES[ruleKey](context);
            if (Array.isArray(res)) warnings.push(...res);
            else if (res) warnings.push(res);
        });

        return {
            valid: warnings.filter(w => w.severity === 'error').length === 0,
            warnings
        };
    },

    /** DECOUPLED RULES */
    NAME_RULES: {
        checkNumber({ trimmed, isVenue }) {
            if (!isVenue && /\d/.test(trimmed)) {
                return { type: 'has_number', message: 'Tên chứa số?', severity: 'error' };
            }
            return null;
        },

        checkLength({ trimmed, isEthnic }) {
            if (trimmed.length === 0) return null;
            // Kinh names: warn if no space (single word)
            // Ethnic names: allow single word if it looks like a prefix/name
            if (!/\s/.test(trimmed)) {
                if (isEthnic) return null; // Standalone H, Y is OK for ethnic
                return { type: 'too_short', message: 'Tên quá ngắn?', severity: 'info' };
            }
            return null;
        },

        checkSpecialChars({ trimmed, isEthnic }) {
            // [NEW] Bỏ qua hoàn toàn kiểm tra ký tự đặc biệt cho Tên Dân tộc thiểu số (văn phong tự do)
            if (isEthnic) return null;

            // Strict: common Vietnamese chars only
            if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)) {
                return { type: 'special_chars', message: 'Tên có ký tự đặc biệt', severity: 'warning' };
            }
            return null;
        },

        checkSurname({ trimmed, isVenue, isEthnic, validator }) {
            if (isVenue || isEthnic || !trimmed.includes(' ')) return null;

            const surname = trimmed.split(/\s+/)[0];
            const normSurname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
            if (!validator.COMMON_SURNAMES.has(normSurname)) {
                return { type: 'uncommon_surname', message: `Họ lạ: "${surname}"?`, severity: 'info' };
            }
            return null;
        },

        checkPhonetics({ trimmed, isEthnic }) {
            if (typeof VietnamesePhonetics === 'undefined') return null;

            const results = [];
            const words = trimmed.split(/\s+/);

            // Smart Bypass Pattern (Word-level)
            // If a word contains ' or matches common ethnic starts, bypass phonetic check for THAT word
            const wordBypassRegex = /['ʼ']|^Ro|^Kpa|^H'|^Y'|^K'|^M'|^S'|^N'|^L'/i;

            for (const w of words) {
                // Clean purely numeric or abbreviation parts
                if (w.includes('.') || w.length < 2 || /\d/.test(w)) continue;

                // Word-level Phonetic Bypass: 
                // Skip if globally marked as ethnic OR if this specific word looks ethnic (Sau khi đã lột dấu)
                const cleanW = typeof UnicodeNormalizer !== 'undefined' ? UnicodeNormalizer.removeDiacritics(w) : w;
                if (isEthnic || wordBypassRegex.test(cleanW)) continue;

                const error = VietnamesePhonetics.checkWord(w);
                if (error) {
                    results.push({ type: error.code, message: error.message, severity: 'error' });
                }
            }
            return results;
        }
    },

    // ===== SMART IDX (New — Phase 2) =====

    /**
     * Detect if name belongs to an ethnic minority group.
     * Delegates to EthnicNameNormalizer for heavy lifting.
     * @param {string} name - Raw name input
     * @returns {boolean}
     */
    isEthnicName(name) {
        if (typeof EthnicNameNormalizer === 'undefined' || !EthnicNameNormalizer.isReady) {
            const cleanName = typeof UnicodeNormalizer !== 'undefined'
                ? UnicodeNormalizer.removeDiacritics(name || '')
                : (name || '');
            return this.ETHNIC_PATTERN.test(cleanName);
        }
        return EthnicNameNormalizer.isEthnic(name);
    },

    /**
     * Suggest optimal split index for name.
     * Returns 0 for Kinh names (default = last word is tên).
     * Returns >0 for ethnic names where tên is NOT the last word.
     * @param {string} name - Raw name input
     * @returns {number} idx value compatible with splitFullName()
     */
    suggestIdx(name) {
        if (typeof EthnicNameNormalizer === 'undefined' || !EthnicNameNormalizer.isReady) {
            return 0;
        }
        return EthnicNameNormalizer.suggestIdx(name);
    }
};

