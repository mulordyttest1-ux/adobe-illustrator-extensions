import { UIFeedback } from '@shared/cep-ui';
import { runTemplateAuthoringService } from '../logic/use-cases/template-authoring/templateAuthoringService.js';

function createDeps(overrides = {}) {
    return {
        runTemplateAuthoringService: overrides.runTemplateAuthoringService || runTemplateAuthoringService,
        showToast: overrides.showToast || ((message, type) => UIFeedback.showToast(message, type))
    };
}

function handleSelectionFailure(selectionResult, showToast) {
    if (selectionResult.reason === 'READ_FAILED') {
        showToast('L\u1ed7i \u0111\u1ecdc Text: ' + selectionResult.error, 'error');
        return { success: false, error: selectionResult.error };
    }

    showToast('\u26a0\ufe0f Vui l\u00f2ng b\u00f4i \u0111en (ch\u1ecdn) ph\u1ea7n ch\u1eef tr\u00ean thi\u1ebft k\u1ebf AI!', 'warning');
    return { success: false, error: 'No selection' };
}

function handleBuildFailure(result, showToast) {
    if (result.reason === 'INVALID_FRAME_COUNT') {
        showToast(
            `\u26a0\ufe0f Vui l\u00f2ng ch\u1ecdn \u0111\u00fang b\u1ed9 4 d\u00f2ng (\u00d4ng B\u00e0, \u00d4ng, B\u00e0, \u0110/C) \u0111\u1ec3 ti\u00eam c\u1ee5m. B\u1ea1n \u0111ang ch\u1ecdn ${result.frameCount} d\u00f2ng.`,
            'warning'
        );
        return { success: false, error: result.reason };
    }

    if (result.reason === 'NO_DATE_TIEC_METADATA') {
        showToast('\u26a0\ufe0f Kh\u00f4ng t\u00ecm th\u1ea5y frame n\u00e0o c\u00f3 metadata date.tiec.* \u0111\u1ec3 clone.', 'warning');
        return { success: false, error: result.reason };
    }

    if (result.reason === 'APPLY_FAILED') {
        showToast('L\u1ed7i ghi \u0111\u00e8 Text: ' + result.error, 'error');
        return { success: false, error: result.error };
    }

    return { success: false, error: result.reason || 'BUILD_FAILED' };
}

async function runManualAction({ action, ctx, input, successMsg, deps }) {
    const { button } = ctx;

    try {
        action._setButtonState(button, true);

        const result = await deps.runTemplateAuthoringService(input, deps);
        if (!result.success) {
            if (result.reason === 'READ_FAILED' || result.reason === 'EMPTY_SELECTION') {
                return handleSelectionFailure(result, deps.showToast);
            }
            return handleBuildFailure(result, deps.showToast);
        }

        deps.showToast(successMsg(result), 'success');
        return {
            success: true,
            count: result.count
        };
    } catch (err) {
        console.error(err);
        deps.showToast('L\u1ed7i h\u1ec7 th\u1ed1ng: ' + err.message, 'error');
        return { success: false, error: err.message };
    } finally {
        action._setButtonState(button, false);
    }
}

export const ManualInjectAction = {
    async injectSingle(ctx, deps = {}) {
        const resolvedDeps = createDeps(deps);
        const hostFacade = ctx.hostFacade || ctx.bridge;
        return runManualAction({
            action: this,
            ctx,
            input: {
                hostFacade,
                bridge: hostFacade,
                mode: 'single',
                schemaValue: ctx.schemaValue
            },
            successMsg: () => `\ud83e\ude84 \u0110\u00e3 ti\u00eam ${ctx.schemaValue}`,
            deps: resolvedDeps
        });
    },

    async injectCompound(ctx, deps = {}) {
        const resolvedDeps = createDeps(deps);
        const hostFacade = ctx.hostFacade || ctx.bridge;
        return runManualAction({
            action: this,
            ctx,
            input: {
                hostFacade,
                bridge: hostFacade,
                mode: 'compound',
                schemaValue: ctx.schemaValue
            },
            successMsg: (result) => `\ud83d\udd17 \u0110\u00e3 ti\u00eam compound [${result.keys.join(' + ')}]`,
            deps: resolvedDeps
        });
    },

    async injectBulk(ctx, deps = {}) {
        const resolvedDeps = createDeps(deps);
        const hostFacade = ctx.hostFacade || ctx.bridge;
        return runManualAction({
            action: this,
            ctx,
            input: {
                hostFacade,
                bridge: hostFacade,
                mode: 'bulk',
                prefix: ctx.prefix
            },
            successMsg: () => '\u2601\ufe0f Ti\u00eam c\u1ee5m Top-Down th\u00e0nh c\u00f4ng!',
            deps: resolvedDeps
        });
    },

    async injectDateClone(ctx, deps = {}) {
        const resolvedDeps = createDeps(deps);
        const hostFacade = ctx.hostFacade || ctx.bridge;
        return runManualAction({
            action: this,
            ctx,
            input: {
                hostFacade,
                bridge: hostFacade,
                mode: 'dateClone',
                targetMoc: ctx.targetMoc
            },
            successMsg: (result) => `\ud83d\udccb \u0110\u00e3 clone ${result.affectedCount} frame sang date.${ctx.targetMoc}.*`,
            deps: resolvedDeps
        });
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
