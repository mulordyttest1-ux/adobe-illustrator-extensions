import { AbstractParser } from './AbstractParser.js';

/**
 * TimeStrictParser: Xử lý TIER 1
 * Bắt chốt Giờ, Phút (Fixed Format), Thứ, Năm Âm Lịch Can Chi
 */
export class TimeStrictParser extends AbstractParser {
    parse(context) {
        const { originalText, targetType, consumedRanges } = context;
        const replacements = [];

        // Helper
        const addReplacements = (regex, replacer) => {
            let match;
            const re = new RegExp(regex);
            while ((match = re.exec(originalText)) !== null) {
                const s = match.index;
                const e = match.index + match[0].length;

                // Bỏ qua nếu đã bị ăn
                if (this.isConsumed(s, e, consumedRanges)) continue;

                const val = typeof replacer === 'function' ? replacer(match) : replacer;
                if (val !== null && val !== undefined) {
                    replacements.push({ start: s, end: e, val });
                }
            }
        };

        // Giờ Phút ("11 giờ 30 phút", "11h30", "11:00") - ATOMIC 100%
        const timeScanner = /(0?[0-9]|1[0-9]|2[0-3])(\s*(?:giờ|h|:)\s*)([0-5]?[0-9])?(?:\s*phút)?/ig;
        let tm;
        while ((tm = timeScanner.exec(originalText)) !== null) {
            const gioStr = tm[1];
            const sepStr = tm[2];
            const phutStr = tm[3];

            const startGio = tm.index;
            const endGio = startGio + gioStr.length;

            if (!this.isConsumed(startGio, endGio, consumedRanges)) {
                replacements.push({ start: startGio, end: endGio, val: `{date.${targetType}.gio}` });
            }

            if (phutStr) {
                const startPhut = endGio + sepStr.length;
                const endPhut = startPhut + phutStr.length;
                if (!this.isConsumed(startPhut, endPhut, consumedRanges)) {
                    replacements.push({ start: startPhut, end: endPhut, val: `{date.${targetType}.phut}` });
                }
            }
        }

        // Thứ
        addReplacements(/(Thứ\s*(Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ\s*Nhật)/ig, `{date.${targetType}.thu}`);

        // Âm Lịch Hậu Tố Can Chi (10 Can x 12 Chi)
        addReplacements(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)\s*(Tý|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/ig, `{date.${targetType}.nam_al}`);

        return replacements;
    }
}
