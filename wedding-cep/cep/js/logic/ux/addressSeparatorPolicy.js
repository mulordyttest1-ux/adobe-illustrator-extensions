export const POS1_ADDRESS_KEY = 'pos1.diachi';
export const DEFAULT_ADDRESS_SEPARATOR = ', ';
export const DASH_ADDRESS_SEPARATOR = ' - ';

const LETTER_PATTERN = /[A-Za-z\u00C0-\u1EF9]/;
const DIGIT_PATTERN = /\d/;

function isInlineWhitespace(char) {
    return char === ' ' || char === '\t';
}

function isLetter(char) {
    return LETTER_PATTERN.test(char || '');
}

function isDigit(char) {
    return DIGIT_PATTERN.test(char || '');
}

function isAlphanumericToken(token) {
    return /[A-Za-z]/.test(token || '') && /\d/.test(token || '');
}

function isTokenBoundary(char) {
    return !char || char === ' ' || char === '\t' || char === ',' || char === '\n' || char === '\r' || char === ';';
}

function findPreviousNonSpaceIndex(value, index) {
    let cursor = index;

    while (cursor >= 0 && isInlineWhitespace(value.charAt(cursor))) {
        cursor -= 1;
    }

    return cursor;
}

function findTokenStart(value, index) {
    let cursor = index;

    while (cursor >= 0 && !isTokenBoundary(value.charAt(cursor))) {
        cursor -= 1;
    }

    return cursor + 1;
}

function findTokenEnd(value, index) {
    let cursor = index;

    while (cursor < value.length && !isTokenBoundary(value.charAt(cursor))) {
        cursor += 1;
    }

    return cursor;
}

function findSegmentStart(value, index) {
    let cursor = index;

    while (cursor >= 0) {
        const char = value.charAt(cursor);
        if (char === ',' || char === '\n' || char === '\r' || char === ';') {
            return cursor + 1;
        }
        cursor -= 1;
    }

    return 0;
}

function hasComponentDashContext(value, dashIndex, start, end) {
    const nextChar = value.charAt(end);
    if (!isLetter(nextChar)) {
        return false;
    }

    const prevIndex = findPreviousNonSpaceIndex(value, start - 1);
    if (prevIndex < 0) {
        return false;
    }

    const leftToken = value.slice(findTokenStart(value, start - 1), start).trim();
    const rightToken = value.slice(end, findTokenEnd(value, end)).trim();
    const hasInlineWhitespace = start !== dashIndex || end !== dashIndex + 1;
    const leftFragment = value.slice(findSegmentStart(value, prevIndex), prevIndex + 1);

    if (!hasInlineWhitespace && isAlphanumericToken(leftToken) && isAlphanumericToken(rightToken)) {
        return false;
    }

    return hasInlineWhitespace || isDigit(value.charAt(prevIndex)) || /\s/.test(leftFragment);
}

function getComponentDashSpan(value, dashIndex) {
    let start = dashIndex;
    let end = dashIndex + 1;

    while (start > 0 && isInlineWhitespace(value.charAt(start - 1))) {
        start -= 1;
    }

    while (end < value.length && isInlineWhitespace(value.charAt(end))) {
        end += 1;
    }

    if (!hasComponentDashContext(value, dashIndex, start, end)) {
        return null;
    }

    return {
        type: 'dash',
        start,
        end,
        separator: DASH_ADDRESS_SEPARATOR
    };
}

function canNormalizeLooseDash(leftToken, rightToken) {
    if (!leftToken || !rightToken) {
        return false;
    }

    if (!isLetter(rightToken.charAt(0))) {
        return false;
    }

    if (/^\d+$/.test(leftToken) && /^\d/.test(rightToken)) {
        return false;
    }

    if (isAlphanumericToken(leftToken) && isAlphanumericToken(rightToken)) {
        return false;
    }

    return (leftToken.length >= 2 && rightToken.length >= 2)
        || (/\d/.test(leftToken) && rightToken.length >= 2);
}

function getLooseDashSpan(value, dashIndex) {
    let start = dashIndex;
    let end = dashIndex + 1;

    while (start > 0 && isInlineWhitespace(value.charAt(start - 1))) {
        start -= 1;
    }

    while (end < value.length && isInlineWhitespace(value.charAt(end))) {
        end += 1;
    }

    const leftToken = value.slice(findTokenStart(value, start - 1), start).trim();
    const rightToken = value.slice(end, findTokenEnd(value, end)).trim();

    if (!canNormalizeLooseDash(leftToken, rightToken)) {
        return null;
    }

    return {
        type: 'dash',
        start,
        end,
        separator: DASH_ADDRESS_SEPARATOR
    };
}

