## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Lock the remaining `Fuse` runtime contract in `wedding-cep` by adding a static vendor-script guard, strengthening adapter tests, upgrading the autocomplete smoke receipt, and trimming legacy autocomplete notes.
- Execution mode: focused in-app polish with behavior preservation

## Files To Modify

- `wedding-cep/cep/scripts/check_architecture.cjs`
- `wedding-cep/cep/js/logic/ux/search/FuseAddressIndex.test.js`
- `wedding-cep/cep/debug_scripts/smoke_helpers.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/cep/README.md`

## Consumers Verified

- `wedding-cep/cep/index.html`
- `wedding-cep/cep/js/logic/ux/search/FuseAddressIndex.js`
- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. Scope is limited to `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_fuse_runtime_contract_scope.md`

## Notes Before Execution

- Keep `Fuse` as a vendor global loaded from `index.html` in this round.
- Do not change autocomplete behavior or script-loading strategy beyond enforcing the existing contract.
- Prefer upgrading the existing autocomplete smoke over adding a new smoke case.

## Review Gate

Scope Reviewed: `wedding-cep` Fuse runtime contract hardening across static vendor-script guard, autocomplete smoke receipt, Fuse adapter tests, autocomplete notes cleanup, and architecture/docs updates.
Top Risks: breaking CEP runtime by over-constraining `index.html` script checks; weakening autocomplete smoke with bad test literals; changing `AddressService` behavior while only trying to clean comments; allowing a second raw `Fuse` entrypoint to slip past the new guard.
Required Fixes: the first smoke rewrite copied terminal-rendered mojibake into `schema_smoke_tests.cjs`; that file was rewritten with correct UTF-8 literals before final validation.
No Blocking Findings: the static guard now enforces one `fuse.basic.min.js` script before `js/bundle.js`; the autocomplete smoke asserts `globalThis.Fuse` exists at runtime before probing behavior; `FuseAddressIndex` is still the only runtime adapter allowed to touch vendor `Fuse`.
Validation Rerun Needed: no

## Verification Gate

Claims Verified: `index.html` is now protected by a static contract check for single-load and script order; autocomplete smoke now verifies the runtime `Fuse` global before asserting dropdown behavior; `FuseAddressIndex` has direct test coverage for global fallback and missing ctor failure; `AddressService` comments now describe the post-P3 boundary accurately; docs now record the Fuse runtime contract explicitly.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: `Fuse` is still loaded as a global vendor from `index.html` by design in this round; the contract is hardened, not replaced with bundled/module loading.
Unverified But Suspected: none
