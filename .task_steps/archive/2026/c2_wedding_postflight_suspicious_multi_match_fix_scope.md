## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Surface every suspicious-data finding present in the same frame instead of dropping later matches after the first warning.
- Execution mode: Focused app-local bug fix with validator regression coverage and one representative same-frame smoke probe.

## Files To Modify

- `wedding-cep/cep/js/logic/validators/rules/SuspiciousDataRule.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/PROJECT_STATUS.md`

## Cross-App Impact

- None. The candidate is fully app-local inside `wedding-cep` validator rules and does not touch shared libs, JSX host code, or bridge payloads.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_suspicious_multi_match_fix_scope.md`

## Notes Before Execution

- Keep current suspicious-data heuristics unchanged; this fix is about surfacing all matching findings, not retuning phone/date detection.
- Do not widen scope into `PostflightAction`, widget layout, or shared validation support.
- If the validator and widget already accept arrays from rule results, prefer the narrowest rule-level change.

## Symptom

- Expected: when one frame contains multiple suspicious static patterns, postflight should surface each suspicious finding so the operator can fix all issues in that frame.
- Actual: a frame such as `Lien he 0912345678 vao 15/09` only produces one warning (`SUSPICIOUS_PHONE`) even though the same frame also contains a static date that should trigger `SUSPICIOUS_STATIC_DATE`.
- Reproduce path:
  - Instantiate `PostflightValidator`
  - Call `inspect([], [{ id: 'frame-multi', text: 'Lien he 0912345678 vao 15/09' }], { phase: 'render' })`
  - Observe only one warning in the returned report

## Hypotheses

1. `SuspiciousDataRule` is the narrow root cause because it accumulates matches but returns only the first result.
2. `PostflightValidator` is not the suppressor because it already normalizes arrays from rules in `_runRules(...)`.
3. Existing tests missed this bug because they only cover one suspicious family per frame.

## Isolation

- Direct validator reproduction returned one warning only for a frame containing both a phone number and a static date.
- `SuspiciousDataRule.validate(...)` pushes multiple findings into `results` but ends with `return results.length > 0 ? results[0] : null`.
- `PostflightValidator._runRules(...)` already handles either a single finding or an array, so no validator-level refactor is needed to surface multiple findings from one rule.

## Root Cause

- `SuspiciousDataRule` was written to detect multiple suspicious patterns inside the same frame, but its final return statement collapses the collected array down to the first item.
- Because the rule never returns the later matches, postflight under-reports suspicious content whenever more than one suspicious pattern appears in the same frame.

## Verification Gate

Claims Verified: `SuspiciousDataRule` now surfaces both same-frame suspicious findings instead of dropping later matches; the validator regression covers the same-frame multi-match case; the existing postflight heuristics smoke now proves the panel returns `SUSPICIOUS_STATIC_DATE`, `SUSPICIOUS_PHONE`, and `SCHEMA_GAP` together without changing leftover-marker or action-button behavior.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding` -> `315/315`; `npm run test:smoke:wedding` -> `17/17`; `npm run verify`.
Remaining Limits: Smoke covers one representative same-frame multi-match path through the existing postflight heuristics test. It does not add a separate widget-level assertion for warning ordering, and order is intentionally not part of the contract.
Unverified But Suspected: If future suspicious-data heuristics add more families beyond phone and static date, the same rule-level array contract should hold, but those future families would still need their own direct regression coverage.

## Postmortem

- Root cause confirmed: the rule's return contract did not match its multi-result collection logic, so later suspicious matches in the same frame were never surfaced.
- False hypotheses avoided by the audit:
  - `PostflightValidator` deduplication might be collapsing separate suspicious findings from the same frame.
  - `ValidationReportWidget` might only render the first warning from a frame.
- Guardrail that should have caught this earlier: one validator test plus one representative smoke probe covering a single frame with both phone and static-date suspicious content.