export function findAddressComponentSeparators(value) {
    if (!value || typeof value !== 'string') {
        return [];
    }

    const separators = [];

    for (let index = 0; index < value.length; index += 1) {
        const char = value.charAt(index);

        if (char === ',') {
            let end = index + 1;
            while (end < value.length && isInlineWhitespace(value.charAt(end))) {
                end += 1;
            }

            separators.push({
                type: 'comma',
                start: index,
                end,
                separator: DEFAULT_ADDRESS_SEPARATOR
            });
            index = end - 1;
            continue;
        }

        if (char === '-') {
            const dashSpan = getComponentDashSpan(value, index);
            if (dashSpan) {
                separators.push(dashSpan);
                index = dashSpan.end - 1;
            }
        }
    }

    return separators;
}

export function splitAddressComponents(value) {
    if (!value || typeof value !== 'string') {
        return [];
    }

    const separators = findAddressComponentSeparators(value);
    if (separators.length === 0) {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }

    const components = [];
    let cursor = 0;

    separators.forEach((separator) => {
        const component = value.slice(cursor, separator.start).trim();
        if (component) {
            components.push(component);
        }
        cursor = separator.end;
    });

    const tail = value.slice(cursor).trim();
    if (tail) {
        components.push(tail);
    }

    return components;
}

export function normalizeAddressSeparatorSpacing(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const collapsed = value.replace(/,{2,}/g, ',');
    const separators = findAddressComponentSeparators(collapsed);
    if (separators.length === 0) {
        return collapsed;
    }

    let result = '';
    let cursor = 0;

    separators.forEach((separator) => {
        result += collapsed.slice(cursor, separator.start).trimEnd();
        result += separator.separator;
        cursor = separator.end;
    });

    result += collapsed.slice(cursor).trimStart();
    return result;
}

export function normalizeAmbiguousAddressComponentSeparators(value, separator = DEFAULT_ADDRESS_SEPARATOR) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    let result = '';
    let cursor = 0;
    let mutated = false;

    for (let index = 0; index < value.length; index += 1) {
        if (value.charAt(index) !== '-') {
            continue;
        }

        const looseDashSpan = getLooseDashSpan(value, index);
        if (!looseDashSpan) {
            continue;
        }

        result += value.slice(cursor, looseDashSpan.start).trimEnd();
        result += separator;
        cursor = looseDashSpan.end;
        index = looseDashSpan.end - 1;
        mutated = true;
    }

    if (!mutated) {
        return value;
    }

    result += value.slice(cursor).trimStart();
    return result;
}

export function normalizeAddressComponentSeparators(value, separator = DEFAULT_ADDRESS_SEPARATOR) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const components = splitAddressComponents(value);
    if (components.length < 2) {
        return value;
    }

    return components.join(separator);
}

function resolveSeparatorStyle(hasComma, hasDash, hasLooseDash, hasLooseComma) {
    if (hasComma && hasDash) {
        return 'mixed';
    }
    if (hasDash) {
        return 'dash';
    }
    if (hasComma) {
        return 'comma';
    }
    if (hasLooseDash || hasLooseComma) {
        return 'ambiguous';
    }

    return 'none';
}

export function detectAddressSeparatorStyle(value) {
    const rawValue = typeof value === 'string' ? value : '';
    const separators = findAddressComponentSeparators(rawValue);
    const hasComma = separators.some((separator) => separator.type === 'comma');
    const hasDash = separators.some((separator) => separator.type === 'dash');
    const hasLooseDash = rawValue.includes('-') && !hasDash;
    const hasLooseComma = rawValue.includes(',') && !hasComma;
    const style = resolveSeparatorStyle(hasComma, hasDash, hasLooseDash, hasLooseComma);

    return {
        style,
        separators,
        hasComma,
        hasDash,
        isClear: style === 'comma' || style === 'dash',
        separator: style === 'dash'
            ? DASH_ADDRESS_SEPARATOR
            : style === 'comma'
                ? DEFAULT_ADDRESS_SEPARATOR
                : null
    };
}

export function resolveCanonicalAddressSeparator(options = {}) {
    const fieldKey = options.fieldKey || '';
    const formData = options.formData || {};
    const fallbackSeparator = options.fallbackSeparator || DEFAULT_ADDRESS_SEPARATOR;
    const pos1Value = typeof formData[POS1_ADDRESS_KEY] === 'string' && formData[POS1_ADDRESS_KEY].trim()
        ? formData[POS1_ADDRESS_KEY]
        : fieldKey === POS1_ADDRESS_KEY
            ? options.currentValue || ''
            : '';
    const profile = detectAddressSeparatorStyle(pos1Value);

    if (profile.style === 'dash') {
        return DASH_ADDRESS_SEPARATOR;
    }
    if (profile.style === 'comma') {
        return DEFAULT_ADDRESS_SEPARATOR;
    }

    return fallbackSeparator;
}

export function getAddressSeparatorLabel(separator) {
    return separator === DASH_ADDRESS_SEPARATOR
        ? 'dau gach ngang (-)'
        : 'dau phay (,)';
}
