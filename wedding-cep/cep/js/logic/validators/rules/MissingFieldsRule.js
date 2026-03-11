export class MissingFieldsRule {
    /**
     * Kiểm tra xem các trường bắt buộc (được truyền từ ngoài vào qua context)
     * có thực sự vắng mặt trên text sau khi đã render hay không.
     * Mọi deduplicate sẽ được lo liệu bởi UI hoặc PostflightValidator
     */
    validate(frame, context) {
        if (!context || !context.missedKeys || context.missedKeys.length === 0) return null;

        return {
            type: 'error',
            message: `Thiết kế đang THIẾU các trường bắt buộc: ${context.missedKeys.join(', ')}`,
            highlight: 'Toàn bộ tài liệu',
            frameId: frame.id // Gán bừa vào frame hiện tại để user có chỗ bấm
        };
    }
}
