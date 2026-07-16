## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/logic/ux/validators/DateValidator.js` is a pure runtime validator seam, but it currently mixes field-range validation, date packet parsing, existence checks, sequence checks, and experience warnings in one file without direct coverage.
- Goal: split the pure support mechanics into a validator-local helper and add direct tests while keeping `DateValidator` as the public seam and preserving current behavior.
- Non-goals: do not change `DateGridController`, `InputEngine`, or domain date logic; do not redesign user-facing warning policy.

## Scope Lock

- Summary: add a local helper for field/date validation support, refactor `DateValidator.js` to use it, and add direct CI-safe tests for field range, invalid dates, sequence errors, and experience warnings.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/validators/DateValidator.js`
- `wedding-cep/cep/js/logic/ux/validators/dateValidationSupport.js`
- `wedding-cep/cep/js/logic/ux/validators/DateValidator.test.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/components/date-grid/DateGridController.js`
- `wedding-cep/cep/js/types.d.ts`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-assistance maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_date_validator_support_split_scope.md`

## Notes Before Execution

- Keep `DateValidator` as the public validator seam.
- Keep the new helper internal to the validator slice.
- Preserve current field-warning and date-logic behavior unless a direct regression test proves otherwise.

## Implementation Note

- Added `dateValidationSupport.js` as a validator-local helper for field-range validation, date packet parsing, existence checks, sequence checks, experience warnings, and blocking-warning detection.
- Refactored `DateValidator.js` so the public validator seam now delegates its pure support mechanics to the helper while preserving the existing warning/output contract.
- Extended `DateValidator.test.js` with focused coverage for invalid day/month ranges, impossible calendar dates, invalid `Lễ -> Tiệc` ordering, and experience warnings for far-future and large date gaps.

## Verification Gate

Claims Verified: `DateValidator` remains the public input-assistance validator seam; pure date-validation support mechanics now live in a local helper; and field validation, logical date ordering, invalid date detection, and warning severity behavior remain unchanged.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_date_validator_support_split_scope.md`.
Remaining Limits: this round only splits validator-local support logic; it does not refactor adjacent normalizers or widen the work into `DateGridController` or broader date-intelligence orchestration.
Unverified But Suspected: if another nearby cleanup round lands soon, the next best candidate is likely a normalizer/support seam rather than `AddressAutocomplete.js`, which is already comparatively small.

## Implementation Note

- Added `dateValidationSupport.js` as a validator-local helper for field-range warnings, date packet parsing, invalid-date detection, sequence checks, experience warnings, and blocking-warning checks.
- Refactored `DateValidator.js` so the public validator seam now delegates pure support mechanics to the helper while keeping the existing `validate(...)` and `validateDateLogic(...)` contract for consumers.
- Extended `DateValidator.test.js` with focused coverage for day/month range validation, impossible calendar dates, impossible `Lễ` versus `Tiệc` sequencing, and experience warnings for far-future dates and large gaps.

## Verification Gate

Claims Verified: `DateValidator` remains the public input-assistance validator seam; pure field/date validation support now lives in a local helper; and field-range, invalid-date, date-sequence, and experience-warning behavior remain intact for current consumers.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_date_validator_support_split_scope.md`.
Remaining Limits: this round only splits validator-local support logic; it does not redesign `DateGridController` or widen the work into broader date-normalization or domain policy changes.
Unverified But Suspected: if another date-related change lands soon, `DateNormalizer.js` is now a better next cleanup target than `AddressAutocomplete.js`, because the autocomplete seam is comparatively small while date normalization still concentrates more branching.
