import {
    buildLegacyMirrors,
    buildProcessingOptions,
    getCanonicalSchema,
    hydratePreset,
    serializeFormState
} from '../processing_options.js';
import { ConfirmService } from '../confirm_service.js';
import { impositionCopy } from '../imposition_copy.js';
import { UIFeedback } from '@shared/cep-ui';

function withDefault(value, fallback) {
    return value === undefined ? fallback : value;
}

function getCollectedValues(form, configTabRef, deps) {
    if (configTabRef && typeof configTabRef.collectFormValues === 'function') {
        return configTabRef.collectFormValues(form);
    }

    return deps.serializeFormState(form);
}

function getSchemaForBuild(configTabRef, deps) {
    if (configTabRef && typeof configTabRef.getActiveSchema === 'function') {
        return configTabRef.getActiveSchema();
    }

    return deps.getCanonicalSchema();
}

function updateTabState(configTabRef, nextState) {
    if (!configTabRef) return;

    const safeState = nextState || {};

    if (typeof configTabRef.setActiveSchema === 'function' && safeState.schema && safeState.schema.sections) {
        configTabRef.setActiveSchema(safeState.schema);
    }

    if (typeof configTabRef.setPresetMeta === 'function') {
        configTabRef.setPresetMeta(safeState.presetId || '', safeState.presetLabel || '');
    }

    if (typeof configTabRef.setFormState === 'function') {
        configTabRef.setFormState(safeState.rawValues || {});
    }
}

function createDeps(overrides = {}) {
    const presetRepository = withDefault(overrides.presetRepository, overrides.dataStore);
    return {
        presetRepository: presetRepository || {
            getPresets() { return []; },
            saveLastActive() {},
            savePreset() { return { success: false, message: impositionCopy.persistence.saveError }; }
        },
        buildLegacyMirrors: withDefault(overrides.buildLegacyMirrors, buildLegacyMirrors),
        buildProcessingOptions: withDefault(overrides.buildProcessingOptions, buildProcessingOptions),
        getCanonicalSchema: withDefault(overrides.getCanonicalSchema, getCanonicalSchema),
        hydratePreset: withDefault(overrides.hydratePreset, hydratePreset),
        serializeFormState: withDefault(overrides.serializeFormState, serializeFormState),
        requestConfirm: withDefault(overrides.requestConfirm, (config) => ConfirmService.request(config)),
        showToast: withDefault(overrides.showToast, (message, type) => UIFeedback.showToast(message, type)),
        resolveActionTab: withDefault(overrides.resolveActionTab, () => window.Imposition && window.Imposition.actionTab),
        nowIso: withDefault(overrides.nowIso, () => new Date().toISOString()),
        createPresetId: withDefault(overrides.createPresetId, () => 'preset_' + Date.now())
    };
}

async function resolveUpdateConflict(existingId, name, allowUpdate, deps) {
    if (!existingId || !allowUpdate) return existingId;

    const oldPreset = deps.presetRepository.getPresets().find((entry) => entry.id === existingId);
    if (!oldPreset || oldPreset.label === name) {
        return existingId;
    }

    const action = await deps.requestConfirm({
        title: impositionCopy.persistence.renameConflict.title,
        message: impositionCopy.persistence.renameConflict.message(oldPreset.label, name),
        confirmLabel: impositionCopy.persistence.renameConflict.confirm,
        cancelLabel: impositionCopy.persistence.renameConflict.cancel,
        dismissLabel: impositionCopy.persistence.renameConflict.dismiss,
        leastDestructive: 'dismiss'
    });

    if (action === 'confirm') return existingId;
    if (action === 'cancel') return '';
    return null;
}

function buildPreset(request, deps) {
    const { id, name, rawValues, configTabRef } = request;
    const schema = JSON.parse(JSON.stringify(getSchemaForBuild(configTabRef, deps)));
    const processingOptions = deps.buildProcessingOptions(rawValues, schema);
    const legacy = deps.buildLegacyMirrors(processingOptions);

    const hydratedPreset = deps.hydratePreset({
        id,
        label: name,
        createdAt: deps.nowIso(),
        schemaId: 'embedded',
        schema,
        rawValues,
        geometry: {
            finish: {
                w: Number(rawValues.finish_w) || 0,
                h: Number(rawValues.finish_h) || 0
            },
            safe: [
                Number(rawValues.safe_top) || 0,
                Number(rawValues.safe_bottom) || 0,
                Number(rawValues.safe_left) || 0,
                Number(rawValues.safe_right) || 0
            ]
        },
        processingOptions,
        options: legacy.options,
        info_template: legacy.info_template
    }, schema);

    return hydratedPreset;
}

