import {
    getCanonicalSchema,
    serializeFormState
} from '../processing_options.js';
import { normalizeRawValuesForSchema } from '../config_schema_state.js';
import { buildDraftFromConfigResult } from '../preset_migrator.js';
import { toRuntimePreset } from '../runtime_preset_adapter.js';
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
    return {
        presetRepository: overrides.presetRepository || null,
        getCanonicalSchema: withDefault(overrides.getCanonicalSchema, getCanonicalSchema),
        toRuntimePreset: withDefault(overrides.toRuntimePreset, toRuntimePreset),
        buildDraftFromConfigResult: withDefault(overrides.buildDraftFromConfigResult, buildDraftFromConfigResult),
        serializeFormState: withDefault(overrides.serializeFormState, serializeFormState),
        requestConfirm: withDefault(overrides.requestConfirm, (config) => ConfirmService.request(config)),
        showToast: withDefault(overrides.showToast, (message, type) => UIFeedback.showToast(message, type)),
        resolveActionTab: withDefault(overrides.resolveActionTab, () => window.Imposition && window.Imposition.actionTab),
        nowIso: withDefault(overrides.nowIso, () => new Date().toISOString()),
        createPresetId: withDefault(overrides.createPresetId, () => 'preset_' + Date.now())
    };
}

function hasCanonicalPersistence(repository) {
    return !!(
        repository &&
        typeof repository.getDraftById === 'function' &&
        typeof repository.saveDraft === 'function'
    );
}

async function resolveUpdateConflict(existingId, name, allowUpdate, deps) {
    if (!existingId || !allowUpdate) return existingId;

    const existing = deps.presetRepository.getDraftById(existingId);
    const oldDraft = existing && existing.draft;
    if (!oldDraft || oldDraft.label === name) {
        return existingId;
    }

    const action = await deps.requestConfirm({
        title: impositionCopy.persistence.renameConflict.title,
        message: impositionCopy.persistence.renameConflict.message(oldDraft.label, name),
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
    const normalizedRawValues = normalizeRawValuesForSchema(rawValues, schema);

    return deps.buildDraftFromConfigResult({
        id,
        label: name,
        schema,
        rawValues: normalizedRawValues,
        createdAt: deps.nowIso()
    });
}

function handleMissingName(name, deps) {
    if (name) return false;
    deps.showToast(impositionCopy.persistence.missingPresetName, 'warning');
    return true;
}

async function resolveSaveIdentity(rawValues, allowUpdate, deps) {
    const name = (rawValues.preset_name || '').trim();
    if (handleMissingName(name, deps)) {
        return { valid: false };
    }

    const existingId = await resolveUpdateConflict(
        rawValues.preset_id || '',
        name,
        allowUpdate,
        deps
    );
    if (existingId === null) {
        return { valid: false };
    }

    return {
        valid: true,
        name,
        existingId,
        id: allowUpdate && existingId ? existingId : deps.createPresetId()
    };
}

function buildSaveCandidate({ id, name, rawValues, configTabRef }, deps) {
    const result = buildPreset({ id, name, rawValues, configTabRef }, deps);
    const invalid = !result ||
        !result.draft ||
        result.unsupportedExtensions.length > 0;

    if (invalid) {
        return {
            success: false,
            message: `Preset contains unsupported schema extensions: ${(result && result.unsupportedExtensions || []).join(', ')}.`
        };
    }

    return {
        success: true,
        draft: result.draft,
        preset: deps.toRuntimePreset(result.draft)
    };
}

function persistSaveCandidate(candidate, deps) {
    return deps.presetRepository.saveDraft(candidate.draft);
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

    if (configTabRef && typeof configTabRef.markClean === 'function') {
        configTabRef.markClean({
            rawValues: preset.rawValues,
            schema: preset.schema,
            formMeta: {
                presetId: id,
                presetName: preset.label
            }
        });
    }

    if (configTabRef && typeof configTabRef.render === 'function') {
        configTabRef.render();
    }

    return true;
}

function resolveLoadedRuntimePreset(id, tab, deps) {
    if (!deps.presetRepository || typeof deps.presetRepository.getDraftById !== 'function') {
        return null;
    }

    const result = deps.presetRepository.getDraftById(id);
    return result && result.draft
        ? deps.toRuntimePreset(result.draft)
        : null;
}

export function loadPresetIntoConfigTab({ id, tab } = {}, overrides = {}) {
    const deps = createDeps(overrides);
    const hydrated = resolveLoadedRuntimePreset(id, tab, deps);
    if (!hydrated) return;

    updateTabState(tab, {
        presetId: hydrated.id,
        presetLabel: hydrated.label,
        rawValues: hydrated.rawValues,
        schema: hydrated.schema
    });

    if (tab && typeof tab.markClean === 'function') {
        tab.markClean({
            rawValues: hydrated.rawValues,
            schema: hydrated.schema,
            formMeta: {
                presetId: hydrated.id,
                presetName: hydrated.label
            }
        });
    }

    if (tab && typeof tab.render === 'function') {
        tab.render();
    }
}

export async function saveConfigPreset({ form, allowUpdate, configTabRef } = {}, overrides = {}) {
    const deps = createDeps(overrides);
    const rawValues = getCollectedValues(form, configTabRef, deps);
    if (handleMissingName((rawValues.preset_name || '').trim(), deps)) {
        return false;
    }
    if (!hasCanonicalPersistence(deps.presetRepository)) {
        deps.showToast(impositionCopy.persistence.saveError, 'error');
        return false;
    }
    const identity = await resolveSaveIdentity(rawValues, allowUpdate, deps);
    if (!identity.valid) {
        return false;
    }

    const candidate = buildSaveCandidate({
        id: identity.id,
        name: identity.name,
        rawValues,
        configTabRef
    }, deps);
    if (!candidate.success) {
        deps.showToast(candidate.message, 'error');
        return false;
    }

    const saveResult = persistSaveCandidate(candidate, deps);
    if (!saveResult.success) {
        return finalizeSaveFailure({
            saveResult,
            rawValues,
            name: identity.name,
            preset: candidate.preset,
            configTabRef
        }, deps);
    }

    const savedPreset = saveResult.preset || candidate.preset;
    finalizeSaveSuccess({
        allowUpdate,
        existingId: identity.existingId,
        id: identity.id,
        preset: savedPreset
    }, deps);
    return syncSavedPreset({
        saveResult,
        id: identity.id,
        preset: savedPreset,
        configTabRef
    }, deps);
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

    if (!tempPreset || !tempPreset.draft) {
        deps.showToast(impositionCopy.persistence.saveError, 'error');
        return false;
    }

    await actionTab.runWithPreset(deps.toRuntimePreset(tempPreset.draft));
    return true;
}
