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
     * @param {Function} ctx.showToast - Toast notification function
     * @param {HTMLButtonElement} ctx.button - Update button element  
     * @returns {Promise<{success: boolean, updated?: number, error?: string}>}
     */
    async execute(ctx) {
        const { bridge, builder, showToast, button } = ctx;

        try {
            // 1. UI: Disable button
            button.disabled = true;
            button.textContent = '⏳';

            // 2. Get form data
            const rawData = builder.getData();

            // 3. Run assembler pipeline (if available)
            let processedData = rawData;

            if (typeof WeddingAssembler !== 'undefined') {
                // 3a. Inject dependencies
                WeddingAssembler.setDependencies({
                    normalizer: typeof Normalizer !== 'undefined' ? Normalizer : null,
                    nameAnalysis: typeof NameAnalysis !== 'undefined' ? NameAnalysis : null,
                    calendarEngine: typeof CalendarEngine !== 'undefined' ? CalendarEngine : null,
                    weddingRules: typeof WeddingRules !== 'undefined' ? WeddingRules : null,
                    timeAutomation: typeof TimeAutomation !== 'undefined' ? TimeAutomation : null,
                    venueAutomation: typeof VenueAutomation !== 'undefined' ? VenueAutomation : null
                });

                // 3b. Assemble: normalize → names → parents → dates → time → venue → mapping
                processedData = await WeddingAssembler.assemble(rawData, SchemaLoader.getSync());
            }

            // 4. Send to Illustrator via Bridge
            const result = await bridge.updateWithStrategy(processedData);

            // 5. Handle result
            if (result && result.success) {
                showToast(`Đã cập nhật thông minh ${result.updated} vị trí!`, 'success');
                return { success: true, updated: result.updated };
            } else {
                showToast('Lỗi: ' + (result?.error || 'Unknown error'), 'error');
                return { success: false, error: result?.error };
            }

        } catch (err) {
            showToast('Update lỗi: ' + err.message, 'error');
            return { success: false, error: err.message };

        } finally {
            button.disabled = false;
            button.textContent = '📤 Update';
        }
    }
};

