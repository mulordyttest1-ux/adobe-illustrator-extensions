import { UIFeedback } from '@shared/cep-ui';

import {
    createWeddingSuiteBridgeAdapter,
    pickDirectory,
    pickSourceFile,
    resolveWeddingSuiteTemplatePath
} from './bridgeAdapter.js';
import { PDF_ONLY_SOURCE_ERROR, isPdfSourcePath, scanPdfManifest } from './pdfManifestScanner.js';
import { buildWeddingSuiteBuildRequest, buildWeddingSuitePlan } from './planner.js';
import {
    loadWeddingSuitePaperStockCatalog,
    normalizePaperStockCatalog,
    resolvePaperStock
} from './paperStockConfig.js';
import { resolveWeddingSuitePreferencesStore } from './preferencesStore.js';

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
}

function dirname(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash > 0 ? normalized.slice(0, lastSlash) : normalized;
}

function basename(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

function stripExtension(filename) {
    const safeName = String(filename || '');
    const lastDot = safeName.lastIndexOf('.');
    return lastDot > 0 ? safeName.slice(0, lastDot) : safeName;
}

function resolveOutputBrowseDirectory(state, preferences) {
    if (state && state.outputDirectory) {
        return state.outputDirectory;
    }

    if (preferences && preferences.lastSaveDirectory) {
        return preferences.lastSaveDirectory;
    }

    if (state && state.sourcePath) {
        return dirname(state.sourcePath);
    }

    if (preferences && preferences.lastSourceDirectory) {
        return preferences.lastSourceDirectory;
    }

    return '';
}

function buildDefaultInviteLabel(page, index) {
    return page.name || page.sourceName || `Thiep moi ${index + 1}`;
}

function normalizeManifestPage(page = null, fallbackPageNumber = 1) {
    if (!page) {
        return null;
    }

    return {
        pageNumber: Number(page.pageNumber) || fallbackPageNumber,
        sourceIndex: Number(page.sourceIndex),
        sourceName: page.name || page.sourceName || `Page ${fallbackPageNumber}`,
        widthMm: Number(page.widthMm) || 0,
        heightMm: Number(page.heightMm) || 0
    };
}

function getManifestLastPage(manifest = null) {
    if (manifest && manifest.lastPage) {
        return normalizeManifestPage(
            manifest.lastPage,
            Number(manifest.lastPage.pageNumber) || Math.max(1, Number(manifest.totalPages) || 1)
        );
    }

    const pages = manifest && Array.isArray(manifest.pages) ? manifest.pages : [];
    return pages.length ? normalizeManifestPage(pages[pages.length - 1], pages.length) : null;
}

function buildPageArea(page = null) {
    if (!page) {
        return 0;
    }

    return Math.max(0, Number(page.widthMm) || 0) * Math.max(0, Number(page.heightMm) || 0);
}

function clampDraftCardCount(value) {
    const parsed = parseInt(value, 10);
    return Math.max(1, Number.isFinite(parsed) ? parsed : 1);
}

function canUseDraftCard(manifest = null) {
    const pages = manifest && Array.isArray(manifest.pages) ? manifest.pages : [];
    const lastPage = getManifestLastPage(manifest);
    const lastPageNumber = lastPage ? Number(lastPage.pageNumber) || 0 : 0;

    if (!lastPage || lastPageNumber < 4) {
        return false;
    }

    return pages.some((page) => {
        const pageNumber = Number(page.pageNumber) || 0;
        return pageNumber >= 3 && pageNumber <= Math.min(5, lastPageNumber - 1);
    });
}

function shouldAutoEnableDraftCard(manifest = null) {
    const pages = manifest && Array.isArray(manifest.pages) ? manifest.pages : [];
    const lastPage = getManifestLastPage(manifest);
    const previousPageNumber = lastPage ? Number(lastPage.pageNumber) - 1 : -1;
    const previousPage = pages.find((page) => Number(page.pageNumber) === previousPageNumber) || null;
    const lastArea = buildPageArea(lastPage);
    const previousArea = buildPageArea(previousPage);

    if (!canUseDraftCard(manifest) || !(lastArea > 0) || !(previousArea > 0)) {
        return false;
    }

    return lastArea < (previousArea / 2);
}

function buildDefaultFilenameStem(sourcePath, manifest = null) {
    const sourceName = manifest && manifest.sourceName ? manifest.sourceName : basename(sourcePath);
    const stem = stripExtension(sourceName).trim();
    return `bài in ${stem || 'info'}`;
}

function resolveInviteEndPage(manifest = null, hasDraftCard = false, draftCardCount = 1) {
    const pages = manifest && Array.isArray(manifest.pages) ? manifest.pages : [];
    const lastPage = hasDraftCard ? getManifestLastPage(manifest) : null;

    if (lastPage) {
        return Math.max(2, Number(lastPage.pageNumber) - clampDraftCardCount(draftCardCount));
    }

    return pages.length
        ? Math.max(...pages.map((page) => Number(page.pageNumber) || 0))
        : 0;
}

function resolveInviteRowsEndPage({ manifest, hasDraftCard, draftCardCount, pairInfoInvitePages, combinedInfoInvitePage }) {
    const endPage = resolveInviteEndPage(manifest, hasDraftCard, draftCardCount);
    return pairInfoInvitePages || combinedInfoInvitePage
        ? endPage
        : Math.min(5, endPage || 5);
}

function shouldIncludeInviteRowPage({ pageNumber, inviteEndPage, pairInfoInvitePages, combinedInfoInvitePage, pageByNumber }) {
    const minimumPageNumber = combinedInfoInvitePage ? 2 : 3;
    if (pageNumber < minimumPageNumber || pageNumber > inviteEndPage) {
        return false;
    }

    if (!pairInfoInvitePages || combinedInfoInvitePage) {
        return true;
    }

    return pageNumber % 2 === 1 && pageByNumber.has(pageNumber - 1);
}

function buildInviteRows({
    manifest = null,
    currentRows = [],
    hasDraftCard = false,
    draftCardCount = 1,
    pairInfoInvitePages = false,
    combinedInfoInvitePage = false
} = {}) {
    const currentByPage = new Map(
        (Array.isArray(currentRows) ? currentRows : [])
            .map((row) => [Number(row.pageNumber), row])
    );
    const pages = manifest && Array.isArray(manifest.pages) ? manifest.pages : [];
    const inviteEndPage = resolveInviteRowsEndPage({
        manifest,
        hasDraftCard,
        draftCardCount,
        pairInfoInvitePages,
        combinedInfoInvitePage
    });
    const pageByNumber = new Map(pages.map((page) => [Number(page.pageNumber), page]));

    return pages
        .filter((page) => {
            const pageNumber = Number(page.pageNumber);
            return shouldIncludeInviteRowPage({
                pageNumber,
                inviteEndPage,
                pairInfoInvitePages,
                combinedInfoInvitePage,
                pageByNumber
            });
        })
        .map((page, index) => {
            const pageNumber = Number(page.pageNumber);
            const existing = currentByPage.get(Number(page.pageNumber));
            const infoPage = pairInfoInvitePages ? pageByNumber.get(pageNumber - 1) : null;
            return {
                pageNumber,
                sourceIndex: Number(page.sourceIndex),
                sourceName: page.name || page.sourceName || `Page ${page.pageNumber}`,
                widthMm: Number(page.widthMm) || 0,
                heightMm: Number(page.heightMm) || 0,
                label: existing && existing.label ? existing.label : buildDefaultInviteLabel(page, index),
                quantity: existing ? existing.quantity : 0,
                infoPageNumber: infoPage ? Number(infoPage.pageNumber) : 0,
                combinedInfoInvitePage
            };
        });
}

function buildEmptyState(preferences = {}, paperStockCatalog = null) {
    const normalizedCatalog = normalizePaperStockCatalog(paperStockCatalog);

    return {
        sourcePath: '',
        manifest: null,
        paperStock: normalizedCatalog.defaultStockId,
        envelopeCount: 1,
        infoCount: 1,
        jobQuantity: 1,
        invitePages: [],
        pairInfoInvitePages: false,
        combinedInfoInvitePage: false,
        hasDraftCard: false,
        draftCardCount: 1,
        draftCardDetectionMode: 'auto',
        outputDirectory: preferences.lastSaveDirectory || '',
        filenameStem: 'info',
        lastOutputPath: ''
    };
}

function buildPreviewUsageText(plan) {
    return `Kho giay huu dung: ${plan.usableWidthMm} x ${plan.usableHeightMm} mm`;
}

const OUTPUT_FILE_UNSAVED_OPEN_CODE = 'OUTPUT_FILE_UNSAVED_OPEN';
const OUTPUT_FILE_UNSAVED_OPEN_MESSAGE = 'File bai in hien dang mo va chua luu. Hay luu hoac dong file do roi chay Binh Bo Thiep lai.';
const ACTIVE_SOURCE_NO_DOCUMENT_MESSAGE = 'Khong co file dang mo trong Illustrator.';
const ACTIVE_SOURCE_UNSAVED_MESSAGE = 'File PDF dang mo chua luu. Hay luu file roi bam lai.';
const ACTIVE_SOURCE_NOT_PDF_MESSAGE = 'File dang mo khong phai PDF nguon cho Bo Thiep.';
const ACTIVE_SOURCE_SUCCESS_MESSAGE = 'Da lay file PDF dang mo lam source.';

function resolveActiveSourceErrorMessage(result) {
    if (result && result.code === 'NO_ACTIVE_DOCUMENT') {
        return {
            message: ACTIVE_SOURCE_NO_DOCUMENT_MESSAGE,
            type: 'warning'
        };
    }

    if (result && result.code === 'ACTIVE_DOCUMENT_UNSAVED') {
        return {
            message: ACTIVE_SOURCE_UNSAVED_MESSAGE,
            type: 'warning'
        };
    }

    if (result && result.code === 'ACTIVE_DOCUMENT_NOT_PDF') {
        return {
            message: ACTIVE_SOURCE_NOT_PDF_MESSAGE,
            type: 'warning'
        };
    }

    return {
        message: (result && result.error) || 'Khong the doc file dang mo trong Illustrator.',
        type: 'error'
    };
}

function buildManifestStatusText(manifest = null) {
    if (!manifest) {
        return 'Dang cho file PDF nguon.';
    }

    return `Doc duoc ${manifest.totalPages || 0} page PDF. Mac dinh page 1 bao thu, page 2 info, page 3-5 thiep moi; co the bat mode 1 page du bo hoac ghep cap page roi.`;
}

function buildDraftCardMarkup(state, showDraftToggle, autoDraftNote) {
    if (!showDraftToggle) {
        return '';
    }

    const draftCount = clampDraftCardCount(state.draftCardCount);

    return `
        <label class="checkbox-row">
            <input type="checkbox" name="hasDraftCard"${state.hasDraftCard ? ' checked' : ''}>
            <span class="checkbox-label">Thiep an nhap (cac page cuoi)</span>
        </label>
        <label class="wss-inline-field">
            <span class="panel-field-label">So page thiep an nhap</span>
            <input class="panel-input" type="number" name="draftCardCount" min="1" step="1" value="${draftCount}"${state.hasDraftCard ? '' : ' disabled'}>
        </label>
        <div class="panel-helper-text">
            Khi bat, N page cuoi se duoc tach thanh N artboard rieng va giu dung kich thuoc goc tung page.
        </div>
        ${autoDraftNote ? `
        <div class="panel-helper-text">
            Da tu dong bat vi page cuoi co dien tich nho hon 1/2 page lien ke.
        </div>
        ` : ''}
    `;
}

function buildPairModeMarkup(state, showPairToggle) {
    if (!showPairToggle) {
        return '';
    }

    return `
        <label class="checkbox-row">
            <input type="checkbox" name="combinedInfoInvitePage"${state.combinedInfoInvitePage ? ' checked' : ''}>
            <span class="checkbox-label">Ghep cap trong 1 page: trai thiep bao, phai thiep moi</span>
        </label>
        <div class="panel-helper-text">
            Dung khi moi page PDF da la mot bo ngang lon gap doi. He thong chi lap 4 ban 2x2 tren mot artboard, khong chia top/bottom 8 ban.
        </div>
        <label class="checkbox-row">
            <input type="checkbox" name="pairInfoInvitePages"${state.pairInfoInvitePages ? ' checked' : ''}${state.combinedInfoInvitePage ? ' disabled' : ''}>
            <span class="checkbox-label">Page roi: ghep to bao + thiep moi</span>
        </label>
        <div class="panel-helper-text">
            Khi bat, he thong ghep page 2-3, 4-5, 6-7... thay vi lay mot to bao page 2 cho moi thiep moi.
        </div>
    `;
}

function buildSourceSectionMarkup(state, manifest, sourceName) {
    return `
        <section class="panel-card">
            <div class="panel-eyebrow">Source</div>
            <div class="panel-section-title">${escapeHtml(sourceName || 'Chua chon file nguon')}</div>
            <div class="wss-two-col">
                <label class="wss-inline-field wss-grow">
                    <span class="panel-field-label">Duong dan PDF</span>
                    <input class="panel-input" type="text" value="${escapeAttr(state.sourcePath)}" readonly>
                </label>
                <div class="wss-inline-field">
                    <span class="panel-field-label">Manifest</span>
                    <div class="panel-helper-text">${buildManifestStatusText(manifest)}</div>
                </div>
            </div>
            <div class="config-footer-actions">
                <button type="button" class="outline" data-action="use-active-pdf-source">Lay PDF dang mo</button>
                <button type="button" class="outline" data-action="pick-source-file">Chon file PDF khac</button>
                <button type="button" class="outline" data-action="reset-workflow">Lam moi</button>
            </div>
        </section>
    `;
}

function buildQuickOptionsSectionMarkup({
    state,
    plan,
    stock,
    paperStockCatalog,
    showPairToggle,
    showDraftToggle,
    autoDraftNote
}) {
    const normalizedCatalog = normalizePaperStockCatalog(paperStockCatalog);

    return `
        <section class="panel-card">
            <div class="panel-eyebrow">Nhap nhanh</div>
            <div class="panel-section-title">Loai giay</div>
            <div class="wss-two-col">
                <label class="wss-inline-field">
                    <span class="panel-field-label">Loai giay</span>
                    <select class="panel-select" name="paperStock">
                        ${normalizedCatalog.stockOrder.map((paperId) => {
        const paper = normalizedCatalog.stocksById[paperId];
        return `<option value="${paper.id}"${paper.id === state.paperStock ? ' selected' : ''}>${escapeHtml(paper.label)}</option>`;
    }).join('')}
                    </select>
                </label>
            </div>
            ${buildPairModeMarkup(state, showPairToggle)}
            ${buildDraftCardMarkup(state, showDraftToggle, autoDraftNote)}
            <div class="panel-helper-text">
                ${escapeHtml(stock.label)} | ${escapeHtml(buildPreviewUsageText(plan))}
            </div>
            <div class="panel-helper-text">
                Thu muc luu co dinh: <strong>${escapeHtml(state.outputDirectory || 'Chua chon')}</strong>
            </div>
            <div class="panel-helper-text">
                PDF xuat: <strong>${escapeHtml(state.filenameStem)}.pdf</strong><br>
                Khong con tu dong luu cung thu muc file nguon.
            </div>
            <div class="config-footer-actions">
                <button type="button" class="outline" data-action="pick-output-directory">Chon thu muc luu</button>
                <button type="button" class="contrast" data-action="build-pdf"${plan.valid ? '' : ' disabled'}>Build PDF</button>
            </div>
        </section>
    `;
}

function usesDraftTailPage(lastPage = null, hasDraftCard = false, consumesAllSuitePages = false) {
    return !!(hasDraftCard && lastPage && Number(lastPage.pageNumber) > 5 && !consumesAllSuitePages);
}

function buildIgnoredPageCount({
    manifest = null,
    lastPage = null,
    hasDraftCard = false,
    draftCardCount = 1,
    consumesAllSuitePages = false
} = {}) {
    if (!manifest || !(manifest.totalPages > 5) || consumesAllSuitePages) {
        return 0;
    }

    return Math.max(
        0,
        manifest.totalPages - 5 - (usesDraftTailPage(lastPage, hasDraftCard, consumesAllSuitePages) ? clampDraftCardCount(draftCardCount) : 0)
    );
}

function buildInviteSummaryText(invitePages = [], pairMode = false, combinedMode = false) {
    if (!invitePages.length) {
        if (combinedMode) {
            return 'Chua doc duoc page bo thiep tu page 2 tro di.';
        }
        return pairMode ? 'Chua doc duoc cap page 2-3, 4-5...' : 'Chua doc duoc page 3-5.';
    }

    return invitePages.map((page) => {
        if (combinedMode || page.combinedInfoInvitePage) {
            return `Page ${page.pageNumber}: ${page.sourceName || page.label || 'Bo thiep'} (1 page du bo)`;
        }
        if (pairMode && page.infoPage) {
            return `Page ${page.infoPage.pageNumber}-${page.pageNumber}: ${page.infoPage.sourceName || 'To bao'} + ${page.sourceName || page.label || 'Thiep moi'}`;
        }

        return `Page ${page.pageNumber}: ${page.sourceName || page.label || 'Khong ten'}`;
    }).join(' | ');
}

function buildWorkflowSummaryText(pairMode = false, combinedMode = false) {
    if (combinedMode) {
        return 'Page 1 = Bao thu | Page 2, 3, 4... = tung page da gom thiep bao + thiep moi theo chieu ngang; moi page lap 2x2 tren mot artboard.';
    }

    return pairMode
        ? 'Page 1 = Bao thu | Page 2-3, 4-5, 6-7... = tung cap to bao + thiep moi. Cac page cuoi co the la thiep an nhap.'
        : 'Page 1 = Bao thu | Page 2 = Info | Page 3-5 = Thiep moi. Cac page cuoi co the la thiep an nhap.';
}

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
            pickSourceFile: pickSourceFileImpl = pickSourceFile,
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
        this.state.invitePages = buildInviteRows({
            manifest: this.state.manifest,
            currentRows: this.state.invitePages,
            hasDraftCard: this.state.hasDraftCard,
            draftCardCount: this.state.draftCardCount,
            pairInfoInvitePages: this.state.pairInfoInvitePages,
            combinedInfoInvitePage: this.state.combinedInfoInvitePage
        });
    }

    _clearLastOutputPath() {
        this.state.lastOutputPath = '';
    }

    _applySourcePath(sourcePath) {
        this.state.sourcePath = sourcePath;
        this.state.manifest = null;
        this.state.invitePages = [];
        this.state.pairInfoInvitePages = false;
        this.state.combinedInfoInvitePage = false;
        this.state.hasDraftCard = false;
        this.state.draftCardCount = 1;
        this.state.draftCardDetectionMode = 'auto';
        this.state.filenameStem = buildDefaultFilenameStem(sourcePath);
        this._clearLastOutputPath();
        this._persistPreferences({ lastSourceDirectory: dirname(sourcePath) });
    }

    async _resolveSourceBrowseDirectory() {
        if (this.state.sourcePath) {
            return dirname(this.state.sourcePath);
        }

        if (this.preferences.lastSourceDirectory) {
            return this.preferences.lastSourceDirectory;
        }

        if (this.preferences.lastSaveDirectory) {
            return this.preferences.lastSaveDirectory;
        }

        if (
            this.deps.hostAdapter &&
            typeof this.deps.hostAdapter.getActiveDocumentDirectory === 'function'
        ) {
            try {
                const result = await this.deps.hostAdapter.getActiveDocumentDirectory();
                if (result && result.success && result.directory) {
                    return String(result.directory);
                }
            } catch (error) {
                console.warn('[WeddingSuiteStandard] Failed to resolve active document directory:', error);
            }
        }

        return '';
    }

    async refreshSourceManifest() {
        if (!this.state.sourcePath) {
            UIFeedback.showToast('Can chon file PDF truoc khi doc page.', 'warning');
            return;
        }

        try {
            if (!isPdfSourcePath(this.state.sourcePath)) {
                throw new Error(PDF_ONLY_SOURCE_ERROR);
            }

            const manifest = await this.deps.pdfScanner(this.state.sourcePath);
            this.state.manifest = manifest;
            this.state.filenameStem = buildDefaultFilenameStem(this.state.sourcePath, manifest);
            if (!canUseDraftCard(manifest)) {
                this.state.hasDraftCard = false;
                this.state.draftCardDetectionMode = 'auto';
            } else if (this.state.draftCardDetectionMode !== 'manual') {
                this.state.hasDraftCard = shouldAutoEnableDraftCard(manifest);
                this.state.draftCardDetectionMode = 'auto';
            }
            this._clearLastOutputPath();
            this._syncInvitePagesWithManifest();
            this.render();
            UIFeedback.showToast('Da doc metadata page cua file PDF.', 'success');
        } catch (error) {
            this.state.manifest = null;
            this.state.invitePages = [];
            this.state.pairInfoInvitePages = false;
            this.state.combinedInfoInvitePage = false;
            this.state.hasDraftCard = false;
            this.state.draftCardCount = 1;
            this.state.draftCardDetectionMode = 'auto';
            this._clearLastOutputPath();
            this.render();
            UIFeedback.showToast(error.message || 'Khong the doc metadata PDF nguon.', 'error');
        }
    }

    async _pickSourceFile() {
        const initialPath = await this._resolveSourceBrowseDirectory();
        const picked = await Promise.resolve(this.deps.pickSourceFile(initialPath));

        if (picked === '__PICKER_UNAVAILABLE__') {
            UIFeedback.showToast('Panel khong mo duoc hop chon file. Thu reload panel roi bam lai.', 'warning');
            return;
        }

        if (picked === '__PICKER_ERROR__') {
            UIFeedback.showToast('Khong mo duoc hop chon file nguon. Thu mo lai panel roi bam lai.', 'error');
            return;
        }

        if (!picked) {
            return;
        }

        this._applySourcePath(picked);
        await this.refreshSourceManifest();
    }

    async _pickOutputDirectory() {
        const initialPath = resolveOutputBrowseDirectory(this.state, this.preferences);
        const picked = await Promise.resolve(this.deps.pickDirectory(initialPath));

        if (picked === '__PICKER_ERROR__') {
            UIFeedback.showToast('Khong mo duoc hop chon thu muc luu. Thu mo lai panel roi bam lai.', 'error');
            return;
        }

        if (!picked) {
            return;
        }

        this.state.outputDirectory = picked;
        this._clearLastOutputPath();
        this._persistPreferences({ lastSaveDirectory: picked });
        this.render();
        UIFeedback.showToast('Da cap nhat thu muc luu PDF co dinh.', 'success');
    }

    async _useActiveDocumentAsSource() {
        const hostAdapter = this.deps.hostAdapter;
        let result;

        if (!hostAdapter || typeof hostAdapter.getActiveDocumentSourceInfo !== 'function') {
            UIFeedback.showToast('Panel chua ho tro doc file PDF dang mo tren may nay.', 'error');
            return;
        }

        try {
            result = await hostAdapter.getActiveDocumentSourceInfo();
        } catch (error) {
            UIFeedback.showToast(error.message || 'Khong the doc file dang mo trong Illustrator.', 'error');
            return;
        }

        if (!result || !result.success) {
            const errorState = resolveActiveSourceErrorMessage(result);
            UIFeedback.showToast(errorState.message, errorState.type);
            return;
        }

        this._applySourcePath(result.path);
        UIFeedback.showToast(ACTIVE_SOURCE_SUCCESS_MESSAGE, 'success');
        await this.refreshSourceManifest();
    }

    _createBuildError(result) {
        const code = result && result.code ? result.code : '';
        const message = code === OUTPUT_FILE_UNSAVED_OPEN_CODE
            ? OUTPUT_FILE_UNSAVED_OPEN_MESSAGE
            : (result && result.error ? result.error : 'Build job that bai');
        const buildError = new Error(message);
        buildError.code = code;
        return buildError;
    }

    _handleBuildError(error) {
        if (error && error.code === OUTPUT_FILE_UNSAVED_OPEN_CODE) {
            this._flushToastState();
        }

        UIFeedback.showToast(error.message || 'Khong the build job.', 'error');
    }

    _persistBuildDirectories(request) {
        this._persistPreferences({
            lastSaveDirectory: request.output.directory,
            lastSourceDirectory: dirname(request.sourcePath || this.state.sourcePath)
        });
    }

    _showBuildSuccess(result, request) {
        const outputLabel = result.outputPath || `${request.output.filenameStem}.pdf`;
        UIFeedback.showToast(
            result.openedOutput
                ? `Da build va mo PDF: ${outputLabel}`
                : `Da build PDF: ${outputLabel}`,
            'success'
        );
        if (result.openOutputWarning) {
            UIFeedback.showToast(`PDF da luu nhung khong tu mo duoc: ${result.openOutputWarning}`, 'warning');
        }
        if (result.tempCleanupWarning) {
            UIFeedback.showToast(`PDF da luu nhung con file tam can don: ${result.tempCleanupWarning}`, 'warning');
        }
        if (result.previousOutputDeleteError) {
            UIFeedback.showToast(`Da build ban moi, nhung chua xoa duoc file cu: ${result.previousOutputDeleteError}`, 'warning');
        }
    }

    async _runBuild() {
        this._refreshPaperStockCatalog();
        const request = buildWeddingSuiteBuildRequest(this._buildPlannerState(), {
            templatePath: this.deps.templatePathResolver(),
            now: this.deps.now
        });
        const plan = request.plan;

        if (!plan.valid) {
            UIFeedback.showToast(plan.errors[0] || 'Plan chua hop le.', 'error');
            this.render();
            return;
        }

        if (!request.output.directory) {
            UIFeedback.showToast('Khong xac dinh duoc thu muc luu PDF.', 'warning');
            return;
        }

        try {
            UIFeedback.showToast('Dang build PDF...', 'info');
            const result = await this.deps.hostAdapter.buildJob(request);

            if (!result || !result.success) {
                throw this._createBuildError(result);
            }

            this.state.lastOutputPath = result.outputPath || '';
            this._persistBuildDirectories(request);
            this.render();
            this._showBuildSuccess(result, request);
        } catch (error) {
            this._handleBuildError(error);
        }
    }

    _flushToastState() {
        const toastContainer = typeof document !== 'undefined'
            ? document.getElementById('toast-container')
            : null;

        if (toastContainer) {
            toastContainer.innerHTML = '';
        }

        if (Array.isArray(UIFeedback._toastQueue)) {
            UIFeedback._toastQueue.length = 0;
        }

        UIFeedback._isShowingToast = false;
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
        const manifest = this.state.manifest;
        const pairMode = !!plan.pairInfoInvitePages;
        const combinedMode = !!plan.combinedInfoInvitePage;
        const consumesAllSuitePages = pairMode || combinedMode;
        const lastPage = getManifestLastPage(manifest);
        const ignoredCount = buildIgnoredPageCount({
            manifest,
            lastPage,
            hasDraftCard: this.state.hasDraftCard,
            draftCardCount: this.state.draftCardCount,
            consumesAllSuitePages
        });
        const inviteSummary = buildInviteSummaryText(plan.sourcePages.invites || [], pairMode, combinedMode);
        const outputSummary = this.state.outputDirectory
            ? `${this.state.outputDirectory}/${this.state.filenameStem}.pdf`
            : `${this.state.filenameStem}.pdf`;

        return `
            <div class="wss-summary-grid">
                <div class="panel-card panel-card-compact wss-summary-card">
                    <div class="panel-eyebrow">Kho giay</div>
                    <div class="panel-helper-text">${escapeHtml(buildPreviewUsageText(plan))}</div>
                </div>
                <div class="panel-card panel-card-compact wss-summary-card">
                    <div class="panel-eyebrow">PDF output</div>
                    <div class="panel-helper-text">${escapeHtml(outputSummary)}</div>
                </div>
                <div class="panel-card panel-card-compact wss-summary-card">
                    <div class="panel-eyebrow">Page du</div>
                    <div class="panel-helper-text">${ignoredCount > 0 ? `Bo qua ${ignoredCount} page ngoai workflow.` : 'Khong co page du.'}</div>
                </div>
            </div>
            <div class="panel-helper-text">
                ${buildWorkflowSummaryText(pairMode, combinedMode)}
            </div>
            <div class="panel-helper-text">
                ${escapeHtml(inviteSummary)}
            </div>
        `;
    }

    render() {
        if (!this.container) {
            return;
        }

        const plan = buildWeddingSuitePlan(this._buildPlannerState());
        const stock = resolvePaperStock(this.paperStockCatalog, this.state.paperStock);
        const manifest = this.state.manifest;
        const hasSource = !!this.state.sourcePath;
        const showPairToggle = hasSource;
        const showDraftToggle = hasSource;
        const autoDraftNote = canUseDraftCard(manifest) && this.state.hasDraftCard && this.state.draftCardDetectionMode !== 'manual';
        const sourceName = manifest ? (manifest.sourceName || this.state.sourcePath) : basename(this.state.sourcePath);
        const primaryActionLabel = 'Chon file PDF';
        const errorBox = plan.errors.length
            ? `<div class="wss-error-box">${plan.errors.map((entry) => `<div>${escapeHtml(entry)}</div>`).join('')}</div>`
            : '';

        this.container.innerHTML = `
            <div class="wss-shell">
                <section class="panel-card">
                    <div class="panel-eyebrow">Wedding Suite Standard</div>
                    <div class="panel-section-title">Binh bo thiep theo file PDF</div>
                    <div class="panel-helper-text">
                        Ban bam nut de chon file PDF truoc. Sau khi doc xong, he thong moi hien loai giay. QA se dung cung kho giay in, chi de lai ten file, va page cuoi co the duoc tach thanh thiep an nhap.
                    </div>
                    ${hasSource ? '' : `
                    <div class="config-footer-actions">
                        <button type="button" class="contrast" data-action="pick-source-file">${primaryActionLabel}</button>
                        <button type="button" class="outline" data-action="use-active-pdf-source">Lay PDF dang mo</button>
                        <button type="button" class="outline" data-action="pick-output-directory">Chon thu muc luu</button>
                    </div>
                    `}
                </section>

                ${hasSource ? `
                ${buildSourceSectionMarkup(this.state, manifest, sourceName)}
                ${buildQuickOptionsSectionMarkup({
        state: this.state,
        plan,
        stock,
        paperStockCatalog: this.paperStockCatalog,
        showPairToggle,
        showDraftToggle,
        autoDraftNote
    })}

                ${errorBox}
                ` : ''}
            </div>
        `;
    }
}
