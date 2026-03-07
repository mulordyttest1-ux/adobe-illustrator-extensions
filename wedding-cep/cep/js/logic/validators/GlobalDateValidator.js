export class GlobalDateValidator {
    /**
     * Thu thập "Chân lý Toàn cục" từ mảng Data thô đã bắt được.
     * @param {Array} changesList Mảng {id, plan: {replacements}}
     * @param {Array} frames Mảng {id, text} gốc
     * @param {string} targetType Loại thời gian ('tiec', 'le', 'nhap')
     * @returns {Object|null} Trả về {ngay, thang, nam} hoặc null nếu không đủ tin cậy.
     */
    // eslint-disable-next-line complexity, max-depth, max-statements
    static extractTruth(changesList, frames, targetType = 'tiec') {
        const setNgay = new Set();
        const setThang = new Set();
        const setNam = new Set();

        const frameMap = {};
        for (const f of frames) {
            frameMap[f.id] = f.text || "";
        }

        const ngayToken = `{date.${targetType}.ngay}`;
        const thangToken = `{date.${targetType}.thang}`;
        const namToken = `{date.${targetType}.nam}`;

        for (const change of changesList) {
            const frameText = frameMap[change.id];
            if (!frameText) continue;

            const replacements = change.plan && change.plan.replacements ? change.plan.replacements : [];
            for (const rep of replacements) {
                if (rep.val !== ngayToken && rep.val !== thangToken && rep.val !== namToken) {
                    continue;
                }

                const snippet = frameText.substring(rep.start, rep.end);
                const match = snippet.match(/\d{1,4}/);
                if (!match) continue;

                const num = parseInt(match[0], 10);
                if (rep.val === ngayToken) setNgay.add(num);
                if (rep.val === thangToken) setThang.add(num);
                if (rep.val === namToken) setNam.add(num);
            }
        }

        // Rule 1: Rigid Size Check
        // Phải có đúng 1 Ngày và 1 Tháng trên toàn thiệp. Nhiều hơn -> Huỷ.
        if (setNgay.size !== 1 || setThang.size !== 1) {
            return null;
        }

        // Nếu có khai báo Năm, thì Năm cũng phải duy nhất. Cấm ghi 2 năm khác nhau.
        if (setNam.size > 1) {
            return null;
        }

        const ngay = Array.from(setNgay)[0];
        const thang = Array.from(setThang)[0];

        // Rule 2: Tránh Ambiguity - Hủy tiêm tự động nếu Ngày và Tháng trùng nhau
        if (ngay === thang) {
            return null;
        }

        // Rule 3: Trả về Object an toàn
        const truth = { ngay, thang };
        if (setNam.size === 1) {
            truth.nam = Array.from(setNam)[0];
        }

        return truth;
    }
}
