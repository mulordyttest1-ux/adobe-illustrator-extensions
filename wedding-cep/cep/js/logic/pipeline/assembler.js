/**
 * MODULE: WeddingAssembler
 * LAYER: Logic/Pipeline
 * PURPOSE: Transform raw form data into rich Illustrator-ready packet (7-phase pipeline)
 * DEPENDENCIES: Normalizer, NameAnalysis, CalendarEngine, WeddingRules, TimeAutomation, VenueAutomation (via setDependencies)
 * SIDE EFFECTS: None (pure, dependencies injected)
 * EXPORTS: WeddingAssembler.setDependencies(), .assemble()
 */

export const WeddingAssembler = {
    _deps: {
        normalizer: null,
        nameAnalysis: null,
        calendarEngine: null,
        weddingRules: null,
        timeAutomation: null,
        venueAutomation: null
    },

    setDependencies(deps) {
        this._deps = { ...this._deps, ...deps };
    },

    async assemble(rawData, schema) {
        // 1. Copy raw data
        let packet = { ...rawData };

        // [FIX 1] Chuẩn hóa key Index từ UI (_idx -> _split_idx)
        // Compact UI dùng "_idx", Logic dùng "_split_idx"
        for (const key in packet) {
            if (key.endsWith('_idx')) {
                const baseKey = key.replace('_idx', '');
                packet[`${baseKey}_split_idx`] = packet[key];
            }
        }

        // [FIX 2] Gộp Date rời rạc từ UI (ngay, thang, nam) thành Date Object
        // Để CalendarEngine có thể chạy được
        this._unifyDates(packet, schema);

        // --- PIPELINE CHUẨN ---

        // Phase 1: Normalize (Clean text)
        if (this._deps.normalizer) {
            packet = this._deps.normalizer.normalize(packet, schema);
        }

        // Phase 2: Name Split (Tự động sinh .ten, .lot, .ho_dau, .dau)
        if (this._deps.nameAnalysis) {
            packet = this._deps.nameAnalysis.enrichSplitNames(packet);
        }

        // Phase 3: Parent Prefixes (Ông/Bà)
        if (this._deps.weddingRules) {
            packet = this._deps.weddingRules.enrichParentPrefixes(packet);
        }

        // Phase 4: Date Expansion (Tính lịch âm, thứ, can chi...)
        if (this._deps.calendarEngine) {
            // Đảm bảo DB đã load
            if (!this._deps.calendarEngine._isLoaded) {
                this._deps.calendarEngine.loadDatabase();
            }
            packet = await this._expandDates(packet, schema);
        }

        // Phase 5: Time Automation (Giờ chuẩn)
        if (this._deps.timeAutomation) {
            packet = this._deps.timeAutomation.enrichTimeLocks(packet, schema);
        }

        // Phase 6: Venue Automation (Địa điểm tự động)
        if (this._deps.venueAutomation) {
            packet = this._deps.venueAutomation.detectVenueState(packet);
            packet = this._deps.venueAutomation.applyAutoVenue(packet, {
                triggerConfig: schema?.TRIGGER_CONFIG || {}
            });
        }

        // Phase 7: Mapping Strategy
        if (this._deps.weddingRules?.enrichMappingStrategy) {
            packet = this._deps.weddingRules.enrichMappingStrategy(packet, schema?.TRIGGER_CONFIG || {});
        }

        return packet;
    },

    /**
     * [MỚI] Gộp các trường rời rạc (ngay, thang, nam) thành một string date chuẩn
     * Để các bước sau có dữ liệu để xử lý.
     */
    _unifyDates(packet, schema) {
        const dateKeys = this._getDateKeys(schema);

        dateKeys.forEach(baseKey => {
            // Nếu UI gửi lên rời rạc: date.tiec.ngay, date.tiec.thang...
            const d = packet[`${baseKey}.ngay`];
            const m = packet[`${baseKey}.thang`];
            const y = packet[`${baseKey}.nam`] || new Date().getFullYear();

            // Nếu chưa có field gốc (date.tiec) nhưng có thành phần con -> Gộp lại
            if (!packet[baseKey] && d && m) {
                packet[baseKey] = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
        });
    },

    async _expandDates(packet, schema) {
        if (!this._deps.calendarEngine) return packet;
        const dateKeys = this._getDateKeys(schema);

        for (const key of dateKeys) {
            // Ưu tiên lấy từ unified value ở bước trước
            const value = packet[key];
            if (!value) continue;

            const match = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (!match) continue;

            const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

            // Gọi CalendarEngine tính toán
            const expanded = this._deps.calendarEngine.expandDate(date);

            // Ghi đè/Bổ sung lại vào packet
            packet[`${key}.ngay`] = expanded.ngay;
            packet[`${key}.thang`] = expanded.thang;
            packet[`${key}.nam`] = expanded.nam;
            packet[`${key}.namyy`] = expanded.namyy;
            packet[`${key}.thu`] = expanded.thu;
            packet[`${key}.ngay_al`] = expanded.ngay_al;
            packet[`${key}.thang_al`] = expanded.thang_al;
            packet[`${key}.nam_al`] = expanded.nam_al;
        }

        return packet;
    },

    _getDateKeys(schema) {
        const keys = [];
        if (!schema || !schema.STRUCTURE) return keys;
        for (const group of schema.STRUCTURE) {
            if (!group.items) continue;
            for (const item of group.items) {
                if (item.type === 'date') {
                    const prefix = group.prefix ? `${group.prefix}.` : '';
                    keys.push(prefix + item.key);
                }
            }
        }
        return keys;
    }
};

