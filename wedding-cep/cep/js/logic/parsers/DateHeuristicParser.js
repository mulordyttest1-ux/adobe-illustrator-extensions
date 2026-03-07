import { AbstractParser } from './AbstractParser.js';

/**
 * DateHeuristicParser: TIER 2
 * Quét chuỗi số tự do (không cần nhãn) và phân tích cảm tính để ráp Ngày/Tháng/Năm
 */
export class DateHeuristicParser extends AbstractParser {
    // eslint-disable-next-line complexity
    parse(context) {
        const { originalText, targetType, consumedRanges } = context;
        const replacements = [];

        // Helper check overlap array
        const isRangeConsumed = (s, e) => this.isConsumed(s, e, consumedRanges) ||
            this.isConsumed(s, e, replacements.map(r => [r.start, r.end]));

        const canStr = "Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý";
        const chiStr = "Tý|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi";

        // Single Scanner: bắt cả Năm-Số lẫn Năm-CanChi trong 1 pass
        const scanner = new RegExp(
            `((?:nhằm\\s+ngày\\s+|ngày\\s+)?\\s*)(\\d{1,4})([\\s./-]+|\\s+tháng\\s+)(\\d{1,4})(?:([\\s./-]+|\\s+năm\\s+)(?:(\\d{1,4})|(${canStr})\\s*(${chiStr})))?`,
            'ig'
        );
        let m;
        while ((m = scanner.exec(originalText)) !== null) {
            // Chặn quét nhầm Giờ Phút
            const matchLower = m[0].toLowerCase();
            if (/giờ|phút|\d[h:]\d/.test(matchLower)) { scanner.lastIndex = m.index + 1; continue; }

            const prefixLen = (m[1] || "").length;
            const num1Str = m[2];
            const sep1Len = (m[3] || "").length;
            const num2Str = m[4];
            const sep2Len = (m[5] || "").length;
            const num3Str = m[6];   // Năm dạng SỐ
            const canChi = m[7];    // Can (chữ) — nếu có = Âm lịch

            // Quyết định Âm/Dương CỤC BỘ
            const isLocal = !!canChi || /nhằm/i.test(m[1] || "");
            const sfx = isLocal ? '_al' : '';

            const num1 = parseInt(num1Str);
            const num2 = parseInt(num2Str);
            const num3 = num3Str ? parseInt(num3Str) : null;

            const s1 = m.index + prefixLen;
            const e1 = s1 + num1Str.length;
            if (isRangeConsumed(s1, e1)) { scanner.lastIndex = m.index + 1; continue; }

            const s2 = s1 + num1Str.length + sep1Len;
            const e2 = s2 + num2Str.length;

            if (num3 !== null) {
                // 3 số: Decision Tree
                const isSafe = (n) => n <= 31 || (n >= 20 && n <= 99) || (n >= 2000 && n <= 2099);
                if (![num1, num2, num3].every(isSafe)) { scanner.lastIndex = m.index + 1; continue; }
                const ng = `{date.${targetType}.ngay${sfx}}`;
                const th = `{date.${targetType}.thang${sfx}}`;
                const nm = `{date.${targetType}.nam${sfx}}`;
                let v1, v2, v3;
                if (num3 > 31) { v1 = ng; v2 = th; v3 = nm; }
                else if (num1 > 31) { v1 = nm; v2 = th; v3 = ng; }
                else { v1 = ng; v2 = th; v3 = nm; }
                replacements.push({ start: s1, end: e1, val: v1 });
                replacements.push({ start: s2, end: e2, val: v2 });
                const s3 = s2 + num2Str.length + sep2Len;
                replacements.push({ start: s3, end: s3 + num3Str.length, val: v3 });
            } else if (canChi) {
                // Âm lịch: 2 số + Can Chi (Can Chi đã bị TIER 1 xử lý, giờ xử 2 số)
                replacements.push({ start: s1, end: e1, val: `{date.${targetType}.ngay_al}` });
                replacements.push({ start: s2, end: e2, val: `{date.${targetType}.thang_al}` });
            } else {
                // 2 số gõ tắt
                const isSafe = (n) => n <= 31 || (n >= 20 && n <= 99) || (n >= 2000 && n <= 2099);
                if (![num1, num2].every(isSafe)) { scanner.lastIndex = m.index + 1; continue; }
                const ng = `{date.${targetType}.ngay${sfx}}`;
                const th = `{date.${targetType}.thang${sfx}}`;
                const nm = `{date.${targetType}.nam${sfx}}`;
                let v1, v2;
                if (num2 > 31) { v1 = th; v2 = nm; }
                else if (num1 > 31) { v1 = nm; v2 = th; }
                else { v1 = ng; v2 = th; }
                replacements.push({ start: s1, end: e1, val: v1 });
                replacements.push({ start: s2, end: e2, val: v2 });
            }
        }
        return replacements;
    }
}
