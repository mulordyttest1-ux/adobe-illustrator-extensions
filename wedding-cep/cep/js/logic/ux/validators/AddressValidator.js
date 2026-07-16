import {
    detectAddressSeparatorStyle,
    getAddressSeparatorLabel,
    POS1_ADDRESS_KEY,
    resolveCanonicalAddressSeparator
} from '../addressSeparatorPolicy.js';

export const AddressValidator = {
    TYPO_DICTIONARY: {
        'đường': ['duong', 'đuong', 'đương', 'đuong', 'dduong', 'đừơng'],
        'phố': ['pho', 'phô', 'phó'],
        'ngõ': ['ngo', 'ngỏ'],
        'ngách': ['ngach'],
        'hẻm': ['hem'],
        'số': ['so', 'só'],
        'nhà': ['nha'],
        'ấp': ['ap'],
        'thôn': ['thon'],
        'buôn': ['buon'],
        'xã': ['xa'],
        'huyện': ['huyen'],
        'tỉnh': ['tinh']
    },

    validate(value, options = {}) {
        if (!value || typeof value !== 'string') {
            return { valid: true, warnings: [] };
        }

        const warnings = [];
        const trimmed = value.trim();

        this._checkFormat(trimmed, warnings, options);
        this._checkTypos(trimmed, warnings);

        if (options && options.formData) {
            this._checkCanonicalConsistency(trimmed, options, warnings);
        }

        return {
            valid: warnings.filter((warning) => warning.severity === 'error').length === 0,
            warnings
        };
    },

    _checkFormat(trimmed, warnings, options = {}) {
        const profile = detectAddressSeparatorStyle(trimmed);
        const dashMissingSpacing = profile.separators.some((separator) => {
            return separator.type === 'dash' && trimmed.slice(separator.start, separator.end) !== ' - ';
        });

        if (profile.style === 'mixed') {
            warnings.push({
                type: 'mixed_separators',
                message: 'Chua ca dau phay (,) va gach ngang (-). Hay thong nhat mot kieu phan cach.',
                severity: 'warning'
            });
        }

        if (options.fieldKey === POS1_ADDRESS_KEY && profile.style === 'ambiguous' && trimmed.includes('-')) {
            warnings.push({
                type: 'separator_unclear',
                message: 'POS 1 dang mo ho separator. Form se mac dinh dung dau phay (,).',
                severity: 'warning'
            });
        }

        if (trimmed.length > 0 && trimmed.length < 5) {
            warnings.push({
                type: 'address_too_short',
                message: 'Dia chi qua ngan?',
                severity: 'info'
            });
        }

        if (dashMissingSpacing) {
            warnings.push({
                type: 'dash_no_space',
                message: 'Nen co khoang trang quanh dau gach ngang (VD: A - B).',
                severity: 'info'
            });
        }

        if (/[,\-.;]+$/.test(trimmed)) {
            warnings.push({
                type: 'trailing_punct',
                message: 'Du dau cau cuoi cung.',
                severity: 'info'
            });
        }
    },

    _checkCanonicalConsistency(currentValue, options, warnings) {
        if (!currentValue || typeof currentValue !== 'string') {
            return;
        }

        const fieldKey = options.fieldKey || '';
        if (!fieldKey || fieldKey === POS1_ADDRESS_KEY) {
            return;
        }

        const currentProfile = detectAddressSeparatorStyle(currentValue);
        if (!currentProfile.isClear) {
            return;
        }

        const canonicalSeparator = resolveCanonicalAddressSeparator({
            fieldKey,
            currentValue,
            formData: options.formData
        });

        if (currentProfile.separator === canonicalSeparator) {
            return;
        }

        warnings.push({
            type: 'inconsistent_separators',
            message: `Lech chuan POS 1: o nay dang dung ${getAddressSeparatorLabel(currentProfile.separator)}, trong khi form dang lay ${getAddressSeparatorLabel(canonicalSeparator)} theo POS 1.`,
            severity: 'warning'
        });
    },

    _checkTypos(trimmed, warnings) {
        if (/\b(ddu|uow|oof|oos|ddi|dda|aa|ee|oo)\b/i.test(trimmed)) {
            warnings.push({
                type: 'typo_telex',
                message: 'Loi bo go (ddu, uow...)?',
                severity: 'warning'
            });
        }

        Object.entries(this.TYPO_DICTIONARY).forEach(([correct, wrongs]) => {
            wrongs.some((wrong) => {
                const regex = new RegExp(`(^|\\s|[.,-])${wrong}(\\s|[.,-]|$)`, 'i');
                if (!regex.test(trimmed)) {
                    return false;
                }

                warnings.push({
                    type: 'typo_keyword',
                    message: `Sai chinh ta: "${wrong}" -> "${correct}"?`,
                    severity: 'warning'
                });
                return true;
            });
        });
    }
};
