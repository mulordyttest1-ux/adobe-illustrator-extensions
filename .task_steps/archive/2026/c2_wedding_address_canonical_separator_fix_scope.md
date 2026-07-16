# C2: Wedding Address Canonical Separator Fix Scope

## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Standardize address separator authority so all address normalize, validate, and autocomplete behavior follows `pos1.diachi`, while preserving a clear separator style inside `POS 1` itself.
- Execution mode: Focused app-local `/fix` inside `wedding-cep` panel-side JS only.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/addressSeparatorPolicy.js`
- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/logic/ux/normalizers/addressNormalizationSupport.js`
- `wedding-cep/cep/js/logic/ux/validators/AddressValidator.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/logic/ux/addressSeparatorPolicy.test.js`
- `wedding-cep/cep/js/logic/ux/validators/AddressValidator.test.js`
- `wedding-cep/cep/js/logic/ux/normalizers/AddressNormalizer.test.js`
- `wedding-cep/cep/js/logic/ux/InputEngine.test.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.test.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.test.js`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
- `wedding-cep/cep/js/components/compact-form/fieldBindingHelpers.js`
- `wedding-cep/cep/js/logic/use-cases/swapInvitationSides.js`
- `libs/wedding/domain/src/lib/venue.js`

## Cross-App Impact

- None expected. The fix stays inside `wedding-cep` app seams and does not widen `@wedding/domain`, `libs/shared`, host JSX, or `symbol-cep` contracts.

## Validation Targets

- Targeted address suites
- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_address_canonical_separator_fix_scope.md`

## Notes Before Execution

- Community alignment reference for this fix: UPU S42 plus Google/libaddressinput VN metadata both treat address formatting as component-driven and standardized, which supports one canonical separator policy per form rather than per-field punctuation drift.
- Fallback canonical separator stays `, ` when `pos1.diachi` is empty or separator-ambiguous.
- This round does not redesign addresses into structured subfields.

## Review Gate

Scope Reviewed: `logic/ux` separator authority path (`addressSeparatorPolicy`, `addressNormalizationSupport`, `AddressValidator`, `InputEngine`) plus compact-form autocomplete/form bindings and the new focused tests.
Top Risks: ambiguous `POS 1` dash input not collapsing to fallback comma on blur; embedded hyphens inside ranges or alphanumeric tokens being rewritten as separators; autocomplete selection drifting away from blur-time normalization.
Required Fixes: fixed ambiguous `POS 1` collapse to canonical comma during normalization; fixed alphanumeric embedded hyphen preservation (`A1-B2` stays unchanged); added focused helper/normalizer coverage for both regression paths.
No Blocking Findings: none after the follow-up fixes and validation rerun.
Validation Rerun Needed: yes; reran targeted address suites, `npm run lint:wedding`, `npm run build:wedding`, `npm run test:wedding`, and `npm run test:smoke:wedding`.

## Verification Gate

Claims Verified: non-`POS 1` address normalize/validate/autocomplete now use the live separator resolved from `pos1.diachi`; `POS 1` preserves a clear comma or dash style while mixed/ambiguous forms fall back to comma on blur; embedded numeric ranges and alphanumeric hyphens such as `12-14` and `A1-B2` are preserved.
Evidence Run: `node --test wedding-cep/cep/js/logic/ux/addressSeparatorPolicy.test.js wedding-cep/cep/js/logic/ux/validators/AddressValidator.test.js wedding-cep/cep/js/logic/ux/normalizers/AddressNormalizer.test.js wedding-cep/cep/js/logic/ux/InputEngine.test.js wedding-cep/cep/js/components/compact-form/AddressService.test.js wedding-cep/cep/js/components/compact-form/CompactFormBindings.test.js`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`
Remaining Limits: this remains heuristic normalization over freeform address text rather than a structured address parser, so rare compact token styles outside the covered cases may still need future tuning.
Unverified But Suspected: edge cases with unusual shorthand tokens that mix abbreviations and punctuation in ways not represented by current address data may still surface, but no failing case remains in the covered helper/unit/live smoke lanes.
