import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AddressValidator } from './AddressValidator.js';

describe('AddressValidator', () => {
    it('warns when a non-POS 1 address uses dashes while POS 1 uses commas', () => {
        const result = AddressValidator.validate('Thon C - Xa D', {
            fieldKey: 'ceremony.diachi',
            formData: { 'pos1.diachi': 'Thon A, Xa B' }
        });
        const separatorWarning = result.warnings.find((warning) => warning.type === 'inconsistent_separators');

        assert.equal(result.valid, true);
        assert.equal(Boolean(separatorWarning), true);
        assert.equal(separatorWarning.message.includes('POS 1'), true);
    });

    it('warns when a non-POS 1 address uses commas while POS 1 uses dashes', () => {
        const result = AddressValidator.validate('Thon C, Xa D', {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Thon A - Xa B' }
        });
        const separatorWarning = result.warnings.find((warning) => warning.type === 'inconsistent_separators');

        assert.equal(Boolean(separatorWarning), true);
        assert.equal(separatorWarning.message.includes('dau gach ngang'), true);
    });

    it('keeps POS 1 out of self-referential inconsistency checks', () => {
        const result = AddressValidator.validate('Thon A, Xa B', {
            fieldKey: 'pos1.diachi',
            formData: {
                'pos1.diachi': 'Thon A, Xa B',
                'ceremony.diachi': 'Thon C - Xa D'
            }
        });

        assert.equal(result.warnings.some((warning) => warning.type === 'inconsistent_separators'), false);
    });

    it('warns when POS 1 is ambiguous and other fields fall back to commas', () => {
        const pos1Result = AddressValidator.validate('ThonA-TanLap', {
            fieldKey: 'pos1.diachi',
            formData: { 'pos1.diachi': 'ThonA-TanLap' }
        });
        const otherResult = AddressValidator.validate('Thon C - Xa D', {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'ThonA-TanLap' }
        });
        const separatorWarning = otherResult.warnings.find((warning) => warning.type === 'inconsistent_separators');

        assert.equal(pos1Result.warnings.some((warning) => warning.type === 'separator_unclear'), true);
        assert.equal(Boolean(separatorWarning), true);
        assert.equal(separatorWarning.message.includes('dau phay'), true);
    });
});
