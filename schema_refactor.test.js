
import assert from 'node:assert';
import { test, describe } from 'node:test';
import { SchemaUtils } from './cep/js/logic/schema/SchemaUtils.js';
import { InputEngine } from './cep/js/logic/ux/InputEngine.js';

// Mock Attributes
global.AddressNormalizer = { normalize: (v) => ({ value: v.trim(), applied: [] }) };
global.NameNormalizer = { normalize: (v) => ({ value: v.trim(), applied: [] }) };
global.AddressValidator = { validate: () => ({ valid: true, warnings: [] }) };
global.VenueValidator = { validate: () => ({ valid: true, warnings: [] }) }; // Assumption

describe('Schema Refactor Integration', () => {
    const mockSchema = {
        STRUCTURE: [
            {
                prefix: 'pos1',
                items: [
                    { key: 'ong', type: 'person_name' },
                    { key: 'diachi', type: 'address' }
                ]
            },
            {
                items: [
                    { key: 'ceremony.ten', type: 'venue_name' }
                ]
            }
        ]
    };

    test('SchemaUtils.flatten produces correct map', () => {
        const map = SchemaUtils.flatten(mockSchema);
        assert.strictEqual(map.get('pos1.ong'), 'person_name');
        assert.strictEqual(map.get('pos1.diachi'), 'address');
        assert.strictEqual(map.get('ceremony.ten'), 'venue_name');
    });

    test('InputEngine detects type via Schema', () => {
        // 1. Venue Name
        const resVenue = InputEngine.process('Diamond Place', 'ceremony.ten', {}, mockSchema);
        assert.strictEqual(resVenue.fieldType, 'venue_name', 'Should detect venue_name from schema');

        // 2. Person Name
        const resName = InputEngine.process('Nguyen Van A', 'pos1.ong', {}, mockSchema);
        assert.strictEqual(resName.fieldType, 'person_name', 'Should detect person_name from schema');
    });

    test('InputEngine fallback works for unknown keys', () => {
        // Unknown key 'random.ten' -> fallback to implicit 'name' logic because it has 'ten'
        const resLegacy = InputEngine.process('Some Name', 'random.ten', {}, mockSchema);
        // Explicit schema lookup fails -> Fallback to legacy
        // Legacy logic: if includes 'ten' -> 'name'
        assert.strictEqual(resLegacy.fieldType, 'name', 'Should fallback to legacy detection');
    });
});
