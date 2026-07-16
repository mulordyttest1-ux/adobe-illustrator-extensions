import { CatholicSaintNames } from '@wedding/domain';

const FULL_PERSON_NAME_SEGMENTS = new Set(['ong', 'ba', 'con_full', 'ho_ten']);

export function isFullPersonNameKey(key) {
    if (!key || typeof key !== 'string') return false;
    const parts = key.split('.');
    const last = parts[parts.length - 1];
    return FULL_PERSON_NAME_SEGMENTS.has(last);
}

export function normalizeStyledValueForKey(key, value) {
    const text = value === null || value === undefined ? '' : String(value);
    if (!isFullPersonNameKey(key)) return text;
    return text;
}

export function createReplacementStyles(key, value, offset = 0) {
    if (!isFullPersonNameKey(key)) return [];
    return CatholicSaintNames.getSuperscriptRanges(value, offset);
}

export function createFullResetRange(start, end) {
    if (end <= start) return [];
    return [{
        start,
        end,
        baseline: 'normal'
    }];
}

export function createAbsoluteStylesForMarkerMatch(key, value, match, marker) {
    if (!match || !isFullPersonNameKey(key)) {
        return { resetRanges: [], styleRanges: [] };
    }

    const markerLength = marker ? marker.length : 0;
    const innerStart = match.start + markerLength;
    const innerEnd = Math.max(innerStart, match.end - markerLength);

    return {
        resetRanges: createFullResetRange(innerStart, innerEnd),
        styleRanges: createReplacementStyles(key, value, innerStart)
    };
}

export function hasStyleOperations({ resetRanges = [], styleRanges = [] } = {}) {
    return resetRanges.length > 0 || styleRanges.length > 0;
}
