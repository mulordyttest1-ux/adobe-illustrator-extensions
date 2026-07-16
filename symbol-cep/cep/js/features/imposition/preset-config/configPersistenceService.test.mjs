import test from 'node:test';
import assert from 'node:assert/strict';

import {
    dryRunConfigPreset,
    loadPresetIntoConfigTab,
    saveConfigPreset
} from './configPersistenceService.js';

function createTabRecorder() {
    const calls = [];
    return {
        calls,
        getCanonicalSchema() {
            return { sections: [{ id: 'base' }] };
        },
        setActiveSchema(schema) {
            calls.push(['setActiveSchema', schema]);
        },
        setPresetMeta(id, label) {
            calls.push(['setPresetMeta', id, label]);
        },
        setFormState(rawValues) {
            calls.push(['setFormState', rawValues]);
        },
        render() {
            calls.push(['render']);
        }
    };
}

function normalizeRoundtripPresetShape(preset) {
    return {
        rawValues: preset.rawValues,
        schema: preset.schema,
        processingOptions: preset.processingOptions,
        options: preset.options,
        info_template: preset.info_template
    };
}

test('loadPresetIntoConfigTab hydrates preset state and re-renders the tab', () => {
    const tab = createTabRecorder();
    const dataStore = {
        saveLastActiveCalls: [],
        saveLastActive(id) {
            this.saveLastActiveCalls.push(id);
        },
        getPresets() {
            return [{ id: 'preset_a4', label: 'A4' }];
        }
    };

    loadPresetIntoConfigTab(
        { id: 'preset_a4', tab },
        {
            dataStore,
            hydratePreset: (preset, baseSchema) => ({
                id: preset.id,
                label: preset.label,
                rawValues: { copies: 2 },
                schema: baseSchema
            })
        }
    );

    assert.deepEqual(dataStore.saveLastActiveCalls, ['preset_a4']);
    assert.deepEqual(tab.calls, [
        ['setActiveSchema', { sections: [{ id: 'base' }] }],
        ['setPresetMeta', 'preset_a4', 'A4'],
        ['setFormState', { copies: 2 }],
        ['render']
    ]);
});

test('saveConfigPreset warns and returns false when preset name is missing', async () => {
    const toasts = [];

    const result = await saveConfigPreset(
        {
            form: {},
            allowUpdate: true,
            configTabRef: null
        },
        {
            serializeFormState: () => ({ preset_name: '   ' }),
            showToast: (message, type) => toasts.push({ message, type })
        }
    );

    assert.equal(result, false);
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0].type, 'warning');
});

test('saveConfigPreset saves preset, updates tab state, and reports success', async () => {
    const tab = createTabRecorder();
    const saveLastActiveCalls = [];
    const savedPresets = [];
    const toasts = [];

    const dataStore = {
        getPresets() {
            return [];
        },
        savePreset(preset) {
            savedPresets.push(preset);
            return { success: true };
        },
        saveLastActive(id) {
            saveLastActiveCalls.push(id);
        }
    };

    const result = await saveConfigPreset(
        {
            form: {},
            allowUpdate: true,
            configTabRef: tab
        },
        {
            dataStore,
            serializeFormState: () => ({
                preset_name: 'Preset A',
                copies: '2',
                save_filename_prefix: 'Bai in test',
                save_output_dir: 'C:/Output'
            }),
            createPresetId: () => 'preset_fixed',
            nowIso: () => '2026-03-27T12:00:00.000Z',
            getCanonicalSchema: () => ({ sections: [{ id: 'base' }] }),
            buildProcessingOptions: () => ({ mode: 'single' }),
            buildLegacyMirrors: () => ({ options: { copies: 2 }, info_template: 'Legend' }),
            hydratePreset: (preset, schema) => ({
                ...preset,
                schema,
                rawValues: preset.rawValues
            }),
            showToast: (message, type) => toasts.push({ message, type }),
            requestConfirm: async () => 'confirm'
        }
    );

    assert.equal(result, true);
    assert.equal(savedPresets.length, 1);
    assert.equal(savedPresets[0].id, 'preset_fixed');
    assert.equal(savedPresets[0].label, 'Preset A');
    assert.equal(savedPresets[0].rawValues.save_filename_prefix, 'Bai in test');
    assert.equal(savedPresets[0].rawValues.save_output_dir, 'C:/Output');
    assert.deepEqual(saveLastActiveCalls, ['preset_fixed']);
    assert.equal(toasts[0].type, 'success');
    assert.deepEqual(tab.calls.slice(-4), [
        ['setActiveSchema', { sections: [{ id: 'base' }] }],
        ['setPresetMeta', 'preset_fixed', 'Preset A'],
        ['setFormState', {
            preset_name: 'Preset A',
            copies: '2',
            save_filename_prefix: 'Bai in test',
            save_output_dir: 'C:/Output'
        }],
        ['render']
    ]);
});

