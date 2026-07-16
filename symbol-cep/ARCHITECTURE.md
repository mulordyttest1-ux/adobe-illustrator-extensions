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
- `cep/js/features/imposition/config_renderer.js`
- `cep/js/features/imposition/config_events.js`
- `cep/js/features/imposition/config_pane_renderer.js`
- `cep/js/features/imposition/config_persistence.js`

Contract:

- `config_tab.js` owns the operator-facing config workflow.
- Renderer files own view assembly, not persistence or engine dispatch.
- Persistence stays separate from pane layout and form serialization.
- Internal workflow seams for persistence, config-tab state, event routing, and schema-edit flow now live under `cep/js/features/imposition/preset-config/`.
- Reopen deeper config renderer work only when composition pressure or a real operator workflow trigger appears.

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

- `cep/js/features/imposition/data_store.js`
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

### Main Validation

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm run test:smoke:symbol`

### Focused Regression Checks

- `npm --workspace imposition-panel-cep run test`

Notes:

- Runtime smoke remains the main regression guard for this app.
- Focused unit tests exist in some seams, but they are not a substitute for the real panel/runtime lane.

## Retired Or Non-Entry Surfaces

These surfaces must not be treated as production entrypoints:

- `cep/js/bundle.js` - generated output only
- `cep/debug_scripts/` - smoke/debug surfaces only
- `cep/jsx/debug_host_validation.jsx` - host debug surface only

## Current Remaining Debt

The highest-value remaining debts are:

1. The remaining `Preset / Config` debt is shell/layout composition around `config_pane_renderer.js` and top-level `ConfigTab`, not basic persistence/event/schema-edit workflow separation.
2. `CODEOWNERS` still uses placeholder owner identity and should be updated only when real ownership data exists.
3. Platform / host and preflight should remain trigger-based, not speculative refactor targets.

## Next Phase Guidance

- Keep using milestone-sized changes.
- Prefer bounded-context upgrades over file-level cleanup.
- Treat `Preset / Config` as facade-ready; reopen it only for real composition pressure, policy change, or validation pain.
- Reopen preflight or host work only after a real policy/runtime trigger appears.
