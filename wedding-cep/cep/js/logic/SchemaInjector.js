export class SchemaInjector {
    /**
     * @param {Array} frames [{id, text, uuid}]
     * @param {string} targetType Loại thời gian cần tiêm ('tiec', 'le', 'nhap'). Mặc định: 'tiec'
     * @returns {Array} changes [{id, plan: {mode: 'ATOMIC', replacements: [...]}}]
     */
    // eslint-disable-next-line complexity, max-lines-per-function
    static computeChanges(frames, targetType = 'tiec') {
        // Pass 1: Suy luận Context (Phe Chủ Tiệc)
        let hostSide = ''; // 'nha_trai' hoặc 'nha_gai'

        for (const frame of frames) {
            const text = frame.text || "";
            if (/(tư\s+gia\s+)?nhà\s+gái/i.test(text)) hostSide = 'nha_gai';
            else if (/(tư\s+gia\s+)?nhà\s+trai/i.test(text)) hostSide = 'nha_trai';
            else if (/vu\s+quy/i.test(text)) hostSide = 'nha_gai';
            else if (/tân\s+hôn/i.test(text)) hostSide = 'nha_trai';
        }

        const changes = [];
        const orphans = [];


        for (const frame of frames) {
            const originalText = frame.text || "";
            if (!originalText) continue;

            const replacements = [];

            // Helper to push replacements safely
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

            // ==========================================
            // TIER 1: STRICT TEXT FORMATS
            // ==========================================

            // Giờ Phút ("11 giờ 30 phút", "11h30", "11:00") - ATOMIC 100%
            const timeScanner = /(0?[0-9]|1[0-9]|2[0-3])(\s*(?:giờ|h|:)\s*)([0-5]?[0-9])?(?:\s*phút)?/ig;
            let tm;
            while ((tm = timeScanner.exec(originalText)) !== null) {
                const gioStr = tm[1];
                const sepStr = tm[2];
                const phutStr = tm[3];

                const startGio = tm.index;
                replacements.push({ start: startGio, end: startGio + gioStr.length, val: `{date.${targetType}.gio}` });

                if (phutStr) {
                    const startPhut = startGio + gioStr.length + sepStr.length;
                    replacements.push({ start: startPhut, end: startPhut + phutStr.length, val: `{date.${targetType}.phut}` });
                }
            }

            // Thứ
            addReplacements(/(Thứ\s*(Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ\s*Nhật)/ig, `{date.${targetType}.thu}`);

            // Âm Lịch Hậu Tố Can Chi (10 Can x 12 Chi)
            addReplacements(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)\s*(Tý|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/ig, `{date.${targetType}.nam_al}`);

            // ==========================================
            // TIER 2: SINGLE PASS HEURISTIC SCANNER
            // - Gộp Âm + Dương trong 1 vòng lặp
            // - Quyết định Âm/Dương CỤC BỘ theo từng cụm match
            // - Consumed Ranges chống Overlap với TIER 1
            // ==========================================

            // Consumed ranges từ TIER 1
            const consumed = replacements.map((r) => [r.start, r.end]);
            const isConsumed = (s, e) => consumed.some(([cs, ce]) => s < ce && e > cs);

            // Can Chi strings cho Regex OR
            const canStr = "Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý";
            const chiStr = "Tý|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi";

            // Single Scanner: bắt cả Năm-Số lẫn Năm-CanChi trong 1 pass
            const scanner = new RegExp(
                `((?:nhằm\\s+ngày\\s+|ngày\\s+)?\\s*)(\\d{1,4})([\\s./-]+|\\s+tháng\\s+)(\\d{1,4})(?:([\\s./-]+|\\s+năm\\s+)(?:(\\d{1,4})|(${canStr})\\s*(${chiStr})))?`,
                'ig'
            );
            let m;
            while ((m = scanner.exec(originalText)) !== null) {
                // Chặn quét nhầm Giờ Phút: chỉ skip nếu CHÍNH cụm match chứa pattern giờ phút
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
                if (isConsumed(s1, e1)) { scanner.lastIndex = m.index + 1; continue; }

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
                    // Âm lịch: 2 số + Can Chi (Can Chi đã bị TIER 1 xử lý)
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

            if (replacements.length > 0) {
                // Sort giảm dần chống Shift Index Bug
                replacements.sort((a, b) => b.start - a.start);

                // Lọc Overlaps
                const filteredReplacements = [];
                let currEnd = -1;
                for (const rep of replacements) {
                    if (currEnd === -1 || rep.end <= currEnd) {
                        filteredReplacements.push(rep);
                        currEnd = rep.start;
                    }
                }



                changes.push({
                    id: frame.id,
                    plan: {
                        mode: "ATOMIC",
                        replacements: filteredReplacements,
                        meta: {
                            type: "stateful",
                            keys: [], // Truyền rỗng để báo mốc xóa metadata cũ
                            mappings: []
                        }
                    }
                });
            } else {
                // Kiểm tra số rời: frame chỉ chứa số thuần, không được tiêm gì
                if (/^\s*\d{1,4}\s*$/.test(originalText)) {
                    orphans.push(frame);
                }
            }
        }

        // Note: Tab 2 template injection không còn thu thập keys vào metadata
        // Do đó validation trường bắt buộc ở Tab 2 tạm thời được bỏ qua
        const missedRequired = [];

        return { changes, orphans, missedRequired };
    }
}

// Bơm ra Global để phục vụ CDP Live Testing
if (typeof window !== 'undefined') window.SchemaInjector = SchemaInjector;

