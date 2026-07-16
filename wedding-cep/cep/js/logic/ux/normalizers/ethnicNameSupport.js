export function createSpecialCharCache(specialChars) {
    if (!specialChars || typeof specialChars !== 'object') {
        return {
            regex: null,
            map: null
        };
    }

    const chars = Object.keys(specialChars);
    if (!chars.length) {
        return {
            regex: null,
            map: specialChars
        };
    }

    const escaped = chars.map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return {
        regex: new RegExp(escaped.join('|'), 'g'),
        map: specialChars
    };
}

export function createLowercaseSet(values, { trim = false } = {}) {
    if (!Array.isArray(values) || !values.length) {
        return null;
    }

    return new Set(values.map((value) => {
        const normalized = trim ? String(value).trim() : String(value);
        return normalized.toLowerCase();
    }));
}

export function extractKinshipPrefix(name) {
    if (!name || !name.includes('(')) {
        return null;
    }

    const kinshipMatch = name.match(/\(([^)]+)\)/);
    if (!kinshipMatch) {
        return null;
    }

    return kinshipMatch[1].split(/\s+/)[0].toLowerCase();
}

export function hasEthnicPrefix(normalized, data, genderPrefixSet, kinshipPrefixSet) {
    if (!normalized || !data) {
        return false;
    }

    const words = normalized.split(/\s+/);
    const lower = normalized.toLowerCase();
    const firstWord = words[0].toLowerCase();

    if (data.prefixes && data.prefixes.some((prefix) => lower.startsWith(prefix.toLowerCase()))) {
        return true;
    }

    return Boolean(genderPrefixSet?.has(firstWord) || kinshipPrefixSet?.has(firstWord));
}

export function hasEthnicSurname(normalized, surnamesFirstSet, surnamesLastSet) {
    const words = normalized.split(/\s+/);
    if (words.length < 2) {
        return false;
    }

    const lastWord = words[words.length - 1].toLowerCase();
    const firstWord = words[0].toLowerCase();

    if (surnamesLastSet?.has(lastWord) || surnamesFirstSet?.has(firstWord)) {
        return true;
    }

    if (words.length < 2) {
        return false;
    }

    const firstTwo = `${words[0]} ${words[1]}`.toLowerCase();
    const lastTwo = `${words[words.length - 2]} ${words[words.length - 1]}`.toLowerCase();

    return Boolean(surnamesFirstSet?.has(firstTwo) || surnamesLastSet?.has(lastTwo));
}

export function isStandalonePrefixWord(word, data, genderPrefixSet) {
    const lower = word.toLowerCase();
    const isSingleLetter = word.length === 1 &&
        data?.prefixes &&
        data.prefixes.some((prefix) => prefix.charAt(0).toLowerCase() === lower);
    const isGenderPrefix = genderPrefixSet?.has(lower);
    return Boolean(isSingleLetter || isGenderPrefix);
}
