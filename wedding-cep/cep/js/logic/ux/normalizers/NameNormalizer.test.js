import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NameNormalizer } from './NameNormalizer.js';

describe('NameNormalizer', () => {
    it('preserves customer-provided saint-name spelling while title-casing the saint and ordinary names', () => {
        const person = NameNormalizer.normalize('te-r\u00ea-sa nguy\u1ec5n th\u1ecb an', {
            allowSaintName: true
        });
        const venue = NameNormalizer.normalize('te-r\u00ea-sa garden', {
            allowSaintName: false
        });

        assert.equal(person.value, 'Te-R\u00ea-Sa Nguy\u1ec5n Th\u1ecb An');
        assert.deepEqual(person.applied, ['title_case']);
        assert.equal(venue.value, 'Te-R\u00ea-Sa Garden');
        assert.deepEqual(venue.applied, ['title_case']);
    });

    it('title-cases multi-word saint prefixes without canonicalizing the customer variant', () => {
        const result = NameNormalizer.normalize('maximiliano kolbe nguy\u1ec5n v\u0103n an', {
            allowSaintName: true
        });

        assert.equal(result.value, 'Maximiliano Kolbe Nguy\u1ec5n V\u0103n An');
        assert.deepEqual(result.applied, ['title_case']);
    });
});
