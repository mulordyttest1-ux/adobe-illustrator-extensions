/**
 * MODULE: NameAnalysis
 * LAYER: Logic/Domain
 * PURPOSE: Name splitting and derived field enrichment (multi-cultural support)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: NameAnalysis.splitFullName(), .enrichSplitNames()
 */

export const NameAnalysis = {
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

        // Clean and normalize
        const cleaned = fullName.replace(/\s+/g, ' ').trim();
        if (!cleaned) return result;

        result.full = cleaned;
        const words = cleaned.split(' ');

        // Calculate position
        const idx = parseInt(index, 10) || 0;
        let pointer = idx === 0 ? words.length - 1 : idx - 1;

        // Bounds check
        if (pointer < 0) pointer = 0;
        if (pointer >= words.length) pointer = words.length - 1;

        // Extract parts
        result.ten = words[pointer] || '';
        result.lot = pointer > 0 ? words[pointer - 1] : '';
        result.ho_dau = words[0] || '';
        result.dau = result.ten ? result.ten.charAt(0).toUpperCase() : '';

        return result;
    },

    /**
     * Bổ sung các trường tên phái sinh vào packet.
     * Tìm các field có suffix `_split_idx` và tách tên tương ứng.
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
                const idx = packet[idxKey] || 0;
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

