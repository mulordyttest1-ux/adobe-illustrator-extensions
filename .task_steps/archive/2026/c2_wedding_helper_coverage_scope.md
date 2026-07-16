## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Add direct CI-safe coverage for `SchemaLoader`, `TabbedPanel`, and `DomFactory`, and fix only source-verified mojibake literals touched in this round.
- Execution mode: focused maintenance hardening with behavior preservation

## Files To Modify

- `wedding-cep/cep/js/infrastructure/schemaLoader.js`
- `wedding-cep/cep/js/infrastructure/schemaLoader.test.js`
- `wedding-cep/cep/js/components/TabbedPanel.test.js`
- `wedding-cep/cep/js/components/helpers/DomFactory.test.js`
- `.task_steps/c2_wedding_helper_coverage_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/startup.test.js`
- `wedding-cep/cep/js/bootstrap/tabBoot.js`
- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`

## Cross-App Impact

- None. Scope is limited to `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_helper_coverage_scope.md`

## Notes Before Execution

- Only fix mojibake if raw file inspection confirms the source literal is wrong.
- Do not refactor public APIs for `SchemaLoader`, `TabbedPanel`, or `DomFactory`.
- Keep the round limited to direct coverage and source-verified text hygiene.

## Review Gate

Scope Reviewed: `wedding-cep` helper/boundary maintenance hardening across direct coverage for `SchemaLoader`, `TabbedPanel`, and `DomFactory`, plus source-verified text hygiene for `SchemaLoader`.
Top Risks: adding brittle fake-DOM harnesses that do not match current component behavior; accidentally changing user-facing wording in files whose source was already correct; leaking cache state across `SchemaLoader` tests; broadening this maintenance round into another structural refactor.
Required Fixes: none.
No Blocking Findings: `SchemaLoader`, `TabbedPanel`, and `DomFactory` kept their public APIs intact; only the `SchemaLoader` error string was changed because raw file inspection confirmed the source literal itself was wrong; `startup.js`, `TabbedPanel.js`, and `DomFactory.js` were left untouched because file inspection showed their source literals were already correct.
Validation Rerun Needed: no

## Verification Gate

Claims Verified: `SchemaLoader` now has direct coverage for load/cache/reset and failure paths; `TabbedPanel` now has direct coverage for first-tab activation, lazy loading, reload, warning paths, and controller-failure rendering; `DomFactory` now has direct coverage for radio/input/select/checkbox builders and debounce behavior; the localized `SchemaLoader` error text is fixed in source and the rest of the suspected mojibake candidates were not changed because file inspection did not justify it.
Evidence Run: `npm run test:wedding`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round adds coverage and one source-verified wording fix only; it does not attempt repo-wide text cleanup or new architecture changes.
Unverified But Suspected: none
