## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js` is still the public compact-form binding seam, but it still mixes runtime dependency resolution, idx-state UI updates, field wiring helpers, and date-grid mounting in one file.
- Goal: extract local compact-form binding support helpers so `CompactFormBindings` stays the public binding seam while local runtime resolution and field-wiring mechanics become easier to scan and test directly.
- Non-goals: do not redesign compact-form state contracts, change `fieldBindingHelpers`, or alter input normalization, auto-checkbox, idx-lock, or date-grid behavior.

## Scope Lock

- Summary: add a local compact-form binding support helper for runtime dependency resolution, idx-state UI updates, field creation/binding mechanics, and date-grid mounting; refactor `CompactFormBindings.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/compactFormBindingSupport.js`
- `wedding-cep/cep/js/components/compact-form/compactFormBindingSupport.test.js`
- `.task_steps/c2_wedding_compact_form_bindings_support_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- `wedding-cep/cep/js/components/compact-form/FormComponents.js`
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
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_compact_form_bindings_support_scope.md`

## Notes Before Execution

- Keep `CompactFormBindings.js` as the public compact-form binding seam.
- Keep the new helper internal to the compact-form slice.
- Preserve current input normalization, auto-checkbox bootstrap, idx-lock behavior, and date-grid change wiring.

## Implementation Note

- Added `compactFormBindingSupport.js` as a compact-form local helper for runtime dependency resolution, idx-state UI updates, field creation/binding mechanics, and date-grid mounting.
- Refactored `CompactFormBindings.js` so the public compact-form binding seam now delegates local runtime wiring and field-binding mechanics to the support helper while preserving the same normalization, auto-checkbox, idx-lock, and date-grid behaviors.
- Added `compactFormBindingSupport.test.js` as direct support coverage for override-aware runtime resolution, idx-state UI updates, bound field wiring, and date-grid change-handler mounting.

## Verification Gate

Claims Verified: `CompactFormBindings.js` remains the public compact-form binding seam; local support now owns runtime resolution, idx-state UI updates, field-binding mechanics, and date-grid mounting; and compact-form normalization, auto-checkbox bootstrap, idx-lock behavior, and date-grid change wiring stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_compact_form_bindings_support_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local binding support and adds direct tests; it does not redesign compact-form state contracts, `fieldBindingHelpers`, or compact-form UX behavior.
Unverified But Suspected: after this split, the next meaningful cleanup in `Workspace / Form Entry` is more likely to be a domain-heavy seam such as `FormLogic.js` than reopening `CompactFormBindings.js`.
