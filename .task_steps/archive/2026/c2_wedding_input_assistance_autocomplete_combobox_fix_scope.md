## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Hardening the `wedding-cep` address autocomplete dropdown into a stable combobox/listbox surface, fixing popup anchoring drift, consolidating visual ownership, and locking keyboard/ARIA behavior with CI-safe and smoke coverage.
- Execution mode: Focused app-local bug fix in `wedding-cep` compact-form autocomplete only.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.js`
- `wedding-cep/cep/css/compact.css`
- `wedding-cep/cep/css/main.css`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.test.js`
- `wedding-cep/cep/debug_scripts/smoke_helpers.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/autocomplete_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/compactFormBindingSupport.js`
- `wedding-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. Scope is isolated to `wedding-cep` compact-form autocomplete behavior.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`

## Notes Before Execution

- Symptom:
  - Address autocomplete popup is rendered as a body-level `div` with `position: fixed`, so it drifts relative to the field when compact-form scrolls and has no combobox/listbox semantics.
  - Keyboard support is custom and incomplete; current smoke only proves item selection and separator formatting, not combobox behavior.
- Expected:
  - Popup remains anchored to the focused address field, follows reposition triggers, exposes combobox/listbox semantics, and supports stable keyboard selection.
- Actual:
  - `AddressService.bind()` appends a fixed-position popup to `document.body`.
  - `addressAutocompleteSupport.js` owns inline styling, item DOM, and keyboard behavior without ARIA state.
  - CSS ownership is split between `compact.css`, `main.css`, and inline styles.
- Hypotheses:
  1. Popup drift is caused by `createAutocompleteList()` hard-coding `position: fixed` plus one-shot geometry capture.
  2. Combobox accessibility and keyboard instability come from missing owner/listbox state (`aria-expanded`, `aria-activedescendant`, `role="option"`) rather than Fuse search itself.
  3. CSS drift comes from duplicate `.autocomplete-*` rules in global and compact styles combined with JS inline styling overriding both.
- Isolation:
  - Search and formatting logic live in `AddressAutocomplete` and `FuseAddressIndex`; they do not own popup DOM or field anchoring.
  - `CompactFormBindings` only delegates to `AddressService.bind()`, so the bug is local to compact-form autocomplete UI behavior.
  - Current smoke helper probes `.autocomplete-item` presence but does not assert roles or keyboard selection, leaving this gap unguarded.

## Symptom

- The dropdown works only as a custom popup, not as a stable combobox. It can drift on scroll, has split visual ownership, and lacks ARIA/keyboard guarantees.

## Hypotheses

1. The fixed-position body popup is the direct cause of anchor drift and stale geometry.
2. Missing combobox/listbox state causes keyboard focus and active-option behavior to be unreliable or unobservable.
3. Duplicate CSS ownership is masking UI regressions because JS inline styles override both `main.css` and `compact.css`.

## Isolation

- `AddressAutocomplete` and `FuseAddressIndex` remained unchanged; search ranking and formatting stayed outside this fix, confirming the issue was UI-state ownership rather than data lookup.
- Reproduced behavior was isolated to compact-form autocomplete DOM/state in `AddressService.js` and `addressAutocompleteSupport.js`, plus duplicated `.autocomplete-*` styling in `main.css` and `compact.css`.
- Smoke probes were extended to assert `role="combobox"`, `role="listbox"`, `role="option"`, keyboard selection path, and `aria-expanded` transitions, so the regression surface is now observable end to end.

## Root Cause

- The autocomplete popup was implemented as a body-level custom overlay with fixed-position geometry, inline visual styling, and class-only active state. That left popup anchoring dependent on ad hoc geometry updates, split CSS ownership across JS and two stylesheets, and exposed no stable combobox/listbox semantics.
- Keyboard selection state existed only in local DOM classes, so tests and smoke could not verify active descendant, option selection, or open/close contract. The missing ARIA owner/listbox contract was part of the bug, not just an accessibility omission.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: Address inputs now expose stable combobox semantics with `aria-autocomplete`, `aria-expanded`, `aria-controls`, and `aria-activedescendant`; suggestion popups now expose listbox/option semantics, keep active-option state in sync with CSS and ARIA, and support `ArrowUp/ArrowDown`, `Enter`, `Tab`, and `Escape`; visual ownership for compact-form autocomplete now lives in `compact.css`; CI-safe tests and smoke cover the combobox contract without changing Fuse search ranking or formatting behavior.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`.
Remaining Limits: smoke locks interaction contract and value updates, but it does not assert pixel-perfect popup geometry inside CEP; manual exploratory checks for every delimiter and scroll variant were not separately recorded beyond automated smoke coverage.
Unverified But Suspected: none.

## Postmortem

- Root cause confirmed: popup anchoring and keyboard instability came from custom overlay state living in JS-only geometry/class logic instead of a stable combobox/listbox contract with one CSS owner.
- False signal or discarded hypothesis: Fuse search logic and address formatting were not the source of the bug; they stayed unchanged.
- Guardrail that should have existed earlier: smoke should have asserted ARIA roles, `aria-expanded`, and keyboard selection path from the start instead of only verifying click selection.
- Reusable lesson: CEP panel widgets still benefit from modern semantic contracts. Even in compact internal UIs, ARIA/state ownership improves both behavior and testability.
