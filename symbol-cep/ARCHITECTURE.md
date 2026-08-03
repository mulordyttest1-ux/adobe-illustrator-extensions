# Symbol CEP Architecture

> Source of truth for `symbol-cep` runtime architecture, folder conventions, and boundary contracts.
> When `README`, `PROJECT_STATUS`, or old notes disagree with this file, follow this file.

## Purpose

- Keep `symbol-cep` maintainable while preserving the Illustrator CEP and JSX boundary.
- Make runtime entrypoints, layer boundaries, and allowed dependency directions explicit.
- Keep feature routing delegated to `symbol-cep/FEATURE_MAP.md`.
- Prevent drift back into generic CEP-shell guidance that hides the real feature slices.

## Runtime Truth

1. `cep/index.html` loads `lib/CSInterface.js`, `js/libs/fuse.basic.min.js`, and then `js/bundle.js`.
2. `cep/build.cjs` bundles `cep/js/app.js` into `cep/js/bundle.js`.
3. `cep/js/app.js` is the only supported panel composition root.
4. `app.js` creates one runtime `Bridge`, one `ActionTab`, one `ConfigTab`, one `PreflightOrchestrator`, and one `PostflightOrchestrator`.
5. `app.js` registers `window.Imposition` as the app-owned runtime surface.
6. `cep/jsx/host.jsx` is the host-side composition root and must remain ES3-compatible.

## App-Owned Global Contract

Only these app-owned globals are allowed:

- `window.Imposition`
- `window.switchTab`

Everything else must stay behind imports, injected collaborators, or CEP vendor globals.

## Layer Map

### `cep/js/app.js`

Panel composition root.

- Owns boot assembly.
- Wires tabs, debug surface, bridge instance, and feature orchestrators.
- Must stay thin and delegate feature work downward.

### `cep/js/features/imposition/`

Primary feature slice for panel-side application logic.

Current named areas:

- config
- preflight
- execution
- postflight
- persistence helpers

Rules:

- New app runtime code should enter through a named feature surface here before lower-level helpers are added.
- Keep feature-specific orchestration inside feature files, not in `app.js`.

### `cep/js/domain/`

Pure-ish panel-side domain helpers.

- Owns imposition logic such as layout computation.
- Must not absorb CEP transport or DOM/panel orchestration concerns.

### `cep/js/bridge.js`

CEP transport boundary.

- Owns `CSInterface` access and host eval transport.
- Must not absorb feature policy, config logic, or postflight decisions.

### `cep/js/config.js`

App-level config surface.

- Keep environment/config defaults here.
- Do not turn it into a second runtime composition root.

### `cep/jsx/`

Illustrator host layer.

- Must remain ES3-compatible.
- Owns Illustrator DOM execution and host bridge endpoints.
- Must not duplicate panel-side orchestration that belongs in `cep/js/`.

## Canonical Module Taxonomy

Use this taxonomy when creating or migrating runtime code inside `symbol-cep`.

### `Facade`

- public entrypoint for one bounded context
- owns thin orchestration and stable calling contract
- callers outside the context should start here first

### `Service / Support`

- runtime mechanics internal to one context
- may support a facade or operator workflow seam
- must not become a second public entrypoint

### `Policy / Domain`

- planners, validators, normalizers, rules, and pure decision logic
- should stay free of transport and UI side effects
- panel-side domain helpers stay here instead of leaking into bridge or render layers

### `Adapter`

- CEP, JSX, host, storage, or other IO boundary
- transport and serialization only
- must not absorb preset/config/execution policy

### `Config / Data`

- schema/config descriptors, built-in preset tables, and storage-backed data shapes
- should not hide executable policy that belongs in a facade or service

## Migration Matrix

### Facade-ready

- Runtime / Boot
- Preset / Config
- Engine / Execution
- Postflight / Hooks
- Data / Persistence

### Next v2 island

- None by default. Reopen a new island only when a real policy, runtime, or validation trigger appears.

### Deferred / trigger only

- Platform / Illustrator Host
- Preflight, unless a real rule or policy trigger appears

## Top-Level `cep/js/`

- `cep/js/app.js` is the only app-owned runtime composition root.
- `cep/js/bridge.js` is a boundary adapter, not a second entrypoint.
- `cep/js/config.js` is a config surface, not a feature bucket.
- Do not add new generic top-level runtime files when a named feature slice already exists.

## Feature Slice Contracts

### Preset / Config

Location:

