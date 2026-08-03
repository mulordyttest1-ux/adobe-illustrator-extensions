import { UIFeedback } from '@shared/cep-ui';
import { SchemaLoader } from '../infrastructure/schemaLoader.js';
import { runApplyStrategyUpdate } from '../logic/use-cases/applyStrategyUpdate.js';
import { runUpdateDocument } from '../logic/use-cases/updateDocument.js';

function resolveDeps(deps = {}) {
    return {
        getSchema: deps.getSchema || (() => SchemaLoader.getSync()),
        runUpdateDocument: deps.runUpdateDocument || runUpdateDocument,
        runApplyStrategyUpdate: deps.runApplyStrategyUpdate || runApplyStrategyUpdate,
        showToast: deps.showToast || ((message, type) => UIFeedback.showToast(message, type))
    };
}

function createApplyUpdate(hostFacade, deps) {
    return (processedData) => deps.runApplyStrategyUpdate({
        hostFacade,
        packet: processedData
    });
}

function isNoOpUpdateResult(result) {
    return Boolean(result)
        && result.success === true
        && Number(result.updated || 0) === 0
        && (!Array.isArray(result.affected) || result.affected.length === 0);
}

const REQUIRED_RADIO_SELECTIONS = Object.freeze([
    { key: 'info.ten_le', label: 'Lo\u1ea1i L\u1ec5' },
    { key: 'ui.vithu_nam', label: 'V\u1ecb Th\u1ee9 Nam' },
    { key: 'ui.vithu_nu', label: 'V\u1ecb Th\u1ee9 N\u1eef' }
]);

function getMissingRequiredSelections(rawData = {}) {
    return REQUIRED_RADIO_SELECTIONS.filter((field) => {
        const value = rawData[field.key];
        return !String(value || '').trim();
    });
}

function createMissingSelectionsMessage(missingSelections) {
    const labels = missingSelections.map((field) => field.label).join(', ');
    return `Ch\u01b0a ch\u1ecdn: ${labels}. Vui l\u00f2ng ch\u1ecdn tr\u01b0\u1edbc khi Update.`;
}

async function executeUpdateFlow(ctx, deps) {
    const hostFacade = ctx.hostFacade;
    const { builder } = ctx;
    const rawData = builder.getData();
    const schema = deps.getSchema();
    const missingSelections = getMissingRequiredSelections(rawData);

    if (missingSelections.length) {
        deps.showToast(createMissingSelectionsMessage(missingSelections), 'error');
        return {
            success: false,
            error: 'MISSING_REQUIRED_SELECTIONS',
            missingSelections: missingSelections.map((field) => field.key)
        };
    }

    const result = await deps.runUpdateDocument({
        rawData,
        schema,
        applyUpdate: createApplyUpdate(hostFacade, deps)
    });

    if (!result || !result.success) {
        deps.showToast('L\u1ed7i: ' + (result?.error || 'Unknown error'), 'error');
        return { success: false, error: result?.error };
    }

    if (isNoOpUpdateResult(result)) {
        deps.showToast('Kh\u00f4ng c\u00f3 thay \u0111\u1ed5i n\u00e0o \u0111\u01b0\u1ee3c \u00e1p d\u1ee5ng trong v\u00f9ng ch\u1ecdn hi\u1ec7n t\u1ea1i.', 'info');
        return { success: true, updated: 0 };
    }

    return { success: true, updated: result.updated };
}

function handleUpdateError(error, showToast) {
    showToast('Update l\u1ed7i: ' + error.message, 'error');
    return { success: false, error: error.message };
}

/**
 * MODULE: UpdateAction
 * LAYER: Entry/Actions
 * PURPOSE: Handle Update button - collect form data, hand off processing, apply to Illustrator via HostFacade
 * DEPENDENCIES: HostFacade, SchemaLoader, updateDocument use-case
 * SIDE EFFECTS: DOM (button state, toast), CEP HostFacade
 * EXPORTS: UpdateAction.execute()
 */

export const UpdateAction = {
    /**
     * Execute update action.
     * @param {Object} ctx - Action context
     * @param {Object} ctx.hostFacade - HostFacade instance
     * @param {Object} ctx.builder - CompactFormBuilder instance
     * @param {HTMLButtonElement} ctx.button - Update button element
     * @returns {Promise<{success: boolean, updated?: number, error?: string}>}
     */
    async execute(ctx, deps = {}) {
        const resolvedDeps = resolveDeps(deps);
        const { button } = ctx;

        try {
            this._setButtonState(button, true);
            return await executeUpdateFlow(ctx, resolvedDeps);
        } catch (error) {
            return handleUpdateError(error, resolvedDeps.showToast);
        } finally {
            this._setButtonState(button, false);
        }
    },

    _setButtonState(button, isUpdating) {
        button.disabled = isUpdating;
        button.textContent = isUpdating ? '\u23F3' : '\uD83D\uDCE4 Update';
    }
};
