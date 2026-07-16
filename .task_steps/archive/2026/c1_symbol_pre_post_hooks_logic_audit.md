# C1: Symbol Preflight + Postflight Hooks Logic Audit

# Pass A - Direction Brief

## Context

- Task: Audit `symbol-cep / Preflight + Postflight / Hooks` as a narrow logic-assurance wave and decide whether any verified candidate should escalate into `/fix`.
- App or module: `symbol-cep / Preflight`, `symbol-cep / Postflight / Hooks`, and the execution handoff that connects them
- Trigger: `symbol-cep` is facade-ready in config and execution, but preflight/postflight remain the main trigger-based logic seam worth re-checking before waiting for product bugs

## Normalized Request Receipt

- Intent: run an evidence-first audit over `symbol-cep` preflight and postflight hooks without drifting into speculative refactor
- Route: `/plan` artifact implemented as one C1 audit receipt; `/fix` only if a candidate reaches `>= 4`
- Goal: confirm whether current preflight/postflight logic still has a verified bug family worth opening as a focused fix
- Success Criteria:
  - one dedicated C1 artifact exists for this audit wave
  - baseline evidence for unit and smoke is recorded
  - the audit is split into execution handoff, preflight, and postflight layers
  - every candidate ends as `open /fix`, `defer`, or `reject`
  - no speculative refactor is opened
- Scope Guess: `action_tab.js`, `imposition_run_service.js`, `preflight/`, `postflight/`, and existing symbol smoke/debug harnesses
- Constraints:
  - no shared, host, or bridge payload mutation during the audit
  - no renderer/config work
  - `/fix` only if symptom, expected vs actual, and root-cause direction are concrete
- Unknowns:
  - whether `preflight` has a verified logic issue or only residual thin-coverage risk
  - whether any execution handoff path is under-tested enough to justify a candidate above threshold
- Approval Needed: none; the user explicitly requested implementation of this audit plan

## Problem Restatement

- `symbol-cep` is no longer at the stage where more architecture cleanup is the best use of time.
- The highest-value remaining question is whether `preflight` and `postflight hooks` still hide a real logic bug, especially because preflight is less unit-covered than postflight.
- The correct move is to audit from evidence already present in the repo, not to reopen refactor work.

## Options

### Option 1

- Summary: reopen `PreflightOrchestrator`, `PasteboardInfoRule`, or `action_tab` for cleanup now
- Tradeoffs: easy to keep moving, but speculative and directly against the audit-first requirement

### Option 2

- Summary: run a focused logic audit over execution handoff, preflight, and postflight, then only open `/fix` if a candidate crosses the threshold
- Tradeoffs: slower to produce code changes, but decision quality stays high and no fake milestone gets created

### Option 3

- Summary: do nothing and wait for external bugs
- Tradeoffs: safe, but loses the chance to document current evidence and residual risks while the architecture context is still fresh

## Best Practices

- Start from the execution handoff seam before auditing rule files in isolation.
- Use both symbol unit tests and live smoke as evidence; neither is enough alone.
- Treat `preflight` as a higher-risk audit slice because it relies more heavily on runtime/host behavior.
- Record one findings matrix with explicit score and decision so the next wave can reuse the reasoning.

## Anti-Patterns

- Reopening `PreflightOrchestrator.js` just because it is lightly abstracted.
- Treating `PasteboardInfoRule.js` as suspicious only because it still talks to the bridge.
- Turning thin test coverage into a `/fix` without a reproduced symptom.
- Pulling bridge/JSX/host changes into this wave without a new `/plan`.

## Edge Cases

- A candidate can remain `defer` even when code inspection looks suspicious if no concrete symptom can be stated.
- A slice can be high-risk but still have no `/fix` candidate because smoke already covers the critical runtime path.
- A warning-quality issue may be a UX problem, not a logic bug, unless it changes decision-making or execution flow.

## Counterfactuals

