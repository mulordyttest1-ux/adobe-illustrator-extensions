import { UIFeedback } from '@shared/cep-ui';
import { runTemplateAuthoringService } from '../logic/use-cases/template-authoring/templateAuthoringService.js';

function createDeps(overrides = {}) {
    return {
        runTemplateAuthoringService: overrides.runTemplateAuthoringService || runTemplateAuthoringService,
        selectFramesById: overrides.selectFramesById || ((hostFacade, ids) => hostFacade.selectFramesById(ids)),
        showToast: overrides.showToast || ((message, type) => UIFeedback.showToast(message, type))
    };
}

function handleSelectionFailure(selectionResult, showToast) {
    if (selectionResult.reason === 'READ_FAILED') {
        showToast('L\u1ed7i \u0111\u1ecdc Text: ' + selectionResult.error, 'error');
        return { success: false, error: selectionResult.error };
    }

    showToast('Vui l\u00f2ng b\u00f4i \u0111en (ch\u1ecdn) TextFrame tr\u00ean thi\u1ebft k\u1ebf \u0111\u1ec3 nh\u1eadn di\u1ec7n!', 'warning');
    return { success: false, error: 'No selection' };
}

function handleInjectFailure(injectionResult, showToast) {
    if (injectionResult.reason === 'APPLY_FAILED') {
        showToast('L\u1ed7i ghi \u0111\u00e8 Text: ' + injectionResult.error, 'error');
        return { success: false, error: injectionResult.error };
    }

    return handleSelectionFailure(injectionResult, showToast);
}

export const InjectSchemaAction = {
    // Compatibility cutover keeps a temporary alias layer while HostFacade replaces raw bridge usage.
    async execute(ctx, targetType = 'tiec', deps = {}) {
        const hostFacade = ctx.hostFacade || ctx.bridge;
        const { button } = ctx;
        const resolvedDeps = createDeps(deps);

        try {
            this._setButtonState(button, true);

            const injectionResult = await resolvedDeps.runTemplateAuthoringService(
                { mode: 'auto', hostFacade, bridge: hostFacade, targetType },
                resolvedDeps
            );
            if (!injectionResult.success) {
                return handleInjectFailure(injectionResult, resolvedDeps.showToast);
            }

            if (!injectionResult.hasChanges && !injectionResult.hasOrphans) {
                resolvedDeps.showToast('Kh\u00f4ng t\u00ecm th\u1ea5y t\u1eeb kh\u00f3a n\u00e0o c\u1ea7n ti\u00eam Schema trong v\u00f9ng ch\u1ecdn.', 'info');
                return { success: true, count: 0 };
            }

            const result = {
                success: true,
                count: injectionResult.count || 0,
                affected: injectionResult.affected || []
            };

            if (injectionResult.hasOrphans) {
                const orphanIds = injectionResult.orphans.map((frame) => frame.id);
                Promise.resolve(resolvedDeps.selectFramesById(hostFacade, orphanIds)).catch(() => {});
                resolvedDeps.showToast(
                    `\u26a0\ufe0f ${injectionResult.orphans.length} s\u1ed1 r\u1eddi ch\u01b0a ti\u00eam \u0111\u01b0\u1ee3c \u2014 \u0111\u00e3 ch\u1ecdn \u0111\u1ec3 b\u1ea1n ti\u00eam tay.`,
                    'warning'
                );
            }

            if (injectionResult.missedRequired.length > 0) {
                resolvedDeps.showToast(
                    'Thi\u1ebft k\u1ebf c\u00f2n thi\u1ebfu bi\u1ebfn b\u1eaft bu\u1ed9c. H\u00e3y b\u1ed5 sung tr\u01b0\u1edbc khi render.',
                    'error'
                );
            }

            return result;
        } catch (err) {
            console.error(err);
            resolvedDeps.showToast('L\u1ed7i h\u1ec7 th\u1ed1ng: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            this._setButtonState(button, false);
        }
    },

    _setButtonState(button, isProcessing) {
        if (!button) return;
        button.disabled = isProcessing;
        if (isProcessing) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '\u23f3 \u0110ang x\u1eed l\u00fd...';
        } else if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
};
