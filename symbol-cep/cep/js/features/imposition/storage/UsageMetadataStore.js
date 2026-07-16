import {
    USAGE_STORE_VERSION,
    buildUsageStoreFromPresets,
    normalizeUsageStorePayload
} from './storageHelpers.js';

export class UsageMetadataStore {
    constructor(environment) {
        this.environment = environment;
    }

    getPath() {
        return this.environment.getPaths().usageFilePath;
    }

    readEntries(fallbackPresets) {
        const state = this.environment.readJsonFile(this.getPath(), true);

        if (state.state === 'missing') {
            return {
                state: 'missing',
                usageById: buildUsageStoreFromPresets(fallbackPresets)
            };
        }

        if (state.state !== 'ok') {
            return {
                state: state.state,
                usageById: {}
            };
        }

        return {
            state: 'ok',
            usageById: normalizeUsageStorePayload(state.data).usageById
        };
    }

    writeEntries(usageById) {
        const payload = JSON.stringify({
            version: USAGE_STORE_VERSION,
            usageById: normalizeUsageStorePayload({ usageById }).usageById
        }, null, 2);

        return this.environment.safeWriteJson(this.getPath(), payload, true);
    }
}
