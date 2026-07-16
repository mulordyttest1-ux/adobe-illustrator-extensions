/* global Fuse */
/**
 * MODULE: ActionTab
 * LAYER: UI/Feature (L6)
 * PURPOSE: Preset browsing, search, management, and imposition triggering
 * DEPENDENCIES: DataStore, ConfigEngine
 * SIDE EFFECTS: DOM, evalScript (CEP)
 * EXPORTS: ActionTab class
 */

import { hydratePreset } from './processing_options.js';
import { parseBase64JsonUtf8 } from './bridge_codec.js';
import { ConfirmService } from './confirm_service.js';
import { impositionCopy } from './imposition_copy.js';
import { SaveFilenamePromptService } from './save_filename_prompt_service.js';
import {
    compilePresetRules,
    executeImposition,
    handleEngineFailure,
    handleEngineSuccess,
    resolveSmartSaveFilenamePrefix,
    restoreAutoGrouping,
    runImpositionEngineAsync,
    runPreflight,
    runPresetExecutionFlow,
    saveDocumentAfterSuccessfulRun
} from './imposition_run_service.js';
import { UIFeedback } from '@shared/cep-ui';

function createDefaultNotifier() {
    return {
        showToast(message, tone) {
            UIFeedback.showToast(message, tone);
        }
    };
}

function createEmptyPresetRepository() {
    return {
        deletePreset() {
            return { success: false, message: impositionCopy.action.deleteError };
        },
        getById() {
            return null;
        },
        getPresets() {
            return [];
        },
        getStorageHealth() {
            return { reason: 'ok', message: '' };
        },
        incrementUsage() {
            return { success: false };
        }
    };
}

function createDefaultCsInterface() {
    if (typeof CSInterface === 'function') {
        return new CSInterface();
    }

    return {
        evalScript(_script, callback) {
            if (typeof callback === 'function') {
                callback('');
            }
        }
    };
}

function createEmptyJobSaveTargetStore() {
    return {
        buildKey() {
            return '';
        },
        get() {
            return null;
        },
        remember() {
            return null;
        }
    };
}

function resolveDirectoryFromOutputPath(outputPath) {
    const normalized = String(outputPath || '').replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');

    return lastSlash > 0 ? normalized.slice(0, lastSlash) : '';
}

function normalizeSaveMode(mode) {
    if (mode === 'overwrite' || mode === 'save_as_new') {
        return mode;
    }

    return 'run_only';
}

