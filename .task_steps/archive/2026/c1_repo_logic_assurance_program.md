# C1: Repo Logic Assurance Program

# Pass A - Direction Brief

## Context

- Task: Shift the repo from architecture-first cleanup to a bounded-context logic assurance program and audit the highest-risk runtime slices before opening any new `/fix`.
- App or module: repo-wide across `wedding-cep` and `symbol-cep`
- Trigger: the architecture initiative is closed out and the remaining debt is trigger-based rather than refactor-driven

## Normalized Request Receipt

- Intent: build a repo-native bug-hunting program that audits logic families and opens `/fix` only for verified findings
- Route: repo-wide `/plan` artifact plus bounded-context audit waves; `/fix` only when a candidate scores `>= 4`
- Goal: finish one decision-complete audit pass over five bounded contexts without speculative refactor
- Success Criteria:
  - one C1 artifact exists for the logic assurance program
  - five bounded-context audit waves are recorded with findings matrices
  - every slice ends as `open /fix`, `defer`, or `reject`
  - no speculative work opens in `SchemaInjector`, `config_pane_renderer`, shared libs, or host surfaces
- Scope Guess: audit and findings only unless a verified bug is reproduced with clear expected vs actual behavior
- Constraints:
  - follow repo `/plan` and `/fix` workflow contracts
  - one writer max
  - no shared/domain/host change without a new `/plan`
  - no symmetry cleanup
- Unknowns:
  - whether any slice still has a candidate that reaches `>= 4`
  - whether smoke lanes expose a fresh regression not already covered by current receipts
- Approval Needed: none; the user explicitly requested implementation of this program

## Problem Restatement

- The repo is now architecturally clean enough that more refactor has lower ROI than logic assurance.
- Remaining risks are not “files still too large”; they are policy mistakes, false positives, state drift, or runtime branch gaps.
- The correct next step is to audit by bounded context, score findings, and only open `/fix` when there is verified evidence.

## Options

### Option 1

- Summary: continue refactor-oriented cleanup in whichever context still has large files
- Tradeoffs: easy to keep moving, but directly violates the stop-line and will likely produce low-ROI symmetry work

### Option 2

- Summary: run a repo-wide logic assurance program with bounded-context audits and strict `/fix` thresholds
- Tradeoffs: slower to open code changes, but keeps changes evidence-driven and aligned with current repo maturity

### Option 3

- Summary: stop all active work and wait for product bugs only
- Tradeoffs: safest short-term, but loses the opportunity to proactively inspect high-risk policy seams while architecture context is still fresh

## Best Practices

- Audit by bounded context, not by file size.
- Use current feature maps, architecture docs, tests, smoke lanes, and recent receipts as the primary evidence set.
- Treat smoke passes as validator evidence, not as proof that no bug family exists.
- Open `/fix` only when symptom, expected vs actual behavior, and root-cause direction are concrete.
- Keep one bug family per C2 receipt.

## Anti-Patterns

- Opening `SchemaInjector.js` or `config_pane_renderer.js` just because they remain central.
- Converting “this could be wrong” into `/fix` without a reproduced symptom.
- Mixing multiple unrelated bug families into one fix receipt.
- Reopening host, bridge, or shared surfaces from a repo-wide audit without a dedicated plan.

## Edge Cases

- A slice may have dense logic and still produce no verified candidate because tests and smoke already cover the risky branch.
- A smoke lane may pass while a policy candidate remains suspicious; if expected vs actual cannot be stated, the slice still stays `defer` or `reject`.
- A bug family may already be closed by a recent receipt; that should count as evidence against reopening it.
- The worktree is dirty; audit findings must not assume ownership over unrelated pending changes.

## Counterfactuals

- If a slice produced a candidate with a concrete failing symptom today, this program would immediately branch into `/fix` with a dedicated C2.
- If smoke had failed in either app, the first verified candidate would have been the failing smoke family, not the slice currently under audit.
- If shared/domain or host policy bugs had surfaced, this program would have stopped and reopened `/plan` instead of fixing inline.

## Chosen Direction

- Stop proactive refactor.
- Audit five bounded contexts in fixed order.
- Score every candidate using the repo stop-line rubric.
- Open `/fix` only when the candidate reaches `>= 4` with concrete symptom and evidence.
- Otherwise record `No verified fix candidate` and move on.

## Why Other Options Were Rejected

