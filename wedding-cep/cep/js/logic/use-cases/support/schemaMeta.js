function buildDerivedLabel(baseLabel, derivedLabel, isDateType) {
    if (!derivedLabel) {
        return baseLabel;
    }

    if (isDateType) {
        return derivedLabel;
    }

    return `${baseLabel} - ${derivedLabel}`;
}

const GROUP_LABEL_RULES = [
    { match: (key) => key === 'date.tiec' || key.startsWith('date.tiec.'), value: (item) => item.label || 'Ngay Tiec' },
    { match: (key) => key === 'date.le' || key.startsWith('date.le.'), value: (item) => item.label || 'Ngay Le' },
    { match: (key) => key === 'date.nhap' || key.startsWith('date.nhap.'), value: (item) => item.label || 'Ngay Nhap' },
    { match: (key) => key.startsWith('info.'), value: () => '\u0054h\u00f4ng tin' },
    { match: (key) => key.startsWith('pos1.') || key.startsWith('pos2.'), value: () => '\u0047ia \u0111\u00ecnh' },
    { match: (key) => key.startsWith('ceremony.') || key.startsWith('venue.'), value: () => '\u0110\u1ecba \u0111i\u1ec3m' }
];

function resolveGroupLabel(baseKey, item = {}) {
    for (const rule of GROUP_LABEL_RULES) {
        if (rule.match(baseKey)) {
            return rule.value(item);
        }
    }

    return item.label || baseKey;
}

function createSuffixMap(items = []) {
    return items.reduce((acc, item) => {
        if (!item || !item.suffix) return acc;
        acc[item.suffix] = item.desc || item.suffix.replace(/^\./, '');
        return acc;
    }, {});
}

function createState() {
    return {
        schemaKeys: [],
        schemaKeySet: new Set(),
        labelsByKey: {},
        groupByKey: {},
        groupRankByKey: {},
        keyRankByKey: {},
        derivedSuffixLabels: {}
    };
}

function addEntry(state, entry = {}) {
    const {
        key,
        label,
        groupLabel,
        groupRank,
        keyRank
    } = entry;
    if (!key) return;

    if (!state.schemaKeySet.has(key)) {
        state.schemaKeySet.add(key);
        state.schemaKeys.push(key);
    }

    if (!Object.prototype.hasOwnProperty.call(state.labelsByKey, key)) {
        state.labelsByKey[key] = label || key;
    }

    if (!Object.prototype.hasOwnProperty.call(state.groupByKey, key)) {
        state.groupByKey[key] = groupLabel || key;
    }

    if (!Object.prototype.hasOwnProperty.call(state.groupRankByKey, key)) {
        state.groupRankByKey[key] = groupRank;
    }

    if (!Object.prototype.hasOwnProperty.call(state.keyRankByKey, key)) {
        state.keyRankByKey[key] = keyRank;
    }
}

export function extractSchemaMeta(schema = null) {
    if (!schema || !Array.isArray(schema.STRUCTURE)) {
        return {
            schemaKeys: [],
            labelsByKey: {},
            groupByKey: {},
            groupRankByKey: {},
            keyRankByKey: {},
            derivedSuffixLabels: {}
        };
    }

    const nameSuffixLabels = createSuffixMap(schema.DERIVED?.NAME || []);
    const dateSuffixLabels = createSuffixMap(schema.DERIVED?.DATE || []);
    const state = createState();
    let groupRank = 0;
    let keyRank = 0;

    state.derivedSuffixLabels = {
        ...nameSuffixLabels,
        ...dateSuffixLabels
    };

    schema.STRUCTURE.forEach((group) => {
        const prefix = group.prefix || '';

        (group.items || []).forEach((item) => {
            const baseKey = prefix ? `${prefix}.${item.key}` : item.key;
            const baseLabel = item.label || baseKey;
            const groupLabel = resolveGroupLabel(baseKey, item);
            const isNameType = item.type === 'person_name' || item.type === 'name';
            const isDateType = item.type === 'date' || item.type === 'solar_date';

            addEntry(state, { key: baseKey, label: baseLabel, groupLabel, groupRank, keyRank });
            keyRank += 1;

            if (isNameType) {
                Object.entries(nameSuffixLabels).forEach(([suffix, derivedLabel]) => {
                    addEntry(state, {
                        key: baseKey + suffix,
                        label: buildDerivedLabel(baseLabel, derivedLabel, false),
                        groupLabel,
                        groupRank,
                        keyRank
                    });
                    keyRank += 1;
                });
            }

            if (isDateType) {
                Object.entries(dateSuffixLabels).forEach(([suffix, derivedLabel]) => {
                    addEntry(state, {
                        key: baseKey + suffix,
                        label: buildDerivedLabel(baseLabel, derivedLabel, true),
                        groupLabel,
                        groupRank,
                        keyRank
                    });
                    keyRank += 1;
                });
            }

            groupRank += 1;
        });
    });

    return {
        schemaKeys: state.schemaKeys,
        labelsByKey: state.labelsByKey,
        groupByKey: state.groupByKey,
        groupRankByKey: state.groupRankByKey,
        keyRankByKey: state.keyRankByKey,
        derivedSuffixLabels: state.derivedSuffixLabels
    };
}
