import { UnicodeNormalizer } from '../core/UnicodeNormalizer.js';
import { CatholicSaintNames } from '@wedding/domain';
import { extractLeadingSurname } from './surnameLibrary.js';

const FAMILY_TITLE_KEYS = new Set(['ong', 'ba', 'anh', 'chi', 'co', 'chu', 'bac', 'cha', 'thay']);

export function runNameRules(rules, context) {
    const warnings = [];

    Object.keys(rules).forEach((ruleKey) => {
        const result = rules[ruleKey](context);
        if (Array.isArray(result)) {
            warnings.push(...result);
            return;
        }
        if (result) {
            warnings.push(result);
        }
    });

    return warnings;
}

export function hasBlockingNameWarnings(warnings) {
    return warnings.some((warning) => warning.severity === 'error');
}

export function fallbackEthnicDetection(name, ethnicPattern) {
    const cleanName = UnicodeNormalizer.removeDiacritics(name || '');
    return ethnicPattern.test(cleanName);
}

export function normalizeSurnameToken(trimmed) {
    const info = extractLeadingSurname(trimmed);
    if (!info) {
        return {
            surname: '',
            normalized: '',
            known: false
        };
    }

    return {
        surname: info.surname,
        normalized: info.normalized,
        known: info.known
    };
}

export function parseFamilyNameField(fieldKey) {
    const match = /^pos([12])\.(ong|ba|con_full)$/.exec(fieldKey || '');
    if (!match) return null;

    return {
        side: `pos${match[1]}`,
        role: match[2]
    };
}

export function getOrdinaryNameForSurname(value) {
    const trimmed = stripLeadingFamilyTitle(String(value || '').trim());
    if (!trimmed) return '';

    const normalized = CatholicSaintNames.normalizeFullName(trimmed);
    return normalized.saint ? normalized.ordinaryName : trimmed;
}

export function stripLeadingFamilyTitle(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 3) return String(value || '').trim();

    const firstKey = UnicodeNormalizer.removeDiacritics(words[0])
        .replace(/[ĐđÐð]/g, 'd')
        .toLowerCase();
    return FAMILY_TITLE_KEYS.has(firstKey) ? words.slice(1).join(' ') : String(value || '').trim();
}

export function getSurnameInfoForName(value) {
    return extractLeadingSurname(getOrdinaryNameForSurname(value));
}

function createFamilyFieldKeys(side) {
    return {
        father: `${side}.ong`,
        mother: `${side}.ba`,
        child: `${side}.con_full`
    };
}

function resolveFamilyValues({ fieldKey, formData, currentValue, side }) {
    const keys = createFamilyFieldKeys(side);
    return {
        father: fieldKey === keys.father ? currentValue : formData[keys.father],
        mother: fieldKey === keys.mother ? currentValue : formData[keys.mother],
        child: fieldKey === keys.child ? currentValue : formData[keys.child]
    };
}

function getOrdinaryFamilyNames(values) {
    return {
        father: getOrdinaryNameForSurname(values.father),
        mother: getOrdinaryNameForSurname(values.mother),
        child: getOrdinaryNameForSurname(values.child)
    };
}

function hasComparableFamilyNames(ordinary) {
    return Boolean(ordinary.child && ordinary.father && ordinary.mother);
}

function hasEthnicFamilyName(ordinary, validator) {
    if (!validator?.isEthnicName) return false;
    return [ordinary.father, ordinary.mother, ordinary.child]
        .filter(Boolean)
        .some((name) => validator.isEthnicName(name));
}

function getFamilySurnameSet(values) {
    return {
        childSurname: getSurnameInfoForName(values.child),
        parentSurnames: [values.father, values.mother]
            .map((value) => getSurnameInfoForName(value))
            .filter(Boolean)
    };
}

function hasFamilySurnameMismatch(childSurname, parentSurnames) {
    if (!childSurname || parentSurnames.length === 0) return false;
    return !parentSurnames.some((parentSurname) => parentSurname.normalized === childSurname.normalized);
}

function buildFamilySurnameWarning(childSurname, parentSurnames) {
    const parentText = parentSurnames.map((parentSurname) => `"${parentSurname.surname}"`).join(' / ');
    return {
        type: 'family_surname_mismatch',
        message: `Họ con "${childSurname.surname}" khác họ cha/mẹ (${parentText})?`,
        severity: 'info'
    };
}

export function createFamilySurnameWarning({ fieldKey, formData = {}, currentValue, validator }) {
    const parsed = parseFamilyNameField(fieldKey);
    if (!parsed) return null;

    const values = resolveFamilyValues({
        fieldKey,
        formData,
        currentValue,
        side: parsed.side
    });
    const ordinary = getOrdinaryFamilyNames(values);

    if (!hasComparableFamilyNames(ordinary)) return null;
    if (hasEthnicFamilyName(ordinary, validator)) return null;

    const { childSurname, parentSurnames } = getFamilySurnameSet(values);
    if (!hasFamilySurnameMismatch(childSurname, parentSurnames)) return null;

    return buildFamilySurnameWarning(childSurname, parentSurnames);
}

export function shouldBypassPhoneticWord(word, isEthnic, wordBypassRegex) {
    if (word.includes('.') || word.length < 2 || /\d/.test(word)) {
        return true;
    }

    if (isEthnic) {
        return true;
    }

    const cleanWord = UnicodeNormalizer.removeDiacritics(word);
    return wordBypassRegex.test(cleanWord);
}
