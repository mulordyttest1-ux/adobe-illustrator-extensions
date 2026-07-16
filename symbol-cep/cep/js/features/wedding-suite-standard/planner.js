import {
    FALLBACK_PAPER_STOCKS,
    normalizePaperStockCatalog,
    resolvePaperStock
} from './paperStockConfig.js';

export const PAPER_STOCKS = FALLBACK_PAPER_STOCKS;

export function createDefaultCardSheetRecipe(id = 'sheet_recipe_1') {
    return {
        id,
        label: 'Sheet 1',
        type: 'two_row_card_sheet',
        topRole: 'info',
        topSlots: 4,
        bottomRole: 'invite_1',
        bottomSlots: 4,
        manualRunCount: ''
    };
}

function toInteger(value, fallback = 0) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPositiveInteger(value, fallback = 0) {
    return Math.max(0, toInteger(value, fallback));
}

function clampMinimumInteger(value, minimum = 1, fallback = minimum) {
    return Math.max(minimum, toInteger(value, fallback));
}

function hasNonEmptyValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
}

function padTimestampPart(value, width) {
    let text = String(value);
    while (text.length < width) {
        text = `0${text}`;
    }
    return text;
}

function buildTimestampSuffix(options = {}) {
    const nowFactory = typeof options.now === 'function' ? options.now : () => new Date();
    const now = nowFactory();
    return `${now.getHours()}'${padTimestampPart(now.getMinutes(), 2)} ${now.getDate()} ${now.getMonth() + 1}`;
}

