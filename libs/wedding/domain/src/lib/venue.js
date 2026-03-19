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
        const pos1Addr = packet['pos1.diachi'] || '';

        // ten_auto = true CHỈ KHI THỎA CẢ 2 ĐIỀU KIỆN:
        // 1. Tên là "Tư Gia" (phát hiện từ scan)
        // 2. Địa chỉ trùng với pos1.diachi (khẳng định đây là nhà POS 1)
        // Nếu có "Tư Gia" nhưng địa chỉ khác (nhiều nhà) → uncheck, không autofill

        // Detect for Ceremony (Lễ)
        const ceremonyName = packet['ceremony.ten'] || '';
        const ceremonyAddr = packet['ceremony.diachi'] || '';
        const isTugiaCeremony = this.TUGIA_PATTERN.test(ceremonyName)
            && (ceremonyAddr === pos1Addr);
        packet['ceremony.is_tugia'] = isTugiaCeremony;
        packet['ceremony.ten_auto'] = isTugiaCeremony;

        // Detect for Venue (Tiệc)
        const venueName = packet['venue.ten'] || '';
        const venueAddr = packet['venue.diachi'] || '';
        const isTugiaVenue = this.TUGIA_PATTERN.test(venueName)
            && (venueAddr === pos1Addr);
        packet['venue.is_tugia'] = isTugiaVenue;
        packet['venue.ten_auto'] = isTugiaVenue;

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

        // Chỉ cập nhật TÊN — KHÔNG BAO GIờ touch địa chỉ.
        // Địa chỉ đã có trong packet từ getData() (DOM input boxes = SSOT).
        if (this._shouldAuto(packet, 'ceremony')) {
            packet['ceremony.ten'] = labelTugia;
        }

        if (this._shouldAuto(packet, 'venue')) {
            packet['venue.ten'] = labelTugia;
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

