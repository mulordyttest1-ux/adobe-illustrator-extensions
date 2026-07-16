# C1: Wedding Postflight Finding Quality Audit

# Pass A - Direction Brief

## Context

- Task: Audit `wedding-cep / Postflight` for finding-quality regressions and decide whether any verified candidate should escalate into `/fix`.
- App or module: `wedding-cep / Postflight` across validator rules, action handoff, and report consumer surfaces
- Trigger: `wedding-cep` postflight UI and lifecycle work is already stable, so the next valuable question is whether finding quality still hides false positives, false negatives, or degraded actionability

## Normalized Request Receipt

- Intent: run an evidence-first postflight audit instead of reopening widget or architecture cleanup
- Route: audit-only `/plan` artifact plus a targeted C2 scope lock only if a candidate reaches `>= 4`
- Goal: identify whether current postflight logic still contains a verified finding-quality bug family worth fixing now
- Success Criteria:
  - one dedicated C1 artifact exists for this audit wave
  - the audit is split into detection fidelity, global/context fidelity, and actionability/report fidelity
  - every candidate ends as `open /fix`, `defer`, or `reject`
  - no speculative postflight refactor or shared/host change is opened
- Scope Guess: `PostflightValidator`, `PostflightAction`, `ValidationReportWidget`, validator rules under `logic/validators/rules`, and existing postflight tests/smoke
- Constraints:
  - no widget-shell or tab-lifecycle cleanup in this wave
  - no shared/domain/host mutation
  - only open `/fix` if symptom, expected vs actual, and evidence are concrete
- Unknowns:
  - whether `SuspiciousDataRule` still suppresses multiple findings inside one frame strongly enough to justify a fix
  - whether global report quality issues are operator-impacting or just wording debt
  - whether selection-read fallback should be treated as a report-quality bug or a separate selection-contract plan
- Approval Needed: none; the user explicitly requested implementation of this audit plan

## Problem Restatement

- `wedding-cep / Postflight` is no longer blocked on UI structure; the main remaining risk is finding quality.
- The most likely failure modes are now:
  - false positives
  - false negatives
  - severity or actionability drift
  - degraded reporting when upstream data quality drops
- The right move is to audit existing green behavior, not to reopen broad validator cleanup.

## Options

### Option 1

- Summary: reopen validator and widget files for cleanup immediately
- Tradeoffs: creates motion quickly, but would violate the evidence-first rule and risks speculative changes

### Option 2

- Summary: run a narrow audit over detection, global/context logic, and report fidelity, then open `/fix` only for candidates that cross threshold
- Tradeoffs: slower to produce code changes, but keeps this wave aligned with the repo stop-line and current maturity

### Option 3

- Summary: stop here and wait for product bugs
- Tradeoffs: safe, but misses the chance to use current test coverage and recent postflight context to proactively validate the highest-value risk family

## Best Practices

- Audit rule families separately instead of treating `PostflightValidator` as one blob.
- Use both current green tests and direct reproductions when a candidate looks suspicious.
- Keep report-consumer concerns separate from detection concerns.
- Only open `/fix` when the validator or action layer clearly behaves differently from the expected operator-facing result.

## Anti-Patterns

- Reopening widget shell/layout concerns during a finding-quality audit.
- Treating technical-message ugliness as a logic bug without operator-impact evidence.
- Pulling bridge, selection contract, or shared domain changes into this wave without a dedicated plan.
- Opening more than one bug family per C2.

## Edge Cases

- A rule can look weak in code review and still remain `defer` if current tests and direct repro do not prove a bug.
- A degraded report-quality issue may matter, but still stay below `/fix` threshold if the operator impact is not yet concrete.
- A candidate can touch selection fallback semantics indirectly; if that implies bridge or selection-contract change, it should not be fixed inline from this wave.

## Counterfactuals

- If the validator already surfaced both suspicious matches inside a single frame, this wave would likely close with `No verified fix candidate`.
- If `SchemaGap` and `UnboundFormData` had overlapped in current tests, that family would have opened as a global-fidelity fix instead.
- If selection-read fallback already surfaced a degraded state to the operator, the report-fidelity slice would likely have no candidate above `defer`.

## Chosen Direction

- Run a three-slice audit only:
  - detection fidelity
  - global/context fidelity
  - actionability/report fidelity
- Keep evidence anchored in current tests, smoke, direct validator reproduction, and code-path inspection.
- Open exactly one C2 scope lock if a candidate reaches `>= 4`.

## Why Other Options Were Rejected

