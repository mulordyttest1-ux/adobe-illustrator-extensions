# C1: Wedding Postflight `SchemaGap` vs `UnboundFormData` Overlap Audit

# Pass A - Direction Brief

## Context

- Task: audit `wedding-cep / Postflight` for overlap, misbucketing, and operator-noise between `SCHEMA_GAP` and `UNBOUND_FORM_DATA`.
- App or module: `wedding-cep / Postflight` across validator rules, support policy, and report consumer surfaces.
- Trigger: `PostflightValidator` emits both rule families as global warnings, and the widget groups them by severity only. If one underlying problem can surface through both rules, the operator will see both.

## Normalized Request Receipt

- Intent: run an evidence-first overlap audit, not a validator refactor.
- Route: audit-only `C1`, open `C2` only if a verified overlap candidate reaches `>= 4`.
- Goal: determine whether render-phase global warnings are overlapping, misbucketed, or noisy enough to justify a follow-up `/fix`.
- Success Criteria:
  - one C1 artifact exists for this audit wave
  - the audit is split into rule-boundary fidelity, suppression/canonicalization fidelity, and report/actionability fidelity
  - every candidate ends as `open /fix`, `defer`, or `reject`
  - no speculative widget, bridge, or shared cleanup is opened
- Constraints:
  - stay inside `wedding-cep / Postflight`
  - do not touch shared libs, bridge payloads, JSX host code, or widget shell/layout
  - do not reopen `MissingFieldsRule` unless it proves to participate in the same operator-facing overlap problem

## Problem Restatement

- `SchemaGapRule` and `UnboundFormDataRule` are both render-phase global warnings.
- `PostflightValidator` deduplicates by `dedupeKey`, not by operator problem family.
- `ValidationReportWidget` groups global issues by severity only, not by source rule.
- Therefore the important question is not "are there two global warnings?", but:
  - can the same technical key surface through both rules?
  - can one rule leak keys that belong to the other?
  - do mixed scenarios become misleading at the report layer?

## Chosen Direction

- Run three audit slices only:
  - rule-boundary fidelity
  - suppression/canonicalization fidelity
  - report/actionability fidelity
- Use direct validator reproductions plus current unit/smoke coverage as the source of truth.
- Only open `/fix` if one verified overlap or precedence bug crosses the score threshold.

# Pass B - Implementation Evidence

## Baseline Evidence

- `npm run test:wedding` -> `315/315`
- `npm run test:smoke:wedding`
  - session result: `Readiness timeout after 15000ms` while panel stayed in `phase: bridge`
  - interpretation: environment-side CEP readiness issue, not a reproduced overlap failure
  - last known green smoke baseline for this app before this audit remained `17/17`

## Direct Reproductions

### Repro 1 - Non-schema filled key only

- Input:
  - `formData = { 'bride.name': 'Alice', 'unknownKey': 'foo' }`
  - `schemaKeys = ['bride.name']`
- Result:
  - exactly one warning: `SCHEMA_GAP`
  - no `UNBOUND_FORM_DATA`

### Repro 2 - Schema-backed unbound key only

- Input:
  - `formData = { 'venue.ten': 'Sanh Vang' }`
  - `schemaKeys = ['venue.ten']`
  - `templateBindings = ['pos1.ong']`
- Result:
  - exactly one warning: `UNBOUND_FORM_DATA`
  - `technicalKeys = ['venue.ten']`
  - no `SCHEMA_GAP`

### Repro 3 - Mixed scenario with both families present

- Input:
  - `formData = { 'venue.ten': 'Sanh Vang', 'unknownKey': 'foo' }`
  - `schemaKeys = ['venue.ten']`
  - `templateBindings = ['pos1.ong']`
- Result:
  - two warnings:
    - `SCHEMA_GAP` for `unknownKey`
    - `UNBOUND_FORM_DATA` for `venue.ten`
  - no shared technical key between the two findings

## Findings Matrix - Slice A: Rule-Boundary Fidelity

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Same technical key can surface as both `SCHEMA_GAP` and `UNBOUND_FORM_DATA` | One underlying form key would produce two global warnings | Expected: a key should belong to exactly one family; Actual: direct mixed reproduction showed `unknownKey` only in `SCHEMA_GAP` and `venue.ten` only in `UNBOUND_FORM_DATA` | `SchemaGapRule.js`, `UnboundFormDataRule.js`, `PostflightValidator.js` | direct reproductions 1-3 plus rule inspection | 2 | reject |
| Schema-backed keys are misbucketed into `SCHEMA_GAP` | Valid schema key with missing template binding shows as schema mismatch | Expected: schema-backed unbound keys stay in `UNBOUND_FORM_DATA`; Actual: schema-backed reproduction produced only `UNBOUND_FORM_DATA` | `SchemaGapRule.js`, `formKeyScope.js` | direct reproduction 2 | 2 | reject |
| Non-schema keys leak into `UNBOUND_FORM_DATA` | Unknown form key appears in binding-warning flow | Expected: non-schema keys stay in `SCHEMA_GAP`; Actual: non-schema reproduction produced only `SCHEMA_GAP` | `UnboundFormDataRule.js`, `unboundFieldPolicy.js` | direct reproduction 1 | 2 | reject |
| Mixed scenarios produce duplicate warnings for one operator problem | Two global warnings would describe the same underlying issue with different labels | Expected: mixed scenarios should surface only distinct problem families; Actual: mixed reproduction produced two distinct warnings with different keys and different messages | `PostflightValidator.js`, `SchemaGapRule.js`, `UnboundFormDataRule.js` | direct reproduction 3 | 2 | reject |

