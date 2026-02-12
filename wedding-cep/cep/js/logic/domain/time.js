/**
 * MODULE: TimeAutomation
 * LAYER: Logic/Domain
 * PURPOSE: Standard time checking, lock state management, and default time filling
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: TimeAutomation.isStandardTime(), .shouldLock(), .enrichTimeLocks()
 */

export const TimeAutomation = {

    // 1. Chuyển cấu hình giờ chuẩn về đây (Single Source of Truth)
    STANDARD_TIMES: {
        'date.tiec': { h: 11, m: 0 },
        'date.le': { h: 9, m: 0 },
        'date.nhap': { h: 17, m: 0 }
    },

    /**
     * [NEW] Kiểm tra xem giờ/phút có khớp chuẩn không
     */
    isStandardTime(key, h, m) {
        const std = this.STANDARD_TIMES[key];
        if (!std) return false;

        const valH = parseInt(h, 10);
        const valM = m === '' ? 0 : parseInt(m, 10); // Phút trống coi là 0

        // So sánh
        if (isNaN(valH)) return false;
        if (isNaN(valM)) return valH === std.h; // Nếu phút lỗi, chỉ check giờ (tuỳ chọn)

        return valH === std.h && valM === std.m;
    },

    shouldLock(h, m, standard) {
        if (!standard) return false;

        const valH = String(h || '').trim();
        const valM = String(m || '').trim();
        const stdH = String(standard.h || '').trim();
        const stdM = String(standard.m || '').trim();

        // Case 1: Empty -> Lock (để điền default)
        if (valH === '' && valM === '') return true;

        // Case 2: Compare numerically (avoid "09" vs "9" issues)
        const nH = parseInt(valH, 10);
        const nM = parseInt(valM, 10);
        const sH = parseInt(stdH, 10);
        const sM = parseInt(stdM, 10);

        if (!isNaN(nH) && !isNaN(nM) && !isNaN(sH) && !isNaN(sM)) {
            if (nH === sH && nM === sM) return true;
        }

        return false;
    },

    /**
     * Bổ sung trạng thái Lock và điền giờ chuẩn nếu trống.
     * @param {Object} packet - Dữ liệu
     * @param {Object} schema - Schema chứa STANDARD_TIMES
     * @returns {Object} Packet đã xử lý
     */
    enrichTimeLocks(packet, schema) {
        const times = schema?.STANDARD_TIMES || this.DEFAULT_TIMES;

        const mapping = {
            'date.tiec': times.TIEC,
            'date.le': times.LE,
            'date.nhap': times.NHAP
        };

        for (const [rootKey, standard] of Object.entries(mapping)) {
            const h = packet[`${rootKey}.gio`];
            const m = packet[`${rootKey}.phut`];

            const isLocked = this.shouldLock(h, m, standard);
            packet[`${rootKey}_is_locked`] = isLocked;

            // If locked and empty -> Fill default
            if (isLocked && !String(h || '').trim()) {
                packet[`${rootKey}.gio`] = standard.h;
                packet[`${rootKey}.phut`] = standard.m;
            }
        }

        return packet;
    }
};