test('dryRunConfigPreset builds a temp preset and delegates to actionTab', async () => {
    let receivedPreset = null;

    const result = await dryRunConfigPreset(
        {
            form: {},
            configTabRef: null
        },
        {
            serializeFormState: () => ({ preset_name: 'Quick Run', finish_w: '120', finish_h: '180' }),
            buildProcessingOptions: () => ({ mode: 'dry-run' }),
            buildLegacyMirrors: () => ({ options: { copies: 1 }, info_template: 'Info' }),
            hydratePreset: (preset, schema) => ({ ...preset, schema }),
            getCanonicalSchema: () => ({ sections: [{ id: 'embedded' }] }),
            resolveActionTab: () => ({
                async runWithPreset(preset) {
                    receivedPreset = preset;
                }
            })
        }
    );

    assert.equal(result, true);
    assert.equal(receivedPreset.id, 'dry_run_temp');
    assert.match(receivedPreset.label, /^Quick Run/);
    assert.deepEqual(receivedPreset.schema, { sections: [{ id: 'embedded' }] });
});

test('saveConfigPreset and loadPresetIntoConfigTab preserve saved operator state through a roundtrip', async () => {
    const tab = createTabRecorder();
    const storedPresets = [];
    const saveLastActiveCalls = [];
    const canonicalSchema = { sections: [{ id: 'base' }] };
    const rawValues = {
        preset_name: 'Roundtrip A',
        finish_w: '120',
        finish_h: '180',
        safe_top: '8',
        opt_custom_rotate: true,
        custom_rotate_angle: '90',
        save_filename_prefix: 'Bai in roundtrip',
        save_output_dir: 'C:/Output'
    };

    const dataStore = {
        getPresets() {
            return storedPresets.slice();
        },
        savePreset(preset) {
            storedPresets.length = 0;
            storedPresets.push(preset);
            return { success: true };
        },
        saveLastActive(id) {
            saveLastActiveCalls.push(id);
        }
    };

    const overrides = {
        dataStore,
        serializeFormState: () => ({ ...rawValues }),
        createPresetId: () => 'preset_roundtrip',
        nowIso: () => '2026-03-27T12:00:00.000Z',
        getCanonicalSchema: () => canonicalSchema,
        buildProcessingOptions: () => ({
            layout: { finish: { w: 120, h: 180 } },
            rotate: { enabled: true, angle: 90 },
            margins: { safeTop: 8 }
        }),
        buildLegacyMirrors: () => ({
            options: { copies: 1, rotate: true },
            info_template: 'Legend {count}'
        }),
        hydratePreset: (preset, schema) => ({
            ...preset,
            schema,
            rawValues: preset.rawValues,
            processingOptions: preset.processingOptions,
            options: preset.options,
            info_template: preset.info_template
        }),
        showToast() {}
    };

    const saveResult = await saveConfigPreset(
        {
            form: {},
            allowUpdate: false,
            configTabRef: tab
        },
        overrides
    );

    assert.equal(saveResult, true);
    assert.equal(storedPresets.length, 1);
    assert.equal(storedPresets[0].id, 'preset_roundtrip');
    assert.deepEqual(saveLastActiveCalls, ['preset_roundtrip']);

    tab.calls.length = 0;
    saveLastActiveCalls.length = 0;

    loadPresetIntoConfigTab(
        { id: 'preset_roundtrip', tab },
        overrides
    );

    assert.deepEqual(saveLastActiveCalls, ['preset_roundtrip']);
    assert.deepEqual(tab.calls, [
        ['setActiveSchema', canonicalSchema],
        ['setPresetMeta', 'preset_roundtrip', 'Roundtrip A'],
        ['setFormState', rawValues],
        ['render']
    ]);
});