- If smoke had exposed a wrong engine handoff after preflight cancel or auto-group restore, the first candidate would have opened immediately as `/fix`.
- If postflight summary counts or whitespace-template skipping had not already been covered by unit and smoke, this wave would have likely produced a `/fix`.
- If a bridge/JSX payload mismatch had surfaced, this audit would have stopped and escalated back to a dedicated `/plan` instead of fixing inline.

## Chosen Direction

- Run a narrow audit only.
- Keep the work split into three layers:
  - execution handoff
  - preflight
  - postflight hooks
- Use current passing baseline as evidence, then score only residual logic risks.
- Do not open `/fix` unless a candidate reaches `>= 4` with concrete expected vs actual behavior.

## Why Other Options Were Rejected

- Option 1 was rejected because the current repo state no longer justifies speculative cleanup in this bounded context.
- Option 3 was rejected because documenting the real residual risks now is more useful than leaving this seam completely unanalyzed.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_symbol_pre_post_hooks_logic_audit.md`

## Consumers To Verify

- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/ARCHITECTURE.md`
- `symbol-cep/PROJECT_STATUS.md`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/preflight/`
- `symbol-cep/cep/js/features/imposition/postflight/`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Execution Slices

### Slice 1

- Goal: verify the real source of truth for `preflight -> engine -> postflight` handoff before auditing rule files
- Files:
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
  - `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- Validation:
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`

#### Findings Matrix - `Execution Handoff`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `lastPostflightSummary` stale across cancelled or failed runs | A new run could reuse an old summary after preflight cancel or engine failure | Expected: summary is cleared before every run and only repopulated after postflight on engine success; Actual: current execution tests show `setLastPostflightSummary(null)` happens before the run and cancel path leaves it cleared | `imposition_run_service.js`, `action_tab.js` | `imposition_run_service.test.mjs`: `runPresetExecutionFlow stops after unsafe preflight and leaves summary cleared`; smoke tests 21-22 still observe only fresh summaries | 3 | reject |
| `preflightContext` lost before restore path | Auto-group restore could receive stale or missing context after success/failure | Expected: restore uses the same `preflightContext` returned from preflight; Actual: both success and failure paths pass the context through to `restoreAutoGrouping(...)` and live smoke covers restore success/failure | `imposition_run_service.js`, `action_tab.js` | unit tests for `handleEngineFailure`, `handleEngineSuccess`, and `restoreAutoGrouping`; smoke tests 25 and 28 | 3 | reject |
| Postflight warning toast fires on non-failure summaries | Operators could get a warning even when hooks only skip or succeed | Expected: warning toast only when `failedCount > 0`; Actual: code path is gated on `failedCount > 0` and no failing runtime evidence was found | `imposition_run_service.js` | static inspection plus smoke 21-22 staying clean for success/skip paths | 2 | reject |

### Slice 2

- Goal: audit `preflight` for guard drift, context mutation mistakes, and fail-safe behavior
- Files:
  - `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
  - `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.js`
  - `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.js`
  - `symbol-cep/cep/js/features/imposition/confirm_service.js` only for reference if dialog ownership needs comparison
