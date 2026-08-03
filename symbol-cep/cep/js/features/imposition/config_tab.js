/**
 * MODULE: ConfigTab
 * LAYER: UI/Coordinator (L6)
 * PURPOSE: Config tab initialization, render coordination, and modal handling
 * DEPENDENCIES: ConfigPaneRenderer, ConfigEvents, DataStore, ConfigEngine
 * SIDE EFFECTS: DOM manipulation
 * EXPORTS: ConfigTab class
 */
import { ConfigPaneRenderer } from './config_pane_renderer.js';
import { ConfigEvents } from './config_events.js';
import { ConfigPersistence } from './config_persistence.js';
import { impositionCopy } from './imposition_copy.js';
import { normalizeRawValuesForSchema } from './config_schema_state.js';
import { ConfigDraftStore } from './config_draft_store.js';
import { getCanonicalSchema } from './processing_options.js';
import {
    buildNormalizedConfigState,
    buildPresetOptionsMarkup,
    buildStorageWarningMarkup,
    captureConfigTabUiState,
    resolveFormMetaValues,
    restoreConfigTabUiState
} from './preset-config/configTabStateService.js';
import {
    confirmConfigTabModal,
    openConfigTabAddFieldModal,
    requestRemoveRowFromConfigTab
} from './preset-config/configSchemaEditService.js';
import { UIFeedback } from '@shared/cep-ui';
import { ConfirmService } from './confirm_service.js';

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function escapeAttr(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function createDefaultNotifier() {
    return {
        showToast(message, tone) {
            UIFeedback.showToast(message, tone);
        }
    };
}

function getSaveDirectoryPresetMeta(tab) {
    return {
        presetId: String((tab && tab.formMeta && tab.formMeta.presetId) || '').trim(),
        fallbackLabel: String((tab && tab.formMeta && tab.formMeta.presetName) || '').trim()
    };
}

function getRepositoryDraftForSaveDirectory(repository, presetId) {
    if (!repository || !presetId || typeof repository.getDraftById !== 'function') {
        return null;
    }

    const result = repository.getDraftById(presetId);
    return result && result.draft ? result.draft : null;
}

function resolveLoadedPresetForSaveDirectory(tab) {
    const meta = getSaveDirectoryPresetMeta(tab);
    const repository = tab && tab.presetRepository;

    if (
        !meta.presetId ||
        !repository ||
        typeof repository.getDraftById !== 'function' ||
        typeof repository.saveDraft !== 'function'
    ) {
        return { presetId: '', fallbackLabel: meta.fallbackLabel, draft: null };
    }

    return {
        presetId: meta.presetId,
        fallbackLabel: meta.fallbackLabel,
        draft: getRepositoryDraftForSaveDirectory(repository, meta.presetId)
    };
}

function patchSaveOutputDirectory(draft, nextPath) {
    const patched = clone(draft) || {};
    const values = patched.values || {};
    values.save_output_dir = nextPath;
    patched.values = values;
    return patched;
}

function saveDirectoryDraft(repository, draft) {
    return repository.saveDraft(draft);
}

function buildSaveDirectoryFailure(saveResult) {
    return {
        status: 'failed',
        error: saveResult && saveResult.message
            ? saveResult.message
            : impositionCopy.persistence.saveError
    };
}

function persistPickedSaveOutputDirectory(tab, nextPath) {
    const resolved = resolveLoadedPresetForSaveDirectory(tab);

    if (!resolved.presetId || !resolved.draft) {
        return { status: 'draft' };
    }

    const draft = patchSaveOutputDirectory(resolved.draft, nextPath);
    const saveResult = saveDirectoryDraft(tab.presetRepository, draft);
    if (!saveResult || !saveResult.success) {
        return buildSaveDirectoryFailure(saveResult);
    }

    return {
        status: 'saved',
        label: (saveResult.preset && saveResult.preset.label) ||
            draft.label ||
            resolved.fallbackLabel ||
            resolved.presetId,
        warning: saveResult.warning || ''
    };
}

export class ConfigTab {
    constructor({
        notifier = null,
        pickDirectory = null,
        persistence = ConfigPersistence,
        presetRepository = null,
        schemaMutationService = null
    } = {}) {
        this.container = null;
        this.isEditMode = false;
        this.notifier = notifier || createDefaultNotifier();
        this.pickDirectory = typeof pickDirectory === 'function' ? pickDirectory : null;
        this.persistence = persistence;
        this.presetRepository = presetRepository;
        this.schemaMutationService = schemaMutationService;
        this.canonicalSchema = null;
        this.activeSchema = null;
        this.formState = null;
        this.formMeta = {
            presetId: '',
            presetName: ''
        };
        this.selectedPresetId = '';
        this.skipCaptureOnNextRender = false;
        this.draftBaseline = null;
        this.draftStore = new ConfigDraftStore();
        this.operation = null;
        this.paneRenderer = new ConfigPaneRenderer(this);
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.resetActiveSchema();
        this.formState = this._buildNormalizedState({});
        this.markClean();
        this.render();
        ConfigEvents.bindEvents(this);
    }

    render() {
        if (this.skipCaptureOnNextRender) {
            this.skipCaptureOnNextRender = false;
        } else {
            this._captureUiState();
        }

        const schema = this.getActiveSchema();
        this.formState = this._buildNormalizedState(this.formState || {});
        const storageWarning = this._renderStorageWarning();

        this.container.innerHTML = `
            <form id="config-form" class="config-form-shell">
                ${storageWarning}
                ${this._renderTopBar()}
                <input type="hidden" name="preset_id" id="preset_id" value="${escapeAttr(this.formMeta.presetId)}" />
                <div id="dynamic-form-body" class="config-form-body">
                    <div id="config-pane-root"></div>
                </div>
                ${this._renderFooter()}
                ${this._renderModal()}
            </form>
        `;

        const paneRoot = document.getElementById('config-pane-root');
        this.paneRenderer.mount(paneRoot, schema, this.formState, {
            isEditMode: this.isEditMode
        });
        this._restoreUiState();
    }

    _renderStorageWarning() {
        return buildStorageWarningMarkup({
            getStorageHealth: () => (
                this.presetRepository && typeof this.presetRepository.getStorageHealth === 'function'
                    ? this.presetRepository.getStorageHealth()
                    : { reason: 'ok', message: '' }
            )
        });
    }

    _buildCanonicalSchema() {
        return getCanonicalSchema();
    }

    _buildNormalizedState(rawValues) {
        return buildNormalizedConfigState({
            rawValues: rawValues || {},
            formMeta: this.formMeta,
            activeSchema: this.getActiveSchema()
        });
    }

    _captureUiState() {
        const snapshot = captureConfigTabUiState({
            paneRenderer: this.paneRenderer,
            formMeta: this.formMeta,
            selectedPresetId: this.selectedPresetId
        });

        if (snapshot.formState) {
            this.formState = snapshot.formState;
            this.draftStore.setValues(this.formState);
        }
        this.formMeta = snapshot.formMeta;
        this.selectedPresetId = snapshot.selectedPresetId;
        this.draftStore.setMeta(this.formMeta);
    }

    _restoreUiState() {
        restoreConfigTabUiState({
            formMeta: this.formMeta,
            selectedPresetId: this.selectedPresetId
        });
    }

    getCanonicalSchema() {
        if (!this.canonicalSchema || !this.canonicalSchema.sections) {
            this.canonicalSchema = this._buildCanonicalSchema();
        }

        return JSON.parse(JSON.stringify(this.canonicalSchema));
    }

    getActiveSchema() {
        if (!this.activeSchema || !this.activeSchema.sections) {
            this.resetActiveSchema();
        }

        return this.activeSchema;
    }

    setActiveSchema(schema) {
        this.canonicalSchema = this._buildCanonicalSchema();
        this.activeSchema = schema && schema.sections
            ? JSON.parse(JSON.stringify(schema))
            : this.getCanonicalSchema();
        this.formState = this._buildNormalizedState(this.formState || {});
        this.draftStore.setSchema(this.activeSchema);
        this.draftStore.setValues(this.formState);
        this.skipCaptureOnNextRender = true;

        return this.activeSchema;
    }

    resetActiveSchema() {
        this.canonicalSchema = this._buildCanonicalSchema();
        this.activeSchema = this.getCanonicalSchema();
        this.formState = null;
        this.draftStore.setSchema(this.activeSchema);
        this.draftStore.setValues({});
        this.skipCaptureOnNextRender = true;
        return this.activeSchema;
    }

    setFormState(rawValues) {
        this.formState = this._buildNormalizedState(rawValues || {});
        this.draftStore.setSchema(this.getActiveSchema());
        this.draftStore.setValues(this.formState);
        this.skipCaptureOnNextRender = true;
    }

    markClean({ rawValues, schema, formMeta } = {}) {
        const nextSchema = schema || this.getActiveSchema();
        const nextRawValues = this._buildNormalizedState(rawValues || this.formState || {});
        const nextMeta = clone(formMeta || this.formMeta) || { presetId: '', presetName: '' };

        this.draftBaseline = {
            schema: clone(nextSchema),
            rawValues: clone(nextRawValues),
            formMeta: nextMeta
        };
        this.draftStore.setSnapshot({
            schema: nextSchema,
            values: nextRawValues,
            meta: nextMeta
        });
        this.draftStore.markClean();

        return this.draftBaseline;
    }

    isDirty() {
        this._captureUiState();
        this.draftStore.setSnapshot({
            schema: this.getActiveSchema(),
            values: this._buildNormalizedState(this.formState || {}),
            meta: this.formMeta
        });
        return this.draftStore.isDirty();
    }

    async requestDiscardChanges() {
        if (!this.isDirty()) {
            return true;
        }

        const action = await ConfirmService.request({
            title: impositionCopy.config.unsavedChanges.title,
            message: impositionCopy.config.unsavedChanges.message,
            confirmLabel: impositionCopy.config.unsavedChanges.discard,
            cancelLabel: impositionCopy.config.unsavedChanges.keep,
            leastDestructive: 'cancel',
            tone: 'danger'
        });

        return action === 'confirm';
    }

    markFieldPersisted(fieldId, value) {
        if (!this.draftBaseline) {
            this.markClean();
        }

        this.draftBaseline.rawValues[fieldId] = value;
        this.draftStore.markClean({
            schema: this.draftBaseline.schema,
            values: this.draftBaseline.rawValues,
            meta: this.draftBaseline.formMeta
        });
    }

    pruneRemovedRowState(rowId) {
        const rowKey = String(rowId || '').replace(/^row_/, '');
        const prefix = `${rowKey}_`;
        const nextValues = this.readRawValues();

        Object.keys(nextValues).forEach((key) => {
            if (
                key.indexOf(prefix) === 0 ||
                key === `${rowId}_draw_border` ||
                key === `${rowId}_border_style`
            ) {
                delete nextValues[key];
            }
        });

        this.setFormState(normalizeRawValuesForSchema(nextValues, this.getActiveSchema()));
    }

    async runExclusive(name, task) {
        if (this.operation) {
            return false;
        }

        this.operation = name;
        this._setOperationBusy(true);
        try {
            return await task();
        } finally {
            this.operation = null;
            this._setOperationBusy(false);
        }
    }

    _setOperationBusy(isBusy) {
        if (!this.container) {
            return;
        }

        this.container.dataset.configBusy = isBusy ? 'true' : 'false';
        this.container
            .querySelectorAll('#btn-save, #btn-dry-run, #load-preset-select, #btn-toggle-edit, [data-config-action="pick-save-output-dir"]')
            .forEach((element) => {
                element.disabled = isBusy;
            });
    }

    setFieldValue(fieldId, value) {
        const nextState = clone(this.readRawValues()) || {};
        nextState[fieldId] = value;
        this.setFormState(nextState);

        if (this.paneRenderer && typeof this.paneRenderer.applyValues === 'function') {
            this.paneRenderer.applyValues(this.formState);
        }
    }

    setPresetMeta(id, label) {
        this.formMeta = {
            presetId: id || '',
            presetName: label || ''
        };
        this.draftStore.setMeta(this.formMeta);
        this.selectedPresetId = id || '';
        this.skipCaptureOnNextRender = true;
    }

    readRawValues() {
        if (this.paneRenderer) {
            const paneValues = this.paneRenderer.readValues();
            if (paneValues && Object.keys(paneValues).length) {
                return paneValues;
            }
        }

        return clone(this.formState) || {};
    }

    collectFormValues(form) {
        const formRef = form || document.getElementById('config-form');
        const values = this._buildNormalizedState(this.readRawValues());
        const meta = resolveFormMetaValues(formRef, this.formMeta);

        values.preset_id = meta.presetId;
        values.preset_name = meta.presetName;
        this.formMeta.presetId = meta.presetId;
        this.formMeta.presetName = meta.presetName;
        return values;
    }

    _renderTopBar() {
        const editHint = this.isEditMode
            ? `<div class="config-edit-banner">${impositionCopy.config.editHint}</div>`
            : `<div class="config-compact-hint">${impositionCopy.config.compactHint}</div>`;

        return `
            <section class="panel-card panel-card-compact config-top-card">
                <div class="config-top-head">
                    <div>
                        <div class="panel-eyebrow">${impositionCopy.config.eyebrow}</div>
                        <div class="panel-section-title">${impositionCopy.config.title}</div>
                    </div>
                    <button type="button" id="btn-toggle-edit" class="${this.isEditMode ? 'contrast' : 'secondary outline'} config-edit-btn">
                        ${this.isEditMode ? impositionCopy.config.toggleEdit.on : impositionCopy.config.toggleEdit.off}
                    </button>
                </div>
                <div class="config-toolbar-row">
                    <div class="config-toolbar-field">
                        <label class="panel-field-label" for="load-preset-select">${impositionCopy.config.presetLabel}</label>
                        <select id="load-preset-select" class="panel-select">
                            <option value="">${impositionCopy.config.presetPlaceholder}</option>
                            ${this._getPresetOptions()}
                        </select>
                    </div>
                </div>
                ${editHint}
            </section>
        `;
    }

    _renderFooter() {
        return `
            <section class="panel-card panel-card-compact config-footer-card">
                <div class="config-footer-grid">
                    <div class="config-footer-field">
                        <div class="panel-eyebrow">${impositionCopy.config.footerEyebrow}</div>
                        <label class="panel-field-label" for="preset_name">${impositionCopy.config.footerLabel}</label>
                        <input type="text" name="preset_name" id="preset_name" placeholder="${impositionCopy.config.footerPlaceholder}" class="panel-text-input" required />
                    </div>
                    <div class="config-footer-actions">
                        <button type="button" class="secondary outline" id="btn-dry-run" title="${impositionCopy.config.dryRunTitle}">${impositionCopy.config.dryRun}</button>
                        <button type="submit" class="contrast" id="btn-save">${impositionCopy.config.save}</button>
                    </div>
                </div>
                <div class="panel-helper-text config-footer-hint">${impositionCopy.config.footerHint}</div>
            </section>
        `;
    }

    _renderModal() {
        return `
            <div id="modal-add-field" class="panel-modal-overlay" style="display:none;">
                <div class="panel-modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-add-field-title">
                    <h3 id="modal-add-field-title" class="panel-modal-title">${impositionCopy.config.modal.title}</h3>
                    <div class="panel-helper-text">${impositionCopy.config.modal.helper}</div>
                    <label class="panel-field-label" for="new-field-label">${impositionCopy.config.modal.fieldLabel}</label>
                    <input type="text" id="new-field-label" class="panel-text-input" placeholder="${impositionCopy.config.modal.fieldPlaceholder}">
                    <label class="panel-field-label" for="new-field-classification">${impositionCopy.config.modal.classificationLabel}</label>
                    <select id="new-field-classification" class="panel-select">
                        <option value="BASELINE">${impositionCopy.config.modal.classification.baseline}</option>
                        <option value="STRUCTURAL">${impositionCopy.config.modal.classification.structural}</option>
                        <option value="ADDITIVE" selected>${impositionCopy.config.modal.classification.additive}</option>
                    </select>
                    <div class="panel-modal-actions">
                        <button type="button" class="secondary outline" id="btn-cancel-modal">${impositionCopy.config.modal.cancel}</button>
                        <button type="button" class="contrast" id="btn-confirm-modal">${impositionCopy.config.modal.confirm}</button>
                    </div>
                </div>
            </div>
        `;
    }

    _getPresetOptions() {
        return buildPresetOptionsMarkup({
            listPresets: () => (
                this.presetRepository && typeof this.presetRepository.getPresets === 'function'
                    ? this.presetRepository.getPresets()
                    : []
            )
        });
    }

    resetDraft() {
        this.isEditMode = false;
        this.selectedPresetId = '';
        this.formMeta = { presetId: '', presetName: '' };
        this.resetActiveSchema();
        this.formState = this._buildNormalizedState({});
        this.markClean();
        this.skipCaptureOnNextRender = true;
        this.render();

        const documentRef = typeof document !== 'undefined' ? document : null;
        const presetName = documentRef ? documentRef.getElementById('preset_name') : null;
        if (presetName) {
            presetName.focus();
        }
    }

    async requestRemoveRow(rowId, label) {
        return requestRemoveRowFromConfigTab(this, rowId, label, {
            schemaMutationService: this.schemaMutationService
        });
    }

    handleModalConfirm() {
        return confirmConfigTabModal(this, {
            schemaMutationService: this.schemaMutationService
        });
    }

    openAddFieldModal(sectionId) {
        return openConfigTabAddFieldModal(sectionId);
    }

    async pickSaveOutputDirectory() {
        if (!this.pickDirectory) {
            this.notifier.showToast(impositionCopy.action.saveAfterRun.pickerUnavailable, 'warning');
            return false;
        }

        const currentValues = this.readRawValues();
        const nextPath = await Promise.resolve(this.pickDirectory(currentValues.save_output_dir || ''));
        if (!nextPath) {
            return false;
        }

        if (nextPath === '__PICKER_UNAVAILABLE__') {
            this.notifier.showToast(impositionCopy.action.saveAfterRun.pickerUnavailable, 'warning');
            return false;
        }

        if (nextPath === '__PICKER_ERROR__') {
            this.notifier.showToast(impositionCopy.action.saveAfterRun.pickerError, 'error');
            return false;
        }

        this.setFieldValue('save_output_dir', nextPath);
        const appliedPreset = this._applyPickedSaveOutputDirectory(nextPath);
        if (appliedPreset.status === 'saved') {
            this.markFieldPersisted('save_output_dir', nextPath);
            this.notifier.showToast(impositionCopy.action.saveAfterRun.pickerAppliedToPreset(appliedPreset.label), 'success');
            if (appliedPreset.warning) {
                this.notifier.showToast(appliedPreset.warning, 'warning');
            }
            return true;
        }

        if (appliedPreset.status === 'failed') {
            this.notifier.showToast(impositionCopy.action.saveAfterRun.pickerApplyFailed(appliedPreset.error), 'warning');
            return true;
        }

        this.notifier.showToast(impositionCopy.action.saveAfterRun.pickerSelected, 'success');
        return true;
    }

    _applyPickedSaveOutputDirectory(nextPath) {
        return persistPickedSaveOutputDirectory(this, nextPath);
    }
}