- `cep/js/features/imposition/config_tab.js`
- `cep/js/features/imposition/config_engine.js`
- `cep/js/features/imposition/config_events.js`
- `cep/js/features/imposition/config_pane_renderer.js`
- `cep/js/features/imposition/config_pane_control_adapter.js`
- `cep/js/features/imposition/config_pane_special_sections.js`
- `cep/js/features/imposition/config_schema_state.js`
- `cep/js/features/imposition/config_persistence.js`
- `cep/js/features/imposition/preset-config/`
- `cep/js/features/imposition/config_draft_store.js`
- `cep/js/features/imposition/config_section_registry.js`
- `cep/js/features/imposition/preset_schema_policy.js`
- `cep/js/features/imposition/preset_draft_model.js`
- `cep/js/features/imposition/preset_migrator.js`
- `cep/js/features/imposition/preset_serializer.js`
- `cep/js/features/imposition/runtime_preset_adapter.js`
- `cep/js/features/imposition/processing_option_mapper.js`
- `cep/js/features/imposition/legacy_preset_adapter.js`

Contract:

- `config_tab.js` owns the operator-facing config workflow.
- Renderer files own view assembly, not persistence or engine dispatch.
- Persistence stays separate from pane layout and form serialization.
- Internal workflow seams for persistence, config-tab state, event routing, and schema-edit flow now live under `cep/js/features/imposition/preset-config/`.
- `config_engine.js` is pure and only dynamic margin rows may be added or removed at runtime.
- `config_schema_state.js` is the single normalization/fingerprint seam for dirty drafts and stale-field pruning.
- `ConfigDraftStore` owns the current config snapshot and clean baseline; `ConfigTab` keeps only a compatibility mirror while callers migrate.
- Draft preset switching asks before discarding unsaved changes.
- `preset_schema_policy.js` and `processing_option_mapper.js` keep schema invariants and form serialization out of the ConfigTab coordinator.
- `processing_options.js` is a stable runtime facade. Legacy mapping lives in `legacy_preset_adapter.js`; canonical V5 drafts are read through `preset_migrator.js`.
- `CepPresetRepository` reads mixed V4/V5 entries, exposes `getDraftById()` and `saveDraft()`, and writes storage version 5 without mass-migrating untouched entries.
- `config_section_registry.js` owns the nine Config pane adapters: groups A (core/output), B (paper/margins), and C (options/pasteboard).
- `config_pane_control_adapter.js` owns standard, dense, compact, and Tweakpane control construction through an injected renderer context.
- `config_pane_special_sections.js` owns the pasteboard and schema-edit render adapters; the main renderer mounts them without owning their section policy.
- Config load, save, dry-run, and save-directory updates use `getDraftById()` and `saveDraft()` only. Legacy V4 hydration remains a read adapter behind the runtime facade, not a Config persistence branch.

### Preflight

Location:

- `cep/js/features/imposition/preflight/`

Contract:

- Runs before engine execution.
- May block or warn before running a preset.
- Must stay distinct from post-run hooks.

### Engine / Execution

Location:

- `cep/js/features/imposition/action_tab.js`
- `cep/js/features/imposition/processing_options.js`
- `cep/js/features/imposition/bridge_codec.js`
- `cep/js/domain/layout_engine.js`

Contract:

- `action_tab.js` owns run-preset orchestration and the operator-facing run flow.
- Payload shaping stays separate from host bridge transport.
- Engine success/failure handling should not be buried in config or bridge layers.

### Wedding Suite Standard

Location:

