const DEFAULT_MARKER = '\u200B';
const METADATA_TYPE = 'stateful';

function findNextMarkerRun(content, marker, fromIndex) {
    const start = content.indexOf(marker, fromIndex);
    if (start < 0) return null;

    let end = start;
    while (content.startsWith(marker, end)) {
        end += marker.length;
    }

    return {
        start,
        end,
        length: (end - start) / marker.length
    };
}

function shouldTreatRunAsEmptyValue(content, run) {
    if (run.length !== 2) return false;
    if (run.end >= content.length) return true;

    const nextChar = content.charAt(run.end);
    return !/[0-9A-Za-zÀ-ỹ]/.test(nextChar);
}

export const StatefulMarkerCodec = {
    MARKER: DEFAULT_MARKER,
    METADATA_TYPE,

    createMetadata(keys = []) {
        return {
            type: METADATA_TYPE,
            keys: Array.isArray(keys) ? [...keys] : [],
            mappings: []
        };
    },

    getMetadataKeys(meta) {
        if (!meta || meta.type !== METADATA_TYPE) return [];
        if (Array.isArray(meta.keys)) return [...meta.keys];
        if (!Array.isArray(meta.mappings)) return [];
        return meta.mappings
            .map(mapping => mapping?.key)
            .filter(key => typeof key === 'string' && key);
    },

    sanitizeValue(value, marker = DEFAULT_MARKER) {
        let text = value === null || value === undefined ? '' : String(value);
        text = text.split(DEFAULT_MARKER).join('');
        if (marker && marker !== DEFAULT_MARKER) {
            text = text.split(marker).join('');
        }
        return text;
    },

    wrap(value, marker = DEFAULT_MARKER) {
        return marker + this.sanitizeValue(value, marker) + marker;
    },

    extractValues(content, marker = DEFAULT_MARKER) {
        return this.extractMatches(content, marker).map(match => match.inner);
    },

    extractValuesForKeys(content, keys = [], marker = DEFAULT_MARKER) {
        const values = this.extractValues(content, marker);
        if (values.length === 0 && Array.isArray(keys) && keys.length === 1) {
            return [this.sanitizeValue(content, marker)];
        }
        return values;
    },

    extractMatches(content, marker = DEFAULT_MARKER) {
        const matches = [];
        if (!content || typeof content !== 'string' || !marker) return matches;

        let index = 0;
        let matchStart = -1;
        let innerStart = -1;

        while (index < content.length) {
            const run = findNextMarkerRun(content, marker, index);
            if (!run) break;

            if (matchStart < 0) {
                if (shouldTreatRunAsEmptyValue(content, run)) {
                    matches.push({ start: run.start, end: run.end, inner: '' });
                    index = run.end;
                    continue;
                }

                if (run.end >= content.length) {
                    break;
                }

                matchStart = run.start;
                innerStart = run.end;
                index = run.end;
                continue;
            }

            const inner = content.slice(innerStart, run.start);
            if (run.end >= content.length) {
                matches.push({ start: matchStart, end: run.end, inner });
                break;
            }

            if (run.length >= 2) {
                const split = run.start + marker.length;
                matches.push({ start: matchStart, end: split, inner });
                matchStart = split;
                innerStart = run.end;
                index = run.end;
                continue;
            }

            matches.push({ start: matchStart, end: run.end, inner });
            matchStart = -1;
            innerStart = -1;
            index = run.end;
        }

        return matches;
    }
};