- Option 1 was rejected because current repo state no longer justifies speculative validator or widget cleanup.
- Option 3 was rejected because this seam still has enough policy density to justify one evidence-first audit pass.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_wedding_postflight_finding_quality_audit.md`
- `.task_steps/c2_wedding_postflight_suspicious_multi_match_fix_scope.md` only because one verified candidate crossed the `/fix` threshold during the audit

## Consumers To Verify

- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`

## Execution Slices

### Slice 1

- Goal: audit rule-level detection fidelity for frame warnings and errors
- Files:
  - `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
  - `wedding-cep/cep/js/logic/validators/rules/LeftoverMarkerRule.js`
  - `wedding-cep/cep/js/logic/validators/rules/SuspiciousDataRule.js`
  - `wedding-cep/cep/js/logic/validators/rules/EmptyOverrideRule.js`
  - `wedding-cep/cep/js/logic/validators/rules/TruncationRule.js`
- Validation:
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

#### Findings Matrix - `Detection Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `SuspiciousDataRule` multi-match suppression | A single frame containing both a static phone number and a static date only surfaces one suspicious warning | Expected: each suspicious pattern in the frame should surface as its own finding so the operator sees both problems; Actual: a direct validator reproduction for `Lien he 0912345678 vao 15/09` returns only `SUSPICIOUS_PHONE`, because the rule accumulates `results` but returns `results[0]` | `SuspiciousDataRule.js`, `PostflightValidator.js` | direct validator reproduction returned one warning only; code inspection confirms `return results.length > 0 ? results[0] : null`; current validator tests cover only single suspicious patterns | 4 | open /fix |
| `LeftoverMarkerRule` literal or non-schema braces false positive | Literal braces or non-schema brace content could be flagged as leftover template markers | Expected: only true schema-like leftovers should raise a finding; Actual: regex shape is broad enough to be worth noting, but no runtime symptom or failing evidence was reproduced in current tests/smoke | `LeftoverMarkerRule.js` | code inspection only; baseline postflight smoke still passes expected leftover case | 2 | defer |
| Intended short content flagged by `TruncationRule` | Legitimate short content like initials or abbreviations could be flagged as truncation | Expected: intentional short content should not create warning noise; Actual: the `< 3` heuristic is simplistic, but no concrete false-positive runtime case was reproduced | `TruncationRule.js` | code inspection only; current tests only cover obviously suspicious short outputs such as `Hi` | 2 | defer |
| Empty and truncation overlap creates duplicate noise | Empty outputs might still surface both `EMPTY_OVERRIDE` and `TRUNCATION` for the same frame | Expected: empty frames should only surface the empty warning; Actual: `TruncationRule` already skips blank text, so the overlap was not reproduced | `EmptyOverrideRule.js`, `TruncationRule.js` | static inspection plus current validator test `flags empty and truncated affected frames during render phase` | 1 | reject |

### Slice 2

- Goal: audit global and context-aware findings for overlap, suppression drift, and technical-key leakage
- Files:
  - `wedding-cep/cep/js/logic/validators/rules/SchemaGapRule.js`
  - `wedding-cep/cep/js/logic/validators/rules/UnboundFormDataRule.js`
  - `wedding-cep/cep/js/logic/validators/rules/MissingFieldsRule.js`
  - `wedding-cep/cep/js/logic/validators/support/formKeyScope.js`
  - `wedding-cep/cep/js/logic/validators/support/unboundFieldPolicy.js`
- Validation:
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

#### Findings Matrix - `Global / Context Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `SchemaGap` vs `UnboundFormData` overlap or precedence drift | The same key family could show up as both schema mismatch and missing template binding | Expected: non-schema keys should stay in `SCHEMA_GAP` and schema-backed but unbound keys should stay in `UNBOUND_FORM_DATA`; Actual: `SchemaGapRule` derives from `getFilledFormKeys(...)` then filters keys not in schema, while `UnboundFormDataRule` only considers schema-backed keys via `resolveUnboundFormDataFinding(...)` | `SchemaGapRule.js`, `UnboundFormDataRule.js`, `formKeyScope.js` | code-path inspection plus current validator tests for schema-gap and unbound-form behaviors | 2 | reject |
| Optional date suppression drift (`date.le.nam` / `date.le.namyy` / `date.nhap.*`) | Equivalent or optional date fields could leak into global warnings again | Expected: `nam`/`namyy` coverage stays canonicalized and optional `date.nhap.*` stays suppressed when no template binding exists; Actual: the support policy still canonicalizes and suppresses those families and current tests cover both | `unboundFieldPolicy.js`, `unboundFieldPolicy.test.js` | support tests cover `nam` vs `namyy` equivalence and optional `ngay_nhap` suppression | 2 | reject |
| `MissingFieldsRule` uses raw technical keys in the primary message | Template-phase postflight errors expose raw schema keys directly in the headline, which may reduce operator readability | Expected: primary message should be grouped or phrased for operator action; Actual: the current message interpolates `context.missedKeys.join(', ')` directly | `MissingFieldsRule.js`, `PostflightValidator.test.js` | code inspection plus current validator test `runs MissingFieldsRule only in template phase as a global error` | 3 | defer |
| Internal or UI keys leak back into global findings | UI/helper keys such as `ui.*`, `_idx`, `_auto` could still show up in global postflight output | Expected: internal keys stay suppressed; Actual: `getFilledFormKeys(...)` and the current schema-gap/unbound-form tests still filter them out | `formKeyScope.js`, `SchemaGapRule.js`, `UnboundFormDataRule.js` | code inspection plus existing validator tests asserting `ui.vithu_nam`, `_auto`, and `_idx` do not surface | 2 | reject |

