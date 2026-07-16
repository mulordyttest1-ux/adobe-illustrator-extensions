import { createStorageHealth, resolveStorageHealth } from './storageHelpers.js';

export class StorageHealthService {
    constructor(environment, presetFileStore, usageMetadataStore) {
        this.environment = environment;
        this.presetFileStore = presetFileStore;
        this.usageMetadataStore = usageMetadataStore;
        this.cachedHealth = null;
        this.override = null;
    }

    inspect() {
        const { filePath, usageFilePath } = this.environment.getPaths();

        if (this.override) {
            return this.override;
        }

        const presetEntries = this.presetFileStore.readEntries();
        const usageEntries = this.usageMetadataStore.readEntries(presetEntries.presets);
        const canWritePresets = presetEntries.state === 'ok'
            ? this.environment.probeWriteAccess(filePath, false)
            : false;
        const canWriteUsage = this.environment.probeWriteAccess(usageFilePath, true);

        this.cachedHealth = resolveStorageHealth({
            path: filePath,
            usagePath: usageFilePath,
            presetsState: presetEntries.state,
            usageState: usageEntries.state,
            canWritePresets,
            canWriteUsage
        });

        return this.cachedHealth;
    }

    get(forceRefresh = false) {
        if (this.override) {
            return this.override;
        }

        if (!forceRefresh && this.cachedHealth) {
            return this.cachedHealth;
        }

        return this.inspect();
    }

    setOverride(overrides) {
        const { filePath, usageFilePath } = this.environment.getPaths();
        this.override = createStorageHealth({
            path: filePath,
            usagePath: usageFilePath,
            ...overrides
        });
        return this.override;
    }

    clearOverride() {
        this.override = null;
        return this.get(true);
    }
}