- Option 1 was rejected because the repo already reached the point where more cleanup would likely be speculative.
- Option 3 was rejected because the repo now has enough structure and tests to support a bounded, evidence-first audit pass safely.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_repo_logic_assurance_program.md`
- Potential future C2 receipts only if a verified candidate appears:
  - `.task_steps/c2_wedding_postflight_<bug_family>_fix_scope.md`
  - `.task_steps/c2_wedding_template_authoring_<bug_family>_fix_scope.md`
  - `.task_steps/c2_wedding_document_sync_<bug_family>_fix_scope.md`
  - `.task_steps/c2_symbol_preset_config_<bug_family>_fix_scope.md`
  - `.task_steps/c2_symbol_prepost_<bug_family>_fix_scope.md`

## Consumers To Verify

- `AGENT_OPERATING_MODEL.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`
- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/ARCHITECTURE.md`
- current slice tests and smoke lanes

## Execution Slices

### Slice 1

- Goal: audit `wedding-cep / Postflight` for false positives, actionable-id drift, and reporting mismatches
- Files:
  - `wedding-cep/cep/js/actions/PostflightAction.js`
  - `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
  - `wedding-cep/cep/js/components/postflight/`
- Validation:
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

#### Findings Matrix — `wedding-cep / Postflight`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Leftover marker false positives outside render phase | A non-render phase could incorrectly raise affected-frame findings | Expected: affected-frame rules only run in render phase; Actual: current tests show they are gated correctly | `PostflightValidator.js` | `PostflightValidator.test.js`: `does not run affected-frame rules outside render phase`; wedding smoke test 13 passed | 3 | reject |
| Actionable id drift in report selection | “Chọn frame” could select the wrong Illustrator frame if `id` / `frameId` fallback drifted | Expected: selection uses stable target frame id; Actual: current report action resolves correctly | `PostflightAction.js`, `ValidationReportWidget.js` | widget tests cover `id || frameId`; wedding smoke test 12 passed with final selection `["836"]` | 3 | reject |
| Unbound-form false positives on optional or ceremony-only fields | Optional or ceremony-only fields could still surface as actionable warnings | Expected: optional `ngay_nhap` and ceremony-only controls are ignored; Actual: current support tests show that behavior | `PostflightValidator.js`, `logic/validators/support/` | `resolveUnboundFormDataFinding` tests cover optional `ngay_nhap`, ceremony-only suppression, and venue handling | 3 | reject |
| Severity grouping/order drift | Global warnings could be grouped or ordered incorrectly vs frame errors | Expected: frame errors sort ahead of global warnings and severity grouping stays stable; Actual: current tests cover both | `components/postflight/widgetGrouping.js`, `PostflightValidator.js` | validator tests cover sort order; earlier postflight UI receipts already locked severity grouping | 2 | reject |

- Slice status: `No verified fix candidate`

### Slice 2

- Goal: audit `wedding-cep / Template Authoring` for orphan handling, auto/manual divergence, and clone/infer policy gaps
- Files:
  - `wedding-cep/cep/js/actions/InjectSchemaAction.js`
  - `wedding-cep/cep/js/actions/ManualInjectAction.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/`
  - `wedding-cep/cep/js/logic/schema/SchemaInjector.js` read-only
- Validation:
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

#### Findings Matrix — `wedding-cep / Template Authoring`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Orphan selection mismatch after auto inject | Auto inject could highlight the wrong orphan frame in Illustrator | Expected: orphan selection should target the real orphan frame; Actual: current smoke passes the real selection flow | `InjectSchemaAction.js`, `templateAuthoringService.js` | wedding smoke test 11 passed; `InjectSchemaAction.test.js` covers orphan selection and postflight trigger | 3 | reject |
| Auto/manual path divergence after new context root | Auto and manual authoring could reshape inputs differently after `templateAuthoringService.js` was added | Expected: one context root routes to the same internal seams without payload drift; Actual: direct context-root tests pass | `templateAuthoringService.js` | `templateAuthoringService.test.js` covers auto route, manual route, and unknown-mode failure; action tests remain green | 3 | reject |
| Date clone policy drift for `date.tiec -> date.le / date.nhap` | Clone routing could regress between venue and ceremony token behavior | Expected: `le` remaps venue -> ceremony, `nhap` keeps venue tokens; Actual: planner tests cover both branches | `manualInjectionPlanner.js` | planner tests cover `le` and `nhap` clone behavior and missing `date.tiec` metadata cases | 3 | reject |
| Missed required field reporting after inject | Required-field misses could fail to surface during template phase | Expected: missed required keys should surface through postflight validation context; Actual: current inject tests still cover that path | `InjectSchemaAction.js`, `injectSchemaService.js` | `InjectSchemaAction.test.js` asserts missed required keys trigger template-phase postflight | 2 | reject |
| `SchemaInjector` infer/clone core | The core policy engine is still central and dense | Expected: no speculative reopen without a reproducible infer/clone bug; Actual: no fresh symptom was found in tests or smoke | `SchemaInjector.js` | architecture docs explicitly mark it trigger-based; smoke and action tests are green | 0 | reject |

- Slice status: `No verified fix candidate`

### Slice 3

- Goal: audit `wedding-cep / Document Sync` for scan/update envelope drift, inference mismatches, and packet/plan inconsistencies
- Files:
  - `wedding-cep/cep/js/actions/ScanAction.js`
  - `wedding-cep/cep/js/actions/UpdateAction.js`
  - `wedding-cep/cep/js/logic/use-cases/document-sync/`
  - `wedding-cep/cep/js/logic/pipeline/assembler.js`
  - `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.js`
- Validation:
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

#### Findings Matrix — `wedding-cep / Document Sync`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| `no-op` vs `success` envelope drift | Update could incorrectly trigger postflight or success UX on a `no-op` result | Expected: `no-op` stays informational and skips postflight; Actual: current action tests still lock that behavior | `UpdateAction.js`, `updateDocumentService.js` | `UpdateAction.test.js` covers `no-op`; update service tests cover success and failure envelopes | 3 | reject |
| Bride/groom scan inference drift | `host_type` fallback could map the wedding side incorrectly when absent | Expected: missing `host_type` still infers bride/groom correctly from invitation content; Actual: current tests cover both explicit and inferred cases | `scanDocumentService.js` | scan service tests cover explicit groom side and inferred bride side; smoke scan path passes | 3 | reject |
| `solar_date` packet mapping mismatch | `solar_date` could bypass the same date-key handling as `date.*` | Expected: `solar_date` uses the same assembly path as date keys; Actual: assembler tests lock the injected path | `assembler.js` | `assembler.test.js` covers `solar_date`; update service tests still pass through `assembleWith(...)` | 3 | reject |
| Strategy plan vs apply result mismatch | Applied bridge result could drift from the strategy plans returned for update | Expected: update returns stable bridge result shape plus postflight context; Actual: current tests cover success and failure flows | `StrategyOrchestrator.js`, `applyStrategyUpdate.js` | strategy tests and `runApplyStrategyUpdate` tests pass; wedding smoke update lane passes | 3 | reject |
| Binding coverage mismatch after update | Template-binding coverage could under-report or over-report affected frames | Expected: postflight context should track updated frames correctly; Actual: no fresh mismatch surfaced in tests or smoke | `UpdateAction.js`, `strategyUpdateSupport.js` | current tests cover affected frames and stable no-op/failure result helpers; no failing symptom reproduced | 2 | reject |

- Slice status: `No verified fix candidate`

### Slice 4

- Goal: audit `symbol-cep / Preset / Config` for state drift, modal/edit workflow mismatch, and persistence inconsistencies
- Files:
  - `symbol-cep/cep/js/features/imposition/config_tab.js`
  - `symbol-cep/cep/js/features/imposition/config_events.js`
  - `symbol-cep/cep/js/features/imposition/config_persistence.js`
  - `symbol-cep/cep/js/features/imposition/preset-config/`
  - `symbol-cep/cep/js/features/imposition/config_pane_renderer.js` read-only
- Validation:
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`

