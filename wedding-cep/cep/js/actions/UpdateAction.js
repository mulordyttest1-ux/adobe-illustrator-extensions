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
                // NOTE: No toast here — PostflightWidget reports success/failure after validation
                await PostflightAction.execute(ctx, result.affected || [], {
                    phase: 'render',
                    formData: rawData,
                    schemaKeys: this._extractSchemaKeys()
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

    /**
     * Extract flat form-field keys from schema.STRUCTURE (with prefix + DERIVED expansion).
     * e.g. group prefix=pos1, item key=ong, type=person_name
     *   → ['pos1.ong', 'pos1.ong.ten', 'pos1.ong.lot', 'pos1.ong.ho_dau', 'pos1.ong.dau']
     * e.g. item key=date.tiec, type=solar_date
     *   → ['date.tiec', 'date.tiec.ngay', 'date.tiec.thang', ...]
     * @returns {string[]}
     */
    _extractSchemaKeys() {
        const schema = typeof SchemaLoader !== 'undefined' ? SchemaLoader.getSync() : null;
        if (!schema || !Array.isArray(schema.STRUCTURE)) return [];

        const nameSuffixes = (schema.DERIVED?.NAME || []).map(d => d.suffix).filter(Boolean);
        const dateSuffixes = (schema.DERIVED?.DATE || []).map(d => d.suffix).filter(Boolean);

        return schema.STRUCTURE.flatMap(group => {
            const prefix = group.prefix || '';
            return (group.items || []).flatMap(item => {
                const base = prefix ? `${prefix}.${item.key}` : item.key;
                const keys = [base];

                // Expand name derivations (person_name type)
                if (item.type === 'person_name' || item.type === 'name') {
                    nameSuffixes.forEach(s => keys.push(base + s));
                }

                // Expand date derivations (date and solar_date types)
                if (item.type === 'date' || item.type === 'solar_date') {
                    dateSuffixes.forEach(s => keys.push(base + s));
                }

                return keys;
            });
        });
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

