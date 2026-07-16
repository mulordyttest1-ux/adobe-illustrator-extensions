# C2: Wedding Template Authoring V2 Manual Inject Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Template Authoring V2` by moving manual inject orchestration behind a named `template-authoring` service so `ManualInjectAction` becomes a facade over the same bounded-context island.
- Execution mode: focused runtime refactor inside `wedding-cep` manual inject path only

## Files To Modify

- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.test.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.test.js`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/wireActions.js`
- `wedding-cep/cep/js/bootstrap/wireActions.test.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.test.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_manual_inject_service_scope.md`

## Notes Before Execution

- Keep `ManualInjectAction` public method contracts stable.
- Do not widen this round into `manualInjection.js` planner rewrites, `SchemaInjector` policy changes, or JSX host code.
- This round is valid only if it strengthens the same `Template Authoring V2` island rather than creating another generic helper seam.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring` manual inject path only, centered on `ManualInjectAction` delegating to `template-authoring/manualInjectService.js` while keeping operator-visible outcomes and public action methods stable.
Top Risks: moving selection read, planner dispatch, and apply-plan orchestration behind one service could silently change warning routing for invalid bulk count, missing clone metadata, or apply failures; importing action-layer IO into `logic/` would violate the architecture boundary.
Required Fixes: keep `ManualInjectAction` method names and return shapes stable; keep `manualInjection.js` planners unchanged; pass selection IO in from the action layer so `logic/` does not import `actions/`; add direct tests for the new manual inject service.
No Blocking Findings: Yes. This round cleanly upgrades the manual branch of the same `Template Authoring V2` island and preserves the repo boundary rules.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `ManualInjectAction` now acts as a facade over `runManualInjectService(...)`; manual single, compound, bulk, and date-clone orchestration moved behind a named `template-authoring` service; planner modules stayed in `manualInjection.js`; architecture checks, full wedding tests, smoke, and repo verify all pass.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not yet unify manual planners under a higher-level planner facade; `SchemaInjector` policy internals remain untouched; `Template Authoring V2` still has separate auto and manual services rather than one context root.
Unverified But Suspected: none

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring` manual inject path only, centered on `ManualInjectAction` delegating to `template-authoring/manualInjectService.js` while keeping the public action methods and operator-visible outcomes stable.
Top Risks: moving selection-read, planner dispatch, and apply-plan orchestration behind one service could silently change warning routing for invalid bulk count, missing clone metadata, or apply failures; importing action-layer IO into `logic/` would break the architecture boundary.
Required Fixes: keep `ManualInjectAction` method names and return shapes stable; keep `manualInjection.js` planners unchanged; keep selection IO passed in from the action layer so `logic/` does not import `actions/`; add direct tests for the new manual inject service.
No Blocking Findings: Yes. This round cleanly upgrades the manual branch of the same `Template Authoring V2` island and preserves the repo boundary rules.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `ManualInjectAction` now acts as a facade over `runManualInjectService(...)`; manual single/compound/bulk/date-clone orchestration moved behind a named `template-authoring` service; planner modules stayed in `manualInjection.js`; architecture checks, full wedding tests, smoke, and repo verify all pass.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not yet unify manual planners under a higher-level planner facade; `SchemaInjector` policy internals remain untouched; `Template Authoring V2` still has separate auto and manual services rather than one context root.
Unverified But Suspected: none