export class ActionTab {
    // eslint-disable-next-line complexity
    constructor(
        depsOrPreflight = {},
        legacyPostflightOrchestrator = null,
        legacyBridgeInst = null
    ) {
        const deps = depsOrPreflight && typeof depsOrPreflight === 'object' && !Array.isArray(depsOrPreflight) && (
            Object.prototype.hasOwnProperty.call(depsOrPreflight, 'presetRepository') ||
            Object.prototype.hasOwnProperty.call(depsOrPreflight, 'hostGateway') ||
            Object.prototype.hasOwnProperty.call(depsOrPreflight, 'configEngine') ||
            Object.prototype.hasOwnProperty.call(depsOrPreflight, 'bridgeInst') ||
            Object.prototype.hasOwnProperty.call(depsOrPreflight, 'requestSaveFilenamePrefix')
        )
            ? depsOrPreflight
            : {
                preflightOrchestrator: depsOrPreflight,
                postflightOrchestrator: legacyPostflightOrchestrator,
                bridgeInst: legacyBridgeInst
            };
        const {
            bridgeInst = null,
            configEngine = null,
            csInterface = null,
            hostGateway = null,
            jobSaveTargetStore = null,
            notifier = null,
            postflightOrchestrator = null,
            preflightOrchestrator = null,
            presetRepository = null,
            requestSaveFilenamePrefix = null
        } = deps;
        this.container = null;
        this.csInterface = csInterface || createDefaultCsInterface();
        this.searchTerm = '';
        this.isManagerMode = false;
        this.selectedIndex = 0;
        this.filteredPresets = [];
        this.fuse = null;
        this.preflightOrchestrator = preflightOrchestrator;
        this.postflightOrchestrator = postflightOrchestrator;
        this.bridgeInst = bridgeInst;
        this.configEngine = configEngine;
        this.hostGateway = hostGateway;
        this.jobSaveTargetStore = jobSaveTargetStore || createEmptyJobSaveTargetStore();
        this.notifier = notifier || createDefaultNotifier();
        this.presetRepository = presetRepository || createEmptyPresetRepository();
        this.requestSaveFilenamePrefix = typeof requestSaveFilenamePrefix === 'function'
            ? requestSaveFilenamePrefix
            : null;
        this.lastPostflightSummary = null;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.container.addEventListener('click', (event) => {
            const triggerItem = event.target.closest('.dropdown-item');
            const triggerBtnManager = event.target.closest('button.manager-run-btn');
            const presetActionBtn = event.target.closest('[data-trigger-mode]');
            const deleteBtn = event.target.closest('.btn-delete');
            const modeBtn = event.target.closest('[data-action-mode]');

            if (deleteBtn) {
                this.handleDelete(deleteBtn.dataset.id, deleteBtn);
            } else if (modeBtn) {
                this.isManagerMode = modeBtn.dataset.actionMode === 'manage';
                this.searchTerm = '';
                this.selectedIndex = 0;
                this.render();
            } else if (presetActionBtn) {
                this.handleTrigger(
                    presetActionBtn.dataset.id,
                    presetActionBtn,
                    normalizeSaveMode(presetActionBtn.dataset.triggerMode)
                );
            } else if (triggerItem) {
                this.handleTrigger(triggerItem.dataset.id, triggerItem);
            } else if (triggerBtnManager && !deleteBtn) {
                this.handleTrigger(triggerBtnManager.dataset.id, triggerBtnManager);
            }
        });

        this.container.addEventListener('keydown', (event) => {
            if (event.target.id === 'action-search' && !this.isManagerMode) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredPresets.length - 1);
                    this._renderDropdownContent(document.getElementById('action-list'));
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                    this._renderDropdownContent(document.getElementById('action-list'));
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    const selected = this.filteredPresets[this.selectedIndex];
                    if (selected) {
                        this.handleTrigger(selected.id, event.target, 'run_only');
                    }
                }
            }
        });

        this.container.addEventListener('input', (event) => {
            if (event.target.id === 'action-search') {
                this.searchTerm = event.target.value.trim();
                this.selectedIndex = 0;
                this.renderList();
            }
        });

        this.render();
    }

    refresh() {
        this.render();
    }

    _renderStorageWarning() {
        const health = this.presetRepository.getStorageHealth();
        if (!health || health.reason === 'ok' || !health.message) {
            return '';
        }

        return `
            <div data-storage-warning="${health.reason}" style="margin-bottom: 10px; padding: 8px 10px; border-radius: 4px; background: rgba(255, 193, 7, 0.12); border: 1px solid rgba(255, 193, 7, 0.45); color: #ffd36a; font-size: 11px;">
                ${health.message}
            </div>
        `;
    }

    render() {
        const storageWarning = this._renderStorageWarning();
        const actionCopy = impositionCopy.action;
        const searchPlaceholder = this.isManagerMode
            ? actionCopy.placeholder.manage
            : actionCopy.placeholder.run;
        const modeHint = this.isManagerMode
            ? actionCopy.hint.manage
            : actionCopy.hint.run;

        this.container.innerHTML = `
            ${storageWarning}
            <div class="panel-card action-toolbar-card">
                <div class="action-toolbar-head">
                    <div>
                        <div class="panel-eyebrow">${actionCopy.eyebrow}</div>
                        <div class="panel-section-title">${actionCopy.title}</div>
                        <div class="panel-helper-text">${modeHint}</div>
                    </div>
                    <div class="action-mode-switch" role="group" aria-label="${actionCopy.mode.ariaLabel}">
                        <button type="button" id="btn-mode-run" data-action-mode="run" class="${this.isManagerMode ? 'outline' : 'contrast'} action-mode-btn" aria-pressed="${this.isManagerMode ? 'false' : 'true'}">${actionCopy.mode.run}</button>
                        <button type="button" id="btn-mode-manage" data-action-mode="manage" class="${this.isManagerMode ? 'contrast' : 'outline'} action-mode-btn" aria-pressed="${this.isManagerMode ? 'true' : 'false'}">${actionCopy.mode.manage}</button>
                    </div>
                </div>
                <label class="panel-field-label" for="action-search">${actionCopy.searchLabel}</label>
                <input
                    type="text"
                    id="action-search"
                    class="action-search-input"
                    placeholder="${searchPlaceholder}"
                    value="${this.searchTerm}"
                    autocomplete="off"
                >
            </div>
            <div id="action-list"></div>
        `;

        if (!this.isManagerMode) {
            setTimeout(() => {
                const searchInput = document.getElementById('action-search');
                if (searchInput) searchInput.focus();
            }, 50);
        }

        this.renderList();
    }

    _initFuse(presets) {
        if (window.Fuse && presets && presets.length > 0) {
            this.fuse = new Fuse([...presets], {
                keys: [
                    { name: 'label', weight: 0.7 },
                    { name: 'id', weight: 0.3 }
                ],
                threshold: 0.4,
                ignoreLocation: true,
                includeScore: true
            });
        } else {
            this.fuse = null;
        }
    }

    renderList() {
        const listContainer = document.getElementById('action-list');
        if (!listContainer) return;

        const presets = this.presetRepository.getPresets();

        presets.sort((a, b) => {
            const useDiff = (b.usageCount || 0) - (a.usageCount || 0);
            if (useDiff !== 0) return useDiff;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        if (this.isManagerMode) {
            this._renderManagerList(listContainer, presets);
        } else {
            this._initFuse(presets);
            this._filterAndRenderDropdown(listContainer, presets);
        }
    }

    _filterAndRenderDropdown(container, presets) {
        if (this.searchTerm && this.fuse) {
            const results = this.fuse.search(this.searchTerm);
            this.filteredPresets = results.map((result) => result.item).slice(0, 10);
        } else if (this.searchTerm) {
            this.filteredPresets = presets
                .filter((preset) => preset.label.toLowerCase().includes(this.searchTerm.toLowerCase()))
                .slice(0, 10);
        } else {
            this.filteredPresets = presets.slice(0, 10);
        }

        if (this.selectedIndex >= this.filteredPresets.length) {
            this.selectedIndex = Math.max(0, this.filteredPresets.length - 1);
        }

        this._renderDropdownContent(container);
    }

    _renderDropdownContent(container) {
        if (this.filteredPresets.length === 0) {
            container.innerHTML = `<p class="empty-state-text">${impositionCopy.action.empty.run}</p>`;
            return;
        }

        const html = this.filteredPresets.map((preset, index) => {
            const isSelected = index === this.selectedIndex;
            const bg = isSelected ? '#0078d7' : 'transparent';
            const textColor = isSelected ? '#fff' : '#ccc';
            const hasSaveActions = this._presetUsesExplicitSaveActions(preset);
            const usage = preset.usageCount
                ? `<span style="color: ${isSelected ? '#fff' : '#4CAF50'}; font-size: 10px; opacity: 0.8;">&#9733; ${preset.usageCount}</span>`
                : '';
            const actions = hasSaveActions
                ? `
                    <div style="display: inline-flex; gap: 6px; align-items: center;">
                        <button
                            type="button"
                            class="contrast preset-trigger-btn"
                            data-id="${preset.id}"
                            data-trigger-mode="save_as_new"
                            style="padding: 4px 8px; font-size: 11px;"
                        >${impositionCopy.action.buttons.saveAsNew}</button>
                    </div>
                `
                : '';

            return `
                <div class="dropdown-item" data-id="${preset.id}" data-save-enabled="${hasSaveActions ? 'true' : 'false'}" style="padding: 10px 12px; margin-bottom: 2px; background: ${bg}; color: ${textColor}; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; flex: 1 1 auto;">
                        ${isSelected ? '&#9654; ' : '&nbsp;&nbsp;&nbsp;'}${preset.label}
                    </span>
                    <span style="display: inline-flex; gap: 8px; align-items: center; flex: 0 0 auto;">
                        ${usage}
                        ${actions}
                    </span>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="panel-card action-dropdown-list">${html}</div>`;
    }

    _renderManagerList(container, presets) {
        let list = presets;
        if (this.searchTerm) {
            list = presets.filter((preset) =>
                preset.label.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (preset.geometry.finish && (`${preset.geometry.finish.w}x${preset.geometry.finish.h}`).includes(this.searchTerm.toLowerCase()))
            );
        }

        if (list.length === 0) {
            container.innerHTML = `<p class="empty-state-text">${this.searchTerm ? impositionCopy.action.empty.manage : impositionCopy.action.empty.manageInitial}</p>`;
            return;
        }

        const cardsHtml = list.map((preset) => {
            const hasSaveActions = this._presetUsesExplicitSaveActions(preset);
            const usage = preset.usageCount
                ? `<span class="manager-card-usage">&#9733; ${preset.usageCount}</span>`
                : `<span class="manager-card-usage manager-card-usage-muted">${impositionCopy.action.usageNeverRun}</span>`;
            const actions = hasSaveActions
                ? `
                    <button type="button" class="secondary outline manager-run-btn" data-id="${preset.id}" data-trigger-mode="run_only">${impositionCopy.action.buttons.runPreset}</button>
                    <button type="button" class="contrast manager-run-btn preset-trigger-btn" data-id="${preset.id}" data-trigger-mode="save_as_new">${impositionCopy.action.buttons.saveAsNew}</button>
                `
                : `<button type="button" class="secondary outline manager-run-btn" data-id="${preset.id}" data-trigger-mode="run_only">${impositionCopy.action.buttons.runPreset}</button>`;

            return `
                <article class="panel-card manager-card">
                    <div class="manager-card-summary">
                        <div class="manager-card-title">${preset.label}</div>
                        ${usage}
                    </div>
                    <div class="manager-card-actions">
                        ${actions}
                        <button type="button" class="btn-delete outline btn-danger-outline" data-id="${preset.id}">${impositionCopy.action.buttons.delete}</button>
                    </div>
                </article>
            `;
        }).join('');

        container.innerHTML = cardsHtml;
    }

    async handleDelete(id, triggerEl = null) {
        const preset = this.presetRepository.getById(id);
        const confirmed = await ConfirmService.confirm({
            title: impositionCopy.action.deleteDialog.title,
            message: impositionCopy.action.deleteDialog.message(preset && preset.label),
            confirmLabel: impositionCopy.action.deleteDialog.confirm,
            cancelLabel: impositionCopy.action.deleteDialog.cancel,
            tone: 'danger',
            returnFocus: triggerEl
        });

        if (!confirmed) {
            return;
        }

        const result = this.presetRepository.deletePreset(id);
        if (!result.success) {
            this.notifier.showToast(result.message || impositionCopy.action.deleteError, 'error');
            this.render();
            return;
        }

        if (result.warning) {
            this.notifier.showToast(result.warning, 'warning');
        }

        this.renderList();
    }

    _buildRunDeps(runContext = null, saveMode = 'run_only') {
        return {
            bridgeInst: this.bridgeInst,
            configEngine: this.configEngine,
            csInterface: this.csInterface,
            hydratePreset,
            hostGateway: this.hostGateway,
            jobSaveContext: runContext,
            logger: console,
            rememberJobSaveTarget: (payload) => {
                this._rememberJobSaveTarget(payload);
            },
            notifier: this.notifier,
            postflightOrchestrator: this.postflightOrchestrator,
            preflightOrchestrator: this.preflightOrchestrator,
            saveMode,
            setLastPostflightSummary: (summary) => {
                this.lastPostflightSummary = summary;
            },
            showToast: (message, tone) => {
                this.notifier.showToast(message, tone);
            }
        };
    }

    _compileRules(preset) {
        return compilePresetRules(preset, this._buildRunDeps(null, 'run_only'));
    }

    _runImpositionEngineAsync(preset) {
        return runImpositionEngineAsync(preset, this._buildRunDeps(null, 'run_only'));
    }

    async _runPreflight() {
        return runPreflight(this.preflightOrchestrator, this.bridgeInst, this._buildRunDeps());
    }

    async _executeImposition(preset) {
        return executeImposition(preset, {
            ...this._buildRunDeps(),
            runImpositionEngineAsync: (safePreset, deps) => runImpositionEngineAsync(safePreset, deps)
        });
    }

    async _restoreAutoGrouping(preflightContext) {
        return restoreAutoGrouping(preflightContext, this._buildRunDeps());
    }

    async _handleEngineFailure(engineResult, preflightContext) {
        return handleEngineFailure(engineResult, preflightContext, {
            ...this._buildRunDeps(),
            restoreAutoGrouping: (context, deps) => restoreAutoGrouping(context, deps)
        });
    }

    async _handleEngineSuccess(engineResult, preset, preflightContext) {
        return handleEngineSuccess(engineResult, preset, preflightContext, {
            ...this._buildRunDeps(),
            restoreAutoGrouping: (context, deps) => restoreAutoGrouping(context, deps)
        });
    }

    _shouldPromptForSaveFilename(preset) {
        return !!(
            preset &&
            preset.rawValues &&
            String(preset.rawValues.save_output_dir || '').trim()
        );
    }

    _presetUsesExplicitSaveActions(preset) {
        return this._shouldPromptForSaveFilename(preset);
    }

    // eslint-disable-next-line complexity
    async _resolveSaveJobContext(preset) {
        let resultRaw;
        let identity;

        if (!this._shouldPromptForSaveFilename(preset)) {
            return null;
        }

        if (!this.hostGateway || typeof this.hostGateway.getActiveDocumentIdentity !== 'function') {
            return {
                presetId: preset.id,
                documentIdentity: null,
                jobKey: '',
                rememberedTarget: null
            };
        }

        try {
            resultRaw = await this.hostGateway.getActiveDocumentIdentity();
            identity = parseBase64JsonUtf8(resultRaw);
        } catch (error) {
            console.warn('[ActionTab] Failed to resolve active document identity for save-after-run:', error);
            return {
                presetId: preset.id,
                documentIdentity: null,
                jobKey: '',
                rememberedTarget: null
            };
        }

        if (!identity || !identity.success) {
            return {
                presetId: preset.id,
                documentIdentity: identity || null,
                jobKey: '',
                rememberedTarget: null
            };
        }

        const documentPath = String(identity.documentPath || '').trim();
        const jobKey = this.jobSaveTargetStore.buildKey(preset.id, documentPath);
        const rememberedTarget = jobKey
            ? this.jobSaveTargetStore.get(preset.id, documentPath)
            : null;
        const activeDocumentTarget = documentPath
            ? {
                targetPath: documentPath,
                outputDirectory: resolveDirectoryFromOutputPath(documentPath),
                outputName: String(identity.documentName || '').trim()
            }
            : null;

        return {
            presetId: preset.id,
            documentIdentity: identity,
            jobKey,
            rememberedTarget: rememberedTarget || activeDocumentTarget
        };
    }

    _rememberJobSaveTarget({ preset, saveResult } = {}) {
        const outputPath = saveResult && saveResult.outputPath ? String(saveResult.outputPath).trim() : '';

        if (!preset || !preset.id || !outputPath) {
            return null;
        }

        return this.jobSaveTargetStore.remember({
            presetId: preset.id,
            documentPath: outputPath,
            targetPath: outputPath,
            outputDirectory: resolveDirectoryFromOutputPath(outputPath),
            outputName: saveResult.outputName || '',
            updatedAt: new Date().toISOString()
        });
    }

    // eslint-disable-next-line complexity
    async _preparePresetForRun(preset, triggerEl = null, saveMode = 'run_only') {
        const rawValues = preset && preset.rawValues ? preset.rawValues : {};
        const normalizedSaveMode = normalizeSaveMode(saveMode);

        if (!this._presetUsesExplicitSaveActions(preset)) {
            return { preset, runContext: null, saveMode: 'run_only' };
        }

        if (normalizedSaveMode === 'run_only') {
            return { preset, runContext: null, saveMode: normalizedSaveMode };
        }

        if (normalizedSaveMode === 'overwrite') {
            const runContext = await this._resolveSaveJobContext(preset);
            if (
                runContext &&
                runContext.rememberedTarget &&
                String(runContext.rememberedTarget.targetPath || '').trim()
            ) {
                return { preset, runContext, saveMode: normalizedSaveMode };
            }

            this.notifier.showToast(impositionCopy.action.saveAfterRun.missingOverwriteTarget, 'warning');
            return null;
        }

        const runContext = await this._resolveSaveJobContext(preset);
        const requester = this.requestSaveFilenamePrefix || ((options) => SaveFilenamePromptService.request(options));
        const prefix = await requester({
            title: impositionCopy.action.saveAfterRun.promptTitle,
            message: impositionCopy.action.saveAfterRun.promptMessage(preset.label),
            placeholder: impositionCopy.action.saveAfterRun.promptPlaceholder,
            initialValue: resolveSmartSaveFilenamePrefix(runContext),
            confirmLabel: impositionCopy.action.saveAfterRun.promptConfirm,
            cancelLabel: impositionCopy.action.saveAfterRun.promptCancel,
            required: true,
            requiredMessage: impositionCopy.action.saveAfterRun.promptRequired,
            returnFocus: triggerEl
        });

        if (!prefix) {
            return null;
        }

        return {
            preset: {
                ...preset,
                rawValues: {
                    ...rawValues,
                    save_filename_prefix: prefix
                }
            },
            runContext,
            saveMode: normalizedSaveMode
        };
    }

    async handleTrigger(id, triggerEl = null, saveMode = 'run_only') {
        try {
            const preset = this.presetRepository.getById(id);
            if (!preset) {
                console.warn('-> Preset not found!', id);
                return;
            }

            const preparedRun = await this._preparePresetForRun(preset, triggerEl, saveMode);
            if (!preparedRun) {
                return;
            }

            this.presetRepository.incrementUsage(id);
            this.renderList();

            if (normalizeSaveMode(preparedRun.saveMode) !== 'run_only') {
                await this.saveOnlyWithPreset(preparedRun.preset, preparedRun.runContext, preparedRun.saveMode);
                return;
            }

            await this.runWithPreset(preparedRun.preset, preparedRun.runContext, preparedRun.saveMode);
        } catch (fatalErr) {
            console.error('FATAL ERROR IN handleTrigger:', fatalErr);
        }
    }

    async saveOnlyWithPreset(preset, runContext = null, saveMode = 'run_only') {
        this.lastPostflightSummary = null;
        return saveDocumentAfterSuccessfulRun(
            preset,
            this._buildRunDeps(runContext, normalizeSaveMode(saveMode))
        );
    }

    async runWithPreset(preset, runContext = null, saveMode = 'run_only') {
        return runPresetExecutionFlow(preset, {
            ...this._buildRunDeps(runContext, normalizeSaveMode(saveMode)),
            compilePresetRules: (hydratedPreset, deps) => compilePresetRules(hydratedPreset, deps),
            executeImposition: (hydratedPreset, deps) => executeImposition(hydratedPreset, deps),
            handleEngineFailure: (engineResult, preflightContext, deps) => handleEngineFailure(engineResult, preflightContext, deps),
            handleEngineSuccess: (engineResult, hydratedPreset, preflightContext, deps) => handleEngineSuccess(engineResult, hydratedPreset, preflightContext, deps),
            runPreflight: (preflightOrchestrator, bridgeInst, deps) => runPreflight(preflightOrchestrator, bridgeInst, deps)
        });
    }
}
