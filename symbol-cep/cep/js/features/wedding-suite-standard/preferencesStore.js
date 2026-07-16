import { loadWorkspacePreferences, saveWorkspacePreferences } from './workspacePreferences.js';

export function createWeddingSuitePreferencesStore(storage = null) {
    return {
        load() {
            return loadWorkspacePreferences(storage);
        },
        save(nextPrefs) {
            return saveWorkspacePreferences(nextPrefs, storage);
        }
    };
}

export function resolveWeddingSuitePreferencesStore(preferencesStore = null) {
    if (preferencesStore) {
        return preferencesStore;
    }

    return createWeddingSuitePreferencesStore(
        typeof window !== 'undefined' ? window.localStorage : null
    );
}
