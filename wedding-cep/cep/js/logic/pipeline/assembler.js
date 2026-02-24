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
        const packet = { ...rawData };

        // [FIX 1] Chuẩn hóa key Index từ UI (_idx -> _split_idx)
        this._normalizeKeys(packet);

        // [FIX 2] Gộp Date rời rạc từ UI (ngay, thang, nam) thành Date Object
        // Để CalendarEngine có thể chạy được
        this._unifyDates(packet, schema);

        // --- PIPELINE CHUẨN ---
        return await this._runPipeline(packet, schema);
    },

    _normalizeKeys(packet) {
        for (const key in packet) {
            if (key.endsWith('_idx')) {
                const baseKey = key.replace('_idx', '');
                packet[`${baseKey}_split_idx`] = packet[key];
            }
        }
    },

    async _runPipeline(packet, schema) {
        let currentPacket = this._runCorePipeline(packet, schema);
        currentPacket = await this._runDatePipeline(currentPacket, schema);
        return this._runAutomationPipeline(currentPacket, schema);
    },

    _runCorePipeline(packet, schema) {
        let currentPacket = packet;
        if (this._deps.normalizer) {
            currentPacket = this._deps.normalizer.normalize(currentPacket, schema);
        }
        if (this._deps.nameAnalysis) {
            currentPacket = this._deps.nameAnalysis.enrichSplitNames(currentPacket);
        }
        if (this._deps.weddingRules) {
            currentPacket = this._deps.weddingRules.enrichParentPrefixes(currentPacket);
        }
        return currentPacket;
    },

    async _runDatePipeline(packet, schema) {
        let currentPacket = packet;
        if (this._deps.calendarEngine) {
            if (!this._deps.calendarEngine._isLoaded) {
                this._deps.calendarEngine.loadDatabase();
            }
            currentPacket = await this._expandDates(currentPacket, schema);
        }
        return currentPacket;
    },

    _runAutomationPipeline(packet, schema) {
        let currentPacket = packet;
        if (this._deps.timeAutomation) {
            currentPacket = this._deps.timeAutomation.enrichTimeLocks(currentPacket, schema);
        }
        if (this._deps.venueAutomation) {
            currentPacket = this._deps.venueAutomation.detectVenueState(currentPacket);
            currentPacket = this._deps.venueAutomation.applyAutoVenue(currentPacket, {
                triggerConfig: schema?.TRIGGER_CONFIG || {}
            });
        }
        if (this._deps.weddingRules?.enrichMappingStrategy) {
            currentPacket = this._deps.weddingRules.enrichMappingStrategy(currentPacket, schema?.TRIGGER_CONFIG || {});
        }
        return currentPacket;
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

