## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/FormComponents.js` is the main render builder for the compact-form slice, but it still mixes static option/config data with panel assembly and has no direct slice-level test coverage.
- Goal: split compact-form render config/support into a local helper and add direct tests while keeping `FormComponents` as the public render seam and preserving existing adapter contracts.
- Non-goals: do not redesign `CompactFormBuilder`, `CompactFormBindings`, or `FormLogic`; do not change user-facing compact-form behavior.

## Scope Lock

- Summary: add a compact-form local support helper for render config/constants, refactor `FormComponents.js` to use it, and add direct tests that lock the adapter contract for each rendered group.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/FormComponents.js`
- `wedding-cep/cep/js/components/compact-form/formComponentSupport.js`
- `wedding-cep/cep/js/components/compact-form/FormComponents.test.js`
- `.task_steps/c2_wedding_form_components_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
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
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_form_components_support_split_scope.md`

## Notes Before Execution

- Keep `FormComponents` as the public compact-form render seam.
- Keep the new helper internal to the compact-form slice.
- Preserve current adapter calls, date-grid mount config, action-button refs, and IDX lock behavior.

## Implementation Note

- Added `formComponentSupport.js` as a compact-form local helper for info/ranking options, family field descriptors, date-grid configs, action-button metadata, and family field key derivation.
- Refactored `FormComponents.js` so the public compact-form render seam now delegates static config/support concerns to the helper while keeping the same four group-building methods and adapter contract.
- Added `FormComponents.test.js` as direct slice-level coverage for info/family and venue/date rendering, including `Lock IDX`, `mountDateGrid(...)`, and action-button ref registration.

## Verification Gate

Claims Verified: `FormComponents` remains the public compact-form render seam; config/support noise now lives in a local helper; and info/family/venue/date group rendering keeps the same adapter calls, date-grid config, action button ids, and IDX-lock behavior.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_form_components_support_split_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only refactors render config/support and adds direct tests; it does not redesign `CompactFormBuilder`, `CompactFormBindings`, or `FormLogic`.
Unverified But Suspected: if `Workspace / Form Entry` gets another cleanup pass soon, `CompactFormBuilder.js` is now a better orchestration review target than reopening `FormComponents`, because the render seam has direct tests and less embedded config than before.
