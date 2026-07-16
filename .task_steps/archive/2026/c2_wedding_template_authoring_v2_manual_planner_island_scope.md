# C2: Wedding Template Authoring V2 Manual Planner Island

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Template Authoring V2` by moving the manual inject planner implementations into the `template-authoring` island while keeping `manualInjection.js` as a backward-compatible facade.
- Execution mode: focused runtime refactor inside `wedding-cep` manual planner path only

## Files To Modify

- `wedding-cep/cep/js/logic/use-cases/manualInjection.js`
- `wedding-cep/cep/js/logic/use-cases/manualInjection.test.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectionPlanner.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectionPlanner.test.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.test.js`
- `wedding-cep/cep/js/logic/use-cases/manualInjection.test.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_manual_planner_island_scope.md`

## Notes Before Execution

- Keep the exported planner API from `manualInjection.js` stable for existing consumers.
- Do not widen this round into `SchemaInjector` changes, action wiring changes, or JSX host code.
- This round is valid only if it increases `Template Authoring V2` context cohesion rather than adding a no-op wrapper layer.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring V2` manual planner path only, centered on moving the planner implementations into `template-authoring/manualInjectionPlanner.js` while keeping `manualInjection.js` as a backward-compatible facade.
Top Risks: planner relocation could silently change bulk ordering, date-clone replacements, or `_cleanMap` restore behavior; existing consumers could break if the old export surface from `manualInjection.js` drifted during the move.
Required Fixes: keep planner export names stable in `manualInjection.js`; point `manualInjectService.js` at the internal island planner seam directly; keep both facade-level tests and direct planner-island tests green.
No Blocking Findings: Yes. This round strengthens the `Template Authoring V2` island without widening into `SchemaInjector`, UI render flow, or host/bridge code.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: manual planner implementations now live under `template-authoring/manualInjectionPlanner.js`; `manualInjection.js` remains a stable backward-compatible facade for existing consumers; `manualInjectService.js` uses the internal planner seam directly; facade tests and direct planner-island tests both pass; full `wedding-cep` lint, build, unit, smoke, and repo verify stayed green after the move.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: auto and manual branches still stop at separate services; `Template Authoring V2` still has no single context root/facade above those services; `SchemaInjector` core remains unchanged by design in this round.
Unverified But Suspected: none