## Findings Matrix - Slice B: Suppression / Canonicalization Fidelity

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `ui.*`, `_idx`, `_auto` keys re-enter either warning family | Internal helper keys leak back into global postflight warnings | Expected: internal keys remain filtered; Actual: `getFilledFormKeys(...)` still filters them and current validator tests assert they do not surface | `formKeyScope.js`, `PostflightValidator.test.js` | existing tests for schema-gap and unbound warnings | 2 | reject |
| Ignored keys like `ceremony.host_type` / `ceremony.diachi` drift into unbound findings | Ceremony-only controls show as missing bindings | Expected: ignored keys remain suppressed; Actual: support tests still suppress them and keep only actionable venue fields | `unboundFieldPolicy.js`, `unboundFieldPolicy.test.js` | current support test coverage | 2 | reject |
| `date.nhap.*` suppression is over- or under-applied | Optional `date.nhap` keys show up when no matching binding family exists, or get hidden when they should be shown | Expected: optional `date.nhap.*` remains suppressed under current policy; Actual: support tests still confirm suppression behavior | `unboundFieldPolicy.js`, `unboundFieldPolicy.test.js` | current support test coverage | 2 | reject |
| `date.le.nam` vs `date.le.namyy` canonicalization causes duplicate or missing warnings | Equivalent year fields produce duplicate or mismatched global warnings | Expected: year-field coverage collapses to one user-facing field; Actual: support tests still canonicalize them into one finding family | `unboundFieldPolicy.js`, `unboundFieldPolicy.test.js` | current support test coverage | 2 | reject |

## Findings Matrix - Slice C: Report / Actionability Fidelity

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Report layer collapses or muddles the two warning families | Global warnings become ambiguous once rendered together | Expected: schema mismatch and missing binding should remain distinguishable in primary copy; Actual: direct reproductions show clearly distinct messages, and widget tests confirm details/technical keys stay behind disclosure | `ValidationReportWidget.js`, `widgetGrouping.js`, `widgetIssueRendering.js` | direct reproductions 1-3 plus widget tests | 2 | reject |
| Widget grouping by severity only hides overlap problems | Two overlapping global warnings would be merged or misgrouped | Expected: if there is a true overlap, the widget should at least preserve both findings; Actual: widget groups globals by severity only, but because no true overlap was reproduced this remains a constraint, not a current bug | `widgetGrouping.js`, `ValidationReportWidget.test.js` | code-path inspection plus grouping tests | 2 | reject |
| Smoke does not explicitly lock `UNBOUND_FORM_DATA` or a mixed overlap scenario | Regression could slip in without panel-level coverage | Expected: smoke would prove both global warning families separately; Actual: current smoke explicitly checks `SCHEMA_GAP` only and does not assert `UNBOUND_FORM_DATA` or mixed render-phase overlap | `postflight_smoke_tests.cjs` | grep over current smoke + test coverage | 2 | defer |
| `MissingFieldsRule` participates in the same overlap family | Template-phase missing-fields errors collide with render-phase global warnings | Expected: out of scope unless proven; Actual: current tests show `MISSING_FIELDS` stays template-phase only and does not participate in render-phase overlap | `MissingFieldsRule.js`, `PostflightValidator.test.js` | current validator tests | 1 | reject |

## Outcome

- Audit status: `No verified fix candidate`
- Open `/fix`: none
- Deferred only:
  - add panel-smoke parity for `UNBOUND_FORM_DATA` and one mixed render-phase overlap scenario if we want stronger regression coverage later

## Open Risks

- The current separation between `SCHEMA_GAP` and `UNBOUND_FORM_DATA` depends on upstream `schemaKeys` and `templateBindings` being produced correctly. If future evidence shows those inputs drift before postflight, that would require a separate `/plan`, not an inline postflight-rule fix.
- Panel-level smoke coverage is still asymmetric: `SCHEMA_GAP` is locked, but `UNBOUND_FORM_DATA` and mixed overlap scenarios are not yet explicitly asserted end to end.
