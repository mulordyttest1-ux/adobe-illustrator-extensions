# C1: Wedding Template Authoring Revenue Hardening Audit

# Pass A - Direction Brief

## Context

- Task: audit `wedding-cep / Template Authoring` as Wave 2 of the revenue-critical workflow hardening program and decide whether to open a focused `/fix` or a coverage-hardening follow-up.
- App or module: `wedding-cep / Template Authoring`
- Trigger: `Document Sync` is already shielded, while `Template Authoring` still sits on high-blast schema injection paths that can poison live artwork.

## Normalized Request Receipt

- Intent: harden the next most expensive `wedding` workflow before shifting attention to `symbol`.
- Route: audit-first with challenger/skeptic review, then immediate promotion to one C2 if a verified bug survives.
- Goal: prove whether `Template Authoring` currently contains a real workflow bug or only missing panel-side shields.
- Success Criteria:
  - one dedicated C1 exists for the Wave 2 audit
  - the audit covers required-field guardrails, auto/manual live parity, and clone/infer shield gaps
  - each candidate ends as `open /fix`, `defer`, or `reject`
  - if Slice A is a real app-local bug, one focused C2 opens immediately
- Scope Guess:
  - `InjectSchemaAction`, `ManualInjectAction`
  - `template-authoring/*`
  - `SchemaInjector`
  - `schema_smoke_tests.cjs`
- Constraints:
  - no `libs/shared`, `libs/wedding/domain`, `.jsx`, or bridge payload changes
  - no speculative `SchemaInjector` cleanup
  - one writer
- Unknowns:
  - whether `missedRequired` is a dead contract or a missing policy source
  - whether the strongest remaining risks are logic bugs or panel-shield gaps
  - whether `bulk` / `dateClone` need fixes now or only smoke parity
- Approval Needed: none; the user explicitly requested Wave 2 execution.

## Problem Restatement

- `Template Authoring` is structurally facade-ready, but that does not guarantee the actual schema injection workflow is safe enough for paid work.
- The operator still depends on auto-inject and manual inject to shape live invitation templates, and regressions there can damage real files before they are caught.
- The key question is whether the next high-ROI move is a real bug fix or more adversarial shielding.

## Options

### Option 1

- Summary: treat current unit coverage and schema smoke as sufficient and move on to `symbol`.
- Tradeoffs: cheapest short-term, but leaves a money-critical `wedding` workflow under-shielded.

### Option 2

- Summary: audit the workflow in revenue terms and promote the strongest verified candidate into a focused C2.
- Tradeoffs: more work now, but aligns with the user's requirement that the agent, not the user, should catch the next costly bug.

### Option 3

- Summary: reopen `SchemaInjector` broadly for cleanup before hardening the live workflow.
- Tradeoffs: violates the current stop-line and increases code motion without directly improving operator safety.

## Best Practices

- Audit the live action path first, then drill into `SchemaInjector` only where the action contract proves it matters.
- Treat unit coverage as evidence, not as a replacement for panel-side smoke.
- Reuse repo-native policy that already exists in history or current code; do not invent new required-field metadata in this wave.
- Keep one C2 focused on one bug family.

## Anti-Patterns

- Reopening `SchemaInjector` just because it is still the dense core.
- Turning every smoke gap into a logic bug.
- Changing host fixtures or bridge payloads just to make Wave 2 convenient.
- Bundling the required-field bug and manual bulk mismatch into one C2.

## Edge Cases

- `Template Authoring` can still be in a bad state even when unit seams are green if the live action contract is dead.
- A historical policy can remain valid even when the current implementation dropped it during later parser work.
- A verified secondary bug can be deferred if Wave 2 already has one stronger fix and one writer.

## Counterfactuals

- If `missedRequired` still had a live producer path, Wave 2 would likely end as coverage hardening around bulk/date-clone smoke.
- If required-field logic needed new schema metadata, this wave would stop at `/plan` instead of opening a fix.
- If schema smoke already covered auto happy-path and manual bulk/date-clone, the strongest remaining candidate would likely be the mixed-host-side inference risk.

## Chosen Direction

- Use Option 2.
- Audit the workflow in three slices:
  - required-field guardrail viability
  - auto/manual live parity
  - adversarial clone/infer shield
- Promote Slice A into one focused `/fix` because the real producer contract is currently dead and repo history already contains the policy source.

## Why Other Options Were Rejected

- Option 1 was rejected because the user explicitly does not want paid-work bugs to be discovered manually.
- Option 3 was rejected because the current repo stop-line prefers workflow fixes and shields over more architecture work.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_wedding_template_authoring_revenue_hardening_audit.md`
- `.task_steps/c2_wedding_template_authoring_required_fields_guardrail_fix_scope.md`
- `wedding-cep/cep/js/logic/schema/SchemaInjector.js`
- `wedding-cep/cep/js/logic/schema/SchemaInjector.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`

## Consumers To Verify

- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`
- `wedding-cep/cep/js/logic/validators/rules/MissingFieldsRule.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`

## Execution Slices

### Slice 1

- Goal: verify whether required-field reporting is a real producer bug or only a dead unused contract.
- Files:
  - `wedding-cep/cep/js/logic/schema/SchemaInjector.js`
  - `wedding-cep/cep/js/actions/InjectSchemaAction.js`
  - `wedding-cep/cep/js/logic/validators/rules/MissingFieldsRule.js`
  - `wedding-cep/cep/js/logic/pipeline/validator.js`
- Validation:
  - current `wedding` unit baseline
  - code-path inspection
  - repo history check

