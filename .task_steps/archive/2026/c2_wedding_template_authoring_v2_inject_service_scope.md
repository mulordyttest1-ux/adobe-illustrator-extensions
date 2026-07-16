# C2: Wedding Template Authoring V2 Inject Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Start `Template Authoring V2` by moving the auto-inject orchestration behind a named `template-authoring` service so `InjectSchemaAction` becomes a facade over a context-local seam.
- Execution mode: focused runtime refactor inside `wedding-cep` auto-inject path only

## Files To Modify

- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.test.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.test.js`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/wireActions.js`
- `wedding-cep/cep/js/bootstrap/wireActions.test.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.test.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_inject_service_scope.md`

## Notes Before Execution

- Keep `InjectSchemaAction.execute(...)` public contract stable.
- Do not widen this round into manual inject flows, `SchemaInjector` policy rewrites, or JSX host changes.
- This round is valid only if it upgrades the `Template Authoring` context seam, not if it devolves into helper-only extraction.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring` auto-inject path only, centered on `InjectSchemaAction.execute(...)` delegating to a named `template-authoring/injectSchemaService.js` while keeping action contract and inject result behavior stable.
Top Risks: moving selection-read, inject-plan, and apply-plan orchestration behind a service could silently change orphan handling, no-op detection, or postflight trigger timing; touching manual inject or `SchemaInjector` policy in the same round would widen the island too far.
Required Fixes: keep `InjectSchemaAction.execute(...)` public surface stable; preserve orphan selection and postflight behavior; keep manual inject flows and JSX host code out of scope; add direct tests for the new service seam instead of relying only on action tests.
No Blocking Findings: Yes. This round establishes the first `Template Authoring V2` runtime seam with a named service and keeps the risk contained to the auto-inject path.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `InjectSchemaAction.execute(...)` is now a thin facade over a named `template-authoring` service; selection read, inject planning, and apply-plan orchestration moved behind `runInjectSchemaService(...)`; orphan selection, missed-required warnings, and postflight trigger behavior stayed intact for the auto-inject path.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not yet move the `injectSchemaDocument(...)` facade itself behind the same island boundary; manual inject planners remain separate; `SchemaInjector` is still the policy-heavy core and has not been split in this round.
Unverified But Suspected: none
