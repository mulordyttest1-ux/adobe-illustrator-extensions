import {
    createLowercaseSet,
    createSpecialCharCache,
    extractKinshipPrefix,
    hasEthnicPrefix,
    hasEthnicSurname,
    isStandalonePrefixWord
} from './ethnicNameSupport.js';

/**
 * MODULE: EthnicNameNormalizer
 * LAYER: Logic/UX/Normalizers
 * PURPOSE: Chuẩn hóa tên dân tộc thiểu số (prefix spacing, diacritics, kinship stripping)
 * DEPENDENCIES: None (pure)
 * SIDE EFFECTS: None
 * EXPORTS: EthnicNameNormalizer
 */

export const EthnicNameNormalizer = {
    /** @type {Object|null} Loaded dictionary data */
    _data: null,

    /** @type {RegExp|null} Cached special chars regex */
    _specialCharRegex: null,

    /** @type {Object|null} Cached special chars map */
    _specialCharMap: null,

    /** @type {Set|null} Cached surnames_last set (lowercased for matching) */
    _surnamesLastSet: null,

    /** @type {Set|null} Cached surnames_first set (lowercased for matching) */
    _surnamesFirstSet: null,

    /**
     * Init with dictionary data
     * @param {Object} data - Parsed ethnic_names.json
     */
    init(data) {
        if (!data) return;
        this._data = data;

        const specialCharCache = createSpecialCharCache(data.special_chars);
        this._specialCharRegex = specialCharCache.regex;
        this._specialCharMap = specialCharCache.map;
        this._surnamesLastSet = createLowercaseSet(data.surnames_last);
        this._surnamesFirstSet = createLowercaseSet(data.surnames_first);
        this._genderPrefixSet = createLowercaseSet(data.gender_prefixes, { trim: true });
        this._kinshipPrefixSet = createLowercaseSet(data.kinship_prefixes);
    },

    /** @returns {boolean} Whether dictionary is loaded */
    get isReady() {
        return this._data !== null;
    },

    /**
     * Full normalization pipeline
     * @param {string} name - Raw name input
     * @returns {string} Normalized name (kinship stripped, prefix fixed, diacritics cleaned)
     */
    normalize(name) {
        if (!name || typeof name !== 'string') return '';
        let result = name.trim();

        // Step 1: Strip kinship auxiliary names (Amĭ Lan), (Ama Lan)...
        result = this.stripKinship(result);

        // Step 2: Normalize prefix spacing: "H' Hen" → "H'Hen"
        result = this.normalizePrefix(result);

        // Step 3: Normalize special diacritics: ĭ→i, č→c...
        result = this.normalizeDiacritics(result);

        // Clean trailing/leading spaces
        return result.replace(/\s{2,}/g, ' ').trim();
    },

    /**
     * Strip auxiliary kinship names in parentheses at end of string
     * "H'Hen Niê (Amĭ Lan)" → "H'Hen Niê"
     * @param {string} name
     * @returns {string}
     */
    stripKinship(name) {
        if (!name) return '';
        // Remove (...) at end of string, greedy on trailing spaces
        return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    },

    /**
     * Normalize ethnic prefix spacing
     * "H' Hen" | "h'hen" | "H ' Hen" → "H'Hen"
     * Only targets H, Y, K followed by apostrophe variants
     * @param {string} name
     * @returns {string}
     */
    normalizePrefix(name) {
        if (!name) return '';
        // Match H/Y/K (case insensitive) + optional spaces + apostrophe variants + optional spaces
        return name.replace(/([HYKhyk])\s*['ʼ']\s*/g, "$1'");
    },

    /**
     * Convert non-Vietnamese diacritics to base form
     * ĭ→i, ŏ→o, č→c... but KEEP ă, ơ, ư, đ (valid Vietnamese)
     * @param {string} name
     * @returns {string}
     */
    normalizeDiacritics(name) {
        if (!name || !this._specialCharRegex || !this._specialCharMap) return name || '';
        const map = this._specialCharMap;
        return name.replace(this._specialCharRegex, (match) => map[match] || match);
    },

    /**
     * Detect if a name is ethnic minority (after normalization)
     * @param {string} name - Raw or normalized name
     * @returns {boolean}
     */
    isEthnic(name) {
        if (!name || !this._data) return false;

        const kinshipPrefix = extractKinshipPrefix(name);
        if (kinshipPrefix && this._kinshipPrefixSet?.has(kinshipPrefix)) {
            return true;
        }

        const normalized = this.normalize(name);
        return hasEthnicPrefix(normalized, this._data, this._genderPrefixSet, this._kinshipPrefixSet)
            || hasEthnicSurname(normalized, this._surnamesFirstSet, this._surnamesLastSet);
    },

    /**
     * Suggest optimal split index for name
     * Rule: nếu chữ cuối là họ dân tộc → idx = 2 (đa số trường hợp)
     * Thiểu số ngoại lệ → user unlock IDX tự sửa
     * @param {string} name - Raw name input
     * @returns {number} idx value for splitFullName (0 = default/last word)
     */
    suggestIdx(name) {
        if (!name || !this._data) return 0;
        const normalized = this.normalize(name);
        const words = normalized.split(/\s+/);
        if (words.length < 2) return 0;

        // Rule 1: Last word is a known ethnic surname → idx = 2
        // "Y Jut Êban" → Êban in surnames_last → idx=2
        const lastWord = words[words.length - 1];
        if (this._surnamesLastSet && this._surnamesLastSet.has(lastWord.toLowerCase())) {
            return 2;
        }

        // Rule 2: 3+ word name with H/Y standalone prefix → tên is NOT last word → idx=2
        // "H Hang Ja" → H prefix + Hang tên + Ja clan → idx=2
        // Does NOT apply to 2-word "H Loan" where last word IS tên (idx=0 correct)
        if (words.length >= 3 && this.isEthnic(name) && isStandalonePrefixWord(words[0], this._data, this._genderPrefixSet)) {
            return 2;
        }

        return 0;
    }
};
