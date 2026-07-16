## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/FormComponents.js` is the public compact-form rendering seam, but it still mixes panel assembly with repeated family/venue/date layout wiring and static DOM layout details in one file.
- Goal: move the repeated compact-form layout mechanics into local component support so `FormComponents.js` stays the public rendering seam while the section-layout details become easier to scan and test directly.
- Non-goals: do not redesign compact-form sections, change field wiring, or alter the date-grid mount/button registration contract.

## Scope Lock

- Summary: extend local compact-form support with layout helpers for ranking, family, venue, and date sections; refactor `FormComponents.js` to use them; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/FormComponents.js`
- `wedding-cep/cep/js/components/compact-form/formComponentSupport.js`
- `wedding-cep/cep/js/components/compact-form/formComponentSupport.test.js`
- `.task_steps/c2_wedding_form_components_support_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/FormComponents.test.js`
- `wedding-cep/cep/js/components/compact-form/compactFormBuilderSupport.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local compact-form maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_form_components_support_scope.md`

## Notes Before Execution

- Keep `FormComponents.js` as the public compact-form rendering seam.
- Keep the layout helpers local to `components/compact-form/`.
- Preserve the current section order, adapter wiring, and date-grid/button registration behavior.

## Implementation Note

- Extended `formComponentSupport.js` with local layout helpers for the ranking row, mirrored family columns, venue layout, and date-group layout.
- Refactored `FormComponents.js` so the public compact-form rendering seam now delegates repeated layout assembly to local support while preserving the existing adapter contract.
- Added `formComponentSupport.test.js` as direct coverage for ranking wiring, family-column mirroring, and venue/date layout behavior.

## Verification Gate

Claims Verified: `FormComponents.js` remains the public compact-form rendering seam; local support now owns repeated section-layout mechanics; and section order plus adapter/date-grid wiring stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_form_components_support_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local layout mechanics; it does not redesign compact-form sections, change binding behavior, or alter date-grid/widget contracts.
Unverified But Suspected: if `Workspace / Form Entry` gets another cleanup pass soon, the next higher-value target is likely outside `FormComponents` itself, because its public rendering seam is now mostly orchestration over support/config plus adapter calls.
