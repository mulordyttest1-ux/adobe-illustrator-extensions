# C2: Wedding Guardrails Public Contracts

Normalized Receipt:
- intent: refactor
- route: /build
- goal: lock the current living public seams of `wedding-cep`, reroute existing callers through those seams, and add architecture enforcement without changing feature behavior
- success_criteria: seam docs are explicit, internal template-authoring helpers are no longer imported directly by actions, context-aware dep-check fails the retired/internal paths, and wedding validation stays green
- scope_guess: `wedding-cep/ARCHITECTURE.md`, `wedding-cep/FEATURE_MAP.md`, template-authoring actions/services, `wedding-cep/cep/scripts/check_architecture*.cjs`, app-local tests
- constraints: keep scope app-local, no new generic facade bucket, no bridge/JSX contract redesign, preserve runtime behavior
- unknowns: smoke runtime availability on `localhost:9097`
- approval_needed: no

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: lock the current living public seam registry for `wedding-cep`, reroute template-authoring actions through the existing context root, and upgrade the architecture checker from layer-only to layer-plus-context enforcement without changing runtime behavior.
- Execution mode: phased-safe guardrail pass inside `wedding-cep` docs, template-authoring seams, and architecture tooling only

## Files To Modify

- `.task_steps/c2_wedding_guardrails_public_contracts_scope.md`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/cep/scripts/check_architecture.cjs`
- `wedding-cep/cep/scripts/check_architecture_support.cjs`
- `wedding-cep/cep/js/infrastructure/checkArchitectureSupport.test.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.test.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.test.js`
- `wedding-cep/cep/js/actions/support/selectionPlanIO.js` (retired)
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringIO.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringIO.test.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/tabBootSupport.js`
- `wedding-cep/cep/js/bootstrap/wireActions.js`
- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/TabbedPanel.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringService.js`
- `wedding-cep/cep/package.json`

## Cross-App Impact

- None. This round stays inside `wedding-cep` runtime seams and app-local architecture tooling. No `libs/shared`, `libs/wedding/domain`, bridge payload, or JSX contract changes are intended.

## Validation Targets

- `npm --workspace wedding-scripter-cep run dep-check`
- `npm run check:encoding`
- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_guardrails_public_contracts_scope.md`

## Notes Before Execution

- Keep runtime behavior stable; this round changes routing and enforcement, not feature semantics.
- Do not add a generic `cep/js/facades/` bucket.
- Keep `bridge.js`, `ValidationReportWidget.js`, `SchemaTabComponents.js`, and `schemaTabConfig.js` as explicit temporary public seams in Slice 1.
- If checker rollout finds widespread false positives, narrow hard-fail rules to the cleaned contexts in this slice only instead of weakening the entire registry idea.
- Lint follow-up touched existing postflight files only to satisfy local rule pressure without changing intended widget behavior or selection semantics.

## Review Gate

Scope Reviewed: `wedding-cep` seam docs, template-authoring action reroute, context-aware architecture checker, and the postflight lint follow-up files touched during validation.
Top Risks: false positives from the new context registry blocking legitimate same-context imports; action reroute dropping live template-authoring defaults or button/toast behavior; scope creep caused by lint pressure in already-dirty postflight files.
Required Fixes: none.
No Blocking Findings: yes; the final state matches Slice 1 direction, keeps temporary public exceptions explicit, and no longer bypasses the template-authoring context root from the action layer.
Validation Rerun Needed: no; code-affecting follow-up edits were already rerun through dep-check, lint, build, unit/integration, and live smoke before closing this gate.

## Verification Gate

Claims Verified: public seam registry is now documented in `ARCHITECTURE.md` and `FEATURE_MAP.md`; `InjectSchemaAction` and `ManualInjectAction` now route through `templateAuthoringService.js` instead of importing template-authoring internals directly; `selectionPlanIO.js` is retired and replaced by template-authoring-local IO helpers; `dep-check` now enforces context-public-entry rules for workspace, document sync, template authoring, postflight helper rendering, and the retired action helper path; `wedding-cep` build, lint, tests, and live smoke stay green with these guardrails in place.
Evidence Run: `npm --workspace wedding-scripter-cep run dep-check` PASS; `npm run check:encoding` PASS; `npm run lint:wedding` PASS; `npm run build:wedding` PASS; `npm run test:wedding` PASS; `npm run test:smoke:wedding` PASS (24/24, including template-authoring and postflight live wiring paths on `localhost:9097`).
Remaining Limits: Slice 1 still keeps `bridge.js`, `ValidationReportWidget.js`, `SchemaTabComponents.js`, and `schemaTabConfig.js` as temporary seams; this round documents and enforces current living seams but does not yet introduce the later dedicated facades or Host ACL planned for subsequent slices.
Unverified But Suspected: later slices may expose additional cross-context bypasses once more contexts are hardened; no current evidence shows blocker-level false positives in the `wedding-cep` lane after the cleaned contexts in this slice.

## Micro-Postmortem

- False assumption: rerouting actions through the template-authoring context root looked complete at the action-test level, but the first live smoke exposed that the default `runInjectSchemaDocument` dependency had been dropped from the service path.
- Guardrail that should have fired sooner: an integration assertion for `runTemplateAuthoringService({ mode: 'auto' })` with default deps, or running the live schema smoke earlier in the slice.
- Reusable lesson: when collapsing action helpers into a context root, verify the context root's default dependency graph separately from the action mocks so transport-safe live behavior does not regress silently.
