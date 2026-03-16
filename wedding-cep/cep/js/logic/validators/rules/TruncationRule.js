/**
 * RULE: TruncationRule
 * PURPOSE: Detect affected frames whose text is suspiciously short after an update.
 *          A frame shorter than MIN_LENGTH chars after rendering likely had its content
 *          cut off (e.g., empty assembly result or failed concatenation).
 * PHASE: 'render' (after UpdateAction writes to document)
 */
const MIN_LENGTH = 3;

export class TruncationRule {

    validate(frame, context) {
        if (!frame || !frame.text) return null;
        if (!context || context.phase !== 'render') return null;

        const text = frame.text.trim();
        // Only flag frames that have SOME text (not empty — EmptyOverrideRule handles that)
        if (text.length > 0 && text.length < MIN_LENGTH) {
            return {
                type: 'warning',
                message: `Frame "${frame.id}" có nội dung ngắn bất thường (${text.length} ký tự): "${text}". Có thể bị cắt!`,
                highlight: text,
                frameId: frame.id
            };
        }

        return null;
    }
}
