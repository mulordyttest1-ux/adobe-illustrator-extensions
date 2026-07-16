import { CepStorageEnvironment } from './storage/CepStorageEnvironment.js';
import { PresetFileStore } from './storage/PresetFileStore.js';
import { UsageMetadataStore } from './storage/UsageMetadataStore.js';
import { StorageHealthService } from './storage/StorageHealthService.js';
import { LastActiveStore } from './storage/LastActiveStore.js';
import { CepPresetRepository } from './storage/CepPresetRepository.js';

export function createCepPresetRepository(overrides = {}) {
    const environment = overrides.environment || new CepStorageEnvironment({
        csFactory: overrides.csFactory,
        cepFs: overrides.cepFs,
        storage: overrides.storage
    });
    const presetFileStore = overrides.presetFileStore || new PresetFileStore(environment);
    const usageMetadataStore = overrides.usageMetadataStore || new UsageMetadataStore(environment);
    const storageHealthService = overrides.storageHealthService || new StorageHealthService(
        environment,
        presetFileStore,
        usageMetadataStore
    );
    const lastActiveStore = overrides.lastActiveStore || new LastActiveStore(environment);

    return new CepPresetRepository({
        presetFileStore,
        usageMetadataStore,
        storageHealthService,
        lastActiveStore,
        hydratePresetFn: overrides.hydratePresetFn
    });
}

export { CepPresetRepository };
