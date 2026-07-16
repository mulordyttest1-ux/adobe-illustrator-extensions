## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Improve template-phase `MISSING_FIELDS` operator guidance by making the postflight report the detailed source of truth and reducing duplicate missing-field detail in the inject toast.
- Execution mode: focused app-local hardening inside `wedding-cep / Template Authoring + Postflight`

## Files To Modify

- `wedding-cep/cep/js/logic/validators/rules/MissingFieldsRule.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.test.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- `wedding-cep/cep/js/logic/schema/SchemaInjector.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep`, does not touch `libs/shared`, `libs/wedding/domain`, `.jsx`, or bridge/runtime contracts.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_missing_fields_actionability_fix_scope.md`

## Notes Before Execution

- Keep `MISSING_FIELDS` as a template-phase global error only.
- Do not add new action button types or tab-navigation shortcuts.
- The report remains the detailed source of truth; the inject toast should stay short and non-duplicative.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: template-phase `MISSING_FIELDS` guidance only, centered on report copy, grouped details, and reduced duplicate toast detail.
Top Risks: repeating the missing-field list in both toast and report; accidentally widening the round into broader postflight wording changes; breaking template-only gating for `MissingFieldsRule`.
Required Fixes: keep `MissingFieldsRule` template-only; add grouped details for missing labels; update the inject toast to summary-only; extend the live schema smoke to prove both report guidance and condensed toast behavior.
No Blocking Findings: Yes. Current evidence supports a focused missing-fields actionability patch without changing widget contracts.
Validation Rerun Needed: Yes. Run full `wedding` lint, build, unit, smoke, verify, and gate check after the patch.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: template-phase missing-fields findings now render operator-first message, actionable hint, and grouped details in the postflight widget; the inject toast now collapses to a short summary; live auto-inject wiring still surfaces the missing labels through postflight and restores the button state.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not add a new widget action to jump into the Schema tab, and it does not widen the actionability cleanup to `SCHEMA_GAP` or `UNBOUND_FORM_DATA`.
Unverified But Suspected: if operators later still want one-click recovery from the report, that should reopen as a dedicated `/plan` for `MISSING_FIELDS` action affordances rather than extending this copy-focused fix.
