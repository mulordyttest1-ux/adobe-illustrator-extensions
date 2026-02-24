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

        return this._checkOnset(w, word) ||
            this._checkCoda(w, word) ||
            this._checkRhyme(w, word) ||
            this._checkSpellingRules(w, word) ||
            null;
    },

    _checkOnset(w, word) {
        if (/^[^aeiouyà-ỹ]{2}/.test(w)) {
            if (!this.VALID_DIGRAPHS_START.test(w)) {
                return { code: 'invalid_onset', message: `Phụ âm đầu sai: "${word}"` };
            }
        }
        if (/^[fjwz][a-zà-ỹ]/.test(w)) return { code: 'invalid_start_char', message: `Ký tự lạ: "${word}"` };
        if (/\bq(?![uùúủũụưừứửữự])/.test(w)) return { code: 'phonetic_q', message: `Sau Q phải là U: "${word}"` };
        return null;
    },

    _checkCoda(w, word) {
        const vowelMatch = w.match(/[aeiouyà-ỹ]/g);
        if (vowelMatch) {
            const lastVowelIndex = w.lastIndexOf(vowelMatch[vowelMatch.length - 1]);
            const suffix = w.slice(lastVowelIndex + 1);

            if (suffix.length > 0 && !this.VALID_ENDING_GROUP.test(suffix)) {
                return { code: 'invalid_ending_seq', message: `Đuôi từ sai chính tả: "${word}" (dư '${suffix}')` };
            }
        }
        return null;
    },

    _checkRhyme(w, word) {
        if (/[aeiouyà-ỹ]{4,}/.test(w)) return { code: 'vowel_excess', message: `Thừa nguyên âm: "${word}"` };

        if (/[aăâeêoôơuư][ouiy][cmnpt]/.test(w)) {
            if (!w.includes('oong') && !w.includes('uynh') && !w.includes('uych')) {
                return { code: 'invalid_rhyme', message: `Vần sai cấu trúc: "${word}"` };
            }
        }

        if (/[àáảãạắằẳẵặấầẩẫậèéẻẽẹếềểễệìíỉĩịòóỏõọốồổỗộớờởỡợùúủũụứừửữựỳýỷỹỵ]{2}/.test(w)) {
            return { code: 'double_tone', message: `Dấu lặp: "${word}"` };
        }

        if (/a[íìỉĩịýỳỷỹỵ]/.test(w)) return { code: 'ai_ay_tone', message: `Sai dấu AI/AY: "${word}"` };
        return null;
    },

    _checkSpellingRules(w, word) {
        if (/\b(k|gh|ngh)(?![ieêyìíỉĩịèéẻẽẹêềếểễệỳýỷỹỵ])\w+/.test(w)) {
            return { code: 'phonetic_k_gh', message: `K/GH/NGH sai vần: "${word}"` };
        }
        if (/\b(c|ng)(?=[ieêyìíỉĩịèéẻẽẹêềếểễệỳýỷỹỵ])/.test(w)) {
            return { code: 'phonetic_c_ng', message: `C/NG sai vần: "${word}"` };
        }
        if (/(c|ch|p|t)$/.test(w) && !this.TONE_STOPPED_SET.test(w)) {
            return { code: 'phonetic_stop_tone', message: `Thiếu dấu Sắc/Nặng: "${word}"` };
        }
        return null;
    }
};

