import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SmartYearResolver } from './smart-year.js';

describe('SmartYearResolver', () => {
    const today = new Date(2026, 6, 29);

    it('keeps dates later in the current year', () => {
        assert.equal(
            SmartYearResolver.resolveSolarYear(31, 12, { today }),
            2026
        );
    });

    it('keeps today in the current year', () => {
        assert.equal(
            SmartYearResolver.resolveSolarYear(29, 7, { today }),
            2026
        );
    });

    it('moves passed dates to the next occurrence', () => {
        assert.equal(
            SmartYearResolver.resolveSolarYear(1, 1, { today }),
            2027
        );
        assert.equal(
            SmartYearResolver.resolveSolarYear(28, 7, { today }),
            2027
        );
    });

    it('moves February 29 to the next valid leap year', () => {
        assert.equal(
            SmartYearResolver.resolveSolarYear(29, 2, { today }),
            2028
        );
    });

    it('rejects impossible month/day values', () => {
        assert.equal(
            SmartYearResolver.resolveSolarYear(31, 2, { today }),
            null
        );
    });
});
