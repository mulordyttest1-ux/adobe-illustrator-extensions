import { hydratePreset } from '../processing_options.js';
import { migratePresetToDraft } from '../preset_migrator.js';
import {
    getPresetDraftUnsupportedExtensions,
    serializePresetDraft
} from '../preset_serializer.js';
import { toRuntimePreset } from '../runtime_preset_adapter.js';
import {
    STORAGE_REASON_MESSAGES,
    mergeUsageIntoPresets,
    sanitizeUsageEntry
} from './storageHelpers.js';

function buildStorageFailure(health) {
    return {
        success: false,
        reason: health.reason,
        message: health.message
    };
}

function buildPersistedDraft(draft, existingEntry, now) {
    return {
        ...draft,
        createdAt: draft.createdAt || (existingEntry && existingEntry.createdAt) || now,
        updatedAt: now
    };
}

function buildExistingUsage(usageById, id, existingRuntime) {
    return usageById[id] || sanitizeUsageEntry({
        usageCount: existingRuntime && existingRuntime.usageCount,
        lastUsedAt: existingRuntime && existingRuntime.lastUsedAt
    });
}

function writeUsageMetadata({ health, usageMetadataStore, usageById, refreshHealth }) {
    if (!health.canWriteUsage) {
        return STORAGE_REASON_MESSAGES.usage_write_denied;
    }

    const usageWrite = usageMetadataStore.writeEntries(usageById);
    if (!usageWrite.success) {
        refreshHealth();
        return STORAGE_REASON_MESSAGES.usage_write_denied;
    }

    return '';
}

export class CepPresetRepository {
    constructor({
        presetFileStore,
        usageMetadataStore,
        storageHealthService,
        hydratePresetFn = hydratePreset
    } = {}) {
        this.presetFileStore = presetFileStore;
        this.usageMetadataStore = usageMetadataStore;
        this.storageHealthService = storageHealthService;
        this.hydratePreset = hydratePresetFn;
    }

    inspectStorage() {
        return this.storageHealthService.inspect();
    }

    getStorageHealth(forceRefresh) {
        return this.storageHealthService.get(!!forceRefresh);
    }

    setStorageHealthOverride(overrides) {
        return this.storageHealthService.setOverride(overrides || {});
    }

    clearStorageHealthOverride() {
        return this.storageHealthService.clearOverride();
    }

    readPresetEntries() {
        return this.presetFileStore.readEntries();
    }

    readUsageEntries(presets) {
        return this.usageMetadataStore.readEntries(presets);
    }

    getDraftById(id) {
        const health = this.getStorageHealth();
        if (!health.canReadPresets) {
            return {
                success: false,
                draft: null,
                sourceVersion: 0,
                unsupportedExtensions: [],
                reason: health.reason,
                message: health.message
            };
        }

        const entry = this.getRawPresetById(id);
        if (!entry) {
            return {
                success: false,
                draft: null,
                sourceVersion: 0,
                unsupportedExtensions: [],
                reason: 'missing_target',
                message: 'Preset not found.'
            };
        }

        const migration = migratePresetToDraft(entry);
        if (!migration.success) {
            return {
                ...migration,
                reason: 'unsupported_extension',
                message: `Preset contains unsupported schema extensions: ${migration.unsupportedExtensions.join(', ')}.`
            };
        }

        return migration;
    }

    getRawPresetById(id) {
        const entries = this.readPresetEntries();
        return entries.presets.find((entry) => entry && entry.id === id) || null;
    }

    getPresets() {
        const health = this.getStorageHealth();
        if (!health.canReadPresets) {
            return [];
        }

        const presetEntries = this.readPresetEntries();
        const usageEntries = this.readUsageEntries(presetEntries.presets);
        const merged = mergeUsageIntoPresets(presetEntries.presets, usageEntries.usageById);

        return merged.map((preset) => this.hydratePreset(preset));
    }

    getById(id) {
        return this.getPresets().find((entry) => entry && entry.id === id) || null;
    }

