## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js` is now the main orchestration seam left in the compact-form slice, but it still inlines runtime wiring and build sequencing and has no direct slice-level contract test.
- Goal: split builder support into a local helper and add direct tests while keeping `CompactFormBuilder` as the public compact-form orchestration seam and preserving current runtime behavior.
- Non-goals: do not redesign `CompactFormBindings`, `CompactFormState`, `FormComponents`, or `FormLogic`; do not change compact-form UX or bridge/data behavior.

## Scope Lock

- Summary: add a compact-form local support helper for builder runtime wiring and build sequencing, refactor `CompactFormBuilder.js` to use it, and add direct tests that lock the orchestration contract.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- `wedding-cep/cep/js/components/compact-form/compactFormBuilderSupport.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.test.js`
- `.task_steps/c2_wedding_compact_form_builder_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/FormComponents.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormState.js`
- `wedding-cep/cep/js/components/compact-form/FormLogic.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local compact-form maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_compact_form_builder_support_split_scope.md`

## Notes Before Execution

- Keep `CompactFormBuilder` as the public compact-form orchestration seam.
- Keep the new helper internal to the compact-form slice.
- Preserve current build order, `setTimeout(...setupAutoVenue, 0)` behavior, and state/binding passthrough methods.

## Implementation Note

- Added `compactFormBuilderSupport.js` as a compact-form local helper for builder runtime initialization, adapter wiring, and build-cycle sequencing.
- Refactored `CompactFormBuilder.js` so the public compact-form orchestration seam now delegates runtime wiring and build sequencing to the helper while preserving the same constructor shape, build order, and passthrough methods.
- Added `CompactFormBuilder.test.js` as direct slice-level coverage for builder initialization, build-cycle ordering, scheduled auto-venue setup, and state/binding passthrough behavior.

## Verification Gate

Claims Verified: `CompactFormBuilder` remains the public compact-form orchestration seam; runtime wiring and build-cycle support now live in a local helper; and builder initialization/build order/passthrough methods are covered directly without changing compact-form behavior.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_compact_form_builder_support_split_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts builder support and adds direct tests; it does not redesign `CompactFormBindings`, `CompactFormState`, `FormComponents`, or `FormLogic`.
Unverified But Suspected: if `Workspace / Form Entry` needs another cleanup pass soon, `CompactFormBindings.js` is now a more meaningful local target than reopening `CompactFormBuilder`, because builder orchestration has a direct contract test and only a small support seam remains.
