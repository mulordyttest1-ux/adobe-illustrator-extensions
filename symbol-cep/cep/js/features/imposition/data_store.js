/**
 * MODULE: DataStore
 * LAYER: Infrastructure/Persistence (L0)
 * PURPOSE: Backward-compatible facade around the preset repository/storage services.
 */
import { createCepPresetRepository, CepPresetRepository } from './preset_repository.js';
import {
    buildUsageStoreFromPresets,
    createStorageHealth,
    mergeUsageIntoPresets,
    normalizeUsageStorePayload,
    resolveStorageHealth,
    stripUsageMetadata
} from './storage/storageHelpers.js';

export {
    buildUsageStoreFromPresets,
    createStorageHealth,
    mergeUsageIntoPresets,
    normalizeUsageStorePayload,
    resolveStorageHealth,
    stripUsageMetadata
};

export class DataStore extends CepPresetRepository {
    constructor(overrides = {}) {
        const repository = createCepPresetRepository(overrides);
        super({
            presetFileStore: repository.presetFileStore,
            usageMetadataStore: repository.usageMetadataStore,
            storageHealthService: repository.storageHealthService,
            lastActiveStore: repository.lastActiveStore,
            hydratePresetFn: repository.hydratePreset
        });
    }
}

export const presetRepository = new DataStore();
export const dataStore = presetRepository;
