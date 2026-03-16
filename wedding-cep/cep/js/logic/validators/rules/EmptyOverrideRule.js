/**
 * RULE: EmptyOverrideRule
 * PURPOSE: Detect frames that ended up empty after an update.
 *          A frame with empty text after rendering indicates a required field was blanked out.
 * PHASE: 'render' (after UpdateAction writes to document)
 */
export class EmptyOverrideRule {
    validate(frame, context) {
        if (!frame) return null;
        // Only run in render phase on affected frames
        if (!context || context.phase !== 'render') return null;

        const text = (frame.text || '').trim();
        if (text.length === 0) {
            return {
                type: 'warning',
                message: `Frame bị ghi rỗng sau update (ID: ${frame.id}). Kiểm tra data nguồn!`,
                highlight: frame.id,
                frameId: frame.id
            };
        }

        return null;
    }
}
