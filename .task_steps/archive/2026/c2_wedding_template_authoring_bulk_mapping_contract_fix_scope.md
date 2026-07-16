## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Align the operator-facing bulk inject contract with the existing runtime mapping by updating copy, tests, and one live schema smoke without changing planner behavior.
- Execution mode: focused app-local hardening inside `wedding-cep / Template Authoring`

## Files To Modify

- `wedding-cep/cep/js/components/schema-tab/schemaTabConfig.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.test.js`
- `wedding-cep/cep/js/components/schema-tab/SchemaTabComponents.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/wireActions.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectionPlanner.js`
- `wedding-cep/cep/js/logic/ux/LayoutUtils.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep`, does not touch `libs/shared`, `libs/wedding/domain`, `.jsx`, or bridge/runtime contracts.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_bulk_mapping_contract_fix_scope.md`

## Notes Before Execution

- Keep the planner/runtime contract unchanged: top-down remains `Ông Bà -> Ông -> Bà -> Đ/C`.
- Fix only operator-visible drift and missing smoke parity.
- If later product evidence proves address-first is the real intent, that must route through a new `/plan`.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: bulk inject operator contract only, centered on copy alignment and one live smoke for the existing runtime order.
Top Risks: drifting copy in one place while leaving another address-first string behind; adding a smoke that accidentally proves only stub behavior instead of the real schema button path.
Required Fixes: update schema-tab help text and invalid-count warning together; keep planner code untouched; assert live `btn-bulk-pos1` click reaches `applyPlan` with canonical top-down order.
No Blocking Findings: Yes. Current evidence supports copy/test hardening, not a planner rewrite.
Validation Rerun Needed: Yes. Run full `wedding` lint, build, unit, smoke, verify, and gate check after the patch.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: bulk inject no longer exposes any address-first operator copy; the live schema-tab button still drives the same top-down runtime mapping `Ông Bà -> Ông -> Bà -> Đ/C`; the new smoke proves `btn-bulk-pos1` reaches `applyPlan` with the canonical plan order and restores button state.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not add manual `dateClone` live smoke or change the success toast wording because the current generic success path is not contract-breaking.
Unverified But Suspected: if later product evidence shows address-first is the intended bulk order, that must reopen as a new planner/runtime `/plan`, not as an extension of this receipt.
