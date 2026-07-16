import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlanMetadata } from './PlanMetadata.js';

describe('PlanMetadata', () => {
    it('builds the canonical clear metadata action', () => {
        assert.deepEqual(PlanMetadata.clear(), { action: 'clear' });
    });
});
