## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `symbol-cep` keeps its run pipeline inside `ActionTab`, so the same file owns preset search/manage UI and the preflight/engine/postflight execution lifecycle. That makes engine-path changes harder to unit-test and easier to drift from smoke/debug wrappers.
- Goal: Extract the imposition execution lifecycle into a local service seam while keeping `ActionTab` as the public UI entry surface and preserving the existing debug/smoke wrappers.
- Non-goals: Do not change preset list/search UI, do not move logic into the bridge transport layer, and do not change postflight summary or engine payload contracts.

## Scope Lock

- Summary: Refactor `symbol-cep` `Engine / Execution` so `ActionTab` delegates preflight, engine dispatch, postflight handling, and auto-group restore to a local runtime service.
- Execution mode: Focused single-app refactor inside `symbol-cep/cep/js/features/imposition`; preserve wrapper methods used by app debug and smoke tests.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.test.mjs`

## Consumers Verified

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. The change stays inside `symbol-cep` `Engine / Execution` and does not touch shared libs or `wedding-cep`.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_action_run_support_scope.md`

## Notes Before Execution

- Keep `ActionTab` wrapper methods `_runPreflight`, `_handleEngineFailure`, `_handleEngineSuccess`, and `_restoreAutoGrouping` callable because app debug and smoke tests use them.
- Preserve exact host script shapes for engine dispatch and auto-group restore.
- Keep bridge transport thin; the new service remains panel-side JS under `cep/js`.

## Implementation Note

- Added `imposition_run_service.js` as the local execution seam for preset rule compilation, preflight orchestration, engine dispatch, postflight completion handling, and auto-group restore.
- Kept `ActionTab` as the public UI surface. Its existing runtime wrappers now delegate into the new service so `app.js` debug helpers and smoke assertions remain valid.
- Added `imposition_run_service.test.mjs` to lock the exact engine dispatch script shape, preflight short-circuit behavior, invalid host payload fallback, postflight warning path, and auto-group restore script shape.

## Review Gate

Scope Reviewed: `symbol-cep` engine execution seam only, limited to `ActionTab`, the new local run service, and its unit tests.
Top Risks: breaking debug/smoke wrappers on `ActionTab`, drifting the engine or restore bridge script shapes, or accidentally moving runtime logic into the transport boundary.
Required Fixes: none after implementation; the final patch kept `ActionTab` wrappers intact and preserved bridge call shapes.
No Blocking Findings: yes; self-review found no drift into config/search UI and no cross-app or shared-lib impact.
Validation Rerun Needed: yes; reran `lint:symbol`, workspace unit tests, `build:symbol`, `test:smoke:symbol`, and `verify` on the final patch.

## Verification Gate

Claims Verified: `ActionTab` now delegates execution lifecycle work to a local service seam, the legacy wrapper surface still works for app debug and smoke paths, and engine/postflight/restore behavior stayed contract-compatible.
Evidence Run: `npm --workspace imposition-panel-cep run test`; `npm run lint:symbol`; `npm run build:symbol`; `npm run test:smoke:symbol`; `npm run verify`.
Remaining Limits: unit coverage is focused on the execution lifecycle seam itself; list/search/manage UI still relies on existing smoke coverage rather than new direct unit tests.
Unverified But Suspected: none.

## Postmortem

- Outcome: success. This was the highest-ROI local seam in `symbol-cep` because it separated execution lifecycle logic from preset-browsing UI without widening scope into bridge transport or config rendering.
- Architecture signal: `ActionTab` is now closer to a UI entry surface, while engine/preflight/postflight policy is readable in one local service file with direct unit tests.
- Continuation signal: do not open another symbol refactor round unless there is a fresh runtime trigger; the next obvious large files are lower-ROI or explicitly deferred by the continuation rubric.
