# C2: Symbol Preset Config V2 Event Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Preset / Config V2` by moving config-tab event workflow dispatch behind a named `preset-config` event service while keeping `config_events.js` as the listener-binding facade.
- Execution mode: focused runtime refactor inside `symbol-cep` config event workflow only

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_events.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configEventService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configEventService.test.mjs`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. This round stays inside `symbol-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_preset_config_v2_event_service_scope.md`

## Notes Before Execution

- Keep `ConfigEvents.bindEvents(...)` as the public event-binding surface.
- Do not widen this round into pane renderer work, host/bridge code, or storage format changes.
- This round is valid only if it creates a testable event workflow seam rather than a cosmetic event wrapper.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Preset / Config V2` config event workflow only, centered on moving click/change/submit dispatch behind `preset-config/configEventService.js` while keeping `config_events.js` as the listener-binding facade.
Top Risks: the event-service move could silently break draft reset, preset load, modal actions, or dry-run dispatch; changing listener-binding behavior would show up as runtime regressions in config-tab smoke flows even if unit tests passed.
Required Fixes: keep `ConfigEvents.bindEvents(...)` as the public entry; keep submit/change/click routing behavior stable; add direct tests for submit, dropdown change, and config-button click workflow.
No Blocking Findings: Yes. This round creates a real event workflow seam inside the same `Preset / Config V2` island without widening into renderer or host code.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `config_events.js` now acts as a listener-binding facade over `preset-config/configEventService.js`; submit/change/click workflow dispatch has direct tests; draft reset, preset load, modal actions, and dry-run still pass symbol smoke; full symbol lint/build/focused tests and repo verify remain green.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`
Remaining Limits: `ConfigTab` still owns render-shell markup and modal composition directly; `config_pane_renderer.js` remains the larger layout/render seam; route docs were not updated in this runtime round.
Unverified But Suspected: none
