const MIN_SUPPORTED_YEAR = 1800;
const MAX_SUPPORTED_YEAR = 2199;

function parseInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function getTodayParts(today) {
    const date = today instanceof Date && !Number.isNaN(today.getTime())
        ? today
        : new Date();

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };
}

function isValidMonthDay(day, month, year) {
    if (
        year < MIN_SUPPORTED_YEAR
        || year > MAX_SUPPORTED_YEAR
        || month < 1
        || month > 12
        || day < 1
    ) {
        return false;
    }

    const candidate = new Date(year, month, 0);
    return day <= candidate.getDate();
}

function compareMonthDay(day, month, today) {
    const todayParts = getTodayParts(today);
    if (month !== todayParts.month) {
        return month - todayParts.month;
    }
    return day - todayParts.day;
}

export const SmartYearResolver = Object.freeze({
    resolveSolarYear(day, month, options = {}) {
        const parsedDay = parseInteger(day);
        const parsedMonth = parseInteger(month);
        const today = getTodayParts(options.today);

        if (parsedDay === null || parsedMonth === null) {
            return null;
        }

        const baseYear = Math.min(
            MAX_SUPPORTED_YEAR,
            Math.max(MIN_SUPPORTED_YEAR, today.year)
        );

        for (let year = baseYear; year <= MAX_SUPPORTED_YEAR; year += 1) {
            const isCurrentYear = year === baseYear;
            if (
                isValidMonthDay(parsedDay, parsedMonth, year)
                && (!isCurrentYear
                    || compareMonthDay(parsedDay, parsedMonth, options.today) >= 0)
            ) {
                return year;
            }
        }

        return null;
    }
});