#### Findings Matrix - `Required-Field Guardrail Viability`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `missedRequired` producer is dead | Auto inject can never raise template-phase missing-field guardrails through the real producer path | Expected: `SchemaInjector.computeChanges(...)` can populate `missedRequired`, which `InjectSchemaAction` toasts and forwards into `MissingFieldsRule`; Actual: current producer path hard-codes `missedRequired = []`, while downstream consumers and history prove the contract is real | `SchemaInjector.js`, `InjectSchemaAction.js`, `MissingFieldsRule.js`, `validator.js` | current source inspection, `fb603b8` history showing prior `REQUIRED` policy, action/postflight tests proving downstream consumption | 5 | open /fix |
| Required-field policy source missing entirely | Slice A would need new metadata or a new required-field system to fix | Expected: repo-native policy source already exists; Actual: current schema file has no `required` flags, but repo history and existing validator rules provide an app-local source, so a new system is not required | `schema.json`, `validator.js`, `SchemaInjector.js` | schema inspection plus historical `SchemaInjector` implementation | 2 | reject |

### Slice 2

- Goal: audit operator-visible parity between auto and manual flows.
- Files:
  - `wedding-cep/cep/js/actions/InjectSchemaAction.js`
  - `wedding-cep/cep/js/actions/ManualInjectAction.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectionPlanner.js`
  - `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`
- Validation:
  - action tests
  - planner tests
  - schema smoke inspection

#### Findings Matrix - `Auto / Manual Live Parity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Bulk inject operator contract mismatch | UI copy says top-down selection order is `Đ/C -> Ông -> Bà -> Ông Bà`, but the real planner maps `Ông Bà -> Ông -> Bà -> Đ/C` | Expected: operator-facing copy and planner mapping agree; Actual: config/warning copy drift from the planner implementation and tests | `schemaTabConfig.js`, `ManualInjectAction.js`, `manualInjectionPlanner.js` | config copy, warning copy, planner code, planner tests, challenger repro | 5 | defer |
| Auto inject happy-path lacks panel smoke | The live auto path still has no dedicated smoke for a normal multi-frame success path | Expected: at least one panel-side smoke proves real button wiring and postflight handoff; Actual: current schema smoke focuses on UI render, parser priority, and orphan selection | `schema_smoke_tests.cjs` | smoke suite inspection | 3 | defer |
| Auto no-op info branch lacks explicit regression | The info-toast branch exists but is not locked directly in action-level tests | Expected: no-op branch should be explicitly asserted; Actual: current action tests cover read/apply failures and orphan/missedRequired behavior, but not the info no-op branch | `InjectSchemaAction.js`, `InjectSchemaAction.test.js` | source inspection and current tests | 3 | defer |
| Orphan selection drift after auto inject | Auto inject could select the wrong frame after narrowing to orphans | Expected: orphan frame id stays stable through real selection; Actual: schema smoke already proves this path end-to-end | `InjectSchemaAction.js`, `schema_smoke_tests.cjs` | existing real Illustrator smoke | 2 | reject |

### Slice 3

- Goal: audit remaining high-blast clone/infer risks without reopening broad cleanup.
- Files:
  - `wedding-cep/cep/js/logic/schema/SchemaInjector.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectionPlanner.js`
  - `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`
- Validation:
  - planner tests
  - schema smoke inspection
  - challenger review

#### Findings Matrix - `Adversarial Clone / Infer Shield`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Mixed host-side inference can mis-map `vithu` across one selection | One global `hostSide` can be overwritten while scanning frames, then reused for all `Trưởng/Thứ/Út/Quý` replacements | Expected: side inference should be safe across mixed selections or explicitly shielded; Actual: current parser path uses one global `hostSide`, with no direct repro in checked-in tests yet | `SchemaInjector.js`, `EventInfoParser.js` | challenger review plus source inspection | 4 | defer |
| Date-clone `le/nhap` policy is still protected only by unit tests | Clone behavior can regress again without a dedicated smoke lane | Expected: at least one live schema smoke should lock date-clone policy; Actual: planner tests are strong, but schema smoke does not own a dedicated clone receipt yet | `manualInjectionPlanner.js`, `manualInjectionPlanner.test.js`, `schema_smoke_tests.cjs` | planner tests plus prior clone receipt limit | 3 | defer |

## Baseline Evidence

- Carried-in baseline before Wave 2:
  - `npm run test:wedding` -> `316/316`
  - `npm run test:smoke:wedding` -> `21/21`
  - `npm run verify` -> green
- Read-only challenger and skeptic passes both converged on Slice A as a real candidate and on manual bulk/date-clone smoke as the strongest remaining shield gap.

## Validation Plan

- Open exactly one C2 in this round:
  - `c2_wedding_template_authoring_required_fields_guardrail_fix_scope.md`
- Rerun the full `wedding` lane after the fix:
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`
  - `npm run verify`
  - `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_required_fields_guardrail_fix_scope.md`

## Outcome

- Audit status: verified runtime bug candidate in Slice A
- Open follow-up:
  - `c2_wedding_template_authoring_required_fields_guardrail_fix_scope.md`
- Deferred:
  - bulk inject operator contract mismatch
  - auto happy-path and date-clone smoke parity
  - mixed-side `vithu` inference risk

## Open Risks

- Slice A is fixed in this round, but `bulk` copy drift remains the next highest verified candidate.
- Template Authoring still lacks dedicated live smoke for bulk/date-clone happy paths.
- Mixed-side `hostSide` inference remains a trigger-based risk until isolated with a direct repro.
