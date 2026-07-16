# Toolkit CEP Feature Map

> Source of truth for feature-level navigation in `toolkit-cep`.

## Runtime And Boot

Use for startup, ready state, test API registration, and first-focus behavior.

- Primary entrypoints:
  - `toolkit-cep/cep/js/app.js`
  - `toolkit-cep/cep/js/bootstrap/startup.js`
  - `toolkit-cep/cep/js/bootstrap/readyState.js`
  - `toolkit-cep/cep/js/bootstrap/testApi.js`

## Shell

Use for dashboard rendering, search box wiring, result list rendering, and keyboard navigation.

- Primary entrypoints:
  - `toolkit-cep/cep/js/features/shell/toolkitShell.js`
  - `toolkit-cep/cep/js/features/shell/launcherState.js`

## Catalog

Use for generated manifest consumption, grouping, search behavior, and host-availability merge.

- Primary entrypoints:
  - `toolkit-cep/cep/js/features/catalog/moduleCatalog.js`
  - `toolkit-cep/cep/js/features/catalog/moduleCatalogSearch.js`
  - `toolkit-cep/cep/.generated/module_catalog.js`

## Run Flow

Use for precheck, execution, host-result shaping, and quarantined-module blocking.

- Primary entrypoints:
  - `toolkit-cep/cep/js/features/run/commandPreflight.js`
  - `toolkit-cep/cep/js/features/run/commandRunner.js`

## Platform / Host

Use for CEP transport, host runtime reload/inspect, command dispatch, quarantine metadata, and smoke fixture helpers.

- Primary entrypoints:
  - `toolkit-cep/cep/js/infrastructure/hostFacade.js`
  - `toolkit-cep/cep/js/infrastructure/bridge.js`
  - `toolkit-cep/cep/jsx/host.jsx`
  - `toolkit-cep/cep/jsx/bootstrap/toolkitHostBootstrap.jsx`
  - `toolkit-cep/cep/jsx/runtime/toolkitBridgeRuntime.jsx`
  - `toolkit-cep/cep/.generated/module_registry.jsx`
  - `toolkit-cep/cep/.generated/module_dispatch.jsx`

## Module Authoring

Use for future toolkit action modules.

- Primary entrypoints:
  - `toolkit-cep/cep/modules/<module-id>/module.json`
  - `toolkit-cep/cep/modules/<module-id>/run.jsx`
- `toolkit-cep/cep/scripts/scaffold_toolkit_module.cjs`
- `toolkit-cep/cep/scripts/templates/module.json.template`
- `toolkit-cep/cep/scripts/templates/run.jsx.template`
- `toolkit-cep/cep/scripts/generate_toolkit_artifacts.cjs`
- `toolkit-cep/cep/scripts/module_contract.cjs`
- `toolkit-cep/cep/scripts/check_toolkit_shell_freeze.cjs`

## Verification Routing

Use focused smoke by module id for everyday feature work. Module lanes run the stable representative subset; deeper live checks stay available through `--scenario`.

- Shell-only full-smoke scenarios:
  - `startup_ready_path`
  - `reload_button_ready`
  - `quarantine_module_visibility`
- `break_text_into_lines`
  - `break_text_into_lines_point_and_area`
  - `break_text_into_lines_rotated_point_text`
  - `break_text_into_lines_mixed_selection_skip`
- `break_text_into_words`
  - `break_text_into_words_replace_original`
- `break_text_into_glyphs`
  - `break_text_into_glyphs_point_text`
  - `break_text_into_glyphs_unsupported_only_fail`
- `create_cut_lines`
  - `create_cut_lines_sline_selection_bounds`
- `prepare_cut_package`
  - `prepare_cut_package_normalizes`
- `add_camera_marks`
  - `add_camera_marks_invalid_target`
- `save_cut_package`
  - `save_cut_package_exports`
- `swap_selection_position_only`
  - `swap_selection_position_only_basic`
  - `swap_selection_position_only_exact_two_precheck`
- `swap_selection_size_and_position`
  - `swap_selection_size_and_position_basic`
  - `swap_selection_size_and_position_rotated`
  - `swap_selection_size_and_position_zero_size_fail`
- `rasterize_bitmap_300_transparent`
  - `rasterize_bitmap_basic`
  - `rasterize_bitmap_multi_selection_single_output`
  - `rasterize_bitmap_no_selection_precheck`
- `recolor_selection_k100`
  - `recolor_selection_k100_basic_paths`
  - `recolor_selection_k100_group_and_compound`
  - `recolor_selection_k100_text_fill_and_stroke`
  - `recolor_selection_k100_mixed_skip`
- `recolor_selection_red_c0_m100_y100_k0`
  - `recolor_selection_red_basic_paths`
  - `recolor_selection_red_no_supported_items_fail`
  - `recolor_selection_red_no_selection_precheck`
- `step_repeat`
  - `step_repeat_basic_centered`
  - `step_repeat_auto_count`
  - `step_repeat_auto_rotate_better_fit`
  - `step_repeat_cell_too_large_fail`
  - `step_repeat_gap_invalid_fail`
- `step_repeat_symbol`
  - `step_repeat_symbol_creates_instances`

Scenario-only lanes kept for deeper/manual smoke:

- `break_text_into_lines_rotated_point_text`
- `break_text_into_lines_mixed_selection_skip`
- `break_text_into_glyphs_unsupported_only_fail`
- `create_cut_lines_invalid_grid`
- `create_cut_lines_contour_append_only`
- `prepare_cut_package_normalizes`
- `add_camera_marks_manual_multi_artboard`
- `add_camera_marks_smart_all_artboards`
- `swap_selection_position_only_exact_two_precheck`
- `swap_selection_size_and_position_rotated`
- `swap_selection_size_and_position_zero_size_fail`
- `recolor_selection_k100_group_and_compound`
- `recolor_selection_k100_mixed_skip`
- `recolor_selection_red_no_supported_items_fail`
- `step_repeat_auto_rotate_better_fit`
- `step_repeat_cell_too_large_fail`
- `step_repeat_gap_invalid_fail`

Public commands:

- `npm run test:smoke:toolkit`
- `npm run test:smoke:toolkit:module -- --module <module-id[,module-id]>`
- `npm run test:smoke:toolkit:scenario -- --scenario <scenario-id[,scenario-id]>`

Before continuing Batch 1 module work on a machine, install the local guard once:

- `npm run hooks:install`
- pre-commit will then run `npm run check:toolkit:shell-freeze -- --staged`

## Text Break Family

- `break_text_into_lines`, `break_text_into_words`, and `break_text_into_glyphs` form one `Text` family.
- Point text is the precision lane for this family and should not visibly drift after split.
- `Area Text` remains best-effort and may be skipped if stable placement cannot be preserved.
- `Path Text` and threaded text are out of scope in v1 and should be skipped cleanly instead of being force-supported in shell/runtime.

## Navigation Warnings

- Do not edit `cep/.generated/*` by hand.
- Do not let the shell import module folders directly.
- Do not add module-specific UI code into `bootstrap/` or `infrastructure/`.
- If work requires `cep/js/**`, `cep/jsx/**`, `cep/build.cjs`, `cep/scripts/**`, or panel shell files, treat it as a frozen-shell change and get approval first.
