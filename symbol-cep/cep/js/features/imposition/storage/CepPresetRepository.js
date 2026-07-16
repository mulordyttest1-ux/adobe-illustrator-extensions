import { hydratePreset } from '../processing_options.js';
import {
    STORAGE_REASON_MESSAGES,
    mergeUsageIntoPresets,
    sanitizeUsageEntry
} from './storageHelpers.js';

export class CepPresetRepository {
    constructor({
        presetFileStore,
        usageMetadataStore,
        storageHealthService,
        lastActiveStore,
        hydratePresetFn = hydratePreset
    } = {}) {
        this.presetFileStore = presetFileStore;
        this.usageMetadataStore = usageMetadataStore;
        this.storageHealthService = storageHealthService;
        this.lastActiveStore = lastActiveStore;
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

    savePreset(preset) {
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
        const presets = presetEntries.presets.slice();
        const usageById = { ...usageEntries.usageById };
        const normalizedPreset = this.hydratePreset(preset);
        const idx = presets.findIndex((entry) => entry.id === normalizedPreset.id);
        const now = new Date().toISOString();
        const existingUsage = usageById[normalizedPreset.id] || sanitizeUsageEntry({
            usageCount: normalizedPreset.usageCount,
            lastUsedAt: normalizedPreset.lastUsedAt
        });

        if (idx > -1) {
            normalizedPreset.createdAt = presets[idx].createdAt || now;
            normalizedPreset.updatedAt = now;
            presets[idx] = normalizedPreset;
        } else {
            normalizedPreset.createdAt = now;
            normalizedPreset.updatedAt = now;
            presets.push(normalizedPreset);
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

        usageById[normalizedPreset.id] = sanitizeUsageEntry(existingUsage);

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

    saveLastActive(id) {
        this.lastActiveStore.save(id);
    }

    getLastActive() {
        return this.lastActiveStore.get();
    }
}
