import { createWeddingSuiteBridgeAdapter, pickDirectory, pickSourceFile as pickSourceFileDialog, resolveWeddingSuiteTemplatePath } from './bridgeAdapter.js';
import { scanPdfManifest } from './pdfManifestScanner.js';
import { buildWeddingSuitePlan } from './planner.js';
import { loadWeddingSuitePaperStockCatalog, resolvePaperStock } from './paperStockConfig.js';
import { resolveWeddingSuitePreferencesStore } from './preferencesStore.js';
import {
    applySourcePath,
    createBuildError,
    flushToastState,
    handleBuildError,
    pickOutputDirectory,
    pickSourceFile as runPickSourceFile,
    refreshSourceManifest as runRefreshSourceManifest,
    resolveSourceBrowseDirectory,
    runBuild,
    showBuildSuccess,
    syncInvitePagesWithManifest,
    useActiveDocumentAsSource
} from './panelActions.js';
import {
    buildEmptyState,
    clampDraftCardCount,
    dirname
} from './panelPolicy.js';
import { renderWeddingSuiteMarkup, renderWeddingSuitePreview } from './panelView.js';
export class WeddingSuiteTab {
    // eslint-disable-next-line complexity
    constructor(configOrBridge = {}) {
        const deps = configOrBridge && typeof configOrBridge === 'object' && (
            Object.prototype.hasOwnProperty.call(configOrBridge, 'bridge') ||
            Object.prototype.hasOwnProperty.call(configOrBridge, 'hostAdapter') ||
            Object.prototype.hasOwnProperty.call(configOrBridge, 'pdfScanner') ||
            Object.prototype.hasOwnProperty.call(configOrBridge, 'preferencesStore') ||
            Object.prototype.hasOwnProperty.call(configOrBridge, 'paperStockCatalog') ||
            Object.prototype.hasOwnProperty.call(configOrBridge, 'paperStockCatalogLoader')
        )
            ? configOrBridge
            : { bridge: configOrBridge };
        const {
            bridge = null,
            hostAdapter = null,
            pdfScanner = scanPdfManifest,
            pickDirectory: pickDirectoryImpl = pickDirectory,
            pickSourceFile: pickSourceFileImpl = pickSourceFileDialog,
            templatePathResolver = resolveWeddingSuiteTemplatePath,
            preferencesStore = null,
            paperStockCatalog = null,
            paperStockCatalogLoader = loadWeddingSuitePaperStockCatalog,
            now = null
        } = deps;
        this.bridge = bridge;
        this.container = null;
        this.preferencesStore = resolveWeddingSuitePreferencesStore(preferencesStore);
        this.preferences = this.preferencesStore.load();
        this.paperStockCatalogSource = paperStockCatalog;
        this.paperStockCatalogLoader = paperStockCatalogLoader;
        this.paperStockCatalog = this._loadPaperStockCatalog();
        this.state = buildEmptyState(this.preferences, this.paperStockCatalog);
        this.defaultDeps = {
            hostAdapter: hostAdapter || createWeddingSuiteBridgeAdapter(bridge),
            pickDirectory: pickDirectoryImpl,
            pickSourceFile: pickSourceFileImpl,
            pdfScanner,
            templatePathResolver,
            now
        };
        this.deps = {
            ...this.defaultDeps
        };
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.container.addEventListener('click', (event) => this._handleClick(event));
        this.container.addEventListener('change', (event) => this._handleFieldChange(event));
        this.render();
    }

    setHostAdapterForTest(hostAdapter) {
        this.deps.hostAdapter = hostAdapter;
    }

    setPickersForTest(overrides = {}) {
        if (typeof overrides.pickDirectory === 'function') {
            this.deps.pickDirectory = overrides.pickDirectory;
        }
        if (typeof overrides.pickSourceFile === 'function') {
            this.deps.pickSourceFile = overrides.pickSourceFile;
        }
    }

    setPdfScannerForTest(pdfScanner) {
        if (typeof pdfScanner === 'function') {
            this.deps.pdfScanner = pdfScanner;
        }
    }

    setTemplatePathResolverForTest(templatePathResolver) {
        if (typeof templatePathResolver === 'function') {
            this.deps.templatePathResolver = templatePathResolver;
        }
    }

    resetDepsForTest() {
        this.deps = {
            ...this.defaultDeps
        };
    }

    _persistPreferences(overrides = {}) {
        this.preferences = this.preferencesStore.save({
            ...this.preferences,
            ...overrides
        });
    }

    _loadPaperStockCatalog() {
        return this.paperStockCatalogLoader({
            paperStockCatalog: this.paperStockCatalogSource
        });
    }

