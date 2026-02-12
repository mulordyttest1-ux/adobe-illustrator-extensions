/**
 * MODULE: CalendarEngine
 * LAYER: Logic/Domain
 * PURPOSE: Lunar/Solar calendar conversion and date expansion from CSV database
 * DEPENDENCIES: CSInterface (CEP), fs (Node.js via CEP)
 * SIDE EFFECTS: File I/O (readFileSync for CSV)
 * EXPORTS: CalendarEngine.loadDatabase(), .getLunarDate(), .getSolarDate(), .expandDate()
 */

export const CalendarEngine = {
    _cache: null,
    _isLoaded: false,

    /**
     * Load CSV database bằng Node.js fs
     */
    loadDatabase() {
        if (this._isLoaded) return true;

        try {
            // 1. Lấy đường dẫn gốc
            const cs = new CSInterface();
            let rootPath = cs.getSystemPath(CSInterface.EXTENSION);

            // 2. FIX QUAN TRỌNG: Chuyển đổi URI (file://) sang Path hệ thống
            if (rootPath.startsWith('file://')) {
                rootPath = rootPath.substring(7);
            }

            // [FIX] Xử lý đặc thù cho Windows: /C:/Users -> C:/Users
            // Kiểm tra ký tự thứ 2 là dấu hai chấm (vd: /C:)
            if (navigator.platform.indexOf('Win') > -1 && rootPath.startsWith('/') && rootPath[2] === ':') {
                rootPath = rootPath.substring(1);
            }

            rootPath = decodeURIComponent(rootPath);

            const csvPath = rootPath + '/data/ngay.csv';
            // console.log('[CalendarEngine] Loading normalized path:', csvPath);

            // 3. Kiểm tra Node.js require
            let fs;
            if (typeof window.require === 'function') {
                fs = window.require('fs');
            } else if (typeof require === 'function') {
                fs = require('fs');
            }

            if (!fs) {

                return false;
            }

            if (!fs.existsSync(csvPath)) {

                return false;
            }

            const content = fs.readFileSync(csvPath, 'utf8');

            // 4. Parse CSV
            this._parseCSV(content);

            return true;

        } catch {

            return false;
        }
    },

    _parseCSV(content) {
        const lines = content.split(/\r?\n/);
        this._cache = [];

        // Skip header (line 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length >= 6) {
                this._cache.push({
                    d: parseInt(parts[0], 10),
                    m: parseInt(parts[1], 10),
                    y: parseInt(parts[2], 10),
                    al_d: parseInt(parts[3], 10),
                    al_m: parseInt(parts[4], 10),
                    al_y_txt: parts[5].trim()
                });
            }
        }
        this._isLoaded = true;
    },

    getLunarDate(day, month, _year) {
        if (!this._isLoaded) this.loadDatabase();
        if (!this._cache) return null;

        const d = parseInt(day, 10);
        const m = parseInt(month, 10);

        const record = this._cache.find(r => r.d === d && r.m === m);
        if (!record) return null;

        const date = new Date(record.y, record.m - 1, record.d);
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

        return {
            day: record.d,
            month: record.m,
            year: record.y,
            lunar_day: record.al_d,
            lunar_month: record.al_m,
            lunar_year_txt: record.al_y_txt,
            thu: days[date.getDay()]
        };
    },

    getSolarDate(lunarDay, lunarMonth, lunarYearTxt) {
        if (!this._isLoaded) this.loadDatabase();
        if (!this._cache) return null;

        const ld = parseInt(lunarDay, 10);
        const lm = parseInt(lunarMonth, 10);

        let record;
        if (lunarYearTxt) {
            record = this._cache.find(r => r.al_d === ld && r.al_m === lm && r.al_y_txt === lunarYearTxt);
        } else {
            record = this._cache.find(r => r.al_d === ld && r.al_m === lm);
        }

        if (!record) return null;

        return {
            day: record.d,
            month: record.m,
            year: record.y
        };
    },

    /**
     * Hàm mở rộng Date (BẮT BUỘC CÓ để UI không crash)
     */
    expandDate(date) {
        if (!(date instanceof Date) || isNaN(date)) return {};

        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();

        const result = {
            ngay: String(d).padStart(2, '0'),
            thang: String(m).padStart(2, '0'),
            nam: String(y),
            namyy: String(y).slice(-2),
            ngay_al: '', thang_al: '', nam_al: '', thu: ''
        };

        if (!this._isLoaded) this.loadDatabase();

        const lunar = this.getLunarDate(d, m, y);
        if (lunar) {
            result.ngay_al = String(lunar.lunar_day).padStart(2, '0');
            result.thang_al = String(lunar.lunar_month).padStart(2, '0');
            result.nam_al = lunar.lunar_year_txt;
            result.thu = lunar.thu;
        }
        return result;
    }
};

