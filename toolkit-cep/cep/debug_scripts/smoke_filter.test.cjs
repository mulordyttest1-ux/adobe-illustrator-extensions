const test = require('node:test');
const assert = require('node:assert/strict');

const {
    formatSmokeSelection,
    listAvailableModuleIds,
    listAvailableScenarioIds,
    normalizeIdList,
    parseSmokeCliArgs,
    selectSmokeScenarios
} = require('./smoke_filter.cjs');
const { smokeScenarioRegistry } = require('./smoke_registry.cjs');

test('normalizeIdList trims, deduplicates, and drops empties', () => {
    assert.deepEqual(normalizeIdList(' add_camera_marks, ,create_cut_lines,add_camera_marks '), [
        'add_camera_marks',
        'create_cut_lines'
    ]);
});

test('parseSmokeCliArgs returns full mode with no filters', () => {
    assert.deepEqual(parseSmokeCliArgs([]), {
        mode: 'full',
        moduleIds: [],
        scenarioIds: []
    });
});

test('parseSmokeCliArgs parses comma-separated module ids', () => {
    assert.deepEqual(parseSmokeCliArgs(['--module', 'add_camera_marks,prepare_cut_package']), {
        mode: 'module',
        moduleIds: ['add_camera_marks', 'prepare_cut_package'],
        scenarioIds: []
    });
});

test('parseSmokeCliArgs ignores a bare argument separator from npm forwarding', () => {
    assert.deepEqual(parseSmokeCliArgs(['--', '--module', 'add_camera_marks']), {
        mode: 'module',
        moduleIds: ['add_camera_marks'],
        scenarioIds: []
    });
});

test('parseSmokeCliArgs parses scenario ids from equals form', () => {
    assert.deepEqual(parseSmokeCliArgs(['--scenario=create_cut_lines_invalid_grid,prepare_cut_package_normalizes']), {
        mode: 'scenario',
        moduleIds: [],
        scenarioIds: ['create_cut_lines_invalid_grid', 'prepare_cut_package_normalizes']
    });
});

test('parseSmokeCliArgs rejects mixed module and scenario filters', () => {
    assert.throws(() => parseSmokeCliArgs(['--module', 'add_camera_marks', '--scenario', 'prepare_cut_package_normalizes']), /Use either --module or --scenario/);
});

test('parseSmokeCliArgs rejects missing values for module and scenario flags', () => {
    assert.throws(() => parseSmokeCliArgs(['--module']), /Missing module id after --module/);
    assert.throws(() => parseSmokeCliArgs(['--scenario']), /Missing scenario id after --scenario/);
});

test('selectSmokeScenarios returns full registry in full mode', () => {
    const selected = selectSmokeScenarios({ mode: 'full', moduleIds: [], scenarioIds: [] }, smokeScenarioRegistry);
    assert.equal(
        selected.length,
        smokeScenarioRegistry.filter((scenario) => scenario.enabled !== false && scenario.includeInFull !== false).length
    );
});

test('selectSmokeScenarios returns only module scenarios for a module filter', () => {
    const selected = selectSmokeScenarios(
        { mode: 'module', moduleIds: ['add_camera_marks'], scenarioIds: [] },
        smokeScenarioRegistry
    );

    assert.deepEqual(selected.map((scenario) => scenario.id), ['add_camera_marks_invalid_target']);
    assert.ok(selected.every((scenario) => scenario.scope === 'module' && scenario.moduleId === 'add_camera_marks'));
});

test('selectSmokeScenarios unions multiple module filters without shell scenarios', () => {
    const selected = selectSmokeScenarios(
        { mode: 'module', moduleIds: ['create_cut_lines', 'prepare_cut_package'], scenarioIds: [] },
        smokeScenarioRegistry
    );

    assert.deepEqual(selected.map((scenario) => scenario.id), [
        'create_cut_lines_sline_selection_bounds',
        'prepare_cut_package_normalizes'
    ]);
});

test('selectSmokeScenarios returns exact scenario ids for scenario mode', () => {
    const selected = selectSmokeScenarios(
        { mode: 'scenario', moduleIds: [], scenarioIds: ['reload_button_ready', 'prepare_cut_package_normalizes'] },
        smokeScenarioRegistry
    );

    assert.deepEqual(selected.map((scenario) => scenario.id), [
        'reload_button_ready',
        'prepare_cut_package_normalizes'
    ]);
});

test('selectSmokeScenarios rejects unknown module ids with available list', () => {
    assert.throws(
        () => selectSmokeScenarios({ mode: 'module', moduleIds: ['missing_module'], scenarioIds: [] }, smokeScenarioRegistry),
        /Unknown module: missing_module\. Available modules:/
    );
});

test('selectSmokeScenarios rejects unknown scenario ids with available list', () => {
    assert.throws(
        () => selectSmokeScenarios({ mode: 'scenario', moduleIds: [], scenarioIds: ['missing_scenario'] }, smokeScenarioRegistry),
        /Unknown scenario: missing_scenario\. Available scenarios:/
    );
});

test('list helpers expose registry ids for operator hints', () => {
    assert.deepEqual(listAvailableModuleIds(smokeScenarioRegistry), [
        'break_text_into_lines',
        'break_text_into_words',
        'break_text_into_glyphs',
        'create_cut_lines',
        'prepare_cut_package',
        'save_cut_package',
        'swap_selection_position_only',
        'swap_selection_size_and_position',
        'rasterize_bitmap_300_transparent',
        'recolor_selection_k100',
        'recolor_selection_red_c0_m100_y100_k0',
        'place_all_pdf_pages',
        'step_repeat',
        'step_repeat_symbol',
        'add_camera_marks'
    ]);
    assert.ok(listAvailableScenarioIds(smokeScenarioRegistry).includes('quarantine_module_visibility'));
});

test('formatSmokeSelection summarizes focused module runs', () => {
    const selected = selectSmokeScenarios(
        { mode: 'module', moduleIds: ['prepare_cut_package'], scenarioIds: [] },
        smokeScenarioRegistry
    );

    assert.equal(formatSmokeSelection({ mode: 'module', moduleIds: ['prepare_cut_package'], scenarioIds: [] }, selected), 'module:prepare_cut_package (1 scenarios)');
});
