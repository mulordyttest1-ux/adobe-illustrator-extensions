import { EventInfoParser } from './parsers/EventInfoParser.js';
import { TimeStrictParser } from './parsers/TimeStrictParser.js';
import { DateStandaloneParser } from './parsers/DateStandaloneParser.js';
import { DateHeuristicParser } from './parsers/DateHeuristicParser.js';
import { GlobalDateValidator } from './validators/GlobalDateValidator.js';
import { DateFallbackParser } from './parsers/DateFallbackParser.js';

export class SchemaInjector {
    /**
     * @param {Array} frames [{id, text, uuid}]
     * @param {string} targetType Loại thời gian cần tiêm ('tiec', 'le', 'nhap'). Mặc định: 'tiec'
     * @returns {Object} { changes, orphans, missedRequired }
     */
    // eslint-disable-next-line complexity, max-lines-per-function
    static computeChanges(frames, targetType = 'tiec') {
        const changes = [];
        const orphans = [];

        // Pass 1: Suy luận Context (Phe Chủ Tiệc) từ TẤT CẢ frame để lấy thông tin global
        let hostSide = '';
        for (const frame of frames) {
            const text = frame.text || "";
            if (/(tư\s+gia\s+)?nhà\s+gái/i.test(text)) hostSide = 'nha_gai';
            else if (/(tư\s+gia\s+)?nhà\s+trai/i.test(text)) hostSide = 'nha_trai';
            else if (/vu\s+quy/i.test(text)) hostSide = 'nha_gai';
            else if (/tân\s+hôn/i.test(text)) hostSide = 'nha_trai';
        }

        // Định nghĩa Pipeline chuẩn SRP (Two-Pass Parsing)
        const stage1Pipeline = [
            new EventInfoParser(),
            new TimeStrictParser(),
            new DateHeuristicParser(),
            new DateStandaloneParser()
        ];

        const initialChangesList = [];

        // Pass 1: Chạy TIER 0 đến TIER 2 để lấy Dữ liệu Chắc Chắn
        for (const frame of frames) {
            const originalText = frame.text || "";
            if (!originalText) continue;

            const context = {
                originalText,
                targetType,
                hostSide,
                consumedRanges: [] // Các Parser sẽ đọc và đẩy kết quả vào đây
            };

            let allReplacements = [];

            // Execute Stage 1
            for (const parser of stage1Pipeline) {
                const results = parser.parse(context);
                allReplacements = allReplacements.concat(results);

                // Cập nhật Vùng đã đánh dấu (Consumed) cho Công nhân đi sau
                for (const r of results) {
                    context.consumedRanges.push([r.start, r.end]);
                }
            }

            initialChangesList.push({
                id: frame.id,
                context,
                allReplacements
            });
        }

        // Pass 1.5: Trích xuất Chân Lý Toàn Cục (Global Truth) qua Module Trung Gian
        const validationInput = initialChangesList.map(item => ({
            id: item.id,
            plan: { replacements: item.allReplacements }
        }));
        const globalTruth = GlobalDateValidator.extractTruth(validationInput, frames, targetType);

        // Pass 2: Chạy TIER 3 (DateFallbackParser - Vét Máng)
        const stage2Pipeline = [
            new DateFallbackParser()
        ];

        // [FIX] Khi globalTruth null, thu thập cross-frame orphan numbers cho Self-Infer
        let crossFrameOrphans = null;
        if (!globalTruth) {
            crossFrameOrphans = [];
            for (const item of initialChangesList) {
                const text = item.context.originalText;
                const consumed = item.context.consumedRanges;
                const numRegex = /\b(\d{1,4})\b/g;
                let nm;
                while ((nm = numRegex.exec(text)) !== null) {
                    const s = nm.index;
                    const e = s + nm[1].length;
                    const isConsumed = consumed.some(([cs, ce]) => s < ce && e > cs);
                    if (!isConsumed) {
                        crossFrameOrphans.push({ id: item.id, num: parseInt(nm[1], 10), start: s, end: e });
                    }
                }
            }
        }

        for (const item of initialChangesList) {
            const frame = frames.find(f => f.id === item.id);
            const context = item.context;
            context.globalTruth = globalTruth;
            context.crossFrameOrphans = crossFrameOrphans;

            let allReplacements = item.allReplacements;

            // Execute Stage 2
            for (const parser of stage2Pipeline) {
                const results = parser.parse(context);
                allReplacements = allReplacements.concat(results);
                for (const r of results) {
                    context.consumedRanges.push([r.start, r.end]);
                }
            }

            if (allReplacements.length > 0) {
                // Sort giảm dần chống Shift Index Bug (Điểm cốt lõi của giải thuật Atomic)
                allReplacements.sort((a, b) => b.start - a.start);

                // Lọc Overlaps 1 lần cuối (Dù Pipeline đã chống chạm, ta vẫn phòng vệ) 
                const filteredReplacements = [];
                let currEnd = -1;
                for (const rep of allReplacements) {
                    if (currEnd === -1 || rep.end <= currEnd) {
                        filteredReplacements.push(rep);
                        currEnd = rep.start;
                    }
                }

                changes.push({
                    id: item.id,
                    plan: {
                        mode: "ATOMIC",
                        replacements: filteredReplacements,
                        meta: { action: 'clear' }
                    }
                });
            } else {
                // Kiểm tra số rời: frame chỉ chứa số thuần, không được tiêm gì
                if (/^\s*\d{1,4}\s*$/.test(context.originalText)) {
                    orphans.push(frame);
                }
            }
        }

        const missedRequired = [];
        return { changes, orphans, missedRequired };
    }
}

// Bơm ra Global để phục vụ CDP Live Testing
if (typeof window !== 'undefined') window.SchemaInjector = SchemaInjector;
