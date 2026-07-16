export function createFieldValidationWarnings(value, type) {
    if (!value) {
        return [];
    }

    const warnings = [];
    const num = parseInt(value, 10);

    if (Number.isNaN(num)) {
        warnings.push({ type: 'nan', message: 'NaN', severity: 'error' });
        return warnings;
    }

    if (type === 'day' && (num < 1 || num > 31)) {
        warnings.push({ type: 'range', message: 'Ngày 1-31', severity: 'error' });
    }
    if (type === 'month' && (num < 1 || num > 12)) {
        warnings.push({ type: 'range', message: 'Tháng 1-12', severity: 'error' });
    }

    return warnings;
}

export function parseDateFields(data, prefix, currentYear) {
    const day = parseInt(data[`${prefix}.ngay`], 10);
    const month = parseInt(data[`${prefix}.thang`], 10);
    const year = parseInt(data[`${prefix}.nam`], 10) || currentYear;
    const hour = parseInt(data[`${prefix}.gio`], 10) || 0;
    const minute = parseInt(data[`${prefix}.phut`], 10) || 0;

    if (!day || !month) {
        return null;
    }

    const date = new Date(year, month - 1, day, hour, minute);
    if (date.getDate() !== day || date.getMonth() + 1 !== month) {
        return {
            isInvalid: true,
            msg: `Ngày ${day}/${month} không tồn tại!`,
            date
        };
    }

    return {
        isInvalid: false,
        date
    };
}

export function pushExistenceWarnings(warnings, parsedDates) {
    parsedDates.forEach((parsedDate) => {
        if (parsedDate?.isInvalid) {
            warnings.push({ type: 'invalid_date', message: parsedDate.msg, severity: 'error' });
        }
    });
}

export function pushSequenceWarnings(warnings, data, { tiec, le, nhap }) {
    if (tiec && le) {
        const tiecDate = new Date(tiec.date).setHours(0, 0, 0, 0);
        const leDate = new Date(le.date).setHours(0, 0, 0, 0);

        if (leDate > tiecDate) {
            warnings.push({ type: 'logic_seq', message: 'Vô lý: Lễ diễn ra SAU Tiệc', severity: 'error' });
        } else if (leDate === tiecDate) {
            const hasTime = data['date.tiec.gio'] && data['date.le.gio'];
            if (hasTime && le.date > tiec.date) {
                warnings.push({ type: 'logic_time', message: 'Vô lý: Giờ Lễ sau Giờ Tiệc', severity: 'error' });
            }
        }
    }

    if (tiec && nhap) {
        const tiecDate = new Date(tiec.date).setHours(0, 0, 0, 0);
        const nhapDate = new Date(nhap.date).setHours(0, 0, 0, 0);
        if (nhapDate > tiecDate) {
            warnings.push({ type: 'logic_seq', message: 'Vô lý: Nhập tiệc SAU Tiệc', severity: 'error' });
        }
    }
}

export function pushExperienceWarnings(warnings, { today, currentYear, tiec, le }) {
    if (tiec) {
        const tiecTime = new Date(tiec.date).setHours(0, 0, 0, 0);
        if (tiecTime < today.getTime()) {
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

export function hasBlockingDateWarnings(warnings) {
    return warnings.some((warning) => warning.severity === 'error');
}
