import {
    detectAddressSeparatorStyle,
    normalizeAmbiguousAddressComponentSeparators,
    normalizeAddressComponentSeparators,
    normalizeAddressSeparatorSpacing,
    resolveCanonicalAddressSeparator
} from '../addressSeparatorPolicy.js';

const LETTER_RANGE = 'A-Za-z\\u00C0-\\u1EF9';

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function cleanupAddressPunctuation(value) {
    return normalizeAddressSeparatorSpacing(value)
        .replace(/[,\-.;]+$/, '');
}

export function applyAddressTitleCase(value) {
    return value.replace(new RegExp(`[${LETTER_RANGE}]+`, 'g'), (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

export function uppercaseKnownAbbreviations(value, abbreviations) {
    if (!value) {
        return value;
    }

    const keys = Object.keys(abbreviations || {}).sort((left, right) => right.length - left.length);
    if (keys.length === 0) {
        return value;
    }

    const escapedKeys = keys.map(escapeRegex).join('|');
    const pattern = new RegExp(`(^|[^${LETTER_RANGE}0-9])(${escapedKeys})(?=[\\.\\s,-]|$)`, 'gi');

    return value.replace(pattern, (match, prefix, abbr) => prefix + abbr.toUpperCase());
}

function applyCanonicalSeparator(value, options) {
    const canonicalSeparator = resolveCanonicalAddressSeparator({
        fieldKey: options.fieldKey,
        currentValue: value,
        formData: options.formData
    });
    const withAmbiguousDashesCollapsed = detectAddressSeparatorStyle(value).style === 'ambiguous'
        ? normalizeAmbiguousAddressComponentSeparators(value, canonicalSeparator)
        : value;

    return normalizeAddressComponentSeparators(withAmbiguousDashesCollapsed, canonicalSeparator);
}

export function normalizeAddressValue(value, options = {}, deps = {}) {
    if (!value || typeof value !== 'string') {
        return { value: '', applied: [] };
    }

    if (options.skipNormalize) {
        return { value, applied: [] };
    }

    const applied = [];
    const normalizeUnicode = deps.normalizeUnicode || ((raw) => raw);
    const abbreviations = deps.abbreviations || {};
    let result = normalizeUnicode(value);

    result = cleanupAddressPunctuation(result);

    const beforeTitle = result;
    result = applyAddressTitleCase(result);
    if (result !== beforeTitle) {
        applied.push('title_case');
    }

    if (options.expandAbbr !== false) {
        const beforeAbbr = result;
        result = uppercaseKnownAbbreviations(result, abbreviations);
        if (result !== beforeAbbr) {
            applied.push('uppercase_abbr');
        }
    }

    const beforeCanonicalSeparator = result;
    result = applyCanonicalSeparator(result, options);
    if (result !== beforeCanonicalSeparator) {
        applied.push('canonical_separator');
    }

    result = result.replace(/\s{2,}/g, ' ').trim();

    return { value: result, applied };
}
