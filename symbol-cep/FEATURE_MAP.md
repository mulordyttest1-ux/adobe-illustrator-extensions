# Symbol CEP Feature Map

> Source of truth for feature-level navigation in `symbol-cep`.
> Use this file when you know the operator workflow but not yet the implementation files.
> For boundary rules and layer contracts, follow `symbol-cep/ARCHITECTURE.md`.
> For governance and high-level health, follow `symbol-cep/PROJECT_STATUS.md`.

## How To Use This Map

1. Start from the workflow closest to the user request.
2. Open the listed "Primary entrypoints" before lower-level helpers.
3. Use "Also touches" only if the change crosses the primary boundary.
4. Do not start from generated bundles or debug-only files unless the task explicitly says so.

## Runtime And Boot

Use for panel startup, tab wiring, runtime assembly, and debug surface registration.

- Primary entrypoints:
  - `symbol-cep/cep/js/app.js`
  - `symbol-cep/cep/js/bridge.js`
  - `symbol-cep/cep/js/config.js`
- Also touches:
  - `symbol-cep/cep/index.html`
  - `symbol-cep/cep/jsx/host.jsx`

## Preset / Config

Use for preset loading, config schema rendering, config pane behavior, form persistence, and save/edit flows.

- Primary entrypoints:
  - `symbol-cep/cep/js/features/imposition/config_tab.js`
  - `symbol-cep/cep/js/features/imposition/config_events.js`
  - `symbol-cep/cep/js/features/imposition/config_persistence.js`
  - `symbol-cep/cep/js/features/imposition/config_engine.js`
  - `symbol-cep/cep/js/features/imposition/config_renderer.js`
  - `symbol-cep/cep/js/features/imposition/config_pane_renderer.js`
- Also touches:
  - `symbol-cep/cep/js/features/imposition/preset-config/`
  - `symbol-cep/cep/js/features/imposition/builtin_presets.js`
  - `symbol-cep/cep/js/features/imposition/schema_editor.js`
  - `symbol-cep/cep/data/presets.json`

Notes:

- Start from `config_tab.js`, `config_events.js`, or `config_persistence.js` first.
- Open `preset-config/` after the public entrypoint is identified; it is the internal service/support island for persistence, tab-state, event, and schema-edit workflow.

## Preflight

Use for checks that run before imposition, blocking confirmations, and pre-run safety rules.

- Primary entrypoints:
  - `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
  - `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.js`
  - `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.js`
- Also touches:
  - `symbol-cep/cep/js/features/imposition/confirm_service.js`
  - `symbol-cep/cep/js/features/imposition/action_tab.js`

## Engine / Execution

Use for run-preset flow, imposition dispatch, result normalization, engine payload shaping, and core layout execution.

- Primary entrypoints:
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
  - `symbol-cep/cep/js/features/imposition/processing_options.js`
  - `symbol-cep/cep/js/features/imposition/bridge_codec.js`
  - `symbol-cep/cep/js/domain/layout_engine.js`
- Also touches:
  - `symbol-cep/cep/jsx/features/imposition_symbol.jsx`
  - `symbol-cep/cep/jsx/features/imposition_modules/`

## Postflight / Hooks

Use for post-run side effects, postflight summary, pasteboard legend behavior, and hook outcome handling.

- Primary entrypoints:
  - `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
  - `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- Also touches:
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
  - `symbol-cep/PROJECT_STATUS.md`
  - `POSTFLIGHT_TAXONOMY.md`

## Platform / Illustrator Host

Use for CEP transport, host loading, JSX bridge, and Illustrator DOM execution.

- Primary entrypoints:
  - `symbol-cep/cep/js/bridge.js`
  - `symbol-cep/cep/jsx/host.jsx`
  - `symbol-cep/cep/jsx/bridge.jsx`
- Also touches:
  - `symbol-cep/cep/jsx/features/imposition_symbol.jsx`
  - `symbol-cep/cep/jsx/features/imposition_modules/`
  - `symbol-cep/cep/jsx/debug_host_validation.jsx`

## Data / Persistence

Use for stored presets, usage data, storage health, and local persistence health checks.

- Primary entrypoints:
  - `symbol-cep/cep/js/features/imposition/data_store.js`
  - `symbol-cep/cep/js/features/imposition/config_persistence.js`
- Also touches:
  - `symbol-cep/cep/data/presets.json`
  - `symbol-cep/cep/data/presets.usage.json`
  - `symbol-cep/cep/js/features/imposition/builtin_presets.js`

## Navigation Warnings

- Do not start feature work from `bundle.js`.
- Do not treat `jsx/debug_host_validation.jsx` as a production entrypoint.
- Start from the named workflow above before opening generic helpers or host modules.
