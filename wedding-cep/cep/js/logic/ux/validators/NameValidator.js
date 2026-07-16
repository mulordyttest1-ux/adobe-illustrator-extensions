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
import { CatholicSaintNames } from '@wedding/domain';
import {
    createFamilySurnameWarning,
    fallbackEthnicDetection,
    hasBlockingNameWarnings,
    normalizeSurnameToken,
    runNameRules,
    shouldBypassPhoneticWord
} from './nameValidationSupport.js';
import { VietnameseSurnameLibrary } from './surnameLibrary.js';

export const NameValidator = {
    COMMON_SURNAMES: VietnameseSurnameLibrary.commonSurnameKeys,

    // Hỗ trợ dính liền nét (Community Standard): sau H/Y có thể là Khoảng Trắng, Gạch Ngang, Nháy Đơn, Cuối Câu, hoặc Chữ Cái Viết Liền
    ETHNIC_PATTERN: /(^|[\s'-])(H'|Y'|K'|M'|S'|R'|N'|L'|Nie|Eban|Kbuor|Ksor|Siu|Ro|Kpa|Ama|Ami|H|Y)([\s'-]|$|(?=[A-Za-z]))/i,

    validate(value, type = 'person_name', options = {}) {
        if (!value || typeof value !== 'string') return { valid: true, warnings: [] };

        const trimmed = value.trim();
        const saintName = CatholicSaintNames.normalizeFullName(trimmed);
        const validationName = saintName.saint ? saintName.ordinaryName : trimmed;
        const isEthnic = this.isEthnicName(validationName);
        const isVenue = type === 'venue_name';
        const context = {
            trimmed: validationName,
            original: trimmed,
            saintName,
            isEthnic,
            isVenue,
            validator: this,
            fieldKey: options.fieldKey,
            formData: options.formData || {}
        };
        const warnings = runNameRules(this.NAME_RULES, context);

        return {
            valid: !hasBlockingNameWarnings(warnings),
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

        checkSurname({ trimmed, isVenue, isEthnic }) {
            if (isVenue || isEthnic || !trimmed.includes(' ')) return null;

            const { surname, known } = normalizeSurnameToken(trimmed);

            if (!known) {
                return { type: 'uncommon_surname', message: `Họ lạ: "${surname}"?`, severity: 'info' };
            }
            return null;
        },

        checkFamilySurname(context) {
            if (context.isVenue || context.isEthnic) return null;
            return createFamilySurnameWarning({
                fieldKey: context.fieldKey,
                formData: context.formData,
                currentValue: context.original,
                validator: context.validator
            });
        },

        checkPhonetics({ trimmed, isEthnic }) {
            const results = [];
            const words = trimmed.split(/\s+/);

            // Smart Bypass Pattern (Word-level)
            // If a word contains ' or - or matches common ethnic starts, bypass phonetic check for THAT word
            const wordBypassRegex = /['ʼ-]|(?<=^|\s)(Ro|Kpa|H'|Y'|K'|M'|S'|N'|L'|H|Y)(?=$|[\s'-])/i;

            for (const w of words) {
                if (shouldBypassPhoneticWord(w, isEthnic, wordBypassRegex)) continue;

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
        if (!EthnicNameNormalizer.isReady) {
            return fallbackEthnicDetection(name, this.ETHNIC_PATTERN);
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
        if (!EthnicNameNormalizer.isReady) {
            return 0;
        }
        return EthnicNameNormalizer.suggestIdx(name);
    }
};

