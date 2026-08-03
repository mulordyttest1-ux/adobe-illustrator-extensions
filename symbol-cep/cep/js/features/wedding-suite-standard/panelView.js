import { normalizePaperStockCatalog } from './paperStockConfig.js';
import {
    basename,
    buildIgnoredPageCount,
    canUseDraftCard,
    clampDraftCardCount,
    getManifestLastPage
} from './panelPolicy.js';

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

function buildPreviewUsageText(plan) {
    return `Kho giay huu dung: ${plan.usableWidthMm} x ${plan.usableHeightMm} mm`;
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

export function renderWeddingSuitePreview({ state, plan }) {
    const manifest = state.manifest;
    const pairMode = !!plan.pairInfoInvitePages;
    const combinedMode = !!plan.combinedInfoInvitePage;
    const consumesAllSuitePages = pairMode || combinedMode;
    const lastPage = getManifestLastPage(manifest);
    const ignoredCount = buildIgnoredPageCount({
        manifest,
        lastPage,
        hasDraftCard: state.hasDraftCard,
        draftCardCount: state.draftCardCount,
        consumesAllSuitePages
    });
    const inviteSummary = buildInviteSummaryText(plan.sourcePages.invites || [], pairMode, combinedMode);
    const outputSummary = state.outputDirectory
        ? `${state.outputDirectory}/${state.filenameStem}.pdf`
        : `${state.filenameStem}.pdf`;

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

export function renderWeddingSuiteMarkup({ state, plan, stock, paperStockCatalog }) {
    const manifest = state.manifest;
    const hasSource = !!state.sourcePath;
    const autoDraftNote = canUseDraftCard(manifest) &&
        state.hasDraftCard &&
        state.draftCardDetectionMode !== 'manual';
    const sourceName = manifest
        ? (manifest.sourceName || state.sourcePath)
        : basename(state.sourcePath);
    const errorBox = plan.errors.length
        ? `<div class="wss-error-box">${plan.errors.map((entry) => `<div>${escapeHtml(entry)}</div>`).join('')}</div>`
        : '';

    return `
        <div class="wss-shell">
            <section class="panel-card">
                <div class="panel-eyebrow">Wedding Suite Standard</div>
                <div class="panel-section-title">Binh bo thiep theo file PDF</div>
                <div class="panel-helper-text">
                    Ban bam nut de chon file PDF truoc. Sau khi doc xong, he thong moi hien loai giay. QA se dung cung kho giay in, chi de lai ten file, va page cuoi co the duoc tach thanh thiep an nhap.
                </div>
                ${hasSource ? '' : `
                <div class="config-footer-actions">
                    <button type="button" class="contrast" data-action="pick-source-file">Chon file PDF</button>
                    <button type="button" class="outline" data-action="use-active-pdf-source">Lay PDF dang mo</button>
                    <button type="button" class="outline" data-action="pick-output-directory">Chon thu muc luu</button>
                </div>
                `}
            </section>

            ${hasSource ? `
            ${buildSourceSectionMarkup(state, manifest, sourceName)}
            ${buildQuickOptionsSectionMarkup({
        state,
        plan,
        stock,
        paperStockCatalog,
        showPairToggle: true,
        showDraftToggle: true,
        autoDraftNote
    })}

            ${renderWeddingSuitePreview({ state, plan })}
            ${errorBox}
            ` : ''}
        </div>
    `;
}
