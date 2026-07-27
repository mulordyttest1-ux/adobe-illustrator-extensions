import { UIFeedback } from '@shared/cep-ui';

import { PDF_ONLY_SOURCE_ERROR, isPdfSourcePath } from './pdfManifestScanner.js';
import { buildWeddingSuiteBuildRequest } from './planner.js';
import {
    ACTIVE_SOURCE_SUCCESS_MESSAGE,
    OUTPUT_FILE_UNSAVED_OPEN_CODE,
    OUTPUT_FILE_UNSAVED_OPEN_MESSAGE,
    buildDefaultFilenameStem,
    buildInviteRows,
    canUseDraftCard,
    dirname,
    resolveActiveSourceErrorMessage,
    resolveOutputBrowseDirectory,
    shouldAutoEnableDraftCard
} from './panelPolicy.js';

export function persistPreferences(tab, overrides = {}) {
    tab.preferences = tab.preferencesStore.save({
        ...tab.preferences,
        ...overrides
    });
}

export async function resolveSourceBrowseDirectory(tab) {
    if (tab.state.sourcePath) {
        return dirname(tab.state.sourcePath);
    }

    if (tab.preferences.lastSourceDirectory) {
        return tab.preferences.lastSourceDirectory;
    }

    if (tab.preferences.lastSaveDirectory) {
        return tab.preferences.lastSaveDirectory;
    }

    if (
        tab.deps.hostAdapter &&
        typeof tab.deps.hostAdapter.getActiveDocumentDirectory === 'function'
    ) {
        try {
            const result = await tab.deps.hostAdapter.getActiveDocumentDirectory();
            if (result && result.success && result.directory) {
                return String(result.directory);
            }
        } catch (error) {
            console.warn('[WeddingSuiteStandard] Failed to resolve active document directory:', error);
        }
    }

    return '';
}

export function applySourcePath(tab, sourcePath) {
    tab.state.sourcePath = sourcePath;
    tab.state.manifest = null;
    tab.state.invitePages = [];
    tab.state.pairInfoInvitePages = false;
    tab.state.combinedInfoInvitePage = false;
    tab.state.hasDraftCard = false;
    tab.state.draftCardCount = 1;
    tab.state.draftCardDetectionMode = 'auto';
    tab.state.filenameStem = buildDefaultFilenameStem(sourcePath);
    tab.state.lastOutputPath = '';
    persistPreferences(tab, { lastSourceDirectory: dirname(sourcePath) });
}

export function syncInvitePagesWithManifest(tab) {
    tab.state.invitePages = buildInviteRows({
        manifest: tab.state.manifest,
        currentRows: tab.state.invitePages,
        hasDraftCard: tab.state.hasDraftCard,
        draftCardCount: tab.state.draftCardCount,
        pairInfoInvitePages: tab.state.pairInfoInvitePages,
        combinedInfoInvitePage: tab.state.combinedInfoInvitePage
    });
}

export async function refreshSourceManifest(tab) {
    if (!tab.state.sourcePath) {
        UIFeedback.showToast('Can chon file PDF truoc khi doc page.', 'warning');
        return;
    }

    try {
        if (!isPdfSourcePath(tab.state.sourcePath)) {
            throw new Error(PDF_ONLY_SOURCE_ERROR);
        }

        const manifest = await tab.deps.pdfScanner(tab.state.sourcePath);
        tab.state.manifest = manifest;
        tab.state.filenameStem = buildDefaultFilenameStem(tab.state.sourcePath, manifest);
        if (!canUseDraftCard(manifest)) {
            tab.state.hasDraftCard = false;
            tab.state.draftCardDetectionMode = 'auto';
        } else if (tab.state.draftCardDetectionMode !== 'manual') {
            tab.state.hasDraftCard = shouldAutoEnableDraftCard(manifest);
            tab.state.draftCardDetectionMode = 'auto';
        }
        tab.state.lastOutputPath = '';
        syncInvitePagesWithManifest(tab);
        tab.render();
        UIFeedback.showToast('Da doc metadata page cua file PDF.', 'success');
    } catch (error) {
        tab.state.manifest = null;
        tab.state.invitePages = [];
        tab.state.pairInfoInvitePages = false;
        tab.state.combinedInfoInvitePage = false;
        tab.state.hasDraftCard = false;
        tab.state.draftCardCount = 1;
        tab.state.draftCardDetectionMode = 'auto';
        tab.state.lastOutputPath = '';
        tab.render();
        UIFeedback.showToast(error.message || 'Khong the doc metadata PDF nguon.', 'error');
    }
}

