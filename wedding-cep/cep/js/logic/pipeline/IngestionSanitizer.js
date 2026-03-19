/**
 * MODULE: IngestionSanitizer
 * LAYER: Logic/Pipeline (Data Ingestion)
 * PURPOSE: Lột xác dữ liệu thô (Raw Frames) từ Illustrator về Browser. 
 * Xóa bỏ mã tàng hình U200B và chuẩn hóa ký tự khoảng trắng trước khi cho phép vào hệ thống.
 */

export class IngestionSanitizer {
    /**
     * Tiền xử lý (Sanitize) mảng chứa các khung văn bản
     * @param {Array} frames 
     * @returns {Array} Clean Frames
     */
    static sanitizeFrames(frames) {
        if (!Array.isArray(frames)) return frames;

        return frames.map(frame => {
            if (!frame) return frame;

            // ═══════════════════════════════════════════════════════════════
            // TRƯỜNG: frame.text
            // CONSUMER: SchemaInjector.js (Regex matching + Source Mapping)
            // ĐƯỢC PHÉP: Dọn U200B bằng Source Map để bảo toàn Index
            // ═══════════════════════════════════════════════════════════════
            if (typeof frame.text === 'string') {
                // Đổi 1-1 các khoảng trắng dị (không làm lệch index)
                frame.text = frame.text.replace(/\u00A0/g, ' ');

                // Source Mapping cho ký tự Zero-Width (U200B)
                const origText = frame.text;
                const cleanMap = [];
                let cleanStr = "";

                for (let i = 0; i < origText.length; i++) {
                    if (origText[i] !== '\u200B') {
                        cleanMap.push(i);
                        cleanStr += origText[i];
                    }
                }
                cleanMap.push(origText.length); // Neo mốc end cuối cùng

                frame._cleanMap = cleanMap; // Bản đồ bù trừ tọa độ cho JSX
                frame.text = cleanStr;      // Chuỗi rút gọn giao cho Regex
            }

            // ═══════════════════════════════════════════════════════════════
            // TRƯỜNG: frame.contents
            // CONSUMER: StrategyOrchestrator.js (SmartComplex/Fresh strategy)
            // ĐƯỢC PHÉP: Xóa thẳng U200B (không cần Source Map, không dùng Index)
            // ═══════════════════════════════════════════════════════════════
            if (typeof frame.contents === 'string') {
                frame.contents = frame.contents
                    .replace(/\u200B/g, '')
                    .replace(/\u00A0/g, ' ');
            }

            // ═══════════════════════════════════════════════════════════════
            // TRƯỜNG: frame.raw_content
            // CONSUMER: DataValidator.js — dùng cặp \u200B làm MARKER chia cắt
            // ⛔ TUYỆT ĐỐI CẤM SANITIZE TRƯỜNG NÀY!
            // Nếu xóa \u200B ở đây, DataValidator sẽ MÙ hoàn toàn sau lần Scan đầu tiên.
            // ═══════════════════════════════════════════════════════════════

            return frame;
        });
    }

    /**
     * Dịch chuyển tọa độ (Restore Index) dựa trên Source Map đã lập
     * @param {Array} replacements Mảng lệnh thay thế chứa start/end
     * @param {Array} frameMap Mảng Source Map _cleanMap
     */
    static restoreIndices(replacements, frameMap) {
        if (!frameMap || !replacements) return;
        replacements.forEach(rep => {
            if (rep.start !== undefined && frameMap[rep.start] !== undefined) {
                rep.start = frameMap[rep.start];
            }
            if (rep.end !== undefined && frameMap[rep.end] !== undefined) {
                rep.end = frameMap[rep.end];
            }
        });
    }
}