    _refreshPaperStockCatalog() {
        const selectedStockId = this.state ? this.state.paperStock : '';
        const nextCatalog = this._loadPaperStockCatalog();

        this.paperStockCatalog = nextCatalog;
        if (
            this.state &&
            (!selectedStockId || !nextCatalog.stocksById[selectedStockId])
        ) {
            this.state.paperStock = nextCatalog.defaultStockId;
        }

        return nextCatalog;
    }

    _resetState(preserveOutputDirectory = true) {
        const nextPrefs = {
            ...this.preferences,
            lastSaveDirectory: preserveOutputDirectory ? this.state.outputDirectory : this.preferences.lastSaveDirectory
        };
        this.state = buildEmptyState(nextPrefs, this.paperStockCatalog);
    }

    _buildPlannerState() {
        return {
            ...this.state,
            paperStockCatalog: this.paperStockCatalog
        };
    }

    _syncInvitePagesWithManifest() {
        syncInvitePagesWithManifest(this);
    }

    _clearLastOutputPath() {
        this.state.lastOutputPath = '';
    }

    _applySourcePath(sourcePath) {
        applySourcePath(this, sourcePath);
    }

    async _resolveSourceBrowseDirectory() {
        return resolveSourceBrowseDirectory(this);
    }

    async refreshSourceManifest() {
        return runRefreshSourceManifest(this);
    }

    async _pickSourceFile() {
        return runPickSourceFile(this);
    }

    async _pickOutputDirectory() {
        return pickOutputDirectory(this);
    }

    async _useActiveDocumentAsSource() {
        return useActiveDocumentAsSource(this);
    }

    _createBuildError(result) {
        return createBuildError(result);
    }

    _handleBuildError(error) {
        return handleBuildError(error);
    }

    _persistBuildDirectories(request) {
        this._persistPreferences({
            lastSaveDirectory: request.output.directory,
            lastSourceDirectory: dirname(request.sourcePath || this.state.sourcePath)
        });
    }

    _showBuildSuccess(result, request) {
        return showBuildSuccess(result, request);
    }

    async _runBuild() {
        return runBuild(this);
    }

    _flushToastState() {
        return flushToastState();
    }

    _handleFieldChange(event) {
        const target = event.target;
        if (!target) {
            return;
        }

        const name = target.name || '';
        const value = target.value;

        switch (name) {
        case 'paperStock':
            this.state.paperStock = value;
            this._clearLastOutputPath();
            break;
        case 'hasDraftCard':
            this.state.hasDraftCard = !!target.checked;
            this.state.draftCardDetectionMode = 'manual';
            this._clearLastOutputPath();
            this._syncInvitePagesWithManifest();
            break;
        case 'draftCardCount':
            this.state.draftCardCount = clampDraftCardCount(value);
            this._clearLastOutputPath();
            this._syncInvitePagesWithManifest();
            break;
        case 'pairInfoInvitePages':
            this.state.pairInfoInvitePages = !!target.checked;
            if (this.state.pairInfoInvitePages) {
                this.state.combinedInfoInvitePage = false;
            }
            this._clearLastOutputPath();
            this._syncInvitePagesWithManifest();
            break;
        case 'combinedInfoInvitePage':
            this.state.combinedInfoInvitePage = !!target.checked;
            if (this.state.combinedInfoInvitePage) {
                this.state.pairInfoInvitePages = false;
            }
            this._clearLastOutputPath();
            this._syncInvitePagesWithManifest();
            break;
        default:
            return;
        }

        this.render();
    }

    _handleClick(event) {
        const actionTarget = event.target && typeof event.target.closest === 'function'
            ? event.target.closest('[data-action]')
            : event.target;
        const action = actionTarget && actionTarget.getAttribute('data-action');
        if (!action) {
            return;
        }

        event.preventDefault();

        if (action === 'pick-source-file') {
            this._pickSourceFile();
        } else if (action === 'pick-output-directory') {
            this._pickOutputDirectory();
        } else if (action === 'use-active-pdf-source') {
            this._useActiveDocumentAsSource();
        } else if (action === 'build-pdf') {
            this._runBuild();
        } else if (action === 'reset-workflow') {
            this._resetState(true);
            this.render();
        }
    }

    _renderPreview(plan) {
        return renderWeddingSuitePreview({ state: this.state, plan });
    }

    render() {
        if (!this.container) {
            return;
        }

        const plan = buildWeddingSuitePlan(this._buildPlannerState());
        const stock = resolvePaperStock(this.paperStockCatalog, this.state.paperStock);
        this.container.innerHTML = renderWeddingSuiteMarkup({
            state: this.state,
            plan,
            stock,
            paperStockCatalog: this.paperStockCatalog
        });
    }
}
