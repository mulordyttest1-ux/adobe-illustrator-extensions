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

        // Pre-build special char regex + map
        if (data.special_chars) {
            const chars = Object.keys(data.special_chars);
            this._specialCharMap = data.special_chars;
            // Escape for regex, join as alternation
            const escaped = chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            this._specialCharRegex = new RegExp(escaped.join('|'), 'g');
        }

        // Pre-build surname lookup sets
        if (data.surnames_last) {
            this._surnamesLastSet = new Set(data.surnames_last.map(s => s.toLowerCase()));
        }
        if (data.surnames_first) {
            this._surnamesFirstSet = new Set(data.surnames_first.map(s => s.toLowerCase()));
        }
        if (data.gender_prefixes) {
            this._genderPrefixSet = new Set(data.gender_prefixes.map(s => s.trim().toLowerCase()));
        }
        if (data.kinship_prefixes) {
            this._kinshipPrefixSet = new Set(data.kinship_prefixes.map(s => s.toLowerCase()));
        }
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

        // Check 1: Parentheses with kinship terms usually mean ethnic (e.g. "(Ama Pui)")
        if (name.includes('(')) {
            const kinshipMatch = name.match(/\(([^)]+)\)/);
            if (kinshipMatch) {
                const inner = kinshipMatch[1].split(/\s+/)[0].toLowerCase();
                if (this._kinshipPrefixSet?.has(inner)) return true;
            }
        }

        const normalized = this.normalize(name);
        return this._hasEthnicPrefix(normalized) || this._hasEthnicSurname(normalized);
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

        // Check if LAST word is an ethnic surname → idx = 2
        const lastWord = words[words.length - 1];
        if (this._surnamesLastSet && this._surnamesLastSet.has(lastWord.toLowerCase())) {
            return 2;
        }

        return 0;
    },

    // === PRIVATE HELPERS ===

    _hasEthnicPrefix(normalized) {
        if (!this._data) return false;
        const words = normalized.split(/\s+/);
        const lower = normalized.toLowerCase();
        const firstWord = words[0].toLowerCase();

        // Standard prefixes: H', Y', K'...
        if (this._data.prefixes && this._data.prefixes.some(p => lower.startsWith(p.toLowerCase()))) {
            return true;
        }

        // Gender/Kinship prefixes: Ama, Amĭ, Y, A...
        if (this._genderPrefixSet?.has(firstWord)) return true;
        if (this._kinshipPrefixSet?.has(firstWord)) return true;

        return false;
    },

    _hasEthnicSurname(normalized) {
        const words = normalized.split(/\s+/);
        if (words.length < 2) return false;

        const lastWord = words[words.length - 1].toLowerCase();
        const firstWord = words[0].toLowerCase();

        if (this._surnamesLastSet?.has(lastWord)) return true;
        if (this._surnamesFirstSet?.has(firstWord)) return true;

        // Multi-word surnames: "Rơ Châm", "Buôn Krông"
        if (words.length >= 2) {
            const firstTwo = (words[0] + ' ' + words[1]).toLowerCase();
            if (this._surnamesFirstSet?.has(firstTwo)) return true;

            const lastTwo = (words[words.length - 2] + ' ' + words[words.length - 1]).toLowerCase();
            if (this._surnamesLastSet?.has(lastTwo)) return true;
        }

        return false;
    },

    /**
     * Find the position of the actual name (skipping prefix)
     * "H Ngôn Niê" → H is prefix, Ngôn is name → return 2
     * "Y Jut Êban" → Y is prefix, Jut is name  → return 2
     * "H'Hen Niê"  → H'Hen is name (compound)   → return 1
     */
    _findNamePosition(words) {
        if (!words || words.length < 2) return 0;

        const first = words[0];
        const firstLower = first.toLowerCase();

        // Check 1: Is first word a known gender prefix? (Y, A, Ma...)
        if (this._data?.gender_prefixes) {
            const isGenderPrefix = this._data.gender_prefixes.some(
                p => p.trim().toLowerCase() === firstLower
            );
            if (isGenderPrefix) return 2;
        }

        // Check 2: Is first word a single letter matching prefix patterns? (H, Y, K)
        // Catches "H Ngôn" where H is standalone (no apostrophe)
        if (first.length === 1 && this._data?.prefixes) {
            const isSinglePrefix = this._data.prefixes.some(
                p => p.charAt(0).toLowerCase() === firstLower
            );
            if (isSinglePrefix) return 2;
        }

        // Otherwise name is the first word (or compound like H'Hen)
        return 1;
    }
};