#### Findings Matrix — `symbol-cep / Preset / Config`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| State loss after rerender / preset reset | Config tab could lose draft state or last-active state after rerender and blank preset reset | Expected: draft reset and hydration remain stable; Actual: current smoke and service tests cover those flows | `config_tab.js`, `configTabStateService.js`, `configPersistenceService.js` | symbol smoke tests 9, 15, 16, 19 passed; persistence/state service tests are green | 3 | reject |
| Modal/edit workflow mismatch | Add/remove field-row modal flows could desync from schema state | Expected: confirm/open/remove flows mutate schema and rerender consistently; Actual: schema-edit service tests cover them directly | `config_tab.js`, `configSchemaEditService.js` | `configSchemaEditService.test.mjs` covers remove field, remove row, modal confirm, modal open | 3 | reject |
| Storage degraded behavior drift | Degraded storage could incorrectly disable dry run or warning surfaces | Expected: warning surfaces render and dry run still works; Actual: smoke covers both degraded behavior paths | `config_persistence.js`, `data_store.js` | symbol smoke tests 23 and 24 passed | 3 | reject |
| Preset form submission drift from internal buttons | Internal pane buttons could submit the preset form unexpectedly | Expected: internal buttons do not submit the form; Actual: smoke covers this explicitly | `config_events.js`, `config_pane_renderer.js` | symbol smoke test 14 passed | 2 | reject |
| `config_pane_renderer.js` composition pressure | Renderer shell is still the largest config file and could hide a layout/composition bug | Expected: no reopen without a concrete composition failure; Actual: no fresh symptom surfaced in smoke or tests | `config_pane_renderer.js` | architecture docs mark it trigger-based; smoke tests 10-13 passed current UI/render behavior | 0 | reject |

