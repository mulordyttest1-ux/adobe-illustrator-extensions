import {
    CURRENT_VERSION,
    stripUsageMetadata
} from './storageHelpers.js';

export class PresetFileStore {
    constructor(environment) {
        this.environment = environment;
    }

    getPath() {
        return this.environment.getPaths().filePath;
    }

    readEntries() {
        const state = this.environment.readJsonFile(this.getPath(), false);

        if (state.state !== 'ok') {
            return {
                state: state.state,
                presets: [],
                raw: state.raw || null
            };
        }

        if (Array.isArray(state.data)) {
            return {
                state: 'ok',
                presets: state.data,
                raw: state.raw || null
            };
        }

        if (state.data && Array.isArray(state.data.presets)) {
            return {
                state: 'ok',
                presets: state.data.presets,
                raw: state.raw || null
            };
        }

        return {
            state: 'invalid_json',
            presets: [],
            raw: state.raw || null
        };
    }

    writeEntries(presets) {
        const strippedPresets = (Array.isArray(presets) ? presets : []).map(stripUsageMetadata);
        const payload = JSON.stringify({ version: CURRENT_VERSION, presets: strippedPresets }, null, 2);
        return this.environment.safeWriteJson(this.getPath(), payload, false);
    }
}
