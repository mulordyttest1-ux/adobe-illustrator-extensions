import {
    buildLegacyMirrors,
    buildProcessingOptions,
    getCanonicalSchema,
    getPresetSchema,
    normalizePresetSchema,
    serializeFormState
} from './legacy_preset_adapter.js';
import { toDraft } from './preset_migrator.js';
import { toRuntimePreset } from './runtime_preset_adapter.js';

export {
    buildLegacyMirrors,
    buildProcessingOptions,
    getCanonicalSchema,
    getPresetSchema,
    normalizePresetSchema,
    serializeFormState
};

export function hydratePreset(preset, schemaOverride) {
    const draft = toDraft(preset, schemaOverride);
    return toRuntimePreset(draft);
}
