/**
 * RULE: OrphanDataRule
 * PURPOSE: Detect form fields that are filled in but no frame in the document
 *          contains the corresponding schema variable (e.g., {bride.name}).
 *          This means data was filled but never had a destination on the design.
 * PHASE: 'render' (global context rule — runs once, not per-frame)
 */
export class OrphanDataRule {
    /**
     * @param {Object} frame - Current frame being inspected
     * @param {Object} context
     * @param {Object} context.formData     - Raw form data { key: value }
     * @param {string[]} context.allFrameTexts - All document frame texts for scanning
     */
    validate(frame, context) {
        if (!context || !context.formData || !context.allFrameTexts) return null;

        // Only run once (when frame index = 0 equivalent — checked by presence of allFrameTexts)
        // We use frameId = '__global__' as a sentinel to avoid running per-frame
        if (frame.id !== '__global__') return null;

        const allText = context.allFrameTexts.join('\n');
        const filledKeys = Object.entries(context.formData)
            .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '')
            .map(([key]) => key);

        // Find keys whose schema variable {key} doesn't appear in any frame at all
        const orphans = filledKeys.filter(key => !allText.includes(`{${key}}`));

        if (orphans.length === 0) return null;

        return {
            type: 'warning',
            message: `${orphans.length} trường form có data nhưng không có frame nào nhận: ${orphans.join(', ')}`,
            highlight: orphans[0],
            frameId: null
        };
    }
}
