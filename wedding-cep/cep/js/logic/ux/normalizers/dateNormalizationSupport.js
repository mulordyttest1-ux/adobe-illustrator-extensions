export const DATE_NORMALIZER_LIMITS = {
    day: 31,
    month: 12,
    hour: 23,
    minute: 59,
    year: 9999
};

export function smartFixDateTypo(value, maxLimit) {
    const parsed = parseInt(value, 10);

    if (!value || Number.isNaN(parsed) || parsed <= maxLimit) {
        return value;
    }

    if (value.length >= 2) {
        const lastTwo = value.slice(-2);
        const parsedLastTwo = parseInt(lastTwo, 10);
        if (parsedLastTwo <= maxLimit) {
            return String(parsedLastTwo);
        }
    }

    const lastOne = value.slice(-1);
    const parsedLastOne = parseInt(lastOne, 10);
    if (parsedLastOne <= maxLimit) {
        return String(parsedLastOne);
    }

    return value;
}

export function extractDateNumber(value, type) {
    if (!value || /^\d+$/.test(value)) {
        return value || '';
    }

    let match;
    if (type === 'day') {
        match = value.match(/(?:ng(?:\u00E0y|ay)|ng\.?)\s*(\d{1,2})/i);
    } else if (type === 'month') {
        match = value.match(/(?:th(?:\u00E1ng|ang)|th\.?)\s*(\d{1,2})/i);
    } else if (type === 'hour') {
        match = value.match(/(?:gi(?:\u1EDD|o))\s*(\d{1,2})|(\d{1,2})\s*(?:h|gi(?:\u1EDD|o))/i);
        return match ? (match[1] || match[2]) : value.match(/(\d+)/)?.[1] || value;
    } else {
        match = value.match(/(\d+)/);
    }

    return match ? match[1] : value;
}

export function padDateValue(value, type) {
    if (type === 'year' || !value || !/^\d+$/.test(value) || value.length !== 1) {
        return value;
    }

    return value.padStart(2, '0');
}

export function normalizeDateValue(value, options = {}, limits = DATE_NORMALIZER_LIMITS) {
    if (value === null || value === undefined) {
        return { value: '', applied: [] };
    }

    const type = options.type || 'day';
    const applied = [];
    let result = String(value).trim();

    result = extractDateNumber(result, type);

    if (type !== 'year') {
        const limit = limits[type] || DATE_NORMALIZER_LIMITS.day;
        const fixed = smartFixDateTypo(result, limit);
        if (fixed !== result) {
            result = fixed;
            applied.push('smart_typo_fix');
        }
    }

    const padded = padDateValue(result, type);
    if (padded !== result) {
        result = padded;
        applied.push('pad_zero');
    }

    return { value: result, applied };
}
