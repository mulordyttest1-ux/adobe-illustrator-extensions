import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    ADDRESS_DATA_PATH,
    ADDRESS_DATA_STRATEGY,
    createAddressIndexBuilder,
    formatAddressMatch,
    loadAddressAutocompleteData,
    resetAddressAutocompleteState
} from './addressAutocompleteRuntimeSupport.js';

describe('addressAutocompleteRuntimeSupport', () => {
    it('loads and parses address data through the stable CEP host path and strategy', async () => {
        const calls = [];

        const data = await loadAddressAutocompleteData({
            async readExtensionText(relativePath, options) {
                calls.push([relativePath, options.strategy]);
                return {
                    absolutePath: 'C:/fixture/data/vn_address_custom.json',
                    content: JSON.stringify([{ c: 'Ward', p: 'District - City', a: 'ward' }])
                };
            }
        });

        assert.deepEqual(calls, [[ADDRESS_DATA_PATH, ADDRESS_DATA_STRATEGY]]);
        assert.deepEqual(data, [{ c: 'Ward', p: 'District - City', a: 'ward' }]);
    });

    it('builds an index using the injected createIndex override or FuseAddressIndex fallback', () => {
        const customBuilder = createAddressIndexBuilder((data) => ({ kind: 'custom', size: data.length }));
        assert.deepEqual(customBuilder([1, 2]), { kind: 'custom', size: 2 });

        class FakeFuse {
            constructor(data, options) {
                this.data = data;
                this.options = options;
            }
        }

        const fallbackBuilder = createAddressIndexBuilder(undefined, FakeFuse);
        const index = fallbackBuilder([{ c: 'Ward' }]);

        assert.ok(index instanceof FakeFuse);
        assert.deepEqual(index.data, [{ c: 'Ward' }]);
        assert.equal(Array.isArray(index.options.keys), true);
        assert.equal(index.options.threshold, 0.4);
    });

    it('resets mutable autocomplete state and formats matched addresses safely', () => {
        const target = {
            isReady: true,
            fuse: { search() {} },
            data: [{ c: 'old' }]
        };

        resetAddressAutocompleteState(target);

        assert.deepEqual(target, {
            isReady: false,
            fuse: null,
            data: []
        });
        assert.equal(formatAddressMatch(null), null);
        assert.equal(
            formatAddressMatch({ c: 'Phuong Tan Lap', p: 'Quan 1 - TP.HCM' }, ' - '),
            'Phuong Tan Lap - Quan 1 - TP.HCM'
        );
    });
});
