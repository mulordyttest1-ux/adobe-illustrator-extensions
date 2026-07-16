## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/FormLogic.js` is still the main compact-form venue-automation seam, but it still mixes venue context creation, trigger wiring, auto-refresh rules, and trusted manual-cancel logic in one file.
- Goal: extract local form-logic support helpers so `FormLogic` stays the public venue-automation seam while local context/wiring/update mechanics become easier to scan and test directly.
- Non-goals: do not change wedding venue business rules, `VenueAutomation.generateVenueName(...)`, or trusted-input semantics for auto-cancel behavior.

## Scope Lock

- Summary: add a local compact-form logic support helper for venue context creation, trigger wiring, auto-refresh behavior, and trusted manual-cancel logic; refactor `FormLogic.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/FormLogic.js`
- `wedding-cep/cep/js/components/compact-form/formLogicSupport.js`
- `wedding-cep/cep/js/components/compact-form/formLogicSupport.test.js`
- `.task_steps/c2_wedding_form_logic_support_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/FormLogic.test.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local compact-form venue automation maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_form_logic_support_scope.md`

## Notes Before Execution

- Keep `FormLogic.js` as the public compact-form venue-automation seam.
- Keep the new helper internal to the compact-form slice.
- Preserve current host-selection triggers, venue label generation, auto-checkbox refresh rules, and trusted manual-cancel behavior.

## Implementation Note

- Added `formLogicSupport.js` as a compact-form local helper for venue context creation, trigger wiring, host switching, venue refresh, and trusted manual-cancel logic.
- Refactored `FormLogic.js` so the public compact-form venue-automation seam now delegates local context/wiring/update mechanics to the support helper while preserving the same `InputEngine.process(...)` callback on ceremony address reshaping.
- Added `formLogicSupport.test.js` as direct support coverage for context creation, trigger wiring, host switching, venue refresh, and trusted manual-cancel behavior.

## Verification Gate

Claims Verified: `FormLogic.js` remains the public compact-form venue-automation seam; local support now owns venue context creation, trigger wiring, host switching, venue refresh, and trusted manual-cancel logic; and current host-selection, venue-label, auto-checkbox, and ceremony-address-shaping behavior stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_form_logic_support_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local `FormLogic` support and adds direct tests; it does not change wedding venue business rules, `VenueAutomation.generateVenueName(...)`, or trusted-input semantics.
Unverified But Suspected: the fallback `Tư Gia ${hostValue}` label path is now more visible in the helper seam and is a reasonable narrow test to add later if this slice changes again.