function handleMissingName(name, deps) {
    if (name) return false;
    deps.showToast(impositionCopy.persistence.missingPresetName, 'warning');
    return true;
}

function finalizeSaveFailure({ saveResult, rawValues, name, preset, configTabRef }, deps) {
    deps.showToast(saveResult.message || impositionCopy.persistence.saveError, 'error');
    updateTabState(configTabRef, {
        presetId: rawValues.preset_id || '',
        presetLabel: name,
        rawValues,
        schema: preset.schema
    });
    if (configTabRef && typeof configTabRef.render === 'function') {
        configTabRef.render();
    }
    return false;
}

function finalizeSaveSuccess({ allowUpdate, existingId, id, preset }, deps) {
    deps.presetRepository.saveLastActive(id);
    deps.showToast(
        allowUpdate && existingId
            ? impositionCopy.persistence.saveSuccess.updated(preset.label)
            : impositionCopy.persistence.saveSuccess.created(preset.label),
        'success'
    );

    return { id, preset };
}

function syncSavedPreset({ saveResult, id, preset, configTabRef }, deps) {
    if (saveResult.warning) {
        deps.showToast(saveResult.warning, 'warning');
    }

    updateTabState(configTabRef, {
        presetId: id,
        presetLabel: preset.label,
        rawValues: preset.rawValues,
        schema: preset.schema
    });

    if (configTabRef && typeof configTabRef.render === 'function') {
        configTabRef.render();
    }

    return true;
}

export function loadPresetIntoConfigTab({ id, tab } = {}, overrides = {}) {
    const deps = createDeps(overrides);
    deps.presetRepository.saveLastActive(id);

    const preset = deps.presetRepository.getPresets().find((entry) => entry.id === id);
    if (!preset) return;

    const baseSchema = tab && typeof tab.getCanonicalSchema === 'function'
        ? tab.getCanonicalSchema()
        : deps.getCanonicalSchema();
    const hydrated = deps.hydratePreset(preset, baseSchema);

    updateTabState(tab, {
        presetId: hydrated.id,
        presetLabel: hydrated.label,
        rawValues: hydrated.rawValues,
        schema: hydrated.schema
    });

    if (tab && typeof tab.render === 'function') {
        tab.render();
    }
}

export async function saveConfigPreset({ form, allowUpdate, configTabRef } = {}, overrides = {}) {
    const deps = createDeps(overrides);
    const rawValues = getCollectedValues(form, configTabRef, deps);
    const name = (rawValues.preset_name || '').trim();

    if (handleMissingName(name, deps)) {
        return false;
    }

    let existingId = rawValues.preset_id || '';
    existingId = await resolveUpdateConflict(existingId, name, allowUpdate, deps);
    if (existingId === null) {
        return false;
    }

    const id = allowUpdate && existingId ? existingId : deps.createPresetId();
    const preset = buildPreset({ id, name, rawValues, configTabRef }, deps);
    const saveResult = deps.presetRepository.savePreset(preset);

    if (!saveResult.success) {
        return finalizeSaveFailure({ saveResult, rawValues, name, preset, configTabRef }, deps);
    }

    finalizeSaveSuccess({ allowUpdate, existingId, id, preset }, deps);
    return syncSavedPreset({ saveResult, id, preset, configTabRef }, deps);
}

export async function dryRunConfigPreset({ form, configTabRef } = {}, overrides = {}) {
    const deps = createDeps(overrides);
    const actionTab = deps.resolveActionTab();
    if (!actionTab) {
        deps.showToast(impositionCopy.persistence.actionTabMissing, 'error');
        return false;
    }

    const rawValues = getCollectedValues(form, configTabRef, deps);
    const fallback = impositionCopy.persistence.dryRunFallbackName;
    const name = (rawValues.preset_name || fallback).trim() || fallback;
    const tempPreset = buildPreset({
        id: 'dry_run_temp',
        name: `${name} (${impositionCopy.persistence.dryRunSuffix})`,
        rawValues,
        configTabRef
    }, deps);

    await actionTab.runWithPreset(tempPreset);
    return true;
}
