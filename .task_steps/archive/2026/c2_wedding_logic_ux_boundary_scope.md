## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Rationalize `wedding-cep` `logic/ux` boundaries by extracting `FieldTypeResolver`, isolating `Fuse` access behind a search adapter, and adding direct CI-safe coverage for input/name/address logic.
- Execution mode: focused in-app refactor with behavior preservation

## Files To Modify

- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js`
- `wedding-cep/cep/js/logic/ux/input/FieldTypeResolver.js`
- `wedding-cep/cep/js/logic/ux/search/FuseAddressIndex.js`
- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.test.js`
- `wedding-cep/cep/js/logic/ux/input/FieldTypeResolver.test.js`
- `wedding-cep/cep/js/logic/ux/InputEngine.test.js`
- `wedding-cep/cep/js/logic/ux/search/FuseAddressIndex.test.js`
- `wedding-cep/cep/js/logic/ux/validators/NameValidator.test.js`
- `wedding-cep/cep/js/logic/ux/normalizers/EthnicNameNormalizer.test.js`
- `wedding-cep/cep/eslint.config.mjs`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/cep/README.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/FormLogic.js`
- `wedding-cep/cep/js/components/date-grid/DateGridController.js`
- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/js/bootstrap/testApi.js`
- `wedding-cep/cep/index.html`

## Cross-App Impact

- None. Scope is limited to `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_logic_ux_boundary_scope.md`

## Notes Before Execution

- Keep public facades for `InputEngine`, `AddressAutocomplete`, `NameValidator`, and `EthnicNameNormalizer`.
- Do not change `index.html` vendor loading of `fuse.basic.min.js` in this round.
- Isolate raw `Fuse` access to one adapter file only.
- Keep warnings/messages and runtime behavior unchanged.

## Review Gate

Scope Reviewed: `wedding-cep` `logic/ux` boundary cleanup across input routing, Fuse vendor isolation, direct UX tests, eslint guard, and architecture/docs updates.
Top Risks: accidentally changing `InputEngine` behavior for compact-form/date-grid; breaking address autocomplete runtime by bypassing the vendor script load; over-tightening lint rules and blocking the one allowed adapter; drifting architecture docs away from the implemented state.
Required Fixes: one test expectation was corrected to match existing `EthnicNameNormalizer.normalize()` behavior when no dictionary is loaded.
No Blocking Findings: public facades for `InputEngine`, `AddressAutocomplete`, `NameValidator`, and `EthnicNameNormalizer` stayed intact; raw `Fuse` access is centralized in `FuseAddressIndex`; coverage now exists directly for field-type routing, address search, and ethnic-name behavior.
Validation Rerun Needed: no

## Verification Gate

Claims Verified: `InputEngine` now delegates field-type detection to `FieldTypeResolver`; `AddressAutocomplete` no longer creates `Fuse` directly; the only allowed runtime `Fuse` access is `ux/search/FuseAddressIndex.js`; direct CI-safe tests now protect `InputEngine`, `FieldTypeResolver`, `FuseAddressIndex`, `NameValidator`, and `EthnicNameNormalizer`; docs now reflect P1/P2/P3 as completed and shift the next phase to polish work.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: `index.html` still loads `fuse.basic.min.js` globally by design in this round; the vendor loading mode itself was not changed.
Unverified But Suspected: none
