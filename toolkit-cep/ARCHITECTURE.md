# Toolkit CEP Architecture

> Source of truth for `toolkit-cep` runtime architecture, shell contract, and module boundary rules.

## Purpose

- Keep the toolkit shell stable while allowing future `one-click host action` modules to be added without editing the shell.
- Make the panel/runtime/host boundaries explicit before the module catalog grows.
- Prevent drift into ad-hoc buttons, inline `evalScript`, or runtime folder scanning.

## Runtime Truth

1. `cep/index.html` loads `lib/CSInterface.js`, `js/libs/fuse.basic.min.js`, and then `js/bundle.js`.
2. `cep/build.cjs` generates catalog artifacts into `cep/.generated/` before bundling `cep/js/app.js`.
3. `cep/js/app.js` is the only supported panel composition root.
4. `app.js` creates one `ToolkitHostFacade`, one first-class `ToolkitHostRuntime`, one test/debug host surface, and one shell runtime.
5. `app.js` registers `window.__TOOLKIT_TEST_API__` and starts startup boot.
6. `cep/jsx/host.jsx` is a thin ES3-safe entry that delegates to `cep/jsx/bootstrap/toolkitHostBootstrap.jsx`.
7. `ToolkitHostBootstrap.load()` reloads host runtime files from disk, loads `utils.jsx` before parsing any reload payload, then loads the generated module registry and quarantines bad host modules one-by-one without changing the manifest entrypoint.
8. `cep/jsx/runtime/toolkitBridgeRuntime.jsx` owns the operational `ToolkitBridge` methods after bootstrap has loaded utilities and generated host dispatch.
9. `cep/js/bootstrap/startup.js` inspects host runtime health before the panel becomes ready; the host entry is responsible for loading the runtime once when CEP evaluates `ScriptPath`.

## App-Owned Global Contract

Only these app-owned globals are allowed:

- `window.__TOOLKIT_APP_READY__`
- `window.__TOOLKIT_TEST_API__`

Everything else must stay behind imports, injected dependencies, or CEP vendor globals.

## Layer Map

### `cep/js/bootstrap/`

Boot orchestration and readiness state.

- Owns startup flow, DOM readiness, initial focus, and shell assembly.
- Publishes the ready-state contract only.

### `cep/js/infrastructure/`

CEP and host boundaries.

- Owns CEP host access, transport, payload encoding/decoding, and host facade seams.
- Must not absorb shell rendering or module grouping policy.

### `cep/js/features/catalog/`

Generated catalog consumption and search.

- Owns catalog normalization, grouping, and search index behavior.
- Merges host runtime health into panel-visible availability (`enabled`, `status`, `disabledReason`).
- Reads generated artifacts only; must not scan module folders directly at runtime.

### `cep/js/features/run/`

Command execution orchestration.

- Owns metadata precheck, host execution, and feedback shaping.
- Loads optional generated request adapters and prepares their payload once before host execution.
- Reuses the same prepared payload if the host runtime must reload and retry.
- Blocks quarantined modules before the host bridge is called.
- Must not render dashboard layout directly.

### `cep/js/features/shell/`

Operator-facing launcher shell.

- Owns dashboard rendering, result list rendering, keyboard selection state, and DOM event wiring.
- Must not talk directly to CEP or JSX.

### `cep/jsx/`

Illustrator host layer.

- Must remain ES3-compatible.
- `host.jsx` stays intentionally thin and stable.
- `bootstrap/` owns disk-based host runtime loading and reload metadata.
- `runtime/` owns command dispatch, context inspection, and debug fixture helpers for smoke tests.
- Must not duplicate panel-side search or dashboard logic.

### `cep/modules/`

Future plug-in style action units.

- Each module owns `module.json` and `run.jsx`.
- A module may also own an optional panel-side `request.js` exporting
  `prepareRequest({ manifest, services })` when automatic file inspection is
  required before its one-click host action.
- Request adapters receive only narrow injected services; they must not import
  shell or CEP infrastructure.
- Modules are discovered at build time only.
- The shell promise in this app applies only to this module class.
- Text-break family note:
  - `break_text_into_lines`, `break_text_into_words`, and `break_text_into_glyphs` stay as ordinary host-action modules in this safe zone.
  - Point text is the precision lane and should be kept stable without visible placement drift.
  - `Area Text` stays best-effort; split output may be skipped when stable placement cannot be recovered.
  - `Path Text` and threaded text remain explicit module-level skips, not a reason to reopen shell/runtime.

## Module Authoring Flow

Use the scaffolder instead of creating module files by hand.

1. Run `npm run toolkit:new-module` from repo root, or `npm --workspace toolkit-cep run new-module`.
2. Answer the prompted metadata fields in order.
3. The scaffolder creates `modules/<id>/module.json` and `modules/<id>/run.jsx`.
4. The scaffolder immediately runs `build:toolkit` so discovery and generated artifacts fail fast.
5. Edit the placeholder `run.jsx`, then use the normal toolkit reload flow in Illustrator 2026.

