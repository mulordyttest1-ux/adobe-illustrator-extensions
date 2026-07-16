## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js` is the remaining autocomplete-tail seam called out by architecture, but it still mixes host file reads, index-builder selection, mutable state reset, and formatting in one runtime facade.
- Goal: split local runtime support for address autocomplete initialization and formatting into an internal helper, keep `AddressAutocomplete` as the public facade, and lock fail-soft state reset with direct coverage.
- Non-goals: do not redesign `FuseAddressIndex`, `AddressService`, or startup resource ordering; do not change autocomplete query semantics or dropdown UX.

## Scope Lock

- Summary: add an internal runtime support helper for address autocomplete data loading/index building/state reset/formatting, refactor `AddressAutocomplete.js` to use it, and add direct tests for the support seam and fail-soft reset behavior.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js`
- `wedding-cep/cep/js/logic/ux/addressAutocompleteRuntimeSupport.js`
- `wedding-cep/cep/js/logic/ux/addressAutocompleteRuntimeSupport.test.js`
- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.test.js`
- `.task_steps/c2_wedding_address_autocomplete_runtime_support_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/js/bootstrap/startupResources.test.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/autocomplete_smoke_tests.cjs`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local autocomplete maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_address_autocomplete_runtime_support_scope.md`

## Notes Before Execution

- Keep `AddressAutocomplete` as the public autocomplete facade.
- Keep `FuseAddressIndex` as the only runtime adapter that touches `globalThis.Fuse`.
- Preserve startup soft-fail behavior and current query/format semantics.

## Implementation Note

- Added `addressAutocompleteRuntimeSupport.js` as an internal autocomplete helper for host data loading, index-builder selection, mutable state reset, and address formatting.
- Refactored `AddressAutocomplete.js` so the public autocomplete facade now delegates runtime support concerns to the helper while keeping the same `init/search/format` surface and `FuseAddressIndex` boundary.
- Added `addressAutocompleteRuntimeSupport.test.js` and strengthened `AddressAutocomplete.test.js` so fail-soft init now explicitly clears stale autocomplete data instead of leaving old state behind after an init failure.

## Verification Gate

Claims Verified: `AddressAutocomplete` remains the public autocomplete facade; runtime support noise now lives in a local helper; `FuseAddressIndex` still owns the vendor-global boundary; and failed init clears stale mutable state while preserving current query/format behavior.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_address_autocomplete_runtime_support_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only refactors autocomplete runtime support and fail-soft state handling; it does not redesign `AddressService`, `InputEngine`, or startup ordering.
Unverified But Suspected: if `Input Assistance` gets another cleanup pass soon, `startupResources.js` is a better seam than reopening `AddressAutocomplete`, because the facade is now thin and the remaining complexity is more about startup orchestration than autocomplete internals.
