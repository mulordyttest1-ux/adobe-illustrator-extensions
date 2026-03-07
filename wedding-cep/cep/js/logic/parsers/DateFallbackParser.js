import { AbstractParser } from './AbstractParser.js';

/**
 * Parser TIER 3: Vét máng các con số "mồ côi" dựa trên Chân Lý Toàn Cục (Global Truth).
 * Chạy vòng 2, khi mà MỌI mốc thời gian chắc chắn đã bị các Parser vòng 1 hốt và đánh dấu Consumed.
 */
export class DateFallbackParser extends AbstractParser {
    parse(context) {
        const { originalText, targetType, consumedRanges, globalTruth } = context;
        if (!globalTruth) return []; // Không có chân lý thì không làm gì cả

        const replacements = [];

        // Dùng \b để cắn đúng con số độc lập, không cắn số trong chuỗi dài
        const regex = /\b(\d{1,4})\b/g;
        let match;

        while ((match = regex.exec(originalText)) !== null) {
            const numText = match[1];
            const num = parseInt(numText, 10);
            const start = match.index;
            const end = start + numText.length;

            // Bất khả xâm phạm: Số đã bị hốt trước đó
            if (this.isConsumed(start, end, consumedRanges)) {
                continue;
            }

            let val = null;

            // Áp luật Map chéo (Cross-Validation Mapping)
            // Thứ tự ưu tiên: Ngày -> Tháng -> Năm (Nếu vô tình Ngày trùng Năm (VD Ngày 26 năm 2026), ưu tiên bắt Ngày vì Ngày mồ côi phổ biến hơn Năm mồ côi trên thiệp).
            if (num === globalTruth.ngay) {
                val = `{date.${targetType}.ngay}`;
            } else if (num === globalTruth.thang) {
                val = `{date.${targetType}.thang}`;
            } else if (globalTruth.nam && (num === globalTruth.nam || num === (globalTruth.nam % 100))) {
                // Support năm viết tắt VD 26 thay vì 2026
                val = `{date.${targetType}.nam}`;
            }

            if (val) {
                replacements.push({ start, end, val });
            }
        }

        return replacements;
    }
}
