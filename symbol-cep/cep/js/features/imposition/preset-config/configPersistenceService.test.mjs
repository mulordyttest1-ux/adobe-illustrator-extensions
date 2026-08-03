import test from 'node:test';
import assert from 'node:assert/strict';

import {
    dryRunConfigPreset,
    loadPresetIntoConfigTab,
    saveConfigPreset
} from './configPersistenceService.js';

function createSchema() {
    return {
        id: 'standard_imposition',
        sections: [{
            id: 'base',
            fields: [
                'copies',
                'finish_w',
                'finish_h',
                'safe_top',
                'opt_custom_rotate',
                'custom_rotate_angle',
                'save_filename_prefix',
                'save_output_dir'
            ].map((id) => ({ id }))
        }]
    };
}

function createTabRecorder(schema = createSchema()) {
    const calls = [];
    return {
        calls,
        getCanonicalSchema() {
            return schema;
        },
        setActiveSchema(nextSchema) {
            calls.push(['setActiveSchema', nextSchema]);
        },
        setPresetMeta(id, label) {
            calls.push(['setPresetMeta', id, label]);
        },
        setFormState(rawValues) {
            calls.push(['setFormState', rawValues]);
        },
        markClean(snapshot) {
            calls.push(['markClean', snapshot]);
        },
        render() {
            calls.push(['render']);
        }
    };
}

function buildDraftResult({ id, label, schema, rawValues, createdAt }) {
    return {
        success: true,
        sourceVersion: 5,
        unsupportedExtensions: [],
        draft: {
            modelVersion: 1,
            id,
            label,
            schemaId: schema.id || 'standard_imposition',
            schemaExtensions: { marginRows: [] },
            values: { ...rawValues },
            createdAt,
            updatedAt: createdAt
        }
    };
}

function toRuntimePreset(draft, schema = createSchema()) {
    return {
        ...draft,
        schema,
        rawValues: {
            ...draft.values,
            preset_id: draft.id,
            preset_name: draft.label
        },
        processingOptions: {
            finishWidth: draft.values.finish_w,
            finishHeight: draft.values.finish_h
        },
        options: {
            copies: Number(draft.values.copies) || 1
        },
        info_template: draft.values.info_template || ''
    };
}

function createCanonicalRepository(schema = createSchema()) {
    const drafts = new Map();
    return {
        drafts,
        getDraftById(id) {
            const draft = drafts.get(id) || null;
            return {
                success: !!draft,
                draft
            };
        },
        saveDraft(draft) {
            drafts.set(draft.id, draft);
            return {
                success: true,
                draft,
                preset: toRuntimePreset(draft, schema)
            };
        }
    };
}

function createOverrides({
    repository = createCanonicalRepository(),
    schema = createSchema(),
    rawValues = {},
    toasts = []
} = {}) {
    return {
        presetRepository: repository,
        serializeFormState: () => ({ ...rawValues }),
        getCanonicalSchema: () => schema,
        buildDraftFromConfigResult: buildDraftResult,
        toRuntimePreset: (draft) => toRuntimePreset(draft, schema),
        createPresetId: () => 'preset_fixed',
        nowIso: () => '2026-03-27T12:00:00.000Z',
        showToast: (message, type) => toasts.push({ message, type }),
        requestConfirm: async () => 'confirm'
    };
}

test('loadPresetIntoConfigTab reads a canonical draft and re-renders the tab', () => {
    const schema = createSchema();
    const tab = createTabRecorder(schema);
    const repository = createCanonicalRepository(schema);
    const draft = buildDraftResult({
        id: 'preset_a4',
        label: 'A4',
        schema,
        rawValues: { copies: 2 },
        createdAt: '2026-03-27T12:00:00.000Z'
    }).draft;
    repository.drafts.set(draft.id, draft);

    loadPresetIntoConfigTab(
        { id: draft.id, tab },
        createOverrides({ repository, schema })
    );

    assert.deepEqual(tab.calls, [
        ['setActiveSchema', schema],
        ['setPresetMeta', 'preset_a4', 'A4'],
        ['setFormState', {
            copies: 2,
            preset_id: 'preset_a4',
            preset_name: 'A4'
        }],
        ['markClean', {
            rawValues: {
                copies: 2,
                preset_id: 'preset_a4',
                preset_name: 'A4'
            },
            schema,
            formMeta: {
                presetId: 'preset_a4',
                presetName: 'A4'
            }
        }],
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
        createOverrides({
            rawValues: { preset_name: '   ' },
            toasts
        })
    );

    assert.equal(result, false);
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0].type, 'warning');
});