### Slice 3

- Goal: audit whether action and widget layers preserve detection quality and operator actionability
- Files:
  - `wedding-cep/cep/js/actions/PostflightAction.js`
  - `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
  - `wedding-cep/cep/js/components/postflight/widgetGrouping.js`
  - `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- Validation:
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

#### Findings Matrix - `Actionability / Report Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Silent degraded report when `readSelectionObjects()` fails | Postflight falls back to `affectedFrames` when selection read fails, but still returns `{ success: true, report }` without surfacing degraded-state context to the operator | Expected: if broad-scan coverage drops to affected-only, the report should either communicate degraded coverage or be handled through a dedicated selection-contract plan; Actual: `PostflightAction` logs a warning, falls back silently, and still renders a normal report | `PostflightAction.js`, `PostflightAction.test.js` | direct code-path inspection plus current action test `falls back to affectedFrames when reading selection throws` | 3 | defer |
| Actionable id drift between validator output and widget button | A normalized finding could carry the wrong target id into the `Chọn frame` action | Expected: actionable findings should resolve stable frame ids for selection; Actual: widget and smoke coverage still confirm `id || frameId` routing and real selection in Illustrator | `PostflightValidator.js`, `ValidationReportWidget.js` | `ValidationReportWidget.test.js` covers `frameId` fallback; wedding smoke test 15 passed with final selection `['836']` | 2 | reject |
| Technical keys leak into the primary report message instead of remaining in disclosure/details | Operator-facing report copy could still expose technical keys in the main message for grouped findings | Expected: technical keys stay hidden behind the disclosure/details surface unless intentionally expanded; Actual: current widget tests still lock the disclosure behavior | `ValidationReportWidget.js`, `widgetIssueRendering.js` | `ValidationReportWidget.test.js` assertion `keeps technical keys behind a collapsed disclosure` | 2 | reject |
| Severity/grouping drift between validator output and widget presentation | Frame and global findings could be grouped or sorted in a misleading order in the widget | Expected: frame errors remain highest priority and global severity grouping stays stable; Actual: current validator and widget tests still cover ordering and grouping | `PostflightValidator.js`, `widgetGrouping.js`, `ValidationReportWidget.js` | current validator sort-order test plus widget grouping tests and postflight smoke 16-17 | 2 | reject |

## Baseline Evidence

- `npm run test:wedding` -> `314/314`
- `npm run test:smoke:wedding` -> `17/17`

## Validation Plan

- This audit wave is documentation + evidence only, so the baseline commands above are the required validation for the wave.
- Because one candidate reached `>= 4`, the follow-up `/fix` should use:
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`
  - `npm run verify`
  - `npm run check:gates -- --file .task_steps/c2_wedding_postflight_suspicious_multi_match_fix_scope.md`

## Outcome

- Audit status: one verified fix candidate opened
- Open candidate:
  - `SuspiciousDataRule` multi-match suppression
- Deferred candidates:
  - `MissingFieldsRule` raw technical-key wording
  - silent degraded report when selection read falls back to affected-only
  - `LeftoverMarkerRule` and `TruncationRule` heuristic concerns without reproduced runtime symptoms

## Open Risks

- `SuspiciousDataRule` currently under-reports multi-pattern suspicious content inside the same frame until the dedicated `/fix` is executed.
- Postflight still has one degraded-report-quality risk when selection-read fallback silently narrows coverage; this likely needs a separate plan if it ever becomes operator-visible.
- Template-phase `MISSING_FIELDS` copy is still technical and may deserve a later UX/content pass, but it does not yet have evidence strong enough for a logic `/fix`.