export function stripWeddingSuiteTimestampSuffix(value) {
    return String(value || '')
        .replace(/\.[^.]+$/, '')
        .replace(/_\d{1,2}'\d{2}\s+\d{1,2}\s+\d{1,2}$/, '')
        .trim();
}

export function buildTimestampedWeddingSuiteStem(value, options = {}) {
    const baseStem = stripWeddingSuiteTimestampSuffix(value).trim() || 'info';
    return `${baseStem}_${buildTimestampSuffix(options)}`;
}

function joinPath(directory, filename) {
    const safeDirectory = String(directory || '').replace(/\\/g, '/');
    if (!safeDirectory) {
        return filename;
    }

    return /\/$/.test(safeDirectory) ? `${safeDirectory}${filename}` : `${safeDirectory}/${filename}`;
}

function sanitizeInvitePage(page = {}, index = 0) {
    return {
        pageNumber: Number(page.pageNumber) || (index + 3),
        sourceIndex: Number(page.sourceIndex),
        sourceName: page.sourceName || `Page ${index + 3}`,
        widthMm: Number(page.widthMm) || 0,
        heightMm: Number(page.heightMm) || 0,
        label: String(page.label || '').trim(),
        quantity: clampPositiveInteger(page.quantity, 0),
        infoPageNumber: Number(page.infoPageNumber) || 0,
        combinedInfoInvitePage: !!page.combinedInfoInvitePage
    };
}

function normalizeManifestPage(page = {}, fallbackPageNumber = 1) {
    return {
        pageNumber: Number(page.pageNumber) || fallbackPageNumber,
        sourceIndex: Number(page.sourceIndex),
        sourceName: page.name || page.sourceName || `Page ${fallbackPageNumber}`,
        widthMm: Number(page.widthMm) || 0,
        heightMm: Number(page.heightMm) || 0
    };
}

function buildManifestPages(manifest = null) {
    const pages = manifest && Array.isArray(manifest.pages) ? manifest.pages : [];
    return pages.map((page, index) => normalizeManifestPage(page, index + 1));
}

function buildManifestLastPage(manifest = null, manifestPages = []) {
    if (manifest && manifest.lastPage) {
        return normalizeManifestPage(
            manifest.lastPage,
            Number(manifest.lastPage.pageNumber) || Math.max(1, Number(manifest.totalPages) || manifestPages.length || 1)
        );
    }

    return manifestPages.length ? { ...manifestPages[manifestPages.length - 1] } : null;
}

function shouldSkipDraftPages(hasDraftCard, workflowVariant, lastPage, firstDraftPageNumber) {
    return !hasDraftCard || workflowVariant === 'single_card_8up' || !lastPage || firstDraftPageNumber < 4;
}

function buildDraftPages({
    manifest = null,
    manifestPages = [],
    hasDraftCard = false,
    workflowVariant = 'standard_suite',
    draftCardCount = 1
} = {}) {
    const lastPage = buildManifestLastPage(manifest, manifestPages);
    const lastPageNumber = lastPage ? Number(lastPage.pageNumber) || 0 : 0;
    const count = clampMinimumInteger(draftCardCount, 1, 1);
    const firstDraftPageNumber = lastPageNumber - count + 1;

    if (shouldSkipDraftPages(hasDraftCard, workflowVariant, lastPage, firstDraftPageNumber)) {
        return [];
    }

    const draftPages = manifestPages
        .filter((page) => page.pageNumber >= firstDraftPageNumber && page.pageNumber <= lastPageNumber)
        .map((page) => (page.pageNumber === lastPageNumber ? lastPage : page));

    if (!draftPages.some((page) => page.pageNumber === lastPageNumber)) {
        draftPages.push(lastPage);
    }

    return draftPages
        .sort((left, right) => left.pageNumber - right.pageNumber);
}

function buildInviteStateByPage(stateInvitePages = []) {
    return new Map(
        (Array.isArray(stateInvitePages) ? stateInvitePages : [])
            .map((page) => sanitizeInvitePage(page))
            .map((page) => [page.pageNumber, page])
    );
}

function resolveInviteEndPage(manifestPages, draftPages = []) {
    const manifestEndPage = manifestPages.length
        ? Math.max(...manifestPages.map((page) => Number(page.pageNumber) || 0))
        : 0;
    const firstDraftPage = Array.isArray(draftPages) && draftPages.length ? draftPages[0] : null;

    return firstDraftPage
        ? Math.max(2, Number(firstDraftPage.pageNumber) - 1)
        : manifestEndPage;
}

function buildStandardInvitePages(manifestPages, inviteStateByPage, autoQuantity = null, draftPages = []) {
    const firstDraftPage = Array.isArray(draftPages) && draftPages.length ? draftPages[0] : null;
    const inviteEndPage = firstDraftPage
        ? Math.min(5, Math.max(2, Number(firstDraftPage.pageNumber) - 1))
        : 5;

    return manifestPages
        .filter((page) => page.pageNumber >= 3 && page.pageNumber <= inviteEndPage)
        .map((page) => {
            const saved = inviteStateByPage.get(page.pageNumber);
            const defaultLabel = page.sourceName || `Thiep moi ${Math.max(1, page.pageNumber - 2)}`;
            return {
                pageNumber: page.pageNumber,
                sourceIndex: page.sourceIndex,
                sourceName: page.sourceName,
                widthMm: page.widthMm,
                heightMm: page.heightMm,
                label: saved && saved.label ? saved.label : defaultLabel,
                quantity: autoQuantity !== null ? autoQuantity : (saved ? saved.quantity : 0),
                shouldRotate90: page.widthMm > page.heightMm
            };
        })
        .slice(0, 3)
        .map((page, index) => ({
            ...page,
            displayName: `Page ${index + 3}`
        }));
}

function buildCombinedInfoInvitePages(manifestPages, inviteStateByPage, autoQuantity = null, draftPages = []) {
    const endPage = resolveInviteEndPage(manifestPages, draftPages);

    return manifestPages
        .filter((page) => page.pageNumber >= 2 && page.pageNumber <= endPage)
        .map((page, index) => {
            const saved = inviteStateByPage.get(page.pageNumber);
            const defaultLabel = page.sourceName || `Bo thiep ${index + 1}`;
            return {
                pageNumber: page.pageNumber,
                sourceIndex: page.sourceIndex,
                sourceName: page.sourceName,
                widthMm: page.widthMm,
                heightMm: page.heightMm,
                label: saved && saved.label ? saved.label : defaultLabel,
                quantity: autoQuantity !== null ? autoQuantity : (saved ? saved.quantity : 0),
                shouldRotate90: false,
                displayName: `Page ${page.pageNumber}`,
                combinedInfoInvitePage: true
            };
        });
}

function buildPairInfoPage(infoPage, pairIndex) {
    return {
        kind: 'info',
        pageNumber: infoPage.pageNumber,
        sourceIndex: infoPage.sourceIndex,
        sourceName: infoPage.sourceName,
        widthMm: infoPage.widthMm,
        heightMm: infoPage.heightMm,
        label: infoPage.sourceName || `To bao ${pairIndex}`,
        shouldRotate90: infoPage.widthMm > infoPage.heightMm
    };
}

function buildPairedInvitePage({
    infoPage,
    invitePage,
    saved = null,
    autoQuantity = null,
    pairIndex = 1
} = {}) {
    return {
        pageNumber: invitePage.pageNumber,
        sourceIndex: invitePage.sourceIndex,
        sourceName: invitePage.sourceName,
        widthMm: invitePage.widthMm,
        heightMm: invitePage.heightMm,
        label: saved && saved.label ? saved.label : (invitePage.sourceName || `Thiep moi ${pairIndex}`),
        quantity: autoQuantity !== null ? autoQuantity : (saved ? saved.quantity : 0),
        shouldRotate90: invitePage.widthMm > invitePage.heightMm,
        displayName: `Page ${infoPage.pageNumber}-${invitePage.pageNumber}`,
        infoPageNumber: infoPage.pageNumber,
        infoPage: buildPairInfoPage(infoPage, pairIndex)
    };
}

function buildPairedInvitePages(manifestPages, inviteStateByPage, autoQuantity = null, draftPages = []) {
    const pagesByNumber = new Map(manifestPages.map((page) => [Number(page.pageNumber), page]));
    const endPage = resolveInviteEndPage(manifestPages, draftPages);
    const pairs = [];
    let infoPageNumber;

    for (infoPageNumber = 2; infoPageNumber <= endPage; infoPageNumber += 2) {
        const infoPage = pagesByNumber.get(infoPageNumber);
        const invitePage = pagesByNumber.get(infoPageNumber + 1);
        const saved = invitePage ? inviteStateByPage.get(invitePage.pageNumber) : null;
        const pairIndex = pairs.length + 1;

        if (!infoPage || !invitePage || invitePage.pageNumber > endPage) {
            continue;
        }

        pairs.push(buildPairedInvitePage({
            infoPage,
            invitePage,
            saved,
            autoQuantity,
            pairIndex
        }));
    }

    return pairs;
}

function buildInvitePages({
    manifestPages,
    stateInvitePages = [],
    autoQuantity = null,
    draftPages = [],
    pairInfoInvitePages = false,
    combinedInfoInvitePage = false
} = {}) {
    const inviteStateByPage = buildInviteStateByPage(stateInvitePages);

    if (combinedInfoInvitePage) {
        return buildCombinedInfoInvitePages(manifestPages, inviteStateByPage, autoQuantity, draftPages);
    }

    return pairInfoInvitePages
        ? buildPairedInvitePages(manifestPages, inviteStateByPage, autoQuantity, draftPages)
        : buildStandardInvitePages(manifestPages, inviteStateByPage, autoQuantity, draftPages);
}

function resolveWorkflowVariant(manifestPages, envelopePage, infoPage) {
    if (manifestPages.length === 2 && envelopePage && infoPage) {
        return 'single_card_8up';
    }

    return 'standard_suite';
}

function isStandardSuiteWorkflow(workflowVariant) {
    return workflowVariant !== 'single_card_8up';
}

function resolveSuiteModeFlags(state = {}, workflowVariant = 'standard_suite') {
    const canUseSuiteModes = isStandardSuiteWorkflow(workflowVariant);
    const combinedInfoInvitePage = canUseSuiteModes ? !!state.combinedInfoInvitePage : false;
    const pairInfoInvitePages = canUseSuiteModes && !combinedInfoInvitePage ? !!state.pairInfoInvitePages : false;

    return {
        combinedInfoInvitePage,
        pairInfoInvitePages
    };
}

function resolveAutoQuantity(state = {}) {
    if (!hasNonEmptyValue(state.jobQuantity)) {
        return {
            hasAutoQuantity: false,
            autoQuantity: null
        };
    }

    return {
        hasAutoQuantity: true,
        autoQuantity: clampPositiveInteger(state.jobQuantity, 0)
    };
}

function buildCounts(state = {}, quantityState = {}) {
    if (quantityState.hasAutoQuantity) {
        return {
            envelope: quantityState.autoQuantity,
            info: quantityState.autoQuantity
        };
    }

    return {
        envelope: clampPositiveInteger(state.envelopeCount, 0),
        info: clampPositiveInteger(state.infoCount, 0)
    };
}

function buildInfoPreviewPage(infoPage, infoCount, workflowVariant) {
    if (!infoPage || !(infoCount > 0)) {
        return null;
    }

    return {
        kind: workflowVariant === 'single_card_8up' ? 'card' : 'info',
        sourceIndex: infoPage.sourceIndex,
        label: workflowVariant === 'single_card_8up'
            ? `Thiep x${infoCount}`
            : `To bao / info x${infoCount}`,
        shouldRotate90: infoPage.widthMm > infoPage.heightMm,
        widthMm: Number(infoPage.widthMm) || 0,
        heightMm: Number(infoPage.heightMm) || 0
    };
}

function buildPairInfoPreviewPage(page, index) {
    if (!page.infoPage) {
        return null;
    }

    return {
        kind: 'info',
        sourceIndex: page.infoPage.sourceIndex,
        label: `${page.infoPage.label || `To bao ${index + 1}`} x${page.quantity}`,
        shouldRotate90: page.infoPage.shouldRotate90,
        widthMm: Number(page.infoPage.widthMm) || 0,
        heightMm: Number(page.infoPage.heightMm) || 0
    };
}

function buildInvitePreviewPage(page, index) {
    return {
        kind: page.combinedInfoInvitePage ? 'suite' : 'invite',
        sourceIndex: page.sourceIndex,
        label: `${page.label || (page.combinedInfoInvitePage ? `Bo thiep ${index + 1}` : `Thiep moi ${index + 1}`)} x${page.quantity}`,
        shouldRotate90: page.shouldRotate90,
        widthMm: Number(page.widthMm) || 0,
        heightMm: Number(page.heightMm) || 0
    };
}

function buildDraftPreviewPage(draftPage = null, index = 0, total = 1) {
    if (!draftPage) {
        return null;
    }

    return {
        kind: 'draft',
        sourceIndex: draftPage.sourceIndex,
        pageNumber: draftPage.pageNumber,
        label: total > 1 ? `Thiep an nhap ${index + 1}` : 'Thiep an nhap',
        shouldRotate90: false,
        widthMm: Number(draftPage.widthMm) || 0,
        heightMm: Number(draftPage.heightMm) || 0
    };
}

function buildInvitePreviewPages(invitePages = [], pairInfoInvitePages = false) {
    const previewPages = [];

    invitePages
        .filter((page) => page.quantity > 0)
        .forEach((page, index) => {
            const pairInfoPreview = pairInfoInvitePages ? buildPairInfoPreviewPage(page, index) : null;
            if (pairInfoPreview) {
                previewPages.push(pairInfoPreview);
            }
            previewPages.push(buildInvitePreviewPage(page, index));
        });

    return previewPages;
}

function buildDraftPreviewPages(draftPages = []) {
    return draftPages.map((draftPage, index) => buildDraftPreviewPage(draftPage, index, draftPages.length));
}

function buildQaPreviewPages({
    infoPage = null,
    infoCount = 0,
    invitePages = [],
    workflowVariant = 'standard_suite',
    draftPages = [],
    pairInfoInvitePages = false,
    combinedInfoInvitePage = false
} = {}) {
    const infoPreview = pairInfoInvitePages || combinedInfoInvitePage ? null : buildInfoPreviewPage(infoPage, infoCount, workflowVariant);
    return [
        ...(infoPreview ? [infoPreview] : []),
        ...buildInvitePreviewPages(invitePages, pairInfoInvitePages),
        ...buildDraftPreviewPages(draftPages)
    ];
}

function buildQaArtboard(usableWidthMm, usableHeightMm, previewCount) {
    const safePreviewCount = Math.max(1, Number(previewCount) || 0);
    const columns = Math.min(2, safePreviewCount);
    const rows = Math.max(1, Math.ceil(safePreviewCount / 2));
    const slotWidthMm = usableWidthMm / 4;
    const slotHeightMm = usableHeightMm / 2;
    const outerMarginMm = 5;
    const textBandMm = 12;

    return {
        artboardName: 'QA',
        widthMm: (outerMarginMm * 2) + (columns * slotWidthMm),
        heightMm: (outerMarginMm * 2) + textBandMm + (rows * slotHeightMm)
    };
}

function buildProductionSheets({
    paperStock,
    infoPage,
    invitePages,
    workflowVariant,
    combinedInfoInvitePage = false
} = {}) {
    if (!infoPage) {
        return [];
    }

    if (workflowVariant === 'single_card_8up') {
        return [{
            id: 'production_single_card_8up',
            artboardName: `Thiep don | ${paperStock.label}`,
            widthMm: paperStock.widthMm,
            heightMm: paperStock.heightMm,
            layoutMode: 'single_card_8up',
            topPage: {
                kind: 'card',
                sourceIndex: infoPage.sourceIndex,
                label: 'Thiep',
                shouldRotate90: infoPage.widthMm > infoPage.heightMm
            },
            bottomPage: {
                kind: 'card',
                sourceIndex: infoPage.sourceIndex,
                label: 'Thiep',
                shouldRotate90: infoPage.widthMm > infoPage.heightMm
            }
        }];
    }

    if (combinedInfoInvitePage) {
        return invitePages
            .filter((page) => page.quantity > 0)
            .map((page, index) => ({
                id: `production_suite_${page.pageNumber}`,
                artboardName: `${page.label || `Bo thiep ${index + 1}`} | ${paperStock.label}`,
                widthMm: paperStock.widthMm,
                heightMm: paperStock.heightMm,
                layoutMode: 'single_page_suite_2x2',
                sourcePage: {
                    kind: 'suite',
                    sourceIndex: page.sourceIndex,
                    label: page.label || `Bo thiep ${index + 1}`,
                    quantity: page.quantity,
                    shouldRotate90: page.shouldRotate90,
                    widthMm: page.widthMm,
                    heightMm: page.heightMm
                }
            }));
    }

    return invitePages
        .filter((page) => page.quantity > 0)
        .map((page, index) => {
            const topPage = page.infoPage || {
                kind: 'info',
                sourceIndex: infoPage.sourceIndex,
                label: 'To bao / info',
                shouldRotate90: infoPage.widthMm > infoPage.heightMm
            };

            return {
                id: `production_${page.pageNumber}`,
                artboardName: `${page.label || `Thiep moi ${index + 1}`} | ${paperStock.label}`,
                widthMm: paperStock.widthMm,
                heightMm: paperStock.heightMm,
                topPage,
                bottomPage: {
                    kind: 'invite',
                    sourceIndex: page.sourceIndex,
                    label: page.label || `Thiep moi ${index + 1}`,
                    quantity: page.quantity,
                    shouldRotate90: page.shouldRotate90
                }
            };
        });
}

function buildDraftArtboard(draftPage, index = 0, total = 1) {
    return {
        artboardName: total > 1 ? `Thiep an nhap ${index + 1}` : 'Thiep an nhap',
        pageNumber: Number(draftPage.pageNumber),
        widthMm: Number(draftPage.widthMm) || 0,
        heightMm: Number(draftPage.heightMm) || 0,
        sourceIndex: Number(draftPage.sourceIndex)
    };
}

function buildDraftArtboards(draftPages = []) {
    return draftPages.map((draftPage, index) => buildDraftArtboard(draftPage, index, draftPages.length));
}

function hasIncompletePair(manifestPages, draftPages = []) {
    const endPage = resolveInviteEndPage(manifestPages, draftPages);
    return endPage >= 2 && endPage % 2 === 0;
}

function buildQaNotes(workflowVariant, draftArtboards = [], combinedInfoInvitePage = false) {
    const qaNotes = workflowVariant === 'single_card_8up'
        ? ['CHU Y: 8 con / 1 to']
        : [];

    if (combinedInfoInvitePage) {
        qaNotes.push('CHU Y: moi page thiep da gom thiep bao ben trai va thiep moi ben phai.');
    }

    if (draftArtboards.length) {
        qaNotes.push(draftArtboards.length > 1
            ? `Co them ${draftArtboards.length} artboard thiep an nhap.`
            : 'Co them 1 artboard thiep an nhap.');
    }

    return qaNotes;
}

// eslint-disable-next-line complexity
function buildPlanErrors({
    state = {},
    manifestPages = [],
    envelopePage = null,
    infoPage = null,
    invitePages = [],
    draftPages = [],
    draftCardCount = 0,
    workflowVariant = 'standard_suite',
    productionSheets = []
} = {}) {
    const errors = [];
    const pairInfoInvitePages = !!state.pairInfoInvitePages && workflowVariant !== 'single_card_8up';
    const combinedInfoInvitePage = !!state.combinedInfoInvitePage && workflowVariant !== 'single_card_8up';

    if (!state.sourcePath) {
        errors.push('Can chon file nguon truoc khi binh bai.');
    }

    if (!manifestPages.length) {
        errors.push('Can doc file nguon truoc khi build.');
    }

    if (!envelopePage) {
        errors.push('File nguon thieu page 1 cho bao thu.');
    }

    if (!infoPage) {
        errors.push(combinedInfoInvitePage
            ? 'File nguon thieu page 2 cho bo thiep 1 page.'
            : 'File nguon thieu page 2 cho to info.');
    }

    if (state.hasDraftCard && workflowVariant !== 'single_card_8up' && !draftPages.length) {
        errors.push('Khong doc duoc page cuoi cho thiep an nhap.');
    }

    if (
        state.hasDraftCard &&
        workflowVariant !== 'single_card_8up' &&
        draftPages.length > 0 &&
        draftPages.length < draftCardCount
    ) {
        errors.push('Khong doc duoc du so luong page thiep an nhap.');
    }

    if (!state.hasDraftCard && !invitePages.length && manifestPages.length > 2) {
        errors.push(combinedInfoInvitePage
            ? 'Khong doc duoc cac page bo thiep tu page 2 tro di.'
            : pairInfoInvitePages
            ? 'Khong doc duoc cap page bao/moi tu page 2-3, 4-5...'
            : 'Khong doc duoc cac page thiep moi tu page 3-5.');
    }

    if (state.hasDraftCard && workflowVariant !== 'single_card_8up' && !invitePages.length) {
        errors.push(combinedInfoInvitePage
            ? 'Thiep an nhap can co it nhat mot page bo thiep truoc page cuoi.'
            : pairInfoInvitePages
            ? 'Thiep an nhap can co it nhat mot cap page bao/moi truoc page cuoi.'
            : 'Thiep an nhap can co it nhat mot thiep moi truoc page cuoi.');
    }

    if (pairInfoInvitePages && hasIncompletePair(manifestPages, draftPages)) {
        errors.push('Dang thieu page thiep moi cho cap page cuoi.');
    }

    if (invitePages.length && !invitePages.some((page) => page.quantity > 0)) {
        errors.push('Can nhap so luong cho bo thiep.');
    }

    if (!productionSheets.length && invitePages.some((page) => page.quantity > 0)) {
        errors.push('Can co it nhat mot thiep moi hop le de tao artboard production.');
    }

    return errors;
}

function buildSourcePages(envelopePage, infoPage, invitePages, draftPages) {
    return {
        envelope: envelopePage,
        info: infoPage,
        invites: invitePages,
        draft: draftPages[0] || null,
        drafts: draftPages
    };
}

function buildPlanArtboards(productionSheets, draftArtboards = []) {
    return [
        { kind: 'qa', name: 'QA' },
        { kind: 'envelope', name: 'Envelope' },
        ...productionSheets.map((sheet) => ({
            kind: 'production',
            name: sheet.artboardName,
            recipeId: sheet.id
        })),
        ...draftArtboards.map((draftArtboard) => ({
            kind: 'draft',
            name: draftArtboard.artboardName
        }))
    ];
}

function resolveDraftCardCount(state = {}, workflowVariant = 'standard_suite') {
    if (!state.hasDraftCard || !isStandardSuiteWorkflow(workflowVariant)) {
        return 0;
    }

    return clampMinimumInteger(state.draftCardCount, 1, 1);
}

function buildDraftPagesForPlan(state, manifestPages, workflowVariant, draftCardCount) {
    return buildDraftPages({
        manifest: state.manifest,
        manifestPages,
        hasDraftCard: !!state.hasDraftCard,
        workflowVariant,
        draftCardCount: draftCardCount || 1
    });
}

function buildEnvelopeArtboard(envelopePage, counts) {
    return {
        artboardName: 'Envelope',
        widthMm: 230,
        heightMm: 230,
        quantity: counts.envelope,
        sourceIndex: envelopePage ? envelopePage.sourceIndex : -1
    };
}

function buildPlanResult({
    errors,
    workflowVariant,
    modeFlags,
    draftCardCount,
    paperStock,
    usableWidthMm,
    usableHeightMm,
    envelopePage,
    infoPage,
    invitePages,
    draftPages,
    counts,
    qaPreviewPages,
    draftArtboard,
    draftArtboards,
    qaNotes,
    productionSheets
}) {
    return {
        valid: errors.length === 0,
        errors,
        workflowVariant,
        pairInfoInvitePages: modeFlags.pairInfoInvitePages,
        combinedInfoInvitePage: modeFlags.combinedInfoInvitePage,
        draftCardCount,
        paperStock,
        usableWidthMm,
        usableHeightMm,
        sourcePages: buildSourcePages(envelopePage, infoPage, invitePages, draftPages),
        counts,
        qaArtboard: buildQaArtboard(usableWidthMm, usableHeightMm, qaPreviewPages.length),
        envelopeArtboard: buildEnvelopeArtboard(envelopePage, counts),
        draftArtboard,
        draftArtboards,
        qaPreviewPages,
        qaNotes,
        productionSheets,
        artboards: buildPlanArtboards(productionSheets, draftArtboards)
    };
}

export function buildWeddingSuitePlan(state = {}) {
    const manifestPages = buildManifestPages(state.manifest);
    const paperStockCatalog = normalizePaperStockCatalog(state.paperStockCatalog);
    const paperStock = resolvePaperStock(paperStockCatalog, state.paperStock);
    const envelopePage = manifestPages[0] || null;
    const infoPage = manifestPages[1] || null;
    const workflowVariant = resolveWorkflowVariant(manifestPages, envelopePage, infoPage);
    const modeFlags = resolveSuiteModeFlags(state, workflowVariant);
    const draftCardCount = resolveDraftCardCount(state, workflowVariant);
    const draftPages = buildDraftPagesForPlan(state, manifestPages, workflowVariant, draftCardCount);
    const quantityState = resolveAutoQuantity(state);
    const invitePages = buildInvitePages({
        manifestPages,
        stateInvitePages: state.invitePages,
        autoQuantity: quantityState.autoQuantity,
        draftPages,
        pairInfoInvitePages: modeFlags.pairInfoInvitePages,
        combinedInfoInvitePage: modeFlags.combinedInfoInvitePage
    });
    const counts = buildCounts(state, quantityState);
    const usableWidthMm = Math.max(0, paperStock.widthMm - 10);
    const usableHeightMm = Math.max(0, paperStock.heightMm - 10);
    const productionSheets = buildProductionSheets({
        paperStock,
        infoPage,
        invitePages,
        workflowVariant,
        combinedInfoInvitePage: modeFlags.combinedInfoInvitePage
    });
    const draftArtboards = buildDraftArtboards(draftPages);
    const draftArtboard = draftArtboards[0] || null;
    const qaPreviewPages = buildQaPreviewPages({
        infoPage,
        infoCount: counts.info,
        invitePages,
        workflowVariant,
        draftPages,
        pairInfoInvitePages: modeFlags.pairInfoInvitePages,
        combinedInfoInvitePage: modeFlags.combinedInfoInvitePage
    });
    const qaNotes = buildQaNotes(
        workflowVariant,
        draftArtboards,
        modeFlags.combinedInfoInvitePage
    );
    const errors = buildPlanErrors({
        state,
        manifestPages,
        envelopePage,
        infoPage,
        invitePages,
        draftPages,
        draftCardCount,
        workflowVariant,
        productionSheets
    });

    return buildPlanResult({
        errors,
        workflowVariant,
        modeFlags,
        draftCardCount,
        paperStock,
        paperStockCatalog,
        usableWidthMm,
        usableHeightMm,
        envelopePage,
        infoPage,
        invitePages,
        draftPages,
        counts,
        draftArtboard,
        draftArtboards,
        qaPreviewPages,
        qaNotes,
        productionSheets
    });
}

export function buildWeddingSuiteBuildRequest(state = {}, options = {}) {
    const plan = buildWeddingSuitePlan(state);
    const baseFilenameStem = stripWeddingSuiteTimestampSuffix(state.filenameStem || 'info') || 'info';
    const filenameStem = buildTimestampedWeddingSuiteStem(baseFilenameStem, options);
    const previousOutputPath = String(state.lastOutputPath || '').trim() ||
        joinPath(state.outputDirectory || '', `${baseFilenameStem}.pdf`);

    return {
        sourcePath: state.sourcePath || '',
        templatePath: String(options.templatePath || '').trim(),
        output: {
            directory: state.outputDirectory || '',
            filenameStem,
            baseFilenameStem,
            previousOutputPath
        },
        plan
    };
}
