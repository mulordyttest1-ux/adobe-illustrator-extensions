import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AddressService } from './AddressService.js';

const MATCH = {
    c: 'Phuong Tan Lap',
    p: 'Tinh Dak Lak'
};

describe('AddressService', () => {
    it('derives comma-based search context from the last token', () => {
        const context = AddressService.deriveSearchContext('Thon A, Tan Lap');

        assert.equal(context.prefix, 'Thon A, ');
        assert.equal(context.prefixValue, 'Thon A');
        assert.equal(context.lastPart, 'Tan Lap');
        assert.equal(context.adaptiveSeparator, ', ');
    });

    it('derives hyphen-based search context when the prefix uses dashes', () => {
        const context = AddressService.deriveSearchContext('Thon A - Tan Lap');

        assert.equal(context.prefix, 'Thon A - ');
        assert.equal(context.prefixValue, 'Thon A');
        assert.equal(context.lastPart, 'Tan Lap');
        assert.equal(context.adaptiveSeparator, ' - ');
    });

    it('derives multiline search context from the last visible line fragment', () => {
        const context = AddressService.deriveSearchContext('TDP Doan Ket\nlsl');

        assert.equal(context.prefix, 'TDP Doan Ket\n');
        assert.equal(context.lastPart, 'lsl');
        assert.equal(context.adaptiveSeparator, ', ');
    });

    it('derives the last search fragment after separators on the final visible line', () => {
        const context = AddressService.deriveSearchContext('TDP Doan Ket\nThon A, Tan Lap');

        assert.equal(context.prefix, 'TDP Doan Ket\nThon A, ');
        assert.equal(context.prefixValue, 'TDP Doan Ket\nThon A');
        assert.equal(context.lastPart, 'Tan Lap');
    });

    it('enforces the minimum search token length', () => {
        assert.equal(AddressService.hasUsableSearchTerm('TDP Doan Ket\nl'), false);
        assert.equal(AddressService.hasUsableSearchTerm('TDP Doan Ket\nls'), true);
    });

    it('builds the final autocomplete value using the canonical POS 1 comma separator', () => {
        const value = AddressService.buildAutocompleteValue('Thon A - Tan Lap', MATCH, {
            fieldKey: 'ceremony.diachi',
            formData: { 'pos1.diachi': 'Ap 1, Xa B' }
        });

        assert.equal(value, 'Thon A, Phuong Tan Lap, Tinh Dak Lak');
    });

    it('builds the final autocomplete value using the canonical POS 1 dash separator', () => {
        const value = AddressService.buildAutocompleteValue('Thon A, Tan Lap', MATCH, {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Ap 1 - Xa B' }
        });

        assert.equal(value, 'Thon A - Phuong Tan Lap - Tinh Dak Lak');
    });

    it('preserves POS 1 style when building the selected value for POS 1 itself', () => {
        const value = AddressService.buildAutocompleteValue('Thon A - Tan Lap', MATCH, {
            fieldKey: 'pos1.diachi',
            formData: {}
        });

        assert.equal(value, 'Thon A - Phuong Tan Lap - Tinh Dak Lak');
    });

    it('builds the final autocomplete value for multiline queries', () => {
        const value = AddressService.buildAutocompleteValue('TDP Doan Ket\nlsl', {
            c: 'Lien Son Lak',
            p: 'Tinh Dak Lak'
        }, {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Ap 1, Xa B' }
        });

        assert.equal(value, 'TDP Doan Ket\nLien Son Lak, Tinh Dak Lak');
    });

    it('builds a multiline selected value when Alt+Enter commit mode is requested', () => {
        const value = AddressService.buildAutocompleteValue('Hem 394/14, bmt', {
            c: 'Phuong Buon Ma Thuot',
            p: 'Tinh Dak Lak'
        }, {
            fieldKey: 'venue.diachi',
            formData: { 'pos1.diachi': 'Ap 1, Xa B' },
            formatMode: 'multiline'
        });

        assert.equal(value, 'Hem 394/14, Phuong Buon Ma Thuot\nTinh Dak Lak');
    });

    it('reflects live POS 1 separator changes across calls', () => {
        const formData = { 'pos1.diachi': 'Ap 1, Xa B' };

        assert.equal(
            AddressService.buildAutocompleteValue('Thon A - Tan Lap', MATCH, {
                fieldKey: 'ceremony.diachi',
                formData
            }),
            'Thon A, Phuong Tan Lap, Tinh Dak Lak'
        );

        formData['pos1.diachi'] = 'Ap 1 - Xa B';

        assert.equal(
            AddressService.buildAutocompleteValue('Thon A, Tan Lap', MATCH, {
                fieldKey: 'ceremony.diachi',
                formData
            }),
            'Thon A - Phuong Tan Lap - Tinh Dak Lak'
        );
    });

    it('closes autocomplete when scheduled close runs after focus leaves the input', () => {
        const input = { id: 'diachi' };
        const runtime = {
            input,
            documentRef: { activeElement: { id: 'other-field' } },
            setTimeoutFn(callback) {
                callback();
            }
        };
        const originalCloseLists = AddressService._closeLists;
        let closeCount = 0;

        AddressService._closeLists = () => {
            closeCount += 1;
        };

        try {
            AddressService._scheduleClose(runtime);
            assert.equal(closeCount, 1);
        } finally {
            AddressService._closeLists = originalCloseLists;
        }
    });

    it('does not close autocomplete when scheduled close runs and the input still owns focus', () => {
        const input = { id: 'diachi' };
        const runtime = {
            input,
            documentRef: { activeElement: input },
            setTimeoutFn(callback) {
                callback();
            }
        };
        const originalCloseLists = AddressService._closeLists;
        let closeCount = 0;

        AddressService._closeLists = () => {
            closeCount += 1;
        };

        try {
            AddressService._scheduleClose(runtime);
            assert.equal(closeCount, 0);
        } finally {
            AddressService._closeLists = originalCloseLists;
        }
    });
});