export async function pickSourceFile(tab) {
    const initialPath = await resolveSourceBrowseDirectory(tab);
    const picked = await Promise.resolve(tab.deps.pickSourceFile(initialPath));

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

    applySourcePath(tab, picked);
    await refreshSourceManifest(tab);
}

export async function pickOutputDirectory(tab) {
    const initialPath = resolveOutputBrowseDirectory(tab.state, tab.preferences);
    const picked = await Promise.resolve(tab.deps.pickDirectory(initialPath));

    if (picked === '__PICKER_ERROR__') {
        UIFeedback.showToast('Khong mo duoc hop chon thu muc luu. Thu reload panel roi bam lai.', 'error');
        return;
    }

    if (!picked) {
        return;
    }

    tab.state.outputDirectory = picked;
    tab.state.lastOutputPath = '';
    persistPreferences(tab, { lastSaveDirectory: picked });
    tab.render();
    UIFeedback.showToast('Da cap nhat thu muc luu PDF co dinh.', 'success');
}

export async function useActiveDocumentAsSource(tab) {
    const hostAdapter = tab.deps.hostAdapter;
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

    applySourcePath(tab, result.path);
    UIFeedback.showToast(ACTIVE_SOURCE_SUCCESS_MESSAGE, 'success');
    await tab.refreshSourceManifest();
}

export function createBuildError(result) {
    const code = result && result.code ? result.code : '';
    const message = code === OUTPUT_FILE_UNSAVED_OPEN_CODE
        ? OUTPUT_FILE_UNSAVED_OPEN_MESSAGE
        : (result && result.error ? result.error : 'Build job that bai');
    const buildError = new Error(message);
    buildError.code = code;
    return buildError;
}

export function flushToastState() {
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

export function handleBuildError(error) {
    if (error && error.code === OUTPUT_FILE_UNSAVED_OPEN_CODE) {
        flushToastState();
    }

    UIFeedback.showToast(error.message || 'Khong the build job.', 'error');
}

export function showBuildSuccess(result, request) {
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

export async function runBuild(tab) {
    tab._refreshPaperStockCatalog();
    const request = buildWeddingSuiteBuildRequest(tab._buildPlannerState(), {
        templatePath: tab.deps.templatePathResolver(),
        now: tab.deps.now
    });
    const plan = request.plan;

    if (!plan.valid) {
        UIFeedback.showToast(plan.errors[0] || 'Plan chua hop le.', 'error');
        tab.render();
        return;
    }

    if (!request.output.directory) {
        UIFeedback.showToast('Khong xac dinh duoc thu muc luu PDF.', 'warning');
        return;
    }

    try {
        UIFeedback.showToast('Dang build PDF...', 'info');
        const result = await tab.deps.hostAdapter.buildJob(request);

        if (!result || !result.success) {
            throw createBuildError(result);
        }

        tab.state.lastOutputPath = result.outputPath || '';
        persistPreferences(tab, {
            lastSaveDirectory: request.output.directory,
            lastSourceDirectory: dirname(request.sourcePath || tab.state.sourcePath)
        });
        tab.render();
        showBuildSuccess(result, request);
    } catch (error) {
        handleBuildError(error);
    }
}
