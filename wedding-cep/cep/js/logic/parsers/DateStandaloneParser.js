import { AbstractParser } from './AbstractParser.js';

/**
 * DateStandaloneParser: Xử lý TIER 1.5
 * Bắt các chuỗi Ngày, Tháng, Năm nằm rời rạc có mốc chỉ định
 */
export class DateStandaloneParser extends AbstractParser {
    parse(context) {
        const { originalText, targetType, consumedRanges } = context;
        const replacements = [];

        let mNgay, mThang, mNam;
        const reNgay = /(nhằm\s+ngày\s+|ngày\s+)(\d{1,2})\b/ig;
        while ((mNgay = reNgay.exec(originalText)) !== null) {
            const prefixStr = mNgay[1];
            const numStr = mNgay[2];
            const isAm = /nhằm/i.test(prefixStr);
            const startNum = mNgay.index + prefixStr.length;
            const endNum = startNum + numStr.length;

            if (!this.isConsumed(startNum, endNum, consumedRanges)) {
                replacements.push({ start: startNum, end: endNum, val: `{date.${targetType}.ngay${isAm ? '_al' : ''}}` });
            }
        }

        const reThang = /(tháng\s+)(\d{1,2})\b/ig;
        while ((mThang = reThang.exec(originalText)) !== null) {
            const prefixStr = mThang[1];
            const startNum = mThang.index + prefixStr.length;
            const endNum = startNum + mThang[2].length;

            if (!this.isConsumed(startNum, endNum, consumedRanges)) {
                replacements.push({ start: startNum, end: endNum, val: `{date.${targetType}.thang}` });
            }
        }

        const reNam = /(năm\s+)(\d{2,4})\b/ig;
        while ((mNam = reNam.exec(originalText)) !== null) {
            const prefixStr = mNam[1];
            const startNum = mNam.index + prefixStr.length;
            const endNum = startNum + mNam[2].length;

            if (!this.isConsumed(startNum, endNum, consumedRanges)) {
                replacements.push({ start: startNum, end: endNum, val: `{date.${targetType}.nam}` });
            }
        }

        return replacements;
    }
}
