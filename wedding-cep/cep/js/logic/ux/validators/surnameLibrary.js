import { UnicodeNormalizer } from '../core/UnicodeNormalizer.js';

// Add new Vietnamese/Kinh surnames here. Matching is accent-insensitive.
export const COMMON_VIETNAMESE_SURNAMES = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Phan', 'Trương',
    'Bùi', 'Đỗ', 'Đặng', 'Ngô', 'Hồ', 'Dương', 'Lý', 'Đinh', 'Đoàn', 'Mai',
    'Trịnh', 'Đào', 'Cao', 'Lương', 'Lưu', 'Châu', 'Tạ', 'Tô', 'Tăng', 'Hà',
    'Thái', 'Quách', 'Văn', 'La', 'Lâm', 'Chung', 'Đàm', 'Chu', 'Vi', 'Kiều',
    'Triệu', 'Khương', 'Dư', 'Hứa', 'Thạch', 'Diệp', 'Từ', 'Tống', 'Nghiêm', 'Doãn',
    'Bạch', 'Bành', 'Biên', 'Biện', 'Cam', 'Cảnh', 'Cát', 'Chân', 'Chế', 'Chiêm',
    'Chử', 'Cổ', 'Cù', 'Cung', 'Dịch', 'Đái', 'Đậu', 'Điền', 'Đồng', 'Đổng',
    'Đường', 'Giang', 'Giáp', 'Hạ', 'Hàn', 'Hầu', 'Hoa', 'Hoắc', 'Kha',
    'Khâu', 'Khổng', 'Khuất', 'Kim', 'Kỳ', 'Kỷ', 'Lại', 'Lam', 'Lăng', 'Liên',
    'Liêu', 'Liễu', 'Long', 'Lục', 'Lư', 'Lữ', 'Mã', 'Mạc', 'Mạch', 'Mạnh',
    'Nghê', 'Nhâm', 'Nhiếp', 'Ninh', 'Nông', 'Ôn', 'Ông', 'Phí', 'Phó', 'Phùng',
    'Phương', 'Quan', 'Quản', 'Quang', 'Quế', 'Quyền', 'Sử', 'Tào', 'Tân', 'Tần',
    'Tất', 'Thân', 'Thích', 'Thiệu', 'Thôi', 'Tiền', 'Tiết', 'Tiêu', 'Tôn', 'Tông',
    'Trác', 'Trầm', 'Trâu', 'Trang', 'Tưởng', 'Ứng', 'Vạn', 'Vân', 'Vĩnh', 'Vương',
    'Yên', 'Yến', 'Gia Cát', 'Hoàng Phủ', 'Nguyễn Phúc', 'Tôn Nữ', 'Tôn Thất', 'Tư Mã'
];

const SURNAME_SEPARATOR_PATTERN = /[\s'._-]+/g;
const SURNAME_SPLIT_PATTERN = /[\s'._-]+/;

export function normalizeSurnameKey(value) {
    if (!value || typeof value !== 'string') return '';

    return UnicodeNormalizer.removeDiacritics(value)
        .replace(/[ĐđÐð]/g, 'd')
        .toLowerCase()
        .replace(SURNAME_SEPARATOR_PATTERN, ' ')
        .trim();
}

export const COMMON_SURNAME_KEYS = new Set(COMMON_VIETNAMESE_SURNAMES.map(normalizeSurnameKey));

export function isCommonSurname(value) {
    return COMMON_SURNAME_KEYS.has(normalizeSurnameKey(value));
}

export function extractLeadingSurname(value, options = {}) {
    if (!value || typeof value !== 'string') return null;

    const words = value.trim().split(SURNAME_SPLIT_PATTERN).filter(Boolean);
    if (words.length < 2) return null;

    const maxWords = Math.min(options.maxWords || 4, words.length - 1);
    for (let length = maxWords; length > 0; length -= 1) {
        const surname = words.slice(0, length).join(' ');
        const normalized = normalizeSurnameKey(surname);
        if (COMMON_SURNAME_KEYS.has(normalized)) {
            return {
                surname,
                normalized,
                known: true,
                wordCount: length
            };
        }
    }

    const surname = words[0];
    const normalized = normalizeSurnameKey(surname);
    return {
        surname,
        normalized,
        known: COMMON_SURNAME_KEYS.has(normalized),
        wordCount: 1
    };
}

export const VietnameseSurnameLibrary = {
    surnames: COMMON_VIETNAMESE_SURNAMES,
    commonSurnameKeys: COMMON_SURNAME_KEYS,
    normalizeKey: normalizeSurnameKey,
    isCommon: isCommonSurname,
    extractLeading: extractLeadingSurname
};
