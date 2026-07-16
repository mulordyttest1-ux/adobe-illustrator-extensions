## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/compact-form/FormLogic.js` mixes event wiring, schema option lookup, radio-state handling, field synchronization, and auto-cancellation in one runtime hotspot, which makes form-entry changes harder for agents to route and patch safely.
- Goal: split the venue auto-sync mechanics into a small helper module and leave `FormLogic.js` as the compact-form orchestration seam, without changing runtime behavior.
- Non-goals: do not change `@wedding/domain`, do not touch document-sync or host `.jsx`, and do not redesign compact-form UX.

## Scope Lock

- Summary: refactor `FormLogic.js` into a thinner coordinator, add a compact-form-local helper for venue auto-sync mechanics, and extend tests to lock the current ceremony-address shaping behavior.
- Execution mode: single-writer local runtime refactor inside `wedding-cep/Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/compact-form/FormLogic.js`
- `wedding-cep/cep/js/components/compact-form/venueAutomationSupport.js`
- `wedding-cep/cep/js/components/compact-form/FormLogic.test.js`

## Consumers Verified

- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`

## Cross-App Impact

- None. This is app-local compact-form maintenance only.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_form_logic_split_scope.md`

## Notes Before Execution

- Keep `FormLogic.js` as the public slice seam for compact-form business wiring.
- Keep the new helper internal to the compact-form slice; do not leak it into actions or other feature areas.
- Preserve the current `InputEngine.process(..., 'ceremony.diachi', ...)` behavior when auto-sync updates ceremony address.

## Implementation Note

- Added `venueAutomationSupport.js` as a compact-form-local helper for schema option lookup, checked-radio resolution, radio-group sync, and event-driven control value sync.
- Refactored `FormLogic.js` so it now owns orchestration and trigger wiring while delegating repeated venue auto-sync mechanics to the helper.
- Added a regression test that locks the current `InputEngine.process(..., 'ceremony.diachi', ...)` behavior when auto-sync updates the ceremony address.

## Verification Gate

Claims Verified: `FormLogic.js` remains the compact-form business-wiring seam; the venue automation mechanics now live in a local helper; and venue auto-fill, host switching, manual cancellation, and ceremony-address shaping still behave the same in unit and smoke lanes.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_compact_form_bindings_split_scope.md`.
Remaining Limits: this round keeps the compact-form boundary local; it does not yet split `AddressService.js` or change how compact-form and date-grid are composed.
Unverified But Suspected: if another real change lands in the compact-form slice, `AddressService.js` is now the clearest remaining hotspot inside the same bounded context.
