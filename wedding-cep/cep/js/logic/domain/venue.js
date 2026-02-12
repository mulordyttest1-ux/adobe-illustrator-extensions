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

        // 1. Xác định bên nào (Nhà Trai hay Nhà Gái)
        let isNhaGai = triggerConfig[tenLe] === 1;

        // Ưu tiên lựa chọn trực tiếp của người dùng từ hostType
        if (hostType === 'Nhà Gái') isNhaGai = true;
        else if (hostType === 'Nhà Trai') isNhaGai = false;

        const labelOwner = isNhaGai ? 'Nhà Gái' : 'Nhà Trai';

        // Tạo nhãn tên (Ví dụ: "TƯ GIA NHÀ GÁI")
        const labelTugia = this.generateVenueName(labelOwner);

        // Lấy địa chỉ nguồn (mặc định từ pos1.diachi)
        const sourceAddr = options.sourceAddress || packet['pos1.diachi'] || '';

        // --- XỬ LÝ CHO LỄ (CEREMONY) ---
        // Ưu tiên 1: Checkbox UI 'ten_auto'. 
        // Ưu tiên 2: Dự phòng logic cũ 'is_tugia' nếu ten_auto chưa xác định (null/undefined)
        const shouldAutoLe = (packet['ceremony.ten_auto'] !== undefined && packet['ceremony.ten_auto'] !== null)
            ? (packet['ceremony.ten_auto'] === true || packet['ceremony.ten_auto'] === 'true')
            : (packet['ceremony.is_tugia'] === true || packet['ceremony.is_tugia'] === 'true');

        if (shouldAutoLe) {
            packet['ceremony.ten'] = labelTugia;
            packet['ceremony.diachi'] = sourceAddr;
        }

        // --- XỬ LÝ CHO TIỆC (VENUE) ---
        const shouldAutoTiec = (packet['venue.ten_auto'] !== undefined && packet['venue.ten_auto'] !== null)
            ? (packet['venue.ten_auto'] === true || packet['venue.ten_auto'] === 'true')
            : (packet['venue.is_tugia'] === true || packet['venue.is_tugia'] === 'true');

        if (shouldAutoTiec) {
            packet['venue.ten'] = labelTugia;
            packet['venue.diachi'] = sourceAddr;
        }

        return packet;
    },

    // Generate simple name for use in other context
    _simpleName(owner) {
        return `Tư Gia ${owner}`;
    }
};

