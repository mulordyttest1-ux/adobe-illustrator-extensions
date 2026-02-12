/**
 * abbreviations.js - Vietnamese Address Abbreviations
 * 
 * Lookup table for expanding common Vietnamese address abbreviations.
 * Used by AddressNormalizer for AUTO-tier normalization.
 * 
 * @module UX/Constants/Abbreviations
 */

export const UX_ABBREVIATIONS = {
    // Đơn vị hành chính
    'TP': 'Thành phố',
    'Q': 'Quận',
    'P': 'Phường',
    'X': 'Xã',
    'H': 'Huyện',
    'TT': 'Thị trấn',
    'TX': 'Thị xã',
    'T': 'Tỉnh',

    // Đường/Ngõ
    'Đ': 'Đường',
    'KP': 'Khu phố',
    'AP': 'Ấp',
    'SN': 'Số nhà',

    // Công trình
    'KTX': 'Ký túc xá',
    'TDP': 'Tổ dân phố',
    'NV': 'Nhà văn hóa',
    'TTVH': 'Trung tâm văn hóa',
    'UBND': 'Ủy ban nhân dân',

    // Địa danh đặc biệt (Đắk Lắk & lân cận)
    'BMT': 'Buôn Ma Thuột',
    'HCM': 'Hồ Chí Minh',
    'ĐL': 'Đắk Lắk',
    'ĐN': 'Đắk Nông',
    'GL': 'Gia Lai',
    'KT': 'Kon Tum',
    'LĐ': 'Lâm Đồng',
    // công giáo
    'GH': 'Giáo Họ',
    'GX': 'Giáo Xứ',
    'GP': 'Giáo Phận'
};

// Reverse lookup (full → abbr) for future use
export const UX_ABBREVIATIONS_REVERSE = Object.fromEntries(
    Object.entries(UX_ABBREVIATIONS).map(([k, v]) => [v.toLowerCase(), k])
);
