# C1: Wedding Document Sync Revenue Hardening Audit

# Pass A - Direction Brief

## Context

- Task: audit `wedding-cep / Document Sync` as the first revenue-critical hardening wave and decide whether to open `/fix` or coverage-hardening `/build`.
- App or module: `wedding-cep / Document Sync`
- Trigger: `Document Sync` is the live write path into Illustrator output, and the repo currently has no dedicated panel smoke lane for it.

## Normalized Request Receipt

- Intent: harden the highest-blast `wedding` workflow before moving on to lower-cost surfaces.
- Route: audit-first, then `/build` if the main gap is missing shield rather than a verified defect.
- Goal: prove whether `Document Sync` already contains a concrete runtime bug or whether the current risk is insufficient end-to-end evidence.
- Success Criteria:
  - one dedicated C1 exists for the `Document Sync` wave
  - the audit covers write-path contract fidelity, strategy/assembler fidelity, and panel-shield fidelity
  - each candidate ends as `open /fix`, `open /build`, `defer`, or `reject`
  - if no runtime bug is verified, a focused shield C2 opens immediately
- Scope Guess:
  - `ScanAction`, `UpdateAction`
  - `document-sync/*`
  - `applyStrategyUpdate`
  - `StrategyOrchestrator`
  - `assembler`
  - wedding smoke harness
- Constraints:
  - no shared/domain/host/bridge contract changes
  - no speculative refactor of assembler or strategy files
  - one writer only
- Unknowns:
  - whether no-op/success drift exists outside current unit coverage
  - whether scan/update parity can currently fail in real button wiring
  - whether the highest-risk gap is simply missing smoke coverage
- Approval Needed: none; the user approved program execution.

## Problem Restatement

- `Document Sync` is the path that can directly overwrite invitation artwork.
- Internal seams are much cleaner than before, but that write path is still protected mostly by unit/service tests.
- The main question is whether there is already a bug to fix, or whether the missing shield is a dedicated panel smoke lane.

## Options

### Option 1

- Summary: treat the current unit/service coverage as sufficient and move on.
- Tradeoffs: cheapest short-term, but leaves the most expensive workflow without a dedicated panel-side shield.

### Option 2

- Summary: run an audit over write-path behavior and promote a concrete smoke build if no bug is verified.
- Tradeoffs: more work now, but directly matches the user goal of not discovering failures during paid work.

### Option 3

- Summary: reopen `Document Sync` internals for more architecture cleanup before adding smoke.
- Tradeoffs: violates the stop-line and does not improve operator confidence as directly as a real workflow shield.

## Best Practices

- Audit the live workflow from action seam downward.
- Treat unit/service coverage as evidence, not as a substitute for panel smoke.
- Promote shield gaps into small builds rather than forcing them to masquerade as logic bugs.
- Keep the write scope inside `wedding-cep` only.

## Anti-Patterns

- Reopening assembler or strategy internals because they are central.
- Declaring the write path safe without a dedicated smoke lane.
- Pulling host selection or bridge contract changes into this wave.
- Adding multiple unrelated smoke objectives to the same C2.

## Edge Cases

- A no-op path can still be correct even if there is no smoke for it yet.
- Fresh and stateful frame paths can both matter to update coverage.
- A smoke lane may use the real app bridge instance with patched methods instead of expanding the bridge contract.

## Counterfactuals

- If the wedding smoke suite already had scan/update coverage, this wave would likely close with `No verified fix candidate`.
- If a write-path bug surfaced in action or service code, the next artifact would be `/fix`, not a smoke build.
- If the smoke lane required host or bridge contract changes, this wave would stop and reopen as a separate `/plan`.

## Chosen Direction

- Use Option 2.
- Audit `Document Sync` in three slices:
  - write-path contract fidelity
  - strategy/assembler fidelity
  - panel-shield fidelity
- If no bug is verified but the shield gap is concrete, open a focused C2 build for smoke parity.

## Why Other Options Were Rejected

- Option 1 was rejected because the user explicitly wants proactive shielding on money-critical workflows.
- Option 3 was rejected because the current repo stop-line favors workflow shielding over more internal cleanup.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_wedding_document_sync_revenue_hardening_audit.md`
- `.task_steps/c2_wedding_document_sync_smoke_parity_scope.md`
- `wedding-cep/cep/debug_scripts/test_smoke.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/document_sync_smoke_tests.cjs`

## Consumers To Verify

- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/cep/js/actions/ScanAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/scanDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`
- `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.js`
- `wedding-cep/cep/js/logic/pipeline/assembler.js`

