## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/logic/ux/normalizers/EthnicNameNormalizer.js` is a pure runtime hotspot in `Input Assistance`, but it currently mixes cache setup, kinship/prefix/surname heuristics, and public normalization/detection methods in one large object.
- Goal: split the pure support mechanics into a local helper while keeping `EthnicNameNormalizer` as the public normalizer contract and preserving behavior.
- Non-goals: do not move this logic into `@wedding/domain`, do not change `NameValidator`, and do not widen the work into a broader name-processing redesign.

## Scope Lock

- Summary: add a normalizer-local helper module for cache construction and ethnic detection helpers, refactor `EthnicNameNormalizer.js` to use it, and extend tests for diacritic normalization plus multi-word surname detection.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/normalizers/EthnicNameNormalizer.js`
- `wedding-cep/cep/js/logic/ux/normalizers/ethnicNameSupport.js`
- `wedding-cep/cep/js/logic/ux/normalizers/EthnicNameNormalizer.test.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/validators/NameValidator.js`
- `wedding-cep/cep/js/bootstrap/loadCepData.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-assistance maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_ethnic_name_support_split_scope.md`

## Notes Before Execution

- Keep `EthnicNameNormalizer` as the public UX normalizer seam.
- Keep the new helper internal to the normalizer slice.
- Preserve current `NameValidator` behavior and bootstrap loading flow.

## Implementation Note

- Added `ethnicNameSupport.js` as a normalizer-local helper for cache construction, kinship extraction, ethnic prefix detection, ethnic surname detection, and standalone prefix checks.
- Refactored `EthnicNameNormalizer.js` so the public normalizer object remains unchanged while delegating pure support mechanics to the helper.
- Extended `EthnicNameNormalizer.test.js` to cover configured diacritic normalization and multi-word surname detection in addition to the existing ethnic-name and safe-default paths.

## Verification Gate

Claims Verified: `EthnicNameNormalizer` remains the public input-assistance normalizer seam; pure support mechanics now live in a local helper; and ethnic detection, smart idx suggestion, configured diacritic normalization, and panel smoke paths continue to behave as before.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_ethnic_name_support_split_scope.md`.
Remaining Limits: one smoke rerun was needed because the first pass showed a transient host-selection failure in the unrelated auto-inject test; the immediate rerun passed clean, so this milestone does not include a separate `/fix`.
Unverified But Suspected: if another real change lands in `Input Assistance`, the next hotspot is more likely to be a consumer seam such as `NameValidator.js` or `AddressAutocomplete.js` than the helper just introduced.
