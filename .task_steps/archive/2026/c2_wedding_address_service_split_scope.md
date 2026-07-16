## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/AddressService.js` is the compact-form entry for address autocomplete, but its `bind()` flow currently mixes address-field routing, dropdown lifecycle, active-item state, highlight rendering, and selection side effects in one hotspot.
- Goal: split repeated autocomplete support mechanics into a compact-form-local helper while keeping `AddressService` as the public entry and preserving current behavior.
- Non-goals: do not change `AddressAutocomplete`, Fuse runtime wiring, schema logic, or any host/runtime contract outside compact-form.

## Scope Lock

- Summary: add an internal helper module for address-field detection and autocomplete list support, refactor `AddressService.js` to use it, and add focused CI-safe tests for the new helper seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.js`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.test.js`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/AddressService.test.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local compact-form maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_address_service_split_scope.md`

## Notes Before Execution

- Keep `AddressService` as the public compact-form seam.
- Keep the new helper internal to the compact-form slice.
- Preserve the current dropdown interaction contract and inherited separator behavior.

## Implementation Note

- Added `addressAutocompleteSupport.js` as a compact-form-local helper for address-field detection, autocomplete list lifecycle, match highlighting, and keydown navigation support.
- Refactored `AddressService.js` so it still owns the public compact-form autocomplete seam while delegating dropdown support mechanics to the helper.
- Added focused CI-safe helper tests in `addressAutocompleteSupport.test.js` without changing `AddressAutocomplete` or Fuse runtime wiring.

## Verification Gate

Claims Verified: `AddressService` remains the public compact-form autocomplete seam; repeated dropdown support logic now lives in a local helper; and inherited separator behavior plus autocomplete runtime flow remain unchanged in unit and smoke lanes.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_address_service_split_scope.md`.
Remaining Limits: this round improves compact-form-local readability only; it does not change `AddressAutocomplete` itself or widen the slice into a broader input-assistance refactor.
Unverified But Suspected: if another real change lands in autocomplete or compact-form plumbing, the next likely hotspot will be either `AddressAutocomplete.js` in `Input Assistance` or another compact-form orchestration seam rather than the helper just introduced.
