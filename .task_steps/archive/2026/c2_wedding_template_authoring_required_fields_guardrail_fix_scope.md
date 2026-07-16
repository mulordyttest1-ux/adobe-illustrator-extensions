## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Restore the live `missedRequired` producer path in `Template Authoring` so auto inject can surface real template-phase missing-field guardrails again without introducing any new required-field system.
- Execution mode: focused runtime bug fix inside `wedding-cep` template-authoring producer + smoke/test surfaces only

## Files To Modify

- `wedding-cep/cep/js/logic/schema/SchemaInjector.js`
- `wedding-cep/cep/js/logic/schema/SchemaInjector.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.js`
- `wedding-cep/cep/js/logic/validators/rules/MissingFieldsRule.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep`, does not touch `libs/shared`, `libs/wedding/domain`, `.jsx`, or bridge payload contracts, and does not change public action signatures.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_required_fields_guardrail_fix_scope.md`

## Notes Before Execution

- Reuse repo-native required-field policy already present in app history; do not introduce schema metadata or a new required-field engine.
- Keep `InjectSchemaAction.execute(...)` and the template-phase postflight contract stable.
- Do not widen this round into manual bulk/date-clone fixes or `SchemaInjector` cleanup.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Template Authoring` Slice A only, centered on restoring the real producer path for `missedRequired` so auto inject can surface `MISSING_FIELDS` again.
Top Risks: restoring historical required-field policy could accidentally change which labels appear in the report; smoke could prove only the widget path while missing the real auto-inject action wiring.
Required Fixes: derive `missedRequired` from the real replacement set inside `SchemaInjector`; add one direct producer regression; add one panel-side schema smoke that clicks the real auto-inject button and asserts the missing-fields report appears.
No Blocking Findings: Yes. The fix stays app-local and uses repo-native policy instead of inventing a new required-field system.
Validation Rerun Needed: Yes. Run full `wedding` lint, build, unit, smoke, verify, and gate check after the patch.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `SchemaInjector.computeChanges(...)` no longer returns an inert `missedRequired` contract; auto inject can now surface template-phase `MISSING_FIELDS` through the real postflight widget path; the fix stays inside `wedding-cep` and preserves existing action/service contracts.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_required_fields_guardrail_fix_scope.md`
Remaining Limits: Wave 2 still has deferred follow-ups for bulk inject copy drift, auto happy-path smoke parity, date-clone smoke parity, and mixed-side `vithu` inference.
Unverified But Suspected: none
