# C2: Wedding Template Authoring V2 Inject Document Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Template Authoring V2` by turning `runInjectSchemaDocument(...)` into a thin facade over a named `template-authoring` service so the auto-inject path keeps converging on one bounded-context island.
- Execution mode: focused runtime refactor inside `wedding-cep` auto-inject use-case only

## Files To Modify

- `wedding-cep/cep/js/logic/use-cases/injectSchemaDocument.js`
- `wedding-cep/cep/js/logic/use-cases/injectSchemaDocument.test.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaDocumentService.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.test.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_inject_document_service_scope.md`

## Notes Before Execution

- Keep `runInjectSchemaDocument(...)` return envelope stable.
- Do not widen this round into `SchemaInjector` policy splitting, manual inject planners, or JSX host code.
- This round is valid only if it strengthens the same `Template Authoring` island rather than starting another helper-only branch.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring` auto-inject use-case only, centered on `runInjectSchemaDocument(...)` delegating to `template-authoring/injectSchemaDocumentService.js` while keeping the returned inject envelope stable.
Top Risks: moving the sort-plus-compute seam could silently change `changes`, `orphans`, or `missedRequired` normalization; widening into `SchemaInjector` itself would turn this from a facade round into a risky policy rewrite.
Required Fixes: keep `runInjectSchemaDocument(...)` return shape unchanged; keep `InjectSchemaAction` and `runInjectSchemaService(...)` consumers stable; add direct tests for the new service seam and keep manual inject planners out of scope.
No Blocking Findings: Yes. This round strengthens the same `Template Authoring V2` island and creates a second named seam without changing bridge or UI behavior.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `runInjectSchemaDocument(...)` is now a thin facade over `runInjectSchemaDocumentService(...)`; frame sorting and `SchemaInjector.computeChanges(...)` orchestration moved behind the new service; auto-inject action and service consumers still pass their contract tests and full smoke.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not yet split `SchemaInjector` policy internals; manual inject planners remain separate; `Template Authoring V2` still has no higher-level planner seam for bulk/manual/clone convergence.
Unverified But Suspected: none
