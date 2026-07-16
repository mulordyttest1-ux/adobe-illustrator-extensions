import { UIFeedback } from '@shared/cep-ui';
import { runSwapInvitationSides } from '../logic/use-cases/swapInvitationSides.js';

/**
 * MODULE: SwapAction
 * LAYER: Entry/Actions
 * PURPOSE: Handle Swap button - exchange POS1 <-> POS2 data
 * DEPENDENCIES: CompactFormBuilder, swapInvitationSides use-case
 * SIDE EFFECTS: DOM (form values, toast)
 * EXPORTS: SwapAction.execute()
 */

export const SwapAction = {
    /**
     * Execute swap action.
     * @param {Object} ctx - Action context
     * @param {Object} ctx.builder - CompactFormBuilder instance
     * @returns {{success: boolean}}
     */
    execute(ctx, deps = {}) {
        const { builder } = ctx;
        const swapInvitationSides = deps.runSwapInvitationSides || runSwapInvitationSides;
        const showToast = deps.showToast || UIFeedback.showToast;

        const { data } = swapInvitationSides({
            data: builder.getData()
        });

        builder.setData(data);
        showToast('\u0110\u00E3 ho\u00E1n \u0111\u1ED5i POS!', 'success');
        return { success: true };
    }
};
