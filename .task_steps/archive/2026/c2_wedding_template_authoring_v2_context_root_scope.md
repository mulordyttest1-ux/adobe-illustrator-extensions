# C2: Wedding Template Authoring V2 Context Root

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Strengthen `Template Authoring V2` with one context root above the existing auto and manual service seams so both actions route through the same bounded-context service surface without touching `SchemaInjector`.
- Execution mode: focused runtime refactor inside `wedding-cep` template-authoring action and service seams only

## Files To Modify

- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringService.test.js`

## Consumers Verified

- `wedding-cep/cep/js/components/schema-tab/SchemaTabComponents.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.test.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.test.js`
- `wedding-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. This round stays inside `wedding-cep` template-authoring runtime seams and does not change shared packages, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_context_root_scope.md`

## Notes Before Execution

- Keep `InjectSchemaAction.execute(...)` and the `ManualInjectAction` public methods stable for schema-tab callers.
- Keep `runInjectSchemaService(...)`, `runManualInjectService(...)`, `runInjectSchemaDocument(...)`, and `manualInjectionPlanner.js` intact as internal seams under the new context root.
- Do not widen this round into `SchemaInjector.js`, schema-tab rendering, or JSX bridge code.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring V2` action routing only, centered on adding one `templateAuthoringService.js` context root above the existing auto and manual service seams while keeping action contracts stable.
Top Risks: the new context root could silently reshape inputs between auto and manual branches; action tests could pass while schema-tab callers break if public method names or result envelopes change.
Required Fixes: keep `InjectSchemaAction.execute(...)` and `ManualInjectAction` methods stable; route auto mode to `runInjectSchemaService(...)` and manual modes to `runManualInjectService(...)` without changing their existing payload contracts; add direct tests for the new context root.
No Blocking Findings: Yes. This round closes the documented `Template Authoring V2` debt of having two parallel service branches without widening into `SchemaInjector` core or renderer work.
Validation Rerun Needed: Yes. Run wedding lint, build, focused tests, smoke, repo verify, and gate check after the patch.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `Template Authoring V2` now has one context root at `template-authoring/templateAuthoringService.js`; `InjectSchemaAction` and `ManualInjectAction` route through it while keeping their public methods stable; auto and manual service seams remain intact under the root; wedding lint, build, tests, smoke, repo verify, and gate check remain green.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_context_root_scope.md`
Remaining Limits: `SchemaInjector.js` remains the core policy engine by design; schema-tab rendering and inject policy planning are still separate concerns; route docs are unchanged in this runtime round.
Unverified But Suspected: none
