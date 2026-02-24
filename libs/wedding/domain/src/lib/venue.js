/**
 * MODULE: VenueAutomation
 * LAYER: Logic/Domain
 * PURPOSE: Auto venue name generation and Tư Gia detection/application
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: VenueAutomation.generateVenueName(), .detectVenueState(), .applyAutoVenue()
 */

export const VenueAutomation = {
    // Regex to detect "Tư gia"
    TUGIA_PATTERN: /tư\s*gia/i,

    /**
     * [NEW] Tạo tên địa điểm chuẩn dựa trên chủ tiệc
     * @param {string} hostType - VD: "Nhà Trai", "Nhà Gái"
     * @returns {string} - VD: "Tư Gia Nhà Trai"
     */
    generateVenueName(hostType) {
        if (!hostType) return '';
        // Logic ghép chuỗi tập trung tại đây
        // Sau này muốn đổi thành "Tư gia nhà ..." hay viết hoa/thường thì chỉ sửa ở đây
        return `Tư Gia ${hostType}`;
    },

    /**
     * Tự động phát hiện trạng thái Tư Gia từ text.
     * @param {Object} packet - Dữ liệu
     * @returns {Object} Packet với checkbox đã được set
     */
    detectVenueState(packet) {
        // Detect for Ceremony (Lễ)
        const ceremonyName = packet['ceremony.ten'] || '';
        if (this.TUGIA_PATTERN.test(ceremonyName)) {
            packet['ceremony.is_tugia'] = true;
        }

        // Detect for Venue (Tiệc)
        const venueName = packet['venue.ten'] || '';
        if (this.TUGIA_PATTERN.test(venueName)) {
            packet['venue.is_tugia'] = true;
        }

        return packet;
    },

    /**
     * Áp dụng thông tin Tư Gia nếu checkbox được bật.
     * @param {Object} packet - Dữ liệu
     * @param {Object} options - { triggerConfig, sanitizer, sourceAddress }
     * @returns {Object} Packet đã xử lý
     */
    applyAutoVenue(packet, options = {}) {
        const tenLe = packet['info.ten_le'] || 'Tân Hôn';
        const hostType = packet['ceremony.host_type'];
        const triggerConfig = options.triggerConfig || {};

        const labelOwner = this._determineLabelOwner(hostType, tenLe, triggerConfig);
        const labelTugia = this.generateVenueName(labelOwner);
        const sourceAddr = options.sourceAddress || packet['pos1.diachi'] || '';

        if (this._shouldAuto(packet, 'ceremony')) {
            packet['ceremony.ten'] = labelTugia;
            packet['ceremony.diachi'] = sourceAddr;
        }

        if (this._shouldAuto(packet, 'venue')) {
            packet['venue.ten'] = labelTugia;
            packet['venue.diachi'] = sourceAddr;
        }

        return packet;
    },

    _determineLabelOwner(hostType, tenLe, triggerConfig) {
        if (hostType === 'Nhà Gái') return 'Nhà Gái';
        if (hostType === 'Nhà Trai') return 'Nhà Trai';
        const isNhaGai = triggerConfig[tenLe] === 1;
        return isNhaGai ? 'Nhà Gái' : 'Nhà Trai';
    },

    _shouldAuto(packet, prefix) {
        const autoKey = `${prefix}.ten_auto`;
        const legacyKey = `${prefix}.is_tugia`;

        if (packet[autoKey] !== undefined && packet[autoKey] !== null) {
            return packet[autoKey] === true || packet[autoKey] === 'true';
        }
        return packet[legacyKey] === true || packet[legacyKey] === 'true';
    },

    // Generate simple name for use in other context
    _simpleName(owner) {
        return `Tư Gia ${owner}`;
    }
};

