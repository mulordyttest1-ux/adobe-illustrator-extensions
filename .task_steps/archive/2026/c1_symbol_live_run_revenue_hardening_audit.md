# C1: Symbol Live Run Revenue Hardening Audit

# Pass A - Direction Brief

## Context

- Task: audit `symbol-cep / live run` as Wave 3 of the revenue-critical hardening program and decide whether the next round is a bug fix or a smoke shield.
- App or module: `symbol-cep / ActionTab live run`
- Trigger: current `symbol` smoke is green, but it still does not lock a real run path from `ActionTab` UI trigger through `runWithPreset -> preflight -> engine -> postflight -> restore`.

## Normalized Request Receipt

- Intent: harden the next highest-ROI money path after `wedding` write and template-authoring shields are in place.
- Route: audit-first, then promote to focused C2 if the strongest residual risk is missing live-run shielding rather than a verified runtime defect.
- Goal: prove whether `symbol` live run already has a product bug or whether the real gap is missing UI-trigger smoke parity.
- Success Criteria:
  - one dedicated C1 exists for `symbol-cep / live run`
  - the audit covers UI trigger/handoff fidelity, end-state fidelity, and shield-gap decision
  - each candidate ends as `open /fix`, `open /build`, `defer`, or `reject`
  - if there is no bug `>= 4`, a focused live-run smoke C2 opens immediately
- Scope Guess:
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
  - `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
  - `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
  - `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
  - `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- Constraints:
  - no `libs/shared`, `.jsx`, bridge payload, or config renderer/layout changes
  - use exactly two read-only subagents for challenger/skeptic review
  - keep one writer
- Unknowns:
  - whether a real UI trigger still diverges from the service seam
  - whether manager mode needs its own parity shield
  - whether restore/error semantics are only proven at service/debug seams today
- Approval Needed: none; the user approved Wave 3 execution.

## Problem Restatement

- `symbol-cep` already proves many runtime invariants at the service seam and through focused debug smokes.
- The missing proof is the revenue-critical live run path that starts from a real preset click in the Action tab and flows into preflight, engine, postflight, and restore.
- This wave needs to distinguish between a hidden runtime defect and a simpler shield asymmetry.

## Options

### Option 1

- Summary: trust the current service tests and debug smokes as sufficient and move on.
- Tradeoffs: leaves the paid-work run path without real Action-tab coverage.

### Option 2

- Summary: audit the live run path and, if no bug is verified, add a focused smoke matrix for the real UI trigger.
- Tradeoffs: costs one round now, but directly protects the workflow that can waste operator time or output.

### Option 3

- Summary: reopen preflight/postflight internals for broader cleanup before adding a live-run shield.
- Tradeoffs: violates the current stop-line and adds little operator confidence compared with a real workflow smoke.

## Best Practices

- Audit the real UI trigger path before reopening internals.
- Treat service tests as strong evidence, but not as a substitute for Action-tab smoke.
- Promote shield gaps into a small C2 instead of forcing them to masquerade as logic bugs.
- Keep the write scope inside `symbol-cep` only.

## Anti-Patterns

- Reopening preflight or postflight rule internals because they are central.
- Adding manager-mode parity smoke when the selectors already converge into the same handler without contradictory evidence.
- Expanding the bridge payload or host debug contract for a panel-side coverage gap.
- Mixing config/preset-roundtrip cleanup into this live-run wave.

## Edge Cases

- A service seam can be correct while the Action-tab UI trigger remains unshielded.
- `lastPostflightSummary` must be cleared even when the run cancels before engine execution.
- Restore semantics matter in engine-failure paths even when there is no postflight summary.

## Counterfactuals

- If current smoke already clicked a real preset and reached `runWithPreset`, this wave would likely close with `No verified fix candidate`.
- If dropdown and manager buttons diverged after selector dispatch, Wave 3 would need a focused logic fix instead of a shield build.
- If the live-run matrix required new bridge payload or host fixture APIs, this wave would stop and reopen through a new `/plan`.

## Chosen Direction

- Use Option 2.
- Audit the live run workflow in three slices:
  - UI trigger and handoff fidelity
  - engine/postflight/restore end-state fidelity
  - shield-gap decision
- If no bug reaches `>= 4`, open a focused C2 build for dropdown-trigger live-run matrix smoke.

## Why Other Options Were Rejected

- Option 1 was rejected because the user explicitly asked to proactively harden paid workflows instead of discovering issues during live work.
- Option 3 was rejected because current repo direction favors bounded workflow shields over more trigger-based cleanup.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_symbol_live_run_revenue_hardening_audit.md`
- `.task_steps/c2_symbol_live_run_matrix_smoke_scope.md`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers To Verify

- `.task_steps/c1_revenue_critical_workflow_hardening_program.md`
- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/ARCHITECTURE.md`
- `symbol-cep/PROJECT_STATUS.md`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.test.mjs`
- `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
- `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Execution Slices

### Slice 1

- Goal: audit Action-tab trigger and handoff fidelity.
- Files:
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
  - `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- Validation:
  - current `symbol` unit baseline

