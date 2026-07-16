const PREF_KEY = 'imposition_job_save_targets_v1';

export function normalizeJobDocumentPath(path = '') {
    return String(path || '')
        .trim()
        .replace(/^file:\/\/\//i, '')
        .replace(/^file:\/\//i, '')
        .replace(/\\/g, '/')
        .toLowerCase();
}

export function buildJobSaveTargetKey(presetId, documentPath) {
    const safePresetId = String(presetId || '').trim();
    const normalizedDocumentPath = normalizeJobDocumentPath(documentPath);

    if (!safePresetId || !normalizedDocumentPath) {
        return '';
    }

    return `${safePresetId}::${normalizedDocumentPath}`;
}

// eslint-disable-next-line complexity
function normalizeJobSaveTargetEntry(entry = {}, fallbackKey = '') {
    const presetId = String(entry.presetId || '').trim();
    const targetPath = String(entry.targetPath || '').trim();
    const documentPath = String(entry.documentPath || targetPath || '').trim();
    const jobKey = buildJobSaveTargetKey(presetId, documentPath);

    if (!jobKey || !targetPath) {
        return null;
    }

    return {
        jobKey: jobKey || fallbackKey,
        presetId,
        documentPath,
        targetPath,
        outputDirectory: String(entry.outputDirectory || '').trim(),
        outputName: String(entry.outputName || '').trim(),
        updatedAt: String(entry.updatedAt || '').trim()
    };
}

export function normalizeJobSaveTargets(raw = {}) {
    const source = raw && typeof raw === 'object' && raw.targetsByKey && typeof raw.targetsByKey === 'object'
        ? raw.targetsByKey
        : {};
    const targetsByKey = {};

    Object.keys(source).forEach((key) => {
        const normalized = normalizeJobSaveTargetEntry(source[key], key);
        if (normalized) {
            targetsByKey[normalized.jobKey] = normalized;
        }
    });

    return { targetsByKey };
}

export function loadJobSaveTargets(storage = null) {
    if (!storage || typeof storage.getItem !== 'function') {
        return normalizeJobSaveTargets();
    }

    try {
        const raw = storage.getItem(PREF_KEY);
        if (!raw) {
            return normalizeJobSaveTargets();
        }

        return normalizeJobSaveTargets(JSON.parse(raw));
    } catch (error) {
        console.warn('[Imposition] Failed to load job save targets:', error);
        return normalizeJobSaveTargets();
    }
}

export function saveJobSaveTargets(nextState, storage = null) {
    const normalized = normalizeJobSaveTargets(nextState);

    if (storage && typeof storage.setItem === 'function') {
        try {
            storage.setItem(PREF_KEY, JSON.stringify(normalized));
        } catch (error) {
            console.warn('[Imposition] Failed to save job save targets:', error);
        }
    }

    return normalized;
}

export function createJobSaveTargetStore(storage = null) {
    return {
        buildKey(presetId, documentPath) {
            return buildJobSaveTargetKey(presetId, documentPath);
        },

        get(presetId, documentPath) {
            const state = loadJobSaveTargets(storage);
            const key = buildJobSaveTargetKey(presetId, documentPath);
            return key ? state.targetsByKey[key] || null : null;
        },

        remember(entry) {
            const normalizedEntry = normalizeJobSaveTargetEntry(entry);
            if (!normalizedEntry) {
                return null;
            }

            const state = loadJobSaveTargets(storage);
            state.targetsByKey[normalizedEntry.jobKey] = normalizedEntry;
            saveJobSaveTargets(state, storage);
            return normalizedEntry;
        }
    };
}
