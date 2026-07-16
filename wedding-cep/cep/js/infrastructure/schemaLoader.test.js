import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SchemaLoader } from './schemaLoader.js';

function createHostFacade(overrides = {}) {
    const calls = [];
    return {
        calls,
        hostFacade: {
            async readExtensionText(relativePath, options) {
                calls.push({ relativePath, options });
                if (typeof overrides.readExtensionText === 'function') {
                    return overrides.readExtensionText(relativePath, options);
                }
                return {
                    absolutePath: '/mock/schema.json',
                    content: JSON.stringify({ version: 1 })
                };
            }
        }
    };
}

beforeEach(() => {
    SchemaLoader.clearCache();
});

afterEach(() => {
    SchemaLoader.clearCache();
});

describe('SchemaLoader', () => {
    it('loads schema data, caches it, and serves getSync from the current cache', async () => {
        const { hostFacade, calls } = createHostFacade({
            readExtensionText: async () => ({
                absolutePath: '/mock/schema.json',
                content: JSON.stringify({ id: 'schema-1', fields: ['a'] })
            })
        });

        const first = await SchemaLoader.load({ hostFacade });
        const second = await SchemaLoader.load({ hostFacade });

        assert.deepEqual(first, { id: 'schema-1', fields: ['a'] });
        assert.equal(second, first);
        assert.equal(SchemaLoader.getSync(), first);
        assert.deepEqual(calls, [
            {
                relativePath: 'data/schema.json',
                options: { strategy: 'extendscript' }
            }
        ]);
    });

    it('clearCache resets the synchronous cache view', async () => {
        const { hostFacade } = createHostFacade();

        await SchemaLoader.load({ hostFacade });
        assert.notEqual(SchemaLoader.getSync(), null);

        SchemaLoader.clearCache();

        assert.equal(SchemaLoader.getSync(), null);
    });

    it('throws a localized error when no hostFacade is provided', async () => {
        await assert.rejects(
            () => SchemaLoader.load(),
            (error) => {
                assert.match(error.message, /^Không thể tải Schema:/);
                assert.equal(error.cause.message, 'HostFacade is required');
                return true;
            }
        );
    });

    it('throws when the host returns no schema content', async () => {
        const { hostFacade } = createHostFacade({
            readExtensionText: async () => ({
                absolutePath: '/missing/schema.json',
                content: null
            })
        });

        await assert.rejects(
            () => SchemaLoader.load({ hostFacade }),
            (error) => {
                assert.match(error.message, /^Không thể tải Schema:/);
                assert.equal(error.cause.message, 'File not found: /missing/schema.json');
                return true;
            }
        );
    });

    it('throws when the schema payload is invalid JSON', async () => {
        const { hostFacade } = createHostFacade({
            readExtensionText: async () => ({
                absolutePath: '/mock/schema.json',
                content: '{"broken": }'
            })
        });

        await assert.rejects(
            () => SchemaLoader.load({ hostFacade }),
            (error) => {
                assert.match(error.message, /^Không thể tải Schema:/);
                assert.ok(error.cause instanceof Error);
                return true;
            }
        );
    });
});