#### Findings Matrix - `UI Trigger / Handoff Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Dropdown vs manager-run divergence | The two visible run buttons could dispatch different live run paths | Expected: both selectors should converge into the same `handleTrigger(id)` path before preset resolution; Actual: both click branches in `ActionTab.init()` call `this.handleTrigger(dataset.id)` and no separate execution path exists afterward | `action_tab.js` | direct code-path inspection plus Challenger and Skeptic review | 2 | reject |
| Stale `lastPostflightSummary` leak between runs | A second run could retain stale postflight state from a prior run | Expected: `runPresetExecutionFlow()` clears summary before hydrate/preflight; Actual: the service clears summary first, and unit coverage already proves the unsafe-preflight branch leaves the summary `null` | `imposition_run_service.js`, `imposition_run_service.test.mjs` | service code inspection plus existing unit test | 2 | reject |
| Unsafe/cancel preflight falls through to engine | A cancelled live run could still execute the engine | Expected: unsafe preflight returns `null` and short-circuits before `executeImposition()`; Actual: `runPresetExecutionFlow()` returns `{ status: 'cancelled' }` and current unit coverage proves `executeImposition()` is never called | `imposition_run_service.js`, `imposition_run_service.test.mjs` | existing unit test plus subagent convergence | 2 | reject |

### Slice 2

- Goal: audit live end-state fidelity after engine and restore.
- Files:
  - `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
  - `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
  - `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
  - `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- Validation:
  - current `symbol` unit and smoke baseline

#### Findings Matrix - `Engine / Postflight / Restore End-State Fidelity`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Restore skipped on engine failure | Auto-group cleanup could be lost when engine fails | Expected: failure path always calls `restoreAutoGrouping(...)`; Actual: `handleEngineFailure()` always restores and current unit coverage locks that behavior | `imposition_run_service.js`, `imposition_run_service.test.mjs` | service code inspection plus existing unit test | 2 | reject |
| Success path loses postflight summary | A successful run could finish without retaining the latest summary | Expected: `handleEngineSuccess()` should save `lastPostflightSummary` after `postflightOrchestrator.runAll(...)`; Actual: service code does this and current smoke already proves retention through the debug surface | `imposition_run_service.js`, `app.js`, `test_smoke.cjs` | existing debug smoke plus service inspection | 2 | reject |
| Hook failure warning drift | The live path could warn in the wrong cases | Expected: warning only when `summary.failedCount > 0`; Actual: service code matches that rule, with service coverage already locking the failed-count case | `imposition_run_service.js`, `imposition_run_service.test.mjs` | service test plus subagent convergence | 2 | reject |

### Slice 3

- Goal: decide whether the remaining risk is a bug or a missing live-run shield.
- Files:
  - `symbol-cep/cep/debug_scripts/test_smoke.cjs`
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
  - `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- Validation:
  - `npm run test:smoke:symbol`

#### Findings Matrix - `Shield-Gap Decision`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Missing Action-tab live-run matrix smoke | The revenue-critical preset click path is still protected only by service tests and debug probes, not by a real Action-tab trigger | Expected: at least one dedicated smoke matrix should click a real Action-tab preset and prove happy-path, unsafe-preflight, and engine-failure semantics through the live run seam; Actual: current smoke covers search, manager UI, postflight debug, failure visibility, restore lifecycle, and preset/config flows, but not a real preset click into `runWithPreset` | `test_smoke.cjs`, `action_tab.js`, `imposition_run_service.js` | smoke harness inspection, local audit, Challenger and Skeptic review | 4 | open /build |
| Separate manager-run parity shield | Manager mode might need its own live-run smoke | Expected: separate parity only if manager mode resolves into a materially different live path; Actual: both selectors converge into the same handler before preset resolution, and no contradictory evidence surfaced | `action_tab.js` | code-path inspection plus subagent convergence | 2 | reject |

## Baseline Evidence

- `npm --workspace imposition-panel-cep run test` was green at `45/45` before this wave.
- `npm run test:smoke:symbol` was green at `29/29` before this wave.
- Current `symbol` smoke already proves:
  - postflight summary retention through debug seam
  - whitespace template skip path
  - preflight failure visibility
  - host auto-group restore lifecycle
- Current `symbol` smoke does not prove a real preset click through `ActionTab` into the live run seam.

## Challenger / Skeptic Review

- Challenger review result: no verified real bug candidate `>= 4`; recommended a narrow dropdown-trigger smoke matrix with happy-path, unsafe-preflight, and engine-failure coverage, and rejected full manager-run parity.
- Skeptic review result: current service and debug seams already prove summary reset, cancel gating, restore semantics, and postflight warning retention; the remaining risk is the missing Action-tab smoke matrix.

## Validation Plan

- This audit wave promotes a focused coverage build rather than a product-logic fix.
- The follow-up C2 must run:
  - `npm run lint:symbol`
  - `npm run build:symbol`
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`
  - `npm run verify`
  - `npm run check:gates -- --file .task_steps/c2_symbol_live_run_matrix_smoke_scope.md`

## Outcome

- Audit status: no verified runtime bug candidate
- Open follow-up:
  - `c2_symbol_live_run_matrix_smoke_scope.md`
- Deferred:
  - separate manager-mode parity smoke unless future evidence shows divergence after selector dispatch

## Open Risks

- The live run seam still depends on the new smoke matrix to protect UI-trigger integration; the service seam was already stronger than the Action-tab surface.
- Host payload and selection variability remain intentionally out of scope for this wave.