- `cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `cep/js/features/wedding-suite-standard/panelPolicy.js`
- `cep/js/features/wedding-suite-standard/panelView.js`
- `cep/js/features/wedding-suite-standard/panelActions.js`
- `cep/jsx/features/wedding_suite_standard.jsx`
- `cep/jsx/features/wedding_suite_standard_core.jsx`
- `cep/jsx/features/wedding_suite_standard_source.jsx`
- `cep/jsx/features/wedding_suite_standard_render.jsx`
- `cep/jsx/features/wedding_suite_standard_output.jsx`

Contract:

- `WeddingSuiteTab.js` remains the panel facade and composition root for this
  bounded context. It owns dependency wiring, state snapshots, event
  delegation, and the existing runtime facade methods.
- `panelPolicy.js` contains source/manifest, draft, pair/combined, and
  validation policy without bridge or DOM access.
- `panelView.js` renders the shell and preview without repository, bridge, or
  feedback access.
- `panelActions.js` owns source/output pickers, refresh, build, and toast
  lifecycle through injected dependencies.
- `cep/jsx/host.jsx` includes the Wedding Suite host layers in the fixed order
  `core -> source -> render -> output -> wedding_suite_standard`.
- App boot and page reload own loading `cep/jsx/host.jsx` into Illustrator.
  Wedding Suite build calls must reuse that loaded host and must not evaluate
  the composition root again inside Illustrator's persistent script engine.
  `Bridge.reloadHostScripts()` remains an explicit developer-only seam.
- `wedding_suite_standard.jsx` is the only public host endpoint surface;
  extracted JSX files expose internal helpers only and remain ES3-compatible.
- PDF-only output, dirty guards, previous-output cleanup, QA, and temporary
  debug artifact behavior remain unchanged.

### Symbol Smoke Harness

Location:

- `cep/debug_scripts/test_smoke.cjs`
- `cep/debug_scripts/smoke_support.cjs`
- `cep/debug_scripts/smoke_suites/`

Contract:

- `test_smoke.cjs` is the thin CLI runner and defaults to the Illustrator 2026
  lane on port `9198`.
- `smoke_manifest.cjs` owns the stable suite IDs and registration order.
- Top-level suite files are composition facades; scenario bodies live in
  bounded Action, Config, Host, and Wedding Suite family files.
- Smoke support owns cleanup guards, host payload decoding, and expression
  factories. It must not contain product runtime policy.
- Scenario names, order, and counts are locked by manifest tests. Standalone
  diagnostic scripts are not part of the supported smoke contract.

### Postflight / Hooks

Location:

- `cep/js/features/imposition/postflight/`

Contract:

- This app uses the cross-app subtype `postflight/hooks`.
- Postflight means post-run automation and rendering side effects, not a validation report UI.
- `PostflightOrchestrator` coordinates hook execution.
- Rule files under `postflight/rules/` stay app-local and should not drift toward `wedding-cep`'s report model.

### Data / Persistence

Location:

- `cep/js/features/imposition/preset_repository.js`
- `cep/js/features/imposition/config_persistence.js`

Contract:

- Owns preset storage, usage metadata, and storage health.
- Must not become a dumping ground for config layout or execution logic.

## Platform Boundary

- `Bridge` is transport only.
- JSX host files are elevated-risk surfaces.
- Host payload and codec concerns belong in bridge/codec boundaries, not in feature renderers.
- Debug host helpers are not production entrypoints.

## Cross-App Postflight Taxonomy

- `symbol-cep` uses `postflight/hooks`.
- In this app, postflight is hook orchestration after engine success.
- Shared terminology lives in `../POSTFLIGHT_TAXONOMY.md`.
- Do not share runtime implementation with `wedding-cep/postflight/report`.

## Validation Contract

### Architecture Guards

- `cep/scripts/check_architecture.cjs` is a developer-only static guard for
  panel import direction, app-global writes, and selected policy/view
  boundaries.
- The guard is intentionally local to Symbol and does not change runtime
  behavior or rewrite source.
- The root `npm run check:architecture` command runs this guard together with
  the existing Wedding dependency check and the Toolkit guard.
- Architecture exceptions must be explicit in the checker source with a
  filename and reason. New exceptions are not inferred automatically.

### Main Validation

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm run test:smoke:symbol`

### Focused Regression Checks

- `npm --workspace imposition-panel-cep run test`

Notes:

- Runtime smoke remains the main regression guard for this app.
- Focused unit tests exist in some seams, but they are not a substitute for the real panel/runtime lane.
- Wedding Suite host composition is guarded by
  `hostComposition.test.mjs`; Symbol smoke runs only the Illustrator 2026 lane.

## Retired Or Non-Entry Surfaces

These surfaces must not be treated as production entrypoints:

- `cep/js/bundle.js` - generated output only
- `cep/debug_scripts/` - smoke/debug surfaces only
- `cep/jsx/debug_host_validation.jsx` - host debug surface only

## Current Remaining Debt

Remaining debt is trigger-based rather than an active refactor queue:

1. `CODEOWNERS` still uses placeholder owner identity and should be updated
   only when real ownership data exists.
2. Platform / host, preflight, and any final Config compatibility cleanup
   should reopen only for a reproducible defect, feature requirement, or
   repeated coupling.

## Next Phase Guidance

- Keep using milestone-sized changes for real feature or defect work.
- Prefer bounded-context upgrades over file-level cleanup.
- Proactive refactoring is paused after the architecture guard pass.
- Reopen preflight, host, or Config work only after a real policy/runtime
  trigger appears.
