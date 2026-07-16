## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/logic/ux/normalizers/DateNormalizer.js` is a pure runtime normalizer seam, but it currently mixes text extraction, smart typo recovery, limit lookup, and zero-padding in one file without direct focused coverage.
- Goal: split the pure date-normalization support mechanics into a normalizer-local helper and add direct tests while keeping `DateNormalizer` as the public seam and preserving current behavior.
- Non-goals: do not change `InputEngine`, `DateGridController`, or the validator/date-logic warning policy; do not widen the work into domain date conversion.

## Scope Lock

- Summary: add a local helper for date-normalization support, refactor `DateNormalizer.js` to use it, and add direct CI-safe tests for extraction, typo recovery, and padding behavior.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/normalizers/DateNormalizer.js`
- `wedding-cep/cep/js/logic/ux/normalizers/dateNormalizationSupport.js`
- `wedding-cep/cep/js/logic/ux/normalizers/DateNormalizer.test.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/components/date-grid/DateGridController.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-assistance maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_date_normalizer_support_split_scope.md`

## Notes Before Execution

- Keep `DateNormalizer` as the public normalizer seam.
- Keep the new helper internal to the normalizer slice.
- Preserve current extraction, typo-recovery, and zero-padding behavior unless a direct regression test proves otherwise.

## Implementation Note

- Added `dateNormalizationSupport.js` as a normalizer-local helper for text extraction, smart typo recovery, zero-padding, and shared limit lookup.
- Refactored `DateNormalizer.js` so the public normalizer seam now delegates its pure support mechanics to the helper while keeping `DateNormalizer.LIMITS` and `DateNormalizer.normalize(...)` intact for existing consumers.
- Added `DateNormalizer.test.js` with focused CI-safe coverage for extracted text input, typo recovery, year passthrough, and shorthand month/hour parsing behavior.

## Verification Gate

Claims Verified: `DateNormalizer` remains the public input-assistance normalizer seam; pure normalization support mechanics now live in a local helper; and extraction, typo recovery, and zero-padding behavior remain unchanged for runtime consumers.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_date_normalizer_support_split_scope.md`.
Remaining Limits: this round only splits normalizer-local support logic; it does not refactor adjacent address/name normalizers or widen the work into `InputEngine` orchestration.
Unverified But Suspected: the next worthwhile runtime cleanup in this bounded context is more likely another pure normalizer seam than `AddressAutocomplete.js`, which is already comparatively small and isolated.
