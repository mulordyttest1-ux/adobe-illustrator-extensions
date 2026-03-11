import { UIFeedback } from '../controllers/helpers/UIFeedback.js';
import { PostflightAction } from './PostflightAction.js';

/**
 * MODULE: UpdateAction
 * LAYER: Entry/Actions
 * PURPOSE: Handle Update button — assemble form data, run pipeline, apply to Illustrator via Bridge
 * DEPENDENCIES: Bridge, WeddingAssembler, SchemaLoader + all domain modules (via DI)
 * SIDE EFFECTS: DOM (button state, toast), CEP Bridge
 * EXPORTS: UpdateAction.execute()
 */

export const UpdateAction = {
    /**
     * Execute update action.
     * @param {Object} ctx - Action context
     * @param {Object} ctx.bridge - Bridge instance
     * @param {Object} ctx.builder - CompactFormBuilder instance
     * @param {HTMLButtonElement} ctx.button - Update button element  
     * @returns {Promise<{success: boolean, updated?: number, error?: string}>}
     */
    async execute(ctx) {
        const { bridge, builder, button } = ctx;

        try {
            this._setButtonState(button, true);

            const rawData = builder.getData();
            const processedData = await this._assembleData(rawData);

            const result = await bridge.updateWithStrategy(processedData);

            if (result && result.success) {
                UIFeedback.showToast(`Đã cập nhật thông minh ${result.updated} vị trí!`, 'success');

                // TRIGGER POSTFLIGHT VALIDATION (Render Phase)
                await PostflightAction.execute(ctx, result.affected || [], {
                    phase: 'render'
                });

                return { success: true, updated: result.updated };
            } else {
                UIFeedback.showToast('Lỗi: ' + (result?.error || 'Unknown error'), 'error');
                return { success: false, error: result?.error };
            }

        } catch (err) {
            UIFeedback.showToast('Update lỗi: ' + err.message, 'error');
            return { success: false, error: err.message };

        } finally {
            this._setButtonState(button, false);
        }
    },

    _setButtonState(button, isUpdating) {
        button.disabled = isUpdating;
        button.textContent = isUpdating ? '⏳' : '📤 Update';
    },

    async _assembleData(rawData) {
        if (typeof WeddingAssembler === 'undefined') return rawData;

        WeddingAssembler.setDependencies({
            normalizer: typeof Normalizer !== 'undefined' ? Normalizer : null,
            nameAnalysis: typeof NameAnalysis !== 'undefined' ? NameAnalysis : null,
            calendarEngine: typeof CalendarEngine !== 'undefined' ? CalendarEngine : null,
            weddingRules: typeof WeddingRules !== 'undefined' ? WeddingRules : null,
            timeAutomation: typeof TimeAutomation !== 'undefined' ? TimeAutomation : null,
            venueAutomation: typeof VenueAutomation !== 'undefined' ? VenueAutomation : null
        });

        const schema = typeof SchemaLoader !== 'undefined' ? SchemaLoader.getSync() : null;
        return await WeddingAssembler.assemble(rawData, schema);
    }
};

