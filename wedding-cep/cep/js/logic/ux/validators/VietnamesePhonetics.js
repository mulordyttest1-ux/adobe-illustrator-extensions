/**
 * VietnamesePhonetics.js - Strict Typo Detection (v4.0)
 */
export const VietnamesePhonetics = {
    TONE_STOPPED_SET: /[áạắặấậéẹếệíịóọốộớợúụứựýỵ]/,
    ALL_VOWELS: /[aeiouyà-ỹ]/,
    FRONT_VOWELS: /[ieêyìíỉĩịèéẻẽẹềếểễệỳýỷỹỵ]/,
    
    // Whitelist phụ âm kép đầu từ
    VALID_DIGRAPHS_START: /^(ch|gh|gi|kh|ng|ngh|nh|ph|qu|th|tr)/,
    
    // Whitelist CỤM phụ âm cuối (Chỉ 8 loại)
    // Lưu ý: phải match chính xác toàn bộ cụm sau nguyên âm cuối cùng
    VALID_ENDING_GROUP: /^(c|ch|m|n|ng|nh|p|t)$/,

    checkWord(word) {
        if (!word || word.length < 2 || /\d/.test(word)) return null;
        const w = word.toLowerCase();

        // --- NHÓM 1: CẤU TRÚC ĐẦU (Onset) ---
        
        // 1. Phụ âm đầu cấm (hcú, kga, z...)
        // Logic: Nếu bắt đầu bằng 2 phụ âm -> Phải nằm trong Whitelist
        if (/^[^aeiouyà-ỹ]{2}/.test(w)) {
            if (!this.VALID_DIGRAPHS_START.test(w)) {
                return { code: 'invalid_onset', message: `Phụ âm đầu sai: "${word}"` };
            }
        }
        if (/^[fjwz][a-zà-ỹ]/.test(w)) return { code: 'invalid_start_char', message: `Ký tự lạ: "${word}"` };

        // 2. Sau Q phải là U (qả)
        if (/\bq(?![uùúủũụưừứửữự])/.test(w)) return { code: 'phonetic_q', message: `Sau Q phải là U: "${word}"` };

        // --- NHÓM 2: CẤU TRÚC CUỐI (Coda) - [FIX CHO "DAHN"] ---

        // 🔥 3. Kiểm tra cụm phụ âm cuối
        // Logic: Lấy toàn bộ phần phụ âm đứng sau nguyên âm cuối cùng
        // Ví dụ: "dahn" -> nguyên âm cuối là 'a' -> đuôi là "hn" -> "hn" không nằm trong list cho phép -> LỖI
        const vowelMatch = w.match(/[aeiouyà-ỹ]/g);
        if (vowelMatch) {
            const lastVowelIndex = w.lastIndexOf(vowelMatch[vowelMatch.length - 1]);
            const suffix = w.slice(lastVowelIndex + 1); // Lấy đuôi sau nguyên âm

            if (suffix.length > 0) {
                if (!this.VALID_ENDING_GROUP.test(suffix)) {
                    return { code: 'invalid_ending_seq', message: `Đuôi từ sai chính tả: "${word}" (dư '${suffix}')` };
                }
            }
        }

        // --- NHÓM 3: CẤU TRÚC VẦN (Rhyme) - [FIX CHO "HÀONH"] ---

        // 4. Quá 3 nguyên âm (nguuoi)
        if (/[aeiouyà-ỹ]{4,}/.test(w)) return { code: 'vowel_excess', message: `Thừa nguyên âm: "${word}"` };

        // 🔥 5. Vần đóng/mở xung đột
        // Các vần kết thúc bằng o/u/i/y (ao, au, ai, ay, eo...) KHÔNG ĐƯỢC có thêm phụ âm cuối
        // Lỗi: hàonh (ao + nh), máyc (ay + c), saun (au + n)
        // Ngoại lệ duy nhất: oong (xoong), uynh (huynh)
        if (/[aăâeêoôơuư][ouiy][cmnpt]/.test(w)) {
            // Check ngoại lệ
            if (!w.includes('oong') && !w.includes('uynh') && !w.includes('uych')) {
                return { code: 'invalid_rhyme', message: `Vần sai cấu trúc: "${word}"` };
            }
        }

        // 6. Dấu lặp (hòá)
        if (/[àáảãạắằẳẵặấầẩẫậèéẻẽẹếềểễệìíỉĩịòóỏõọốồổỗộớờởỡợùúủũụứừửữựỳýỷỹỵ]{2}/.test(w))
            return { code: 'double_tone', message: `Dấu lặp: "${word}"` };

        // 7. Dấu trên AI/AY phải ở A (mái/máy)
        if (/a[íìỉĩịýỳỷỹỵ]/.test(w)) return { code: 'ai_ay_tone', message: `Sai dấu AI/AY: "${word}"` };

        // --- NHÓM 4: CHÍNH TẢ ---

        // 8. K/GH/NGH + i/e/ê
        if (/\b(k|gh|ngh)(?![ieêyìíỉĩịèéẻẽẹêềếểễệỳýỷỹỵ])\w+/.test(w))
            return { code: 'phonetic_k_gh', message: `K/GH/NGH sai vần: "${word}"` };

        // 9. C/NG không + i/e/ê
        if (/\b(c|ng)(?=[ieêyìíỉĩịèéẻẽẹêềếểễệỳýỷỹỵ])/.test(w))
            return { code: 'phonetic_c_ng', message: `C/NG sai vần: "${word}"` };

        // 10. Luật Tắc Âm
        if (/(c|ch|p|t)$/.test(w) && !this.TONE_STOPPED_SET.test(w))
            return { code: 'phonetic_stop_tone', message: `Thiếu dấu Sắc/Nặng: "${word}"` };

        return null; // ✅
    }
};

