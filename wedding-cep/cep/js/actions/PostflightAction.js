import { PostflightValidator } from '../logic/validators/PostflightValidator.js';
import { ValidationReportWidget } from '../components/modules/ValidationReportWidget.js';

export const PostflightAction = {
    /**
     * Executes the post-flight validation and renders the report UI.
     * @param {Object} ctx            - Context object containing bridge
     * @param {Array}  affectedFrames - Frames `{id, text}` from Bridge apply result (written frames)
     * @param {Object} validationContext - { phase, formData?, schemaKeys?, missedKeys? }
     */
    async execute(ctx, affectedFrames = [], validationContext = {}) {
        const validator = new PostflightValidator();

        // Fetch ALL frames in current selection for broad-scan rules (LeftoverMarker, Suspicious)
        let allFrames = affectedFrames; // Fallback: at minimum scan affected
        try {
            const selectionResult = await ctx.bridge.readSelectionObjects();
            if (selectionResult && selectionResult.success &&
                Array.isArray(selectionResult.data) && selectionResult.data.length > 0) {
                allFrames = selectionResult.data;
            }
        } catch (e) {
            console.warn('[PostflightAction] Could not fetch all frames, falling back to affected only:', e);
        }

        const report = validator.inspect(affectedFrames, allFrames, validationContext);

        // Render UI
        ValidationReportWidget.show(report, ctx.bridge);

        return { success: true, report };
    }
};

