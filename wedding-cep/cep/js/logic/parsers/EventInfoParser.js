import { AbstractParser } from './AbstractParser.js';

/**
 * EventInfoParser: Xử lý TIER 0
 * Bắt Loại Lễ, Phe Chủ Tiệc và Vị Thứ
 */
export class EventInfoParser extends AbstractParser {
    parse(context) {
        const { originalText, hostSide } = context;
        const replacements = [];

        // Helper
        const addReplacements = (regex, replacer) => {
            let match;
            const re = new RegExp(regex);
            while ((match = re.exec(originalText)) !== null) {
                const val = typeof replacer === 'function' ? replacer(match) : replacer;
                if (val !== null && val !== undefined) {
                    replacements.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        val: val
                    });
                }
            }
        };

        // 1. Loại Lễ
        addReplacements(/(Tân\s*Hôn|Thành\s*Hôn|Vu\s*Quy|Báo\s*Hỷ)/ig, "{info.ten_le}");

        // 2. Phe chủ tiệc (Đổi thành venue.ten thay vì venue.diachi theo yêu cầu)
        addReplacements(/(?:Tư\s+gia\s+)?Nhà\s+(Trai|Gái)|Tư\s+gia/ig, "{venue.ten}");

        // 3. Vị thứ (Dynamic Prefix)
        addReplacements(/(Trưởng|Thứ|Út|Quý)\s*(Nam|Nữ)/ig, (match) => {
            const gender = match[2];
            const isNu = gender.toLowerCase() === 'nữ';
            if (hostSide === 'nha_gai') return isNu ? '{pos1.vithu}' : '{pos2.vithu}';
            if (hostSide === 'nha_trai') return isNu ? '{pos2.vithu}' : '{pos1.vithu}';
            return isNu ? '{pos2.vithu}' : '{pos1.vithu}';
        });

        return replacements;
    }
}
