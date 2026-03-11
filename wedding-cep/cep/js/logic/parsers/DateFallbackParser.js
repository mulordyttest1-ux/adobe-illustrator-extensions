import { AbstractParser } from './AbstractParser.js';

/**
 * Parser TIER 3: Vét máng các con số "mồ côi" dựa trên Chân Lý Toàn Cục (Global Truth).
 * Chạy vòng 2, khi mà MỌI mốc thời gian chắc chắn đã bị các Parser vòng 1 hốt và đánh dấu Consumed.
 */
export class DateFallbackParser extends AbstractParser {
    parse(context) {
        const { originalText, targetType, consumedRanges, globalTruth, crossFrameOrphans } = context;

        // Nhánh A: Có Chân Lý Toàn Cục → Map chéo như cũ
        if (globalTruth) {
            return this._mapWithTruth(originalText, targetType, consumedRanges, globalTruth);
        }

        // Nhánh B: Không có Chân Lý → Self-Infer từ cross-frame orphans
        if (crossFrameOrphans && crossFrameOrphans.length > 0) {
            return this._selfInfer(originalText, targetType, consumedRanges, crossFrameOrphans, context);
        }

        return [];
    }

    /**
     * Nhánh A: Map chéo với Global Truth (Logic cũ giữ nguyên)
     */
    _mapWithTruth(originalText, targetType, consumedRanges, globalTruth) {
        const replacements = [];
        const regex = /\b(\d{1,4})\b/g;
        let match;

        while ((match = regex.exec(originalText)) !== null) {
            const numText = match[1];
            const num = parseInt(numText, 10);
            const start = match.index;
            const end = start + numText.length;

            if (this.isConsumed(start, end, consumedRanges)) continue;

            let val = null;
            if (num === globalTruth.ngay) {
                val = `{date.${targetType}.ngay}`;
            } else if (num === globalTruth.thang) {
                val = `{date.${targetType}.thang}`;
            } else if (globalTruth.nam && (num === globalTruth.nam || num === (globalTruth.nam % 100))) {
                val = `{date.${targetType}.nam}`;
            }

            if (val) {
                replacements.push({ start, end, val });
            }
        }
        return replacements;
    }

    /**
     * Nhánh B: Self-Infer — Suy luận Ngày/Tháng/Năm từ các số thuần orphan
     * Điều kiện an toàn: Chỉ chạy nếu toàn bộ orphans đều là frame chỉ-có-số-thuần
     * Heuristic VN: năm (≥100) → tháng (≤12 & khác ngày) → ngày (≤31)
     */
    // eslint-disable-next-line complexity
    _selfInfer(originalText, targetType, consumedRanges, crossFrameOrphans) {
        // Bước 1: Phân loại tất cả orphan numbers trên TOÀN THIỆP
        const nums = crossFrameOrphans.map(o => o.num);
        const uniqueNums = [...new Set(nums)];

        // Tìm ứng cử viên cho từng vai trò
        const namCandidates = uniqueNums.filter(n => n >= 100); // ≥100 chắc chắn là Năm
        const ngayCandidates = uniqueNums.filter(n => n >= 1 && n <= 31 && n < 100);

        // Bước 2: Suy luận từ Năm (Chắc chắn nhất) → Tháng → Ngày
        let inferredNam = null;
        let inferredThang = null;
        let inferredNgay = null;

        // Năm: Phải có đúng 1 số ≥100 (hoặc ≥2000)
        if (namCandidates.length === 1) {
            inferredNam = namCandidates[0];
        }

        // Tháng & Ngày: Lọc bỏ năm, phân biệt bằng logic
        const remaining = ngayCandidates.filter(n => n !== inferredNam);

        if (remaining.length >= 2) {
            // Có ít nhất 2 số nhỏ: cái nào ≤12 → Tháng, cái còn lại → Ngày
            // Sort tăng dần, số nhỏ hơn ưu tiên là Tháng (convention VN)
            const sorted = [...remaining].sort((a, b) => a - b);

            // Heuristic: Nếu có 1 số > 12 → nó chắc chắn là Ngày, số kia là Tháng
            const bigNums = sorted.filter(n => n > 12);
            const smallNums = sorted.filter(n => n <= 12);

            if (bigNums.length === 1 && smallNums.length >= 1) {
                inferredNgay = bigNums[0];
                inferredThang = smallNums[0];
            } else if (bigNums.length === 0 && smallNums.length >= 2) {
                // Cả 2 đều ≤12 → Ambiguous! Từ chối suy luận (an toàn)
                return [];
            } else if (smallNums.length === 1 && bigNums.length === 0) {
                // Chỉ có 1 số → gán tạm là Ngày (phổ biến nhất trên thiệp)
                inferredNgay = smallNums[0];
            }
        } else if (remaining.length === 1) {
            // Chỉ có 1 số nhỏ: gán là Ngày (phổ biến nhất trên thiệp standalone)
            inferredNgay = remaining[0];
        }

        // Bước 3: Nếu suy luận được ít nhất 1 thành phần → Map vào frame hiện tại
        if (!inferredNgay && !inferredThang && !inferredNam) return [];

        const replacements = [];
        const regex = /\b(\d{1,4})\b/g;
        let match;

        while ((match = regex.exec(originalText)) !== null) {
            const numText = match[1];
            const num = parseInt(numText, 10);
            const start = match.index;
            const end = start + numText.length;

            if (this.isConsumed(start, end, consumedRanges)) continue;

            let val = null;
            if (inferredNgay !== null && num === inferredNgay) {
                val = `{date.${targetType}.ngay}`;
            } else if (inferredThang !== null && num === inferredThang) {
                val = `{date.${targetType}.thang}`;
            } else if (inferredNam !== null && (num === inferredNam || num === (inferredNam % 100))) {
                val = `{date.${targetType}.nam}`;
            }

            if (val) {
                replacements.push({ start, end, val });
            }
        }
        return replacements;
    }
}
