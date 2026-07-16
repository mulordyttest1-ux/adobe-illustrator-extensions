## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/logic/ux/normalizers/AddressNormalizer.js` is a pure runtime normalizer seam, but it currently mixes punctuation cleanup, title casing, abbreviation normalization, and Unicode dependency wiring in one file without direct focused coverage.
- Goal: split the pure address-normalization support mechanics into a normalizer-local helper and add direct tests while keeping `AddressNormalizer` as the public seam and preserving current behavior.
- Non-goals: do not change `InputEngine`, `AddressService`, or the address autocomplete search/index flow; do not widen the work into shared/domain address logic.

## Scope Lock

- Summary: add a local helper for address-normalization support, refactor `AddressNormalizer.js` to use it, and add direct CI-safe tests for punctuation cleanup, title casing, and abbreviation normalization.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/normalizers/AddressNormalizer.js`
- `wedding-cep/cep/js/logic/ux/normalizers/addressNormalizationSupport.js`
- `wedding-cep/cep/js/logic/ux/normalizers/AddressNormalizer.test.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-assistance maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_address_normalizer_support_split_scope.md`

## Notes Before Execution

- Keep `AddressNormalizer` as the public normalizer seam.
- Keep the new helper internal to the normalizer slice.
- Preserve current punctuation cleanup, title-case, and abbreviation behavior unless a direct regression test proves otherwise.
