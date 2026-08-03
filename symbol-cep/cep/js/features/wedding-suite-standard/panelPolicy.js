import { normalizePaperStockCatalog } from './paperStockConfig.js';

export function dirname(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash > 0 ? normalized.slice(0, lastSlash) : normalized;
}

export function basename(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

function stripExtension(filename) {
    const safeName = String(filename || '');
    const lastDot = safeName.lastIndexOf('.');
    return lastDot > 0 ? safeName.slice(0, lastDot) : safeName;
}

export function resolveOutputBrowseDirectory(state, preferences) {
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

export function getManifestLastPage(manifest = null) {
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

export function clampDraftCardCount(value) {
    const parsed = parseInt(value, 10);
    return Math.max(1, Number.isFinite(parsed) ? parsed : 1);
}

export function canUseDraftCard(manifest = null) {
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

export function shouldAutoEnableDraftCard(manifest = null) {
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

export function buildDefaultFilenameStem(sourcePath, manifest = null) {
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

export function buildInviteRows({
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

export function buildEmptyState(preferences = {}, paperStockCatalog = null) {
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

export const OUTPUT_FILE_UNSAVED_OPEN_CODE = 'OUTPUT_FILE_UNSAVED_OPEN';
export const OUTPUT_FILE_UNSAVED_OPEN_MESSAGE = 'File bai in hien dang mo va chua luu. Hay luu hoac dong file do roi chay Binh Bo Thiep lai.';
export const PDF_EXPORT_FAILED_CODE = 'WEDDING_SUITE_PDF_EXPORT_FAILED';
export const ACTIVE_SOURCE_NO_DOCUMENT_MESSAGE = 'Khong co file dang mo trong Illustrator.';
export const ACTIVE_SOURCE_UNSAVED_MESSAGE = 'File PDF dang mo chua luu. Hay luu file roi bam lai.';
export const ACTIVE_SOURCE_NOT_PDF_MESSAGE = 'File dang mo khong phai PDF nguon cho Bo Thiep.';
export const ACTIVE_SOURCE_SUCCESS_MESSAGE = 'Da lay file PDF dang mo lam source.';

export function resolveActiveSourceErrorMessage(result) {
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

// This mirrors the existing page-tail policy; keep the extraction behavior exact.
// eslint-disable-next-line complexity
export function buildIgnoredPageCount({
    manifest = null,
    lastPage = null,
    hasDraftCard = false,
    draftCardCount = 1,
    consumesAllSuitePages = false
} = {}) {
    if (!manifest || !(manifest.totalPages > 5) || consumesAllSuitePages) {
        return 0;
    }

    const usesDraftTailPage = hasDraftCard && lastPage &&
        Number(lastPage.pageNumber) > 5 && !consumesAllSuitePages;

    return Math.max(
        0,
        manifest.totalPages - 5 - (usesDraftTailPage ? clampDraftCardCount(draftCardCount) : 0)
    );
}
