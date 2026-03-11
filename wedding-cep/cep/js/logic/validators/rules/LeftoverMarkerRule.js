export class LeftoverMarkerRule {
    /**
     * Bắt lỗi các cặp ngoặc nhọn `{...}` còn sót lại sau khi Inject Schema.
     * Đây là dấu hiệu của việc field bị thiếu data hoặc user gõ sai cú pháp biến.
     */
    validate(frame, context) {
        if (!frame || !frame.text) return null;

        // Strict Validation Best Practice: Explicitly require the render phase
        if (!context || context.phase !== 'render') return null;

        // Quét tìm tất cả các pattern giống với schema variable: {ceremony.ten}, {ho+ten}...
        const leftoverRegex = /\{[\w.+]+\}/g;
        const matches = frame.text.match(leftoverRegex);

        if (matches && matches.length > 0) {
            return {
                type: 'error',
                message: `Phát hiện ${matches.length} key template chưa được dịch: ${matches.join(', ')}`,
                highlight: matches[0],
                frameId: frame.id
            };
        }

        return null;
    }
}
