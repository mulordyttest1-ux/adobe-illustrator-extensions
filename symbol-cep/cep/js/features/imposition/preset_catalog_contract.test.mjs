import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { ConfigEngine } from './config_engine.js';
import { hydratePreset as legacyHydratePreset } from './legacy_preset_adapter.js';
import { migratePresetToDraft } from './preset_migrator.js';
import { buildLegacyMirrors, buildProcessingOptions, hydratePreset } from './processing_options.js';
import { isCanonicalPresetEntry, serializePresetDraft } from './preset_serializer.js';

const presetsPath = new URL('../../../data/presets.json', import.meta.url);

test('every stored preset hydrates and compiles without mutating its stored entry', () => {
    const catalog = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
    const presets = Array.isArray(catalog) ? catalog : catalog.presets;

    assert.ok(Array.isArray(presets));
    presets.forEach((preset) => {
        const storedEntry = JSON.parse(JSON.stringify(preset));
        const hydrated = hydratePreset(preset);
        const rules = ConfigEngine.compileRules(hydrated.schema, hydrated.rawValues);

        assert.ok(hydrated.schema && Array.isArray(hydrated.schema.sections), preset.id);
        assert.ok(Array.isArray(rules), preset.id);
        assert.deepEqual(preset, storedEntry, preset.id);
    });
});

test('legacy and canonical runtime adapters preserve compiled rules and operator behavior', () => {
    const catalog = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
    const presets = Array.isArray(catalog) ? catalog : catalog.presets;

    presets.forEach((preset) => {
        const current = hydratePreset(preset);

        if (isCanonicalPresetEntry(preset)) {
            const expectedProcessing = buildProcessingOptions(preset.values, current.schema);
            const expectedMirrors = buildLegacyMirrors(expectedProcessing);

            assert.deepEqual(current.processingOptions, expectedProcessing, `${preset.id}: processing options`);
            assert.deepEqual(current.options, expectedMirrors.options, `${preset.id}: options`);
            assert.equal(current.info_template, expectedMirrors.info_template, `${preset.id}: pasteboard template`);
            assert.equal(current.rawValues.preset_id, preset.id, `${preset.id}: runtime id`);
            assert.equal(current.rawValues.preset_name, preset.label, `${preset.id}: runtime label`);
            return;
        }

        const legacy = legacyHydratePreset(preset);

        assert.deepEqual(current.processingOptions, legacy.processingOptions, `${preset.id}: processing options`);
        assert.deepEqual(current.geometry, legacy.geometry, `${preset.id}: geometry`);
        assert.deepEqual(current.options, legacy.options, `${preset.id}: options`);
        assert.equal(current.info_template, legacy.info_template, `${preset.id}: pasteboard template`);
        assert.deepEqual(
            ConfigEngine.compileRules(current.schema, current.rawValues),
            ConfigEngine.compileRules(legacy.schema, legacy.rawValues),
            `${preset.id}: compiled rules`
        );
    });
});

test('V4 preset migration removes identity fields from values and preserves dynamic margin extensions', () => {
    const catalog = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
    const legacyPreset = (Array.isArray(catalog) ? catalog : catalog.presets)
        .find((preset) => preset.schema && preset.schema.sections.some((section) => (
            section.id === 'sec_margins' &&
            (section.rows || []).some((row) => String(row.id).indexOf('row_dynamic_') === 0)
        )));

    const migration = migratePresetToDraft(legacyPreset);

    assert.equal(migration.success, true);
    assert.equal(migration.sourceVersion, 4);
    assert.equal(migration.draft.modelVersion, 1);
    assert.equal(migration.draft.values.preset_id, undefined);
    assert.equal(migration.draft.values.preset_name, undefined);
    assert.ok(migration.draft.schemaExtensions.marginRows.length > 0);
});

test('V5 preset serialization is idempotent', () => {
    const draft = {
        modelVersion: 1,
        id: 'preset-roundtrip',
        label: 'Roundtrip',
        schemaId: 'standard_imposition',
        schemaExtensions: {
            marginRows: [{
                id: 'row_dynamic_test',
                label: 'Test row',
                classification: 'BASELINE'
            }]
        },
        values: {
            preset_id: 'must-be-removed',
            preset_name: 'must-be-removed',
            finish_w: 90,
            finish_h: 50
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z'
    };

    const once = serializePresetDraft(draft);
    const twice = serializePresetDraft(once);

    assert.deepEqual(twice, once);
    assert.equal(twice.values.preset_id, undefined);
    assert.equal(twice.values.preset_name, undefined);
});
