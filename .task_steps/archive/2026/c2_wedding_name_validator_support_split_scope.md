## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/logic/ux/validators/NameValidator.js` is the main input-assistance validator seam for names, but it currently mixes rule execution, fallback ethnic detection, surname normalization, phonetic bypass heuristics, and warning validity checks in one object.
- Goal: split those pure support mechanics into a validator-local helper while keeping `NameValidator` as the public seam and preserving warning/output behavior.
- Non-goals: do not change `EthnicNameNormalizer`, `VietnamesePhonetics`, or widen the work into a domain/shared-name redesign.

## Scope Lock

- Summary: add a validator-local helper module for pure name-validation support functions, refactor `NameValidator.js` to use it, and add focused helper coverage without changing the validator's public API.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/validators/NameValidator.js`
- `wedding-cep/cep/js/logic/ux/validators/nameValidationSupport.js`
- `wedding-cep/cep/js/logic/ux/validators/NameValidator.test.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/logic/ux/normalizers/EthnicNameNormalizer.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-assistance maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_name_validator_support_split_scope.md`

## Notes Before Execution

- Keep `NameValidator` as the public validator seam.
- Keep the new helper internal to the validator slice.
- Preserve current warning types, severity behavior, ethnic fallback, and smart idx behavior.

## Implementation Note

- Added `nameValidationSupport.js` as a validator-local helper for rule execution, blocking-warning detection, fallback ethnic detection, surname normalization, and phonetic bypass predicates.
- Refactored `NameValidator.js` so the public validator seam now delegates these pure support mechanics to the helper while keeping its existing warning contract and consumer-facing API.
- Extended `NameValidator.test.js` with focused helper coverage for fallback ethnic detection, surname normalization, blocking-warning checks, and phonetic bypass behavior.

## Verification Gate

Claims Verified: `NameValidator` remains the public input-assistance validator seam; pure support mechanics now live in a local helper; and ethnic fallback, smart idx delegation, warning severity handling, and panel smoke behavior remain unchanged.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_name_validator_support_split_scope.md`.
Remaining Limits: this round only splits validator-local support logic; it does not refactor `AddressAutocomplete.js` or widen the work into a broader input-assistance architecture pass.
Unverified But Suspected: if another real input-assistance change lands soon, `AddressAutocomplete.js` is now the clearest remaining hotspot in that bounded context.
