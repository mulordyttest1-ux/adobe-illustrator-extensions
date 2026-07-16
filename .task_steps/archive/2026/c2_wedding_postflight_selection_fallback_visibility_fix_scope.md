## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Surface one operator-visible degraded info finding when `PostflightAction` cannot inspect the full current selection and must fall back to `affectedFrames` only.
- Execution mode: Focused app-local postflight bug fix with action-level regression coverage and one representative smoke lock.

## Files To Modify

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/actions/PostflightAction.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. The fix stays inside `wedding-cep` postflight action/report behavior and does not change bridge payloads, JSX host code, shared libs, or widget layout contracts.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_selection_fallback_visibility_fix_scope.md`

## Notes Before Execution

- Keep `success: true` unchanged when fallback happens; validation still runs, only coverage narrows.
- Surface degraded coverage in the report itself, not via toast.
- Do not reopen widget shell/layout work or bridge selection contracts for this round.

## Symptom

- Expected: when postflight cannot read the full selection and narrows to `affectedFrames`, the operator should still see that the report had reduced coverage.
- Actual: `PostflightAction` silently falls back to `affectedFrames`, returns a normal success report, and broad-scan findings only inspect updated frames with no explicit degraded-state signal.
- Reproduce path:
  - Force `readSelectionObjects()` to return `{ success: false, data: [] }`, `{ success: true, data: [] }`, or throw.
  - Run `PostflightAction.execute(...)`.
  - Observe `success: true` plus a normal-looking report with no global info explaining narrowed coverage.

## Hypotheses

1. The visibility gap lives entirely in `PostflightAction`; validator and widget already support global report-level warnings.
2. The fallback should stay a report concern, not a toast concern, because postflight already has a dedicated report surface.
3. The narrowest safe fix is appending one synthetic global info finding only on fallback paths, leaving the existing validator output intact.

## Isolation

- `PostflightAction.execute(...)` already distinguishes populated selection from fallback but only changes `allFrames`; it does not annotate the report.
- `ValidationReportWidget` already renders global info warnings, so no widget API or layout change is needed to make the degraded state visible.
- Existing smoke already forces the fallback path via `readSelectionObjects = { success: false, data: [] }`, making this regression observable without touching bridge or host code.

## Root Cause

- `PostflightAction` treated selection-read fallback as an internal implementation detail instead of an operator-visible report condition.
- As a result, the report looked fully authoritative even when leftover-marker and suspicious-data coverage had been narrowed to only the updated frames.

## Verification Gate

Claims Verified: Fallback paths in `PostflightAction` now append one global info finding with code `DEGRADED_SELECTION_FALLBACK`; populated full-selection paths stay unchanged; action-level tests cover unsuccessful selection, empty selection, and thrown-read fallback paths; the existing postflight heuristics smoke now proves the degraded info finding appears in the real fallback report alongside leftover, suspicious, and schema-gap findings with `severity: info`.
Evidence Run: `npm run lint:wedding` -> pass; `npm run build:wedding` -> pass; `npm run test:wedding` -> `315/315`; `npm run test:smoke:wedding` -> `17/17`; `npm run verify` -> pass; `npm run check:gates -- --file .task_steps/c2_wedding_postflight_selection_fallback_visibility_fix_scope.md` -> pass.
Remaining Limits: The new degraded fallback message is covered through action tests and one representative smoke path. This round does not add a separate widget-specific assertion for disclosure text rendering beyond the existing report surface contract. CEP smoke should still be run sequentially when possible because concurrent panel reload/build activity can cause unrelated selection-smoke noise.
Unverified But Suspected: none.

## Postmortem

- Root cause confirmed: the fallback existed, but its coverage loss was invisible because the action returned an ordinary report with no degraded-state annotation.
- False hypothesis avoided: this was not a validator bug or a widget rendering gap; both layers already accepted the needed report shape.
- Guardrail that should have existed earlier: any report path that intentionally narrows scan coverage should emit a visible global info finding in the report payload.