- Validation:
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`

#### Findings Matrix - `Preflight`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `cancel` or unsafe preflight still falls through to engine execution | A user-cancelled preflight could still run imposition | Expected: unsafe preflight returns `null` and execution stops; Actual: current run-flow tests show the preset execution returns `cancelled` and never reaches engine execution | `imposition_run_service.js`, `PreflightOrchestrator.js` | `imposition_run_service.test.mjs`: `runPreflight short-circuits...` and `runPresetExecutionFlow stops after unsafe preflight...` | 3 | reject |
| `auto_grouped` context is set but not restored correctly | Auto-group may succeed in preflight but restore incorrectly after run | Expected: `autoGroupName` and `autoGrouped` survive until restore, and missing-group cases fail safe; Actual: host smoke covers both restored and fail-safe scenarios | `GroupCheckRule.js`, `imposition_run_service.js` | smoke tests 25 and 28; unit `restoreAutoGrouping uses the exact bridge script and warns when autoGroupName is missing` | 3 | reject |
| Preflight infrastructure failure is invisible to the operator | Bridge parse/eval failure can halt preflight with only console logging and no panel feedback | Expected: operator should get explicit feedback when infrastructure failure stops the run; Actual: `GarbageRule` and some `GroupCheckRule` failure branches log + halt, but no failing smoke exists yet | `GarbageRule.js`, `GroupCheckRule.js` | static inspection of parse/eval error branches; no reproduced smoke failure | 3 | defer |
| Duplicate or missing prompt before execution | Operators could get one prompt too many, or skip a required guard | Expected: one coherent preflight sequence with correct prompt semantics; Actual: smoke and code inspection show stable behavior, but no dedicated prompt-count harness exists | `PreflightOrchestrator.js`, `GarbageRule.js`, `GroupCheckRule.js` | green smoke baseline; no reproduced duplicate or missing prompt | 2 | reject |
| Confirm surface inconsistency between native `confirm(...)` and group dialog | Different dialog surfaces might indicate broken logic sequencing | Expected: dialog ownership differences alone are not a logic bug; Actual: the two rules intentionally use different surfaces and no wrong branch behavior was reproduced | `GarbageRule.js`, `GroupCheckRule.js` | code inspection only; no runtime symptom | 0 | reject |

### Slice 3

- Goal: audit postflight hook summary, skip/failure reporting, and normalization behavior
- Files:
  - `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
  - `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- Validation:
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`

#### Findings Matrix - `Postflight / Hooks`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Whitespace-only legend template still calls the bridge | Blank templates could execute host work even though they should skip | Expected: whitespace-only templates skip with zero bridge calls; Actual: both unit and smoke show a clean skip path | `PasteboardInfoRule.js` | `PasteboardInfoRule.test.mjs`: whitespace-only skip; smoke test 22 | 3 | reject |
| Summary counts drift from real rule outcomes | `successCount`, `skippedCount`, or `failedCount` could disagree with actual hook results | Expected: summary mirrors the normalized rule outcomes and keeps running after failures; Actual: orchestrator tests cover success/skip/failure counts directly | `PostflightOrchestrator.js` | `PostflightOrchestrator.test.mjs`: `runAll returns a postflight summary and keeps running after failures`; smoke test 21 | 3 | reject |
| Legacy `finishSize` payloads still break preview interpolation | Old `w/h` payloads could still leave width/height unresolved | Expected: legacy finish-size keys normalize to `width/height`; Actual: unit and smoke both confirm normalization | `PostflightOrchestrator.js`, `PasteboardInfoRule.js` | orchestrator normalization test; smoke test 20 | 3 | reject |
| Hook failure observability drifts after engine success | Failed hooks could stop being visible to the operator or disappear from retained summary | Expected: failed postflight hooks remain in summary and warn once; Actual: unit tests confirm summary retention + warning on failure, with no contradictory runtime evidence | `imposition_run_service.js`, `PostflightOrchestrator.js` | `handleEngineSuccess retains postflight summary, warns on hook failures...`; no failing smoke symptom | 2 | reject |

## Baseline Evidence

- `npm --workspace imposition-panel-cep run test` -> `41/41`
- `npm run test:smoke:symbol` -> `28/28`

## Validation Plan

- This audit wave is documentation + evidence only, so the baseline commands above are the required validation for the wave.
- If a future candidate crosses `>= 4`, the follow-up `/fix` lane must run:
  - `npm run lint:symbol`
  - `npm run build:symbol`
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`
  - `npm run verify`
  - `npm run check:gates -- --file .task_steps/<c2-file>.md`

## Outcome

- Audit status: `No verified fix candidate`
- Highest residual risk:
  - preflight infrastructure failures may not surface enough operator-facing feedback when bridge parse/eval goes wrong
- Threshold result:
  - no candidate reached `>= 4`
  - no C2 `/fix` should be opened from this wave

## Open Risks

- `Preflight` remains thinner in unit coverage than `postflight`, so future runtime symptoms here should be prioritized quickly.
- The deferred preflight failure-visibility candidate is still below fix threshold because no concrete failing runtime symptom was reproduced.
- Bridge/JSX/host surfaces remain out of scope until a real payload or lifecycle bug appears.
