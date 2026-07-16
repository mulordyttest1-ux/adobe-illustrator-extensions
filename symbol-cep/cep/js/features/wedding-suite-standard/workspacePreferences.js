const PREF_KEY = 'wedding_suite_standard_prefs_v1';

export function normalizeWorkspacePreferences(raw = {}) {
    return {
        lastSaveDirectory: typeof raw.lastSaveDirectory === 'string' ? raw.lastSaveDirectory : '',
        lastSourceDirectory: typeof raw.lastSourceDirectory === 'string' ? raw.lastSourceDirectory : ''
    };
}

export function loadWorkspacePreferences(storage = null) {
    if (!storage || typeof storage.getItem !== 'function') {
        return normalizeWorkspacePreferences();
    }

    try {
        const raw = storage.getItem(PREF_KEY);
        if (!raw) {
            return normalizeWorkspacePreferences();
        }

        return normalizeWorkspacePreferences(JSON.parse(raw));
    } catch (error) {
        console.warn('[WeddingSuiteStandard] Failed to load workspace preferences:', error);
        return normalizeWorkspacePreferences();
    }
}

export function saveWorkspacePreferences(nextPrefs, storage = null) {
    const normalized = normalizeWorkspacePreferences(nextPrefs);

    if (storage && typeof storage.setItem === 'function') {
        try {
            storage.setItem(PREF_KEY, JSON.stringify(normalized));
        } catch (error) {
            console.warn('[WeddingSuiteStandard] Failed to save workspace preferences:', error);
        }
    }

    return normalized;
}
