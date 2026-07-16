import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildUsageStoreFromPresets,
    createStorageHealth,
    mergeUsageIntoPresets,
    normalizeUsageStorePayload,
    resolveStorageHealth,
    stripUsageMetadata
} from './data_store.js';

test('buildUsageStoreFromPresets extracts only usage metadata', () => {
    const usageById = buildUsageStoreFromPresets([
        { id: 'a', label: 'A', usageCount: 4, lastUsedAt: '2026-03-21T10:00:00.000Z' },
        { id: 'b', label: 'B' }
    ]);

    assert.deepEqual(usageById, {
        a: {
            usageCount: 4,
            lastUsedAt: '2026-03-21T10:00:00.000Z'
        }
    });
});

test('mergeUsageIntoPresets overlays sidecar usage and defaults safely', () => {
    const merged = mergeUsageIntoPresets(
        [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B', usageCount: 2 }
        ],
        {
            a: { usageCount: 7, lastUsedAt: '2026-03-21T11:00:00.000Z' }
        }
    );

    assert.equal(merged[0].usageCount, 7);
    assert.equal(merged[0].lastUsedAt, '2026-03-21T11:00:00.000Z');
    assert.equal(merged[1].usageCount, 2);
    assert.equal(merged[1].lastUsedAt, null);
});

test('stripUsageMetadata removes volatile usage fields from preset payload', () => {
    const stripped = stripUsageMetadata({
        id: 'preset_a4',
        label: 'A4',
        usageCount: 12,
        lastUsedAt: '2026-03-21T11:00:00.000Z'
    });

    assert.deepEqual(stripped, {
        id: 'preset_a4',
        label: 'A4'
    });
});

test('normalizeUsageStorePayload accepts versioned and legacy shapes', () => {
    const versioned = normalizeUsageStorePayload({
        version: 1,
        usageById: {
            a: { usageCount: '3', lastUsedAt: '2026-03-21T11:00:00.000Z' }
        }
    });
    const legacy = normalizeUsageStorePayload({
        b: { usageCount: 5 }
    });

    assert.deepEqual(versioned, {
        version: 1,
        usageById: {
            a: {
                usageCount: 3,
                lastUsedAt: '2026-03-21T11:00:00.000Z'
            }
        }
    });

    assert.deepEqual(legacy, {
        version: 1,
        usageById: {
            b: {
                usageCount: 5,
                lastUsedAt: null
            }
        }
    });
});

test('resolveStorageHealth classifies main and sidecar failure modes', () => {
    const missingTarget = resolveStorageHealth({
        path: '/tmp/presets.json',
        usagePath: '/tmp/presets.usage.json',
        presetsState: 'missing_target',
        usageState: 'missing',
        canWritePresets: false,
        canWriteUsage: true
    });
    const mainWriteDenied = resolveStorageHealth({
        path: '/tmp/presets.json',
        usagePath: '/tmp/presets.usage.json',
        presetsState: 'ok',
        usageState: 'missing',
        canWritePresets: false,
        canWriteUsage: true
    });
    const usageWriteDenied = resolveStorageHealth({
        path: '/tmp/presets.json',
        usagePath: '/tmp/presets.usage.json',
        presetsState: 'ok',
        usageState: 'missing',
        canWritePresets: true,
        canWriteUsage: false
    });
    const healthy = createStorageHealth({
        path: '/tmp/presets.json',
        usagePath: '/tmp/presets.usage.json'
    });

    assert.equal(missingTarget.reason, 'missing_target');
    assert.equal(missingTarget.canReadPresets, false);
    assert.equal(mainWriteDenied.reason, 'write_denied');
    assert.equal(mainWriteDenied.canWritePresets, false);
    assert.equal(usageWriteDenied.reason, 'usage_write_denied');
    assert.equal(usageWriteDenied.canWriteUsage, false);
    assert.equal(healthy.reason, 'ok');
});
