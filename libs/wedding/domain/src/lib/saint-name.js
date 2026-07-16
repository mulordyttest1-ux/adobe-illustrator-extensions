import { StringUtils } from './string.js';

const SEPARATOR_PATTERN = /[\s._-]+/g;
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

function saint(canonical, aliases = []) {
    return Object.freeze({ canonical, aliases });
}

const SAINT_NAME_ENTRIES = Object.freeze([
    saint('Alphongsô', ['Alfonso', 'Alphonso']),
    saint('Aloisiô', ['Aloysius', 'Louis Gonzaga', 'Lu-y Gonzaga', 'Luy Gonzaga']),
    saint('Anrê', ['Andre', 'Andrew']),
    saint('Antôn', ['Anton', 'Antonio', 'Anthony']),
    saint('Augustinô', ['Augustino', 'Augustine']),
    saint('Basilio', ['Basiliô', 'Basil']),
    saint('Ba-tô-lô-mê-ô', ['Batolomeo', 'Bartolomeo', 'Bartholomew']),
    saint('Bênađô', ['Bernard', 'Bernardo']),
    saint('Benedictô', ['Benedict', 'Benedicto']),
    saint('Carlo Acutis', ['Carlos Acutis']),
    saint('Claret'),
    saint('Đa-Minh Saviô', ['Daminh Savio', 'Dominic Savio', 'Dominique Savio']),
    saint('Đa-Minh', ['Daminh', 'Dominic', 'Dominique', 'Domingo']),
    saint('Emmanuel', ['Emanuel', 'Immanuel']),
    saint('Giacôbê', ['Giacobe', 'Jacob', 'James']),
    saint('Giêrađô', ['Gerard', 'Gerardo']),
    saint('Gioakim', ['Joachim']),
    saint('Gioan Bosco', ['Don Bosco', 'John Bosco']),
    saint('Gioan Baotixita', ['Gioan Bao Tixita', 'Gioan Baotista', 'Gioan Batista', 'John Baptist', 'John the Baptist']),
    saint('Gioan', ['Jean', 'John', 'Juan']),
    saint('Gioan Phaolô', ['Gioan Phaolo', 'John Paul']),
    saint('Giuse', ['Giu-se', 'Jose', 'Joseph']),
    saint('Gregorio', ['Gregoriô', 'Gregory']),
    saint('Henricô', ['Henrico', 'Henry']),
    saint('Inhaxiô', ['Ignatio', 'Ignatius', 'Inhaxio']),
    saint('Lôrensô', ['Laurence', 'Lawrence', 'Lorenso']),
    saint('Luca', ['Lucas', 'Luke']),
    saint('Matthêu', ['Matteo', 'Mattheu', 'Matthew']),
    saint('Martinô', ['Martin', 'Martino']),
    saint('Micae', ['Micael', 'Michael']),
    saint('Maximilianô Kolbe', [
        'Maximiliano Kolbe',
        'Maximilian Kolbe',
        'Maximilianô Kolbê',
        'Maximilianô Maria Kolbe',
        'Maximilianô Maria Kolbê',
        'Maximilian Maria Kolbe',
        'Maksymilian Kolbe'
    ]),
    saint('Nicôla', ['Nicholas', 'Nicola']),
    saint('Phanxicô Xaviê', [
        'Francis Xavier',
        'Francois Xavier',
        'Phan-xi-cô Xa-vi-ê',
        'Phan xi co Xa vi e',
        'Phanxico Xavie'
    ]),
    saint('Phanxicô', ['Francis', 'Francois', 'Phanxico']),
    saint('Phaolô', ['Paul', 'Paulo', 'Phaolo']),
    saint('Phêrô', ['Pedro', 'Peter', 'Phero']),
    saint('Philipphê', ['Philip', 'Philippe', 'Philipphe']),
    saint('Piô', ['Pio']),
    saint('Simon', ['Simeon']),
    saint('Stêphanô', ['Stefano', 'Stephano', 'Stephen', 'Steven', 'Tephano', 'Têphanô']),
    saint('Tôma', ['Thomas', 'Toma']),
    saint('Vincentê', ['Vincent', 'Vincente']),
    saint('Vinh Sơn', ['Vinh Son']),
    saint('Agata', ['Agatha']),
    saint('Anatasia', ['Anastasia']),
    saint('Anê', ['Agnes', 'Ane']),
    saint('Anna', ['Ana', 'Anne']),
    saint('Catarina', ['Caterina']),
    saint('Catherine', ['Catharine', 'Katharine', 'Katherine']),
    saint('Cecilia', ['Cêcilia', 'Cecily']),
    saint('Clara', ['Claire']),
    saint('Faustina'),
    saint('Gianna'),
    saint('Helena', ['Helen']),
    saint('Inê', ['Ine', 'Ines']),
    saint('Isave', ['Elizabeth', 'Isabel', 'Isabelle']),
    saint('Katarina', ['Katerina', 'Katarine']),
    saint('Mácta', ['Marta', 'Martha', 'Matta']),
    saint('Maria Madalena', ['Mary Magdalene']),
    saint('Maria Goretti'),
    saint('Maria', ['Marie']),
    saint('Mary'),
    saint('Lucia', ['Luci', 'Lucy']),
    saint('Monica', ['Mônica']),
    saint('Rosa', ['Rose']),
    saint('Tê-Rê-Xa Calcutta', ['Mother Teresa', 'Teresa Calcutta', 'Teresa of Calcutta']),
    saint('Tê-Rê-Xa Hài Đồng Giêsu', [
        'Teresa Hai Dong Giesu',
        'Têrêsa Hài Đồng',
        'Têrêsa Hài Đồng Giêsu'
    ]),
    saint('Tê-Rê-Xa', ['Teresa', 'Theresa', 'Therese', 'Terexa', 'Tereza', 'Tê-Rê-Sa'])
]);

