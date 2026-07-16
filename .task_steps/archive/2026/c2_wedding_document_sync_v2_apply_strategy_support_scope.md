# C2: Wedding Document Sync V2 Apply Strategy Support

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Open the first `Document Sync V2` slice by keeping `UpdateAction` and `runUpdateDocument` stable while moving strategy-update planning and result shaping into an internal support module.
- Execution mode: focused runtime refactor inside `wedding-cep` update path only

## Files To Modify

- `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.js`
- `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.test.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.test.js`
- `wedding-cep/cep/js/logic/use-cases/support/strategyUpdateSupport.js`
- `wedding-cep/cep/js/logic/use-cases/support/strategyUpdateSupport.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.test.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.test.js`
- `wedding-cep/cep/js/actions/UpdateAction.test.js`

## Cross-App Impact

- None. This change stays inside `wedding-cep` and does not change shared libs, bridge payload shapes, or cross-app taxonomy.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_v2_apply_strategy_support_scope.md`

## Notes Before Execution

- `Document Sync` is the next approved `v2 island`; this round only opens the update branch.
- Keep `UpdateAction.execute(...)`, `runUpdateDocument(...)`, and `runApplyStrategyUpdate(...)` runtime contracts unchanged.
- Do not widen this round into scan/update packet contract work or host/bridge changes.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Document Sync` update branch only, centered on `StrategyOrchestrator.planFrames(...)` plus `runApplyStrategyUpdate(...)` delegation.
Top Risks: moving frame-to-plan policy into the strategy layer could accidentally change plan payload shape; stale test doubles using the old `analyze(...)` seam could hide drift if not updated.
Required Fixes: keep `UpdateAction.execute(...)`, `runUpdateDocument(...)`, and bridge `applyPlan(plans)` payload unchanged; prove `raw_content` vs `content`, `meta_keys`, and `SKIP` filtering through direct tests on the new strategy seam.
No Blocking Findings: Yes. Explorer review converged on `StrategyOrchestrator.planFrames(...)` as the right first `Document Sync V2` slice, and the final patch stayed inside that write set.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `UpdateAction` and `runUpdateDocument` contracts stayed unchanged; `runApplyStrategyUpdate(...)` now acts as a coordinator only; frame-to-plan policy now lives in `StrategyOrchestrator.planFrames(...)` with direct coverage for content fallback, metadata shaping, and `SKIP` omission.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run verify`
Remaining Limits: no `test:smoke:wedding` rerun for this round because the patch stayed inside panel-side logic and did not change boot, UI wiring, or CEP/JSX transport behavior; scan path and broader `Document Sync` planners are still pending future `v2 island` rounds.
Unverified But Suspected: none
