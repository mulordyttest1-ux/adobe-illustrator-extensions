/**
 * InputEngine.js - Central Orchestrator for UX Automation
 */

import { SchemaUtils } from '../schema/SchemaUtils.js';
import { NameNormalizer } from './normalizers/NameNormalizer.js';
import { AddressNormalizer } from './normalizers/AddressNormalizer.js';
import { DateNormalizer } from './normalizers/DateNormalizer.js';
import { NameValidator } from './validators/NameValidator.js';
import { AddressValidator } from './validators/AddressValidator.js';
import { DateValidator } from './validators/DateValidator.js';

export const InputEngine = {
    process(value, fieldKey, options = {}, schema = null) {
        const fieldType = this._detectFieldType(fieldKey, schema);

        // Step 1: Normalize (AUTO tier)
        const normalizeResult = this._normalize(value, fieldType, options);

        // Step 2: Validate (WARNING tier)
        const validateResult = this._validate(normalizeResult.value, fieldType, options);

        return {
            value: normalizeResult.value,
            original: value,
            fieldType,
            applied: normalizeResult.applied,
            warnings: validateResult.warnings,
            valid: validateResult.valid
        };
    },

    FIELD_RULES: [
        { type: 'date_hour', match: (k) => k.includes('gio') },
        { type: 'date_minute', match: (k) => k.includes('phut') },
        { type: 'date_day', match: (k) => k.includes('ngay') },
        { type: 'date_month', match: (k) => k.includes('thang') },
        { type: 'date_year', match: (k) => k.includes('nam') && !k.includes('ten') },
        { type: 'name', match: (k) => ['ten', 'ong', 'ba', 'ho_ten', 'con'].some(s => k.includes(s)) },
        { type: 'address', match: (k) => ['diachi', 'address', 'venue', 'ceremony'].some(s => k.includes(s)) }
    ],

    _detectFieldType(key, schema) {
        if (!key) return 'text';

        // 1. Schema Lookup (Explicit)
        // Check global SchemaUtils or imported
        if (typeof SchemaUtils !== 'undefined') {
            const type = SchemaUtils.getType(key, schema);
            if (type) return type;
        }

        // 2. Fallback (Implicit - Legacy Support)
        const lowerKey = key.toLowerCase();
        const rule = this.FIELD_RULES.find(r => r.match(lowerKey));
        return rule ? rule.type : 'text';
    },

    _normalize(value, fieldType, options) {
        // Route to DateNormalizer for Time/Date fields
        if (['date_day', 'date_month', 'date_year', 'date_hour', 'date_minute'].includes(fieldType)) {
            if (typeof DateNormalizer !== 'undefined') {
                // Map fieldType to simple type string ('day', 'hour'...)
                const type = fieldType.replace('date_', '');
                return DateNormalizer.normalize(value, { ...options, type });
            }
        }

        switch (fieldType) {
            case 'name':
            case 'person_name':
            case 'venue_name':
                if (typeof NameNormalizer !== 'undefined') return NameNormalizer.normalize(value, options);
                break;
            case 'address':
                if (typeof AddressNormalizer !== 'undefined') return AddressNormalizer.normalize(value, options);
                break;
        }

        return { value: value?.trim() || '', applied: [] };
    },

    _validate(value, fieldType, _options) {
        // Validation logic giữ nguyên hoặc mở rộng sau
        if (typeof DateValidator !== 'undefined') {
            if (['date_day', 'date_month'].includes(fieldType)) {
                return DateValidator.validate(value, fieldType.replace('date_', ''));
            }
        }

        switch (fieldType) {
            case 'name':
            case 'person_name':
            case 'venue_name':
                if (typeof NameValidator !== 'undefined') return NameValidator.validate(value, fieldType);
                break;
            case 'address':
                if (typeof AddressValidator !== 'undefined') return AddressValidator.validate(value, _options);
                break;
        }

        return { valid: true, warnings: [] };
    },

    validateDateLogic(data) {
        if (typeof DateValidator !== 'undefined') {
            return DateValidator.validateDateLogic(data);
        }
        return { valid: true, warnings: [] };
    }
};

