/**
 * MODULE: DateValidator
 * LAYER: Logic/UX/Validators
 * PURPOSE: Validate date fields (range check) and cross-validate date logic (sequence, past, gaps)
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: DateValidator.validate(), .validateDateLogic()
 */

export const DateValidator = {
    // Validate số học cơ bản (Vẫn giữ để InputEngine dùng)
    validate(value, type) {
        if (!value) return { valid: true, warnings: [] };
        const warnings = [];
        const num = parseInt(value, 10);
        if (isNaN(num)) warnings.push({ type: 'nan', message: 'NaN', severity: 'error' });
        // Normalizer đã lo vụ min/max 31/12, nhưng check lại cho chắc
        if (type === 'day' && (num < 1 || num > 31)) warnings.push({ type: 'range', message: 'Ngày 1-31', severity: 'error' });
        if (type === 'month' && (num < 1 || num > 12)) warnings.push({ type: 'range', message: 'Tháng 1-12', severity: 'error' });
        return { valid: warnings.length === 0, warnings };
    },

    // --- LOGIC CHÍNH ---
    validateDateLogic(data) {
        const warnings = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();

        // Helper: Parse Date & Check ngày ảo (30/02)
        const parse = (prefix) => {
            const d = parseInt(data[`${prefix}.ngay`], 10);
            const m = parseInt(data[`${prefix}.thang`], 10);
            const y = parseInt(data[`${prefix}.nam`], 10) || currentYear;
            const h = parseInt(data[`${prefix}.gio`], 10) || 0;
            const min = parseInt(data[`${prefix}.phut`], 10) || 0;

            if (!d || !m) return null; // Chưa nhập đủ

            const date = new Date(y, m - 1, d, h, min);

            // CASE 1: NGÀY KHÔNG TỒN TẠI (VD: 30/02, 31/04) -> LỖI ĐỎ
            if (date.getDate() !== d || date.getMonth() + 1 !== m) {
                return { isInvalid: true, msg: `Ngày ${d}/${m} không tồn tại!`, date };
            }
            return { isInvalid: false, date };
        };

        const tiec = parse('date.tiec');
        const le = parse('date.le');
        const nhap = parse('date.nhap');

        // 1. NGÀY KHÔNG TỒN TẠI
        this._checkExistence(warnings, { tiec, le, nhap });
        if (warnings.length > 0) return { valid: false, warnings };

        // 2. NGHỊCH LÝ THỜI GIAN
        this._checkSequence(warnings, data, { tiec, le, nhap });
        if (warnings.length > 0) return { valid: false, warnings };

        // 3. CẢNH BÁO KINH NGHIỆM
        this._checkExperienceWarnings(warnings, { today, currentYear, tiec, le });

        return {
            valid: warnings.filter(w => w.severity === 'error').length === 0,
            warnings
        };
    },

    _checkExistence(warnings, { tiec, le, nhap }) {
        [tiec, le, nhap].forEach(d => {
            if (d && d.isInvalid) {
                warnings.push({ type: 'invalid_date', message: d.msg, severity: 'error' });
            }
        });
    },

    _checkSequence(warnings, data, { tiec, le, nhap }) {
        if (tiec && le) {
            const tDate = new Date(tiec.date).setHours(0, 0, 0, 0);
            const lDate = new Date(le.date).setHours(0, 0, 0, 0);

            if (lDate > tDate) {
                warnings.push({ type: 'logic_seq', message: 'Vô lý: Lễ diễn ra SAU Tiệc', severity: 'error' });
            } else if (lDate === tDate) {
                const hasTime = data['date.tiec.gio'] && data['date.le.gio'];
                if (hasTime && le.date > tiec.date) {
                    warnings.push({ type: 'logic_time', message: 'Vô lý: Giờ Lễ sau Giờ Tiệc', severity: 'error' });
                }
            }
        }

        if (tiec && nhap) {
            const tDate = new Date(tiec.date).setHours(0, 0, 0, 0);
            const nDate = new Date(nhap.date).setHours(0, 0, 0, 0);
            if (nDate > tDate) {
                warnings.push({ type: 'logic_seq', message: 'Vô lý: Nhập tiệc SAU Tiệc', severity: 'error' });
            }
        }
    },

    _checkExperienceWarnings(warnings, { today, currentYear, tiec, le }) {
        if (tiec) {
            const checkTiec = new Date(tiec.date).setHours(0, 0, 0, 0);
            if (checkTiec < today.getTime()) {
                warnings.push({ type: 'past', message: 'CẢNH BÁO: Ngày Tiệc đã qua!', severity: 'warning' });
            }
        }

        if (tiec && tiec.date.getFullYear() > currentYear + 2) {
            warnings.push({ type: 'far_future', message: `Năm ${tiec.date.getFullYear()} quá xa?`, severity: 'warning' });
        }

        if (tiec && le) {
            const diffTime = Math.abs(tiec.date - le.date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 30) {
                warnings.push({ type: 'gap_warn', message: 'Lễ cách Tiệc > 1 tháng?', severity: 'warning' });
            }
        }
    }
};