## Stable Shell Promise

The shell is considered stable only for:

- one visible panel
- `dashboard + search`
- build-time module discovery
- `one-click host action` modules with metadata-driven precheck

Anything richer than that, such as mini-forms, custom views, or hidden/background helpers, is a new shell capability and must go through planning again.

An optional non-visual request adapter remains inside the one-click contract:
it may select/read a source file and return a payload, but it must not add
module-specific shell DOM or retain mutable runtime state.

## Frozen Shell Zone

The V1 shell is intentionally frozen so normal feature work stays plug-and-play.

- Safe zone for everyday feature work:
  - `cep/modules/**`
  - `cep/debug_scripts/**`
  - toolkit docs and tests
- Frozen zone:
  - `cep/js/**` except build artifacts
  - `cep/jsx/**`
  - `cep/index.html`
  - `cep/css/style.css`
  - `cep/CSXS/manifest.xml`
  - `cep/build.cjs`
  - `cep/scripts/**`
- If a change touches the frozen zone, it is a shell change and must be re-approved before using `TOOLKIT_ALLOW_SHELL_CHANGE=1`.
- Install the native local guard once with `npm run hooks:install`, then the pre-commit hook will block staged frozen-zone edits by default.

## Public Seams

- `ToolkitHostFacade.runCommand({ id, payload })`
- `ToolkitHostFacade.getExecutionContext()`
- `ToolkitRequestServices.pickArtworkFile({ title })`
- `ToolkitRequestServices.readFileBytes(filePath)`
- `ToolkitHostRuntime.reload()`
- `ToolkitHostRuntime.inspect()`
- `ToolkitBridge.runCommand(payloadJson)`
- `ToolkitBridge.inspectContext()`
- `ToolkitBridge.inspectRuntime()`

These seams are the only supported panel-to-host entrypoints.

## Dev Reload Contract

- Panel-side JavaScript remains a single bundle at `cep/js/bundle.js`.
- Host-side JSX stays split into small ES3 files behind one stable entry file: `cep/jsx/host.jsx`.
- The host entry must not parse JSON or touch polyfilled globals before bootstrap has loaded `cep/jsx/utils.jsx`; payload parsing belongs to bootstrap after utilities are present.
- `Toolkit Panel` follows the simple work-panel rule:
  - panel reload is page reload only
  - no in-panel bundle rebuild
  - no smart host-runtime reload during ordinary operator workflow
- `Toolkit Panel (Dev)` follows the same in-panel reload rule:
  - panel reload is page reload only
  - debug port `9099` exists for smoke/debug tooling only
  - no different panel-runtime path is hidden behind the dev wrapper

This keeps JSX edits testable without turning the host layer into one monolithic source file.

## Generated Artifact Contract

`cep/.generated/` is build output only and must stay untracked.

- `module_catalog.js` is the only catalog surface the panel imports.
- `module_request_registry.js` is the generated optional request-adapter map.
- `module_registry.jsx` is the only generated host registry surface.
- `module_dispatch.jsx` is the only generated host dispatch surface.

Do not import modules directly from the shell.

## Quarantine Contract

- One broken `modules/*/run.jsx` must not brick the panel.
- Host bootstrap loads registry entries one-by-one and quarantines failures by `id`.
- Quarantined modules stay visible in dashboard and search, but render disabled with a readable warning reason.
- Disabled/quarantined modules must not cross the host bridge from panel execution flow.

## Validation Contract

### Architecture Guards

- `cep/scripts/check_architecture.cjs` is a developer-only static guard for
  the app composition root, shell/infrastructure boundary, build-time catalog
  contract, module isolation, and app-global writes.
- The guard does not scan `modules/**` at runtime and does not modify source.
- Generated files, vendor files, and test fixtures are excluded from the
  production-boundary checks to avoid false positives.
- The root `npm run check:architecture` command runs the Toolkit guard together
  with the Symbol guard and the existing Wedding dependency check.
- The frozen shell/runtime zone remains frozen; a guard failure must be fixed
  at the boundary or explicitly allowlisted with a filename and reason.

### Everyday Module Verification

- `npm run lint:toolkit`
- `npm run build:toolkit`
- `npm run test:toolkit`
- `npm run test:smoke:toolkit:module -- --module <module-id[,module-id]>`

### Full Smoke Regression

- `npm run test:smoke:toolkit`
- dung lane nay cho frozen-shell change, smoke-harness change, batch closeout, hoac bug dieu tra co tuong tac cheo
- lane nay la stable aggregate regression, khong phai exhaustive catalog cua moi scenario debug sau

### Tooling

- `npm run toolkit:new-module`
- `npm run check:toolkit:shell-freeze`
- `npm run hooks:install`
- `npm run test:smoke:toolkit:scenario -- --scenario <scenario-id[,scenario-id]>`

## Test Lane

- Debug port: `9099`
- Live smoke host: Illustrator 2026 only