    saveDraft(draft) {
        const health = this.getStorageHealth();
        if (!health.canWritePresets) {
            return buildStorageFailure(health);
        }

        const serializedDraft = serializePresetDraft(draft);
        if (!serializedDraft) {
            return {
                success: false,
                reason: getPresetDraftUnsupportedExtensions(draft).length
                    ? 'unsupported_extension'
                    : 'invalid_draft',
                message: getPresetDraftUnsupportedExtensions(draft).length
                    ? `Preset contains unsupported schema extensions: ${getPresetDraftUnsupportedExtensions(draft).join(', ')}.`
                    : 'Preset draft is invalid.'
            };
        }

        const presetEntries = this.readPresetEntries();
        const usageEntries = this.readUsageEntries(presetEntries.presets);
        const presets = presetEntries.presets.slice();
        const usageById = { ...usageEntries.usageById };
        const idx = presets.findIndex((entry) => entry && entry.id === serializedDraft.id);
        const now = new Date().toISOString();
        const existingEntry = idx > -1 ? presets[idx] : null;
        const persistedDraft = buildPersistedDraft(serializedDraft, existingEntry, now);
        const existingRuntime = existingEntry ? this.hydratePreset(existingEntry) : null;
        const existingUsage = buildExistingUsage(usageById, persistedDraft.id, existingRuntime);

        if (idx > -1) {
            presets[idx] = persistedDraft;
        } else {
            presets.push(persistedDraft);
        }

        const presetWrite = this.presetFileStore.writeEntries(presets);
        if (!presetWrite.success) {
            this.getStorageHealth(true);
            return {
                success: false,
                reason: presetWrite.reason || 'write_denied',
                message: STORAGE_REASON_MESSAGES[presetWrite.reason || 'write_denied']
            };
        }

        usageById[persistedDraft.id] = sanitizeUsageEntry(existingUsage);

        const warning = writeUsageMetadata({
            health,
            usageMetadataStore: this.usageMetadataStore,
            usageById,
            refreshHealth: () => this.getStorageHealth(true)
        });

        this.getStorageHealth(true);
        return {
            success: true,
            warning,
            draft: persistedDraft,
            preset: toRuntimePreset(persistedDraft)
        };
    }

    savePreset(preset) {
        const migration = migratePresetToDraft(preset);
        if (!migration.success) {
            return {
                success: false,
                reason: 'unsupported_extension',
                message: `Preset contains unsupported schema extensions: ${migration.unsupportedExtensions.join(', ')}.`
            };
        }

        return this.saveDraft(migration.draft);
    }

    incrementUsage(id) {
        const health = this.getStorageHealth();
        if (!health.canWriteUsage) {
            console.warn('[DataStore] Usage write skipped:', health.message);
            return {
                success: false,
                reason: health.reason,
                message: health.message
            };
        }

        const presetEntries = this.readPresetEntries();
        const usageEntries = this.readUsageEntries(presetEntries.presets);
        const usageById = { ...usageEntries.usageById };
        const current = usageById[id] || sanitizeUsageEntry({});

        usageById[id] = {
            usageCount: current.usageCount + 1,
            lastUsedAt: new Date().toISOString()
        };

        const usageWrite = this.usageMetadataStore.writeEntries(usageById);
        if (!usageWrite.success) {
            this.getStorageHealth(true);
            console.warn('[DataStore] Failed to persist usage sidecar:', usageWrite.reason);
            return {
                success: false,
                reason: 'usage_write_denied',
                message: STORAGE_REASON_MESSAGES.usage_write_denied
            };
        }

        this.getStorageHealth(true);
        return { success: true };
    }

    deletePreset(id) {
        const health = this.getStorageHealth();
        if (!health.canWritePresets) {
            return {
                success: false,
                reason: health.reason,
                message: health.message
            };
        }

        const presetEntries = this.readPresetEntries();
        const usageEntries = this.readUsageEntries(presetEntries.presets);
        const presets = presetEntries.presets.filter((entry) => entry.id !== id);
        const usageById = { ...usageEntries.usageById };
        delete usageById[id];

        const presetWrite = this.presetFileStore.writeEntries(presets);
        if (!presetWrite.success) {
            this.getStorageHealth(true);
            return {
                success: false,
                reason: presetWrite.reason || 'write_denied',
                message: STORAGE_REASON_MESSAGES[presetWrite.reason || 'write_denied']
            };
        }

        let warning = '';
        if (health.canWriteUsage) {
            const usageWrite = this.usageMetadataStore.writeEntries(usageById);
            if (!usageWrite.success) {
                warning = STORAGE_REASON_MESSAGES.usage_write_denied;
            }
        } else {
            warning = STORAGE_REASON_MESSAGES.usage_write_denied;
        }

        this.getStorageHealth(true);
        return {
            success: true,
            warning
        };
    }

}
