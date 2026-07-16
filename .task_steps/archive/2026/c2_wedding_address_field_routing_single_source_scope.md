## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: address-field gating for compact-form autocomplete still has duplicate heuristics in `addressAutocompleteSupport.js`, even though `FieldTypeResolver.js` is supposed to own field-type routing for `Input Assistance`.
- Goal: make `FieldTypeResolver` the single source of truth for address-field routing and have autocomplete support delegate to it, while preserving current binding behavior.
- Non-goals: do not redesign `InputEngine`, `AddressAutocomplete`, or startup orchestration.

## Scope Lock

- Summary: add an explicit `isAddressField(...)` contract to `FieldTypeResolver`, refactor `addressAutocompleteSupport.js` to delegate to it, and tighten tests so address-field routing behavior is asserted in one place.
- Execution mode: single-writer local refactor in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/input/FieldTypeResolver.js`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.js`
- `wedding-cep/cep/js/logic/ux/input/FieldTypeResolver.test.js`
- `wedding-cep/cep/js/components/compact-form/addressAutocompleteSupport.test.js`
- `.task_steps/c2_wedding_address_field_routing_single_source_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-routing maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_address_field_routing_single_source_scope.md`

## Notes Before Execution

- Keep `FieldTypeResolver` as the source of truth for field-type routing.
- Keep `addressAutocompleteSupport.js` as a compact-form support helper, not a second routing authority.
- Preserve current address autocomplete binding behavior for schema-backed and heuristic-backed fields.

## Implementation Note

- Added an explicit `isAddressField(...)` contract to `FieldTypeResolver.js` so address-field routing now lives behind the same resolver that already owns general field-type routing.
- Refactored `addressAutocompleteSupport.js` so compact-form autocomplete gating delegates to `FieldTypeResolver` instead of keeping a second local heuristic.
- Tightened `FieldTypeResolver.test.js` and `addressAutocompleteSupport.test.js` so schema-backed overrides and heuristic-backed fallbacks are asserted through one routing contract.

## Verification Gate

Claims Verified: `FieldTypeResolver` is now the single source of truth for address-field routing; compact-form autocomplete support no longer keeps a separate routing heuristic; and existing schema-backed plus heuristic-backed address binding behavior stays intact.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_address_field_routing_single_source_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only unifies address-field routing authority; it does not redesign `InputEngine`, `AddressService`, or broader startup/autocomplete orchestration.
Unverified But Suspected: if `Input Assistance` gets another cleanup pass soon, `startupResources.js` or `AddressService.js` is a higher-value target than reopening `FieldTypeResolver`, because routing authority is now centralized and the remaining complexity is orchestration/local UI behavior.
