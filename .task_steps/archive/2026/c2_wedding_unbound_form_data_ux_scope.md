## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Humanize and contextualize the `UNBOUND_FORM_DATA` postflight warning in `wedding-cep` by adding a repo-native policy layer, schema-backed labels/groups, and a summary/details UI instead of raw schema-key dumps.
- Execution mode: Root-cause UX/policy fix inside `wedding-cep/postflight/report` only.

## Files To Modify

- `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.test.js`
- `wedding-cep/cep/js/logic/use-cases/support/schemaMeta.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.test.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`
- `wedding-cep/cep/js/logic/validators/rules/UnboundFormDataRule.js`
- `wedding-cep/cep/js/logic/validators/support/unboundFieldPolicy.js`
- `wedding-cep/cep/js/logic/validators/support/unboundFieldPolicy.test.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/data/schema.json`

## Cross-App Impact

- None. `symbol-cep` postflight hooks stay untouched.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_unbound_form_data_ux_scope.md`

## Notes Before Execution

- Keep `UNBOUND_FORM_DATA` as a real validation rule; do not disable it.
- Treat `ceremony.host_type` and `ceremony.diachi` as ignored by policy.
- Treat `date.<slot>.nam` and `date.<slot>.namyy` as equivalent coverage.
- Treat `date.nhap.*` as optional only when the current selection has no `date.nhap.*` binding at all.

## Review Gate

Scope Reviewed: `updateDocument -> UpdateAction -> PostflightValidator -> ValidationReportWidget` plus the new `schemaMeta` and `unboundFieldPolicy` seams in `wedding-cep`.
Top Risks: false-positive suppression hiding real gaps, over-broad optional handling for `date.nhap.*`, and widget disclosure UI leaking raw keys into the primary summary again.
Required Fixes: reduced `schemaMeta` helper complexity to satisfy lint without changing the returned contract.
No Blocking Findings: yes; self-review found no remaining blockers after the lint-driven helper cleanup.
Validation Rerun Needed: yes; reran `lint:wedding`, `build:wedding`, `test:wedding`, `test:smoke:wedding`, and `verify` after the final code shape landed.

## Verification Gate

Claims Verified: `UNBOUND_FORM_DATA` now applies repo-native ignore/equivalence/optional policy, forwards `schemaMeta` from update flow, renders grouped human-readable details in the widget, and keeps raw schema keys behind a collapsed technical disclosure.
Evidence Run: `npm run test:wedding`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:smoke:wedding`; `npm run verify`.
Remaining Limits: no smoke receipt asserts the exact grouped warning copy yet; that UX contract is currently protected by CI-safe validator/widget tests plus full wedding smoke regression.
Unverified But Suspected: none.