test('saveConfigPreset and dryRunConfigPreset keep the same runtime preset shape for the same form data', async () => {
    let savedPreset = null;
    let dryRunPreset = null;
    const rawValues = {
        preset_name: 'Roundtrip B',
        finish_w: '90',
        finish_h: '140',
        safe_top: '6',
        opt_custom_rotate: true,
        custom_rotate_angle: '45'
    };
    const canonicalSchema = { sections: [{ id: 'embedded' }] };

    const overrides = {
        dataStore: {
            getPresets() {
                return [];
            },
            savePreset(preset) {
                savedPreset = preset;
                return { success: true };
            },
            saveLastActive() {}
        },
        serializeFormState: () => ({ ...rawValues }),
        createPresetId: () => 'preset_saved',
        nowIso: () => '2026-03-27T12:00:00.000Z',
        getCanonicalSchema: () => canonicalSchema,
        buildProcessingOptions: () => ({
            layout: { finish: { w: 90, h: 140 } },
            rotate: { enabled: true, angle: 45 },
            margins: { safeTop: 6 }
        }),
        buildLegacyMirrors: () => ({
            options: { copies: 1, rotate: true },
            info_template: 'Legend {count}'
        }),
        hydratePreset: (preset, schema) => ({
            ...preset,
            schema,
            rawValues: preset.rawValues,
            processingOptions: preset.processingOptions,
            options: preset.options,
            info_template: preset.info_template
        }),
        resolveActionTab: () => ({
            async runWithPreset(preset) {
                dryRunPreset = preset;
            }
        }),
        showToast() {}
    };

    const saveResult = await saveConfigPreset(
        {
            form: {},
            allowUpdate: false,
            configTabRef: null
        },
        overrides
    );
    const dryRunResult = await dryRunConfigPreset(
        {
            form: {},
            configTabRef: null
        },
        overrides
    );

    assert.equal(saveResult, true);
    assert.equal(dryRunResult, true);
    assert.equal(savedPreset.id, 'preset_saved');
    assert.equal(dryRunPreset.id, 'dry_run_temp');
    assert.match(dryRunPreset.label, /\(Nháp\)$/);
    assert.deepEqual(
        normalizeRoundtripPresetShape(dryRunPreset),
        normalizeRoundtripPresetShape(savedPreset)
    );
});

test('saveConfigPreset drops legacy save-only action policy from existing preset metadata', async () => {
    let savedPreset = null;
    const existingPreset = {
        id: 'preset_thiep',
        label: 'Thiệp',
        saveActionBehavior: 'save_only'
    };

    const result = await saveConfigPreset(
        {
            form: {},
            allowUpdate: true,
            configTabRef: null
        },
        {
            dataStore: {
                getPresets() {
                    return [existingPreset];
                },
                getRawPresetById(id) {
                    return id === 'preset_thiep' ? existingPreset : null;
                },
                savePreset(preset) {
                    savedPreset = preset;
                    return { success: true };
                },
                saveLastActive() {}
            },
            serializeFormState: () => ({
                preset_id: 'preset_thiep',
                preset_name: 'Thiệp',
                save_output_dir: 'C:/Output'
            }),
            getCanonicalSchema: () => ({ sections: [{ id: 'embedded' }] }),
            buildProcessingOptions: () => ({ layout: { mode: 'single' } }),
            buildLegacyMirrors: () => ({ options: {}, info_template: '' }),
            hydratePreset: (preset, schema) => ({
                ...preset,
                schema,
                rawValues: preset.rawValues
            }),
            showToast() {}
        }
    );

    assert.equal(result, true);
    assert.equal(savedPreset.saveActionBehavior, undefined);
});
