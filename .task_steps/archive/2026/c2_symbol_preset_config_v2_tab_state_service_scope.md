# C2: Symbol Preset Config V2 Tab State Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Preset / Config V2` by moving `ConfigTab` state capture, storage-warning reads, and preset option routing behind a named `preset-config` state service while keeping `config_tab.js` as the operator-facing facade.
- Execution mode: focused runtime refactor inside `symbol-cep` config tab shell only

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/config_persistence.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configTabStateService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configTabStateService.test.mjs`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/config_events.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. This round stays inside `symbol-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_preset_config_v2_tab_state_service_scope.md`

## Notes Before Execution

- Keep `ConfigTab` public behavior and event wiring stable.
- Do not widen this round into `config_pane_renderer.js`, host/bridge code, or preset storage format changes.
- This round is valid only if it creates a testable `ConfigTab` shell/state seam rather than a cosmetic helper split.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Preset / Config V2` config-tab shell only, centered on moving state capture, preset option routing, and storage-warning reads behind `preset-config/configTabStateService.js` while keeping `config_tab.js` as the operator-facing facade.
Top Risks: the state-service move could silently break draft reset behavior, preset meta restore, or degraded-storage rendering; changing `ConfigTab` shell behavior would show up in smoke before unit tests if facade wiring drifted.
Required Fixes: keep `ConfigTab.init(...)`, `render()`, and `resetDraft()` behavior stable; keep storage warning and preset option routing equivalent; add direct tests for state capture/restore and warning/option markup.
No Blocking Findings: Yes. This round strengthens the same `Preset / Config V2` island without widening into renderer internals or host boundaries.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `config_tab.js` now delegates state capture, state normalization, storage warning reads, and preset option markup to `preset-config/configTabStateService.js`; `ConfigTab` remains the operator-facing facade; `ConfigPersistence` gained the minimal `saveLastActive(...)` pass-through needed to remove the last direct draft-reset dependency; symbol lint, build, focused tests, smoke, and repo verify all pass.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`
Remaining Limits: `config_tab.js` still owns render shell composition and modal flow directly; pane layout/render policy still lives in `config_pane_renderer.js`; no route-doc updates were made in this runtime round.
Unverified But Suspected: none
