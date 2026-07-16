## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Close the postflight regression-coverage gap by locking `SCHEMA_GAP + UNBOUND_FORM_DATA` parity in one mixed render-phase validator test and one dedicated panel smoke.
- Execution mode: Focused test-only fix inside `wedding-cep / Postflight`; no runtime behavior or validator logic changes.

## Files To Modify

- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/logic/validators/rules/SchemaGapRule.js`
- `wedding-cep/cep/js/logic/validators/rules/UnboundFormDataRule.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `.task_steps/c1_wedding_postflight_schema_gap_unbound_overlap_audit.md`

## Cross-App Impact

- None. This is app-local coverage hardening for `wedding-cep` postflight and does not change shared libs, bridge contracts, JSX host code, or runtime widget behavior.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_unbound_smoke_parity_fix_scope.md`

## Notes Before Execution

- Root cause from the audit: coverage gap, not product logic bug.
- Keep the current heuristics smoke unchanged; the new parity coverage must live in a dedicated smoke test.
- CEP smoke should be run sequentially. If readiness flakes recur, treat that as environment instability unless the new parity assertions themselves fail.

## Symptom

- Expected: panel-level smoke should explicitly prove that `SCHEMA_GAP` and `UNBOUND_FORM_DATA` can coexist in the same render-phase report without collapsing, leaking keys, or accidentally dragging in fallback noise.
- Actual: existing validator coverage proves the two rule families are logically separate, but current smoke only locks `SCHEMA_GAP` inside a noisy heuristics path and does not explicitly assert `UNBOUND_FORM_DATA` or the mixed scenario.

## Hypotheses

1. A focused validator regression can codify the audit repro without changing runtime logic.
2. A dedicated smoke test is the cleanest way to lock global-warning parity without polluting the existing heuristics smoke.
3. The mixed scenario should avoid `DEGRADED_SELECTION_FALLBACK` entirely by returning a populated selection result from the fake bridge.

## Isolation

- The audit already proved no verified overlap bug exists in `SchemaGapRule` or `UnboundFormDataRule`; the remaining gap is observability in panel smoke.
- `ValidationReportWidget` only consumes the warnings; it does not own the separation logic between `SCHEMA_GAP` and `UNBOUND_FORM_DATA`.
- Existing postflight heuristics smoke intentionally mixes leftover, suspicious, schema-gap, and degraded fallback, making it the wrong seam for clean parity assertions.

## Root Cause

- Regression coverage stopped one layer short of the mixed global-warning scenario. Unit tests covered `SCHEMA_GAP` and `UNBOUND_FORM_DATA` independently, but panel smoke never proved they stay separated together in the same report.

## Verification Gate

Claims Verified: One new validator regression now locks the mixed render-phase scenario where `SCHEMA_GAP` and `UNBOUND_FORM_DATA` coexist; one new dedicated postflight smoke asserts the same panel-level parity without degraded fallback noise; no runtime validator, action, widget, bridge, or schema logic changed.
Evidence Run: `npm run lint:wedding` -> pass; `npm run build:wedding` -> pass; `npm run test:wedding` -> `316/316`; `npm run test:smoke:wedding` -> `18/18`; `npm run verify` -> pass; `npm run check:gates -- --file .task_steps/c2_wedding_postflight_unbound_smoke_parity_fix_scope.md` -> pass.
Remaining Limits: This fix raises regression confidence for the mixed global-warning scenario only. It does not broaden smoke around template-phase `MISSING_FIELDS`, and CEP readiness can still flake independently of these assertions even though this run was stable.
Unverified But Suspected: none.

## Postmortem

- Root cause confirmed: this was a missing regression surface, not a product logic defect.
- False path avoided: reopening `SchemaGapRule`, `UnboundFormDataRule`, or widget grouping would have been speculative and unnecessary.
- Guardrail added: future postflight audit candidates that are rejected as “logic already correct” can still graduate into a coverage-hardening `/fix` when panel smoke is asymmetric.
