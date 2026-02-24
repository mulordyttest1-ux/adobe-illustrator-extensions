/**
 * MODULE: WeddingRules
 * LAYER: Logic/Domain
 * PURPOSE: Wedding business rules (parent prefix, bride/groom side, mapping strategy)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: WeddingRules.generateParentPrefix(), .enrichParentPrefixes(), .isBrideSide(), .getSideState(), .enrichMappingStrategy()
 */

export const WeddingRules = {
    SIDE_BRIDE: 'Nhà Gái',
    SIDE_GROOM: 'Nhà Trai',

    /**
     * Sinh prefix xưng hô Ông/Bà dựa trên việc có nhập tên hay không.
     */
    generateParentPrefix(hasOng, hasBa) {
        if (hasOng && hasBa) return 'Ông Bà:';
        if (hasOng) return 'Ông:';
        if (hasBa) return 'Bà:';
        return '';
    },

    /**
     * Bổ sung prefix Ông/Bà cho cả 2 vị trí.
     */
    enrichParentPrefixes(packet) {
        if (!packet || typeof packet !== 'object') return packet;

        for (const pos of ['pos1', 'pos2']) {
            const hasOng = !!(packet[`${pos}.ong`] && String(packet[`${pos}.ong`]).trim());
            const hasBa = !!(packet[`${pos}.ba`] && String(packet[`${pos}.ba`]).trim());
            packet[`${pos}.ongba`] = this.generateParentPrefix(hasOng, hasBa);
        }

        return packet;
    },

    /**
     * Suy luận phe dựa trên tên Lễ.
     */
    isBrideSide(leName, triggerConfig = {}) {
        if (!leName) return false;
        for (const [key, val] of Object.entries(triggerConfig)) {
            if (new RegExp(key, 'i').test(leName)) {
                return val === 1;
            }
        }
        return false;
    },

    /**
     * Lấy state phe (0 = Trai, 1 = Gái).
     */
    getSideState(leName, triggerConfig = {}) {
        return this.isBrideSide(leName, triggerConfig) ? 1 : 0;
    },

    /**
     * Xác định chiến lược ánh xạ vị thứ (Mapping Strategy).
     * Pos 1 = Phe chủ tiệc, Pos 2 = Phe còn lại.
     */
    enrichMappingStrategy(packet, triggerConfig = {}) {
        if (!packet) return packet;

        const hostType = packet['ceremony.host_type'];
        const tenLe = packet['info.ten_le'] || '';
        const valNam = packet['ui.vithu_nam'] || '';
        const valNu = packet['ui.vithu_nu'] || '';

        // Determine who hosts
        let isPos1Bride = false;
        if (hostType === this.SIDE_BRIDE) {
            isPos1Bride = true;
        } else if (hostType === this.SIDE_GROOM) {
            // Already false
        } else {
            isPos1Bride = this.isBrideSide(tenLe, triggerConfig);
        }

        // Apply swap
        if (isPos1Bride) {
            packet['pos1.vithu'] = valNu;
            packet['pos2.vithu'] = valNam;
        } else {
            packet['pos1.vithu'] = valNam;
            packet['pos2.vithu'] = valNu;
        }

        return packet;
    }
};