- Slice status: `No verified fix candidate`

### Slice 5

- Goal: audit `symbol-cep / Preflight + Postflight / Hooks` for hook guard behavior, skip/success reporting, and preflight safety drift
- Files:
  - `symbol-cep/cep/js/features/imposition/preflight/`
  - `symbol-cep/cep/js/features/imposition/postflight/`
  - `symbol-cep/cep/js/features/imposition/action_tab.js`
- Validation:
  - `npm --workspace imposition-panel-cep run test`
  - `npm run test:smoke:symbol`

#### Findings Matrix — `symbol-cep / Preflight + Postflight / Hooks`

| Candidate | Symptom | Expected vs Actual | Primary files | Evidence | Score | Decision |
|---|---|---|---|---|---:|---|
| Whitespace-only legend template still calls host bridge | A blank template could still invoke bridge execution after engine success | Expected: blank/whitespace template should skip cleanly; Actual: unit and smoke both show skip without bridge call | `PasteboardInfoRule.js` | `PasteboardInfoRule.test.mjs` covers whitespace-only skip; symbol smoke test 22 passed | 3 | reject |
| Hook summary drift after engine success | Postflight summary could lose observability or miscount success/skip/failure | Expected: summary stays observable and normalized; Actual: current orchestrator tests and smoke cover it | `PostflightOrchestrator.js` | `PostflightOrchestrator.test.mjs` covers success/skip/failure summary; symbol smoke test 21 passed | 3 | reject |
| Auto-group lifecycle restore bug | Host lifecycle could fail to restore auto-group or fail unsafely when group name is missing | Expected: lifecycle restores when possible and fails safe when missing; Actual: smoke covers both cases | `action_tab.js`, preflight rules | symbol smoke tests 25 and 28 passed | 3 | reject |
| Preflight guard duplication or missing guard | Preflight could miss a guard or double-prompt before execution | Expected: rules run sequentially and stop only on a failing rule; Actual: current static inspection shows no fresh symptom, but dedicated tests remain light | `PreflightOrchestrator.js`, `GarbageRule.js`, `GroupCheckRule.js` | code-path inspection plus green smoke run; no dedicated failing symptom reproduced | 2 | defer |
| Postflight warning quality for legacy size payloads | Legacy finish-size payloads could degrade hook preview quality | Expected: width/height normalize from legacy keys; Actual: current unit tests cover normalization | `PostflightOrchestrator.js`, `PasteboardInfoRule.js` | unit tests cover normalized width/height preview and summary hydration | 2 | reject |

- Slice status: `No verified fix candidate`

## Validation Plan

- Evidence run for this audit pass:
  - `npm run test:smoke:wedding`
  - `npm run test:smoke:symbol`
- Repo baseline already stayed green immediately before this audit via:
  - `npm run verify`
- If any future candidate reaches `>= 4`, open a dedicated C2 `/fix` and run the app-specific validation lane plus `npm run check:gates -- --file .task_steps/<c2-file>.md`.

## Open Risks

- `symbol-cep / Preflight` remains the lightest-tested slice; it is still below `/fix` threshold because no reproduced symptom was found.
- `wedding-cep / SchemaInjector` and `symbol-cep / config_pane_renderer` remain trigger-based risks and should not be reopened without concrete runtime evidence.
- The worktree is dirty; future `/fix` work must keep scopes tight and avoid assuming ownership over unrelated pending changes.