## Execution Slices

### Slice 1

- Goal: audit action-level write-path contract behavior.
- Files:
  - `wedding-cep/cep/js/actions/ScanAction.js`
  - `wedding-cep/cep/js/actions/UpdateAction.js`
  - action tests
- Validation:
  - current `wedding` unit baseline

#### Findings Matrix - `Write-Path Contract Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Success vs no-op envelope drift | Live button wiring could still blur the distinction between a real update and a no-op update | Expected: success path calls postflight only when `updated > 0`, while no-op path returns `updated: 0` and skips postflight; Actual: current `UpdateAction.test.js` still proves both branches correctly, and code-path inspection matches the tests | `UpdateAction.js`, `UpdateAction.test.js` | action tests cover success, failure, no-op, and catch-path behavior | 2 | reject |
| Scan result mapping drift in live button wiring | Scan button could fail to carry invitation-side mapping into the live compact form even though service tests pass | Expected: clicking the real scan button with scan data should populate builder data including invitation-side UI keys; Actual: current coverage proves the service mapping and action orchestration separately, but not through one panel-side smoke path | `ScanAction.js`, `scanDocumentService.js` | `ScanAction.test.js` covers action orchestration; `scanDocumentService.test.js` covers side mapping; no dedicated smoke exists | 3 | open /build |

### Slice 2

- Goal: audit strategy and assembler risk on the update path.
- Files:
  - `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`
  - `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.js`
  - `wedding-cep/cep/js/logic/pipeline/assembler.js`
  - `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
- Validation:
  - current `wedding` unit baseline

#### Findings Matrix - `Strategy / Assembler Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Strategy plan vs applied result mismatch | A real packet could plan cleanly in unit tests but still miss the live button path | Expected: the same placeholder frame path that feeds `StrategyOrchestrator.planFrames(...)` should remain reachable from the live update action; Actual: service and strategy tests cover the mechanism, but the live button path still lacks smoke evidence | `applyStrategyUpdate.js`, `StrategyOrchestrator.js`, `UpdateAction.js` | existing unit tests plus code-path inspection show no verified bug, only missing workflow smoke | 3 | open /build |
| Legacy assembler fallback hides a current runtime defect | Falling back to `setDependencies + assemble` might still mis-shape a live update | Expected: the fallback should remain dormant unless `assembleWith` is absent; Actual: current tests explicitly cover both `assembleWith` and legacy fallback behavior, with no conflicting evidence | `updateDocumentService.js`, `assembler.js`, `updateDocumentService.test.js` | unit tests cover both paths, including `solar_date` family keys | 2 | defer |

### Slice 3

- Goal: audit end-to-end panel shielding for the highest-cost write path.
- Files:
  - `wedding-cep/cep/debug_scripts/test_smoke.cjs`
  - `wedding-cep/cep/debug_scripts/smoke_suites/*`
- Validation:
  - `npm run test:smoke:wedding`

#### Findings Matrix - `Panel Shield Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| No dedicated `Document Sync` smoke lane | The most expensive workflow has no panel smoke for scan/update, so regressions can hide behind green unit/service tests | Expected: `Document Sync` should have at least one dedicated smoke lane proving real scan wiring and real update wiring; Actual: current smoke only registers `core`, `autocomplete`, `name`, `schema`, and `postflight` suites | `test_smoke.cjs`, smoke suites | direct smoke harness inspection plus current green baseline | 4 | open /build |

## Baseline Evidence

- `npm run test:wedding` was green at `316/316` before this wave
- `npm run test:smoke:wedding` was green at `18/18` before this wave
- `Document Sync` has action, service, strategy, and assembler tests, but no dedicated smoke suite

## Validation Plan

- This audit wave is evidence-first and opens a coverage build rather than a logic fix.
- The follow-up C2 must run:
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`
  - `npm run verify`
  - `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_smoke_parity_scope.md`

## Outcome

- Audit status: no verified runtime bug candidate
- Open follow-up:
  - `c2_wedding_document_sync_smoke_parity_scope.md`
- Deferred:
  - legacy assembler fallback as trigger-based debt

## Open Risks

- The write path is still only as good as the new smoke lane proves; host-side contract drift remains out of scope here.
- `Template Authoring` and `symbol` workflows remain queued until this wave reaches `shielded`.