test('saveConfigPreset writes only a canonical draft and updates tab state', async () => {
    const schema = createSchema();
    const tab = createTabRecorder(schema);
    const repository = createCanonicalRepository(schema);
    const toasts = [];
    const rawValues = {
        preset_name: 'Preset A',
        copies: '2',
        save_filename_prefix: 'Bai in test',
        save_output_dir: 'C:/Output'
    };

    const result = await saveConfigPreset(
        {
            form: {},
            allowUpdate: true,
            configTabRef: tab
        },
        createOverrides({ repository, schema, rawValues, toasts })
    );

    assert.equal(result, true);
    assert.equal(repository.drafts.size, 1);
    const savedDraft = repository.drafts.get('preset_fixed');
    assert.equal(savedDraft.id, 'preset_fixed');
    assert.equal(savedDraft.label, 'Preset A');
    assert.equal(savedDraft.values.save_filename_prefix, 'Bai in test');
    assert.equal(savedDraft.values.save_output_dir, 'C:/Output');
    assert.equal(savedDraft.processingOptions, undefined);
    assert.equal(savedDraft.geometry, undefined);
    assert.equal(savedDraft.options, undefined);
    assert.equal(toasts[0].type, 'success');
});

test('dryRunConfigPreset builds one canonical draft and delegates its runtime projection', async () => {
    let receivedPreset = null;
    const schema = createSchema();
    const rawValues = {
        preset_name: 'Quick Run',
        finish_w: '120',
        finish_h: '180'
    };

    const result = await dryRunConfigPreset(
        {
            form: {},
            configTabRef: null
        },
        {
            ...createOverrides({ schema, rawValues }),
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
    assert.equal(receivedPreset.rawValues.finish_w, '120');
    assert.equal(receivedPreset.rawValues.finish_h, '180');
});

test('save and load preserve the same canonical operator state', async () => {
    const schema = createSchema();
    const repository = createCanonicalRepository(schema);
    const tab = createTabRecorder(schema);
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
    const overrides = createOverrides({ repository, schema, rawValues });

    const saved = await saveConfigPreset(
        {
            form: {},
            allowUpdate: false,
            configTabRef: tab
        },
        overrides
    );

    assert.equal(saved, true);
    tab.calls.length = 0;

    loadPresetIntoConfigTab(
        { id: 'preset_fixed', tab },
        overrides
    );

    assert.equal(tab.calls[0][0], 'setActiveSchema');
    assert.deepEqual(tab.calls[2], ['setFormState', {
        ...rawValues,
        preset_id: 'preset_fixed',
        preset_name: 'Roundtrip A'
    }]);
    assert.equal(tab.calls.at(-1)[0], 'render');
});

test('save and dry run project the same runtime behavior from canonical drafts', async () => {
    const schema = createSchema();
    const repository = createCanonicalRepository(schema);
    const rawValues = {
        preset_name: 'Roundtrip B',
        finish_w: '90',
        finish_h: '140',
        copies: '4'
    };
    let dryRunPreset = null;
    const overrides = {
        ...createOverrides({ repository, schema, rawValues }),
        resolveActionTab: () => ({
            async runWithPreset(preset) {
                dryRunPreset = preset;
            }
        })
    };

    assert.equal(await saveConfigPreset({
        form: {},
        allowUpdate: false,
        configTabRef: null
    }, overrides), true);
    assert.equal(await dryRunConfigPreset({
        form: {},
        configTabRef: null
    }, overrides), true);

    const savedPreset = toRuntimePreset(repository.drafts.get('preset_fixed'), schema);
    assert.deepEqual(dryRunPreset.processingOptions, savedPreset.processingOptions);
    assert.deepEqual(dryRunPreset.options, savedPreset.options);
    assert.equal(dryRunPreset.rawValues.finish_w, savedPreset.rawValues.finish_w);
    assert.equal(dryRunPreset.rawValues.finish_h, savedPreset.rawValues.finish_h);
});

test('Config persistence rejects a legacy-only repository instead of writing through savePreset', async () => {
    let legacyWriteCalled = false;
    const toasts = [];
    const result = await saveConfigPreset(
        {
            form: {},
            allowUpdate: false,
            configTabRef: null
        },
        {
            ...createOverrides({
                rawValues: {
                    preset_name: 'Legacy blocked',
                    copies: '2'
                },
                toasts
            }),
            presetRepository: {
                getPresets() {
                    return [];
                },
                savePreset() {
                    legacyWriteCalled = true;
                    return { success: true };
                }
            }
        }
    );

    assert.equal(result, false);
    assert.equal(legacyWriteCalled, false);
    assert.equal(toasts.at(-1).type, 'error');
});

test('canonical save drops retired preset-level action policy metadata', async () => {
    const schema = createSchema();
    const repository = createCanonicalRepository(schema);
    const existing = buildDraftResult({
        id: 'preset_thiep',
        label: 'Thiep',
        schema,
        rawValues: {
            save_output_dir: 'C:/Old'
        },
        createdAt: '2026-03-27T12:00:00.000Z'
    }).draft;
    existing.saveActionBehavior = 'save_only';
    repository.drafts.set(existing.id, existing);

    const result = await saveConfigPreset(
        {
            form: {},
            allowUpdate: true,
            configTabRef: null
        },
        {
            ...createOverrides({
                repository,
                schema,
                rawValues: {
                    preset_id: 'preset_thiep',
                    preset_name: 'Thiep',
                    save_output_dir: 'C:/Output'
                }
            }),
            createPresetId: () => 'unused'
        }
    );

    assert.equal(result, true);
    assert.equal(repository.drafts.get('preset_thiep').saveActionBehavior, undefined);
});
