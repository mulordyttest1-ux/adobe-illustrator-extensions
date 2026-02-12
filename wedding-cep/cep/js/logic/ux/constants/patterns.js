/**
 * patterns.js - Vietnamese Text Patterns (Regex)
 * 
 * Unicode-aware regex patterns for Vietnamese text processing.
 * Used by normalizers and validators.
 * 
 * @module UX/Constants/Patterns
 */

export const UX_PATTERNS = {
    // Vietnamese character class (full diacritics)
    VN_CHARS: 'a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỂưạảấầẩẫậắằẳẵặẹẻẽềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ',

    // Whitespace normalization
    MULTIPLE_SPACES: /\s{2,}/g,
    LEADING_TRAILING: /^\s+|\s+$/g,

    // Punctuation issues
    MULTIPLE_COMMAS: /,{2,}/g,
    COMMA_NO_SPACE: /,([^\s])/g,
    DASH_NO_SPACE: /-([^\s\d])/g,
    TRAILING_PUNCT: /[,\-.;]+$/g,

    // Abbreviation patterns (capture group for replacement)
    ABBR_WITH_DOT: /\b(TP|Q|P|X|H|TT|TX|Đ|KP|AP|SN)\.\s*/gi,
    ABBR_STANDALONE: /\b(TP|Q|P|X|H|TT|TX)\s+(?=[A-ZẮẰẲẴẶĂẤẦẨẪẬÂÁÀÃẢẠĐẾỀỂỄỆÊÉÈẺẼẸÍÌỈĨỊỐỒỔỖỘÔỚỜỞỠỢƠÓÒÕỎỌỨỪỬỮỰƯÚÙỦŨỤÝỲỶỸỴ\d])/gi,

    // Name validation
    NAME_HAS_NUMBER: /\d/,
    NAME_SINGLE_WORD: /^\S+$/,
    NAME_SPECIAL_CHARS: /[!@#$%^&*()+=[\]{}|\\:;"'<>?,./]/,

    // Date patterns
    DATE_EXTRACT: /(?:ngày|ng\.|Ngày)\s*(\d{1,2})/i,
    MONTH_EXTRACT: /(?:tháng|th\.|Tháng)\s*(\d{1,2})/i,

    // Address quality checks
    MIXED_SEPARATORS: /[,].*[-]|[-].*[,]/,
    TOO_SHORT: /^.{0,9}$/
};

// Pre-compiled regex for performance
UX_PATTERNS.COMPILED = {
    vnWord: new RegExp(`[${UX_PATTERNS.VN_CHARS}]+`, 'g'),
    titleCase: new RegExp(`(^|[\\s'"\\(\\[\\{])([${UX_PATTERNS.VN_CHARS.toLowerCase()}])`, 'g')
};

