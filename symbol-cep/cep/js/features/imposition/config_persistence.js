/**
 * MODULE: ConfigPersistence
 * LAYER: UI/Actions (L7)
 * PURPOSE: Save/load preset logic for the Config tab shell and Tweakpane state.
 * DEPENDENCIES: PresetRepository facade, preset-config service seam
 * SIDE EFFECTS: Persistent preset writes, ConfigTab state updates
 * EXPORTS: createConfigPersistence, ConfigPersistence
 */

import { presetRepository } from './data_store.js';
import {
    dryRunConfigPreset,
    loadPresetIntoConfigTab,
    saveConfigPreset
} from './preset-config/configPersistenceService.js';

export function createConfigPersistence({ presetRepository: repository = presetRepository } = {}) {
    return {
        loadPreset(id, tab, deps = {}) {
            return loadPresetIntoConfigTab(
                { id, tab },
                {
                    presetRepository: repository,
                    ...deps
                }
            );
        },

        async handleSave(form, allowUpdate, configTabRef, deps = {}) {
            return saveConfigPreset(
                { form, allowUpdate, configTabRef },
                {
                    presetRepository: repository,
                    ...deps
                }
            );
        },

        async handleDryRun(form, configTabRef, deps = {}) {
            return dryRunConfigPreset(
                { form, configTabRef },
                {
                    presetRepository: repository,
                    ...deps
                }
            );
        },

        saveLastActive(id) {
            return repository.saveLastActive(id);
        }
    };
}

export const ConfigPersistence = createConfigPersistence();
