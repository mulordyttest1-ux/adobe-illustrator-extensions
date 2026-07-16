# C2: Split `CompactFormBindings` Internal Field Wiring

## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `CompactFormBindings.js` is the main runtime entry for compact-form field wiring, but it currently mixes common field registration, idx syncing, auto-checkbox bootstrap, normalization feedback, and date-grid wiring in one file.
- Goal: extract the repeated field-wiring helpers into a local internal module so the compact-form entry becomes easier to read without changing user behavior.
- Non-goals: do not change `FormLogic`, `InputEngine`, `DateGridWidget`, field schemas, or any host/JSX/runtime contract.

## Scope Lock

- Summary: add a local helper module for common field registration and feedback wiring, then refactor `CompactFormBindings.js` to use it while preserving the existing public class and runtime behavior.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/fieldBindingHelpers.js`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.test.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- `wedding-cep/cep/js/components/compact-form/FormComponents.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local compact-form maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_compact_form_bindings_split_scope.md`

## Notes Before Execution

- Keep `CompactFormBindings` as the public slice entry.
- Keep new helpers internal to the compact-form slice.
- Do not widen this into a broader workspace/form rewrite.

## Implementation Note

- Added `fieldBindingHelpers.js` as an internal helper module for compact-form field registration, idx-sync wiring, auto-checkbox bootstrap, and normalization feedback.
- Refactored `CompactFormBindings.js` to delegate repeated field-wiring behavior to that helper while keeping the public class API unchanged.
- Left `FormLogic`, `InputEngine`, `DateGridWidget`, schema wiring, and host-facing code untouched.

## Verification Gate

Claims Verified: `CompactFormBindings` remains the public slice entry; repeated field registration and feedback logic now lives in a local helper; and the compact-form behavior remains unchanged across the existing unit and runtime lanes.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_compact_form_bindings_split_scope.md`.
Remaining Limits: this round improves local slice readability only; it does not yet split `FormLogic` or the broader workspace/form slice into more submodules.
Unverified But Suspected: if another real change lands in compact-form wiring, `AddressService.js` and `FormLogic.js` are still the next hotspot candidates inside the same bounded context.
