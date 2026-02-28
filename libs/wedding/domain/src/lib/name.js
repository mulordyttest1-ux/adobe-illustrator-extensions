/**
 * MODULE: NameAnalysis
 * LAYER: Logic/Domain
 * PURPOSE: Name splitting and derived field enrichment (multi-cultural support)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: NameAnalysis.splitFullName(), .enrichSplitNames()
 */

export const NameAnalysis = {
    /** @type {Function|null} Injected from UX layer (NameValidator.suggestIdx) */
    _suggestIdxFn: null,

    /**
     * Inject suggestIdx function from UX layer.
     * Domain layer CANNOT import UX directly — this is the bridge.
     * @param {Function} fn - (name: string) => number
     */
    setSuggestIdxFn(fn) {
        if (typeof fn === 'function') {
            this._suggestIdxFn = fn;
        }
    },

    /**
     * Tách tên đầy đủ thành các phần dựa trên Index.
     * @param {string} fullName - Tên đầy đủ (VD: "Nguyễn Văn An")
     * @param {number} index - Vị trí tên chính (0 = auto = chữ cuối, 1 = chữ thứ 1, ...)
     * @returns {Object} { ten, lot, ho_dau, dau, full }
     * @example splitFullName("Nguyễn Văn An", 0) => { ten: "An", ho_dau: "Nguyễn", ... }
     */
    splitFullName(fullName, index = 0) {
        const result = { ten: '', lot: '', ho_dau: '', dau: '', full: '' };

        if (!fullName || typeof fullName !== 'string') return result;

        const cleaned = fullName.replace(/\s+/g, ' ').trim();
        if (!cleaned) return result;

        const words = cleaned.split(/[\s'ʼ']+/);
        const pointer = this._getPointer(words.length, index);

        return this._extractParts(words, pointer, cleaned);
    },

    _getPointer(wordsLength, index) {
        const idx = parseInt(index, 10) || 0;
        const target = idx === 0 ? wordsLength - 1 : idx - 1;

        if (target < 0) return 0;
        if (target >= wordsLength) return wordsLength - 1;
        return target;
    },

    _extractParts(words, pointer, cleaned) {
        const ten = words[pointer] || '';
        return {
            full: cleaned,
            ten: ten,
            lot: pointer > 0 ? words[pointer - 1] : '',
            ho_dau: words[0] || '',
            dau: ten ? ten.charAt(0).toUpperCase() : ''
        };
    },

    /**
     * Bổ sung các trường tên phái sinh vào packet.
     * Tìm các field có suffix `_split_idx` và tách tên tương ứng.
     * Smart IDX: khi idx=0 (auto) và có suggestIdxFn → dùng idx thông minh.
     * @param {Object} packet - Dữ liệu form
     * @returns {Object} Packet đã được bổ sung
     */
    enrichSplitNames(packet) {
        if (!packet || typeof packet !== 'object') return packet;

        // Find all keys with _split_idx suffix
        const keysToProcess = Object.keys(packet).filter(key => key.includes('_split_idx'));

        for (const idxKey of keysToProcess) {
            const baseKey = idxKey.replace('_split_idx', '');

            if (Object.prototype.hasOwnProperty.call(packet, baseKey)) {
                const fullName = packet[baseKey] || '';
                let idx = packet[idxKey] || 0;

                // Smart IDX: only intervene when idx=0 (auto mode)
                if (idx === 0 && this._suggestIdxFn) {
                    idx = this._suggestIdxFn(fullName) || 0;
                }

                const parts = this.splitFullName(fullName, idx);

                // Add derived fields
                packet[`${baseKey}.ten`] = parts.ten;
                packet[`${baseKey}.lot`] = parts.lot;
                packet[`${baseKey}.ho_dau`] = parts.ho_dau;
                packet[`${baseKey}.dau`] = parts.dau;
            }
        }

        return packet;
    }
};

