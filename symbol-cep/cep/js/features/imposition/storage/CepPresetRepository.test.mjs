import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { migratePresetToDraft } from '../preset_migrator.js';
import { CepPresetRepository } from './CepPresetRepository.js';

const presetsPath = new URL('../../../../data/presets.json', import.meta.url);

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createRepository(initialPresets) {
    let entries = clone(initialPresets);
    let writes = 0;
    const usage = {};

    const presetFileStore = {
        readEntries() {
            return {
                state: 'ok',
                presets: clone(entries)
            };
        },
        writeEntries(nextPresets) {
            entries = clone(nextPresets);
            writes += 1;
            return { success: true };
        }
    };
    const usageMetadataStore = {
        readEntries() {
            return {
                state: 'ok',
                usageById: clone(usage)
            };
        },
        writeEntries(nextUsage) {
            Object.assign(usage, clone(nextUsage));
            return { success: true };
        }
    };
    const health = {
        get() {
            return {
                reason: 'ok',
                message: '',
                canReadPresets: true,
                canWritePresets: true,
                canWriteUsage: true
            };
        },
        inspect() {
            return this.get();
        },
        setOverride() {
            return this.get();
        },
        clearOverride() {
            return this.get();
        }
    };

    return {
        repository: new CepPresetRepository({
            presetFileStore,
            usageMetadataStore,
            storageHealthService: health
        }),
        readEntries: () => clone(entries),
        getWrites: () => writes
    };
}

test('mixed V4/V5 storage reads both formats and save canonicalizes only the selected preset', () => {
    const catalog = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
    const legacy = (Array.isArray(catalog) ? catalog : catalog.presets)
        .find((preset) => preset.schema && preset.schema.sections.some((section) => (
            section.id === 'sec_margins' &&
            (section.rows || []).some((row) => String(row.id).indexOf('row_dynamic_') === 0)
        )));
    const otherLegacy = (Array.isArray(catalog) ? catalog : catalog.presets)
        .find((preset) => preset.id !== legacy.id);
    const migrated = migratePresetToDraft(legacy);
    const harness = createRepository([legacy, otherLegacy, migrated.draft]);

    const draftResult = harness.repository.getDraftById(legacy.id);
    assert.equal(draftResult.success, true);
    assert.equal(draftResult.sourceVersion, 4);

    const saveResult = harness.repository.saveDraft(draftResult.draft);
    assert.equal(saveResult.success, true);
    assert.equal(harness.getWrites(), 1);

    const stored = harness.readEntries();
    const selected = stored.find((entry) => entry.id === legacy.id);
    const untouched = stored.find((entry) => entry.id === otherLegacy.id);

    assert.equal(selected.modelVersion, 1);
    assert.equal(Array.isArray(selected.values.preset_id), false);
    assert.deepEqual(untouched, otherLegacy);
});

test('unknown canonical schema extensions block save without writing', () => {
    const catalog = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
    const legacy = (Array.isArray(catalog) ? catalog : catalog.presets)[0];
    const draft = migratePresetToDraft(legacy).draft;
    draft.schemaExtensions.unknown = { value: true };
    const harness = createRepository([legacy]);

    const result = harness.repository.saveDraft(draft);

    assert.equal(result.success, false);
    assert.equal(result.reason, 'unsupported_extension');
    assert.equal(harness.getWrites(), 0);
});
