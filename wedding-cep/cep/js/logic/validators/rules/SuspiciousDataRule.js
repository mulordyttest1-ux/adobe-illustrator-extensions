export class SuspiciousDataRule {
    /**
     * Tìm dữ liệu rác (số điện thoại, ngày tháng) không nằm trong ngoặc nhọn
     * (Khả năng cao do user để sót text tĩnh mà quên gắn biến Schema)
     */
    validate(frame, _context) {
        if (!frame || !frame.text) return null;

        const results = [];

        // 1. Quét Số điện thoại (Bắt đầu bằng 0, 10 số)
        const phoneRegex = /\b0\d{9}\b/g;
        if (phoneRegex.test(frame.text)) {
            results.push({
                type: 'warning',
                message: `Phát hiện SĐT tĩnh chưa gắn biến {sdt}. Hãy cẩn thận!`,
                highlight: frame.text.match(phoneRegex)[0],
                frameId: frame.id
            });
        }

        // 2. Quét Ngày tháng (Định dạng DD/MM hoặc DD-MM)
        const dateRegex = new RegExp("\\b\\d{1,2}[/-]\\d{1,2}\\r?\\n?\\b", "g");
        // Bỏ qua nếu có chữ "ngày" hoặc "tháng" phía trước (đã xử lý logic tốt)
        if (dateRegex.test(frame.text) && !frame.text.includes('ngày') && !frame.text.includes('tháng')) {
            results.push({
                type: 'warning',
                message: `Ngày tháng tĩnh (vd 15/09) chưa gắn thành {date.tiec.*}`,
                highlight: frame.text.match(dateRegex)[0],
                frameId: frame.id
            });
        }

        // Ưu tiên trả về lỗi lớn nhất nếu có (Ở đây toàn bộ là warning)
        return results.length > 0 ? results[0] : null;
    }
}