function normalizeLookupToken(value) {
    return StringUtils.toNFC(value || '')
        .normalize('NFD')
        .replace(DIACRITIC_PATTERN, '')
        .replace(/[\u0110\u0111\u00d0\u00f0]/g, 'd')
        .replace(SEPARATOR_PATTERN, '')
        .toLowerCase();
}

function buildAliasMap(entries = SAINT_NAME_ENTRIES) {
    const map = new Map();

    entries.forEach((entry) => {
        const tokens = [entry.canonical, ...(entry.aliases || [])];
        tokens.forEach((alias) => {
            const lookup = normalizeLookupToken(alias);
            if (lookup && !map.has(lookup)) {
                map.set(lookup, entry);
            }
        });
    });

    return map;
}

const DEFAULT_ALIAS_MAP = buildAliasMap();

function normalizeText(value) {
    return StringUtils.toNFC(value || '');
}

function getWordRanges(value) {
    const ranges = [];
    const scanner = /\S+/g;
    let match = scanner.exec(value);

    while (match) {
        ranges.push({
            start: match.index,
            end: match.index + match[0].length
        });
        match = scanner.exec(value);
    }

    return ranges;
}

function findPrefixMatch(value, aliasMap = DEFAULT_ALIAS_MAP) {
    const ranges = getWordRanges(value);

    for (let count = ranges.length; count >= 1; count--) {
        const start = ranges[0].start;
        const end = ranges[count - 1].end;
        const candidate = value.slice(start, end);
        const entry = aliasMap.get(normalizeLookupToken(candidate));

        if (entry) {
            return {
                canonical: entry.canonical,
                raw: candidate,
                start,
                end,
                rest: value.slice(end).trim()
            };
        }
    }

    return null;
}

export const CatholicSaintNames = {
    entries: SAINT_NAME_ENTRIES,
    normalizeLookupToken,

    detectPrefix(value) {
        const normalized = normalizeText(value);
        if (!normalized.trim()) return null;
        return findPrefixMatch(normalized);
    },

    normalizeFullName(value) {
        const normalized = normalizeText(value);
        if (!normalized.trim()) {
            return {
                value: '',
                saint: null,
                ordinaryName: '',
                changed: normalized !== value
            };
        }

        const match = findPrefixMatch(normalized);
        if (!match) {
            return {
                value: normalized,
                saint: null,
                ordinaryName: normalized,
                changed: normalized !== value
            };
        }

        return {
            value: normalized,
            saint: {
                canonical: match.canonical,
                start: match.start,
                end: match.end,
                raw: match.raw
            },
            ordinaryName: match.rest,
            changed: normalized !== value
        };
    },

    getSuperscriptRanges(value, offset = 0) {
        const match = this.detectPrefix(value);
        if (!match) return [];

        return [{
            start: offset + match.start,
            end: offset + match.end,
            baseline: 'superscript'
        }];
    }
};
