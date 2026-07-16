## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Add a focused live-run smoke matrix for `symbol-cep / ActionTab` so a real preset click now proves happy-path, unsafe-preflight, and engine-failure semantics through `runWithPreset -> preflight -> engine -> postflight/restore`.
- Execution mode: Focused app-local coverage hardening. No runtime contract, host payload, bridge payload, shared-lib, or config-layout changes.

## Files To Modify

- `.task_steps/c2_symbol_live_run_matrix_smoke_scope.md`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `.task_steps/c1_revenue_critical_workflow_hardening_program.md`
- `.task_steps/c1_symbol_live_run_revenue_hardening_audit.md`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.test.mjs`
- `symbol-cep/cep/js/app.js`

## Cross-App Impact

- None. This round only adds `symbol-cep` smoke coverage for the live Action-tab run workflow.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_live_run_matrix_smoke_scope.md`

## Notes Before Execution

- Root cause from the audit: shield asymmetry, not a verified product-logic bug.
- The new smoke lane must use the real Action-tab click path and may monkey-patch panel-side dependencies on the live `actionTab` instance inside each smoke expression.
- Keep the matrix narrow:
  - dropdown-trigger happy path
  - dropdown-trigger unsafe-preflight path
  - dropdown-trigger engine-failure/restore path
- Do not add separate manager-run parity smoke in this round unless the UI trigger path proves divergent.

## Verification Gate

Claims Verified: `symbol-cep` now has a dedicated live-run smoke matrix that clicks a real Action-tab preset and proves happy-path summary retention, unsafe-preflight engine blocking with cleared `lastPostflightSummary`, and engine-failure restore plus operator-visible runtime error handling.
Evidence Run: `npm run lint:symbol` -> pass; `npm run build:symbol` -> pass; `npm --workspace imposition-panel-cep run test` -> `45/45`; `npm run test:smoke:symbol` -> `32/32`; `npm run verify` -> pass.
Remaining Limits: This round hardens dropdown-trigger live-run coverage only. It does not add a separate `manager-run-btn` parity smoke because the selector path converges into the same `handleTrigger(id)` seam, and it does not expand host payload or preset/config renderer coverage.
Unverified But Suspected: none.
