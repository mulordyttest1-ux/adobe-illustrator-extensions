## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/helpers/DomFactory.js` is still a large public helper seam and mixes low-level detached DOM assembly with the exported façade methods used across compact-form, date-grid, and schema-tab.
- Goal: extract local DOM assembly support helpers so `DomFactory` stays the public detached-DOM façade while element-assembly mechanics become easier to scan and test directly.
- Non-goals: do not redesign `DomFactory` public APIs, change class names/styles/defaults, or move UI ownership out of the components slice.

## Scope Lock

- Summary: add a local DOM factory support helper for detached DOM assembly and debounce support; refactor `DomFactory.js` to delegate to it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Workspace / Form Entry`.

## Files To Modify

- `wedding-cep/cep/js/components/helpers/DomFactory.js`
- `wedding-cep/cep/js/components/helpers/domFactorySupport.js`
- `wedding-cep/cep/js/components/helpers/domFactorySupport.test.js`
- `.task_steps/c2_wedding_dom_factory_support_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/compact-form/*`
- `wedding-cep/cep/js/components/date-grid/*`
- `wedding-cep/cep/js/components/schema-tab/SchemaTabComponents.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local UI helper maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_dom_factory_support_scope.md`

## Notes Before Execution

- Keep `DomFactory.js` as the public detached-DOM façade.
- Keep the new helper internal to the components helper slice.
- Preserve current class names, style defaults, detached DOM shape, and debounce behavior.

## Implementation Note

- Added `domFactorySupport.js` as a local helper for detached DOM assembly primitives and debounce support used by the `DomFactory` façade.
- Refactored `DomFactory.js` so the public static helper surface now delegates element-assembly mechanics to the support helper while preserving the same exported method names, class names, styles, and detached DOM shape.
- Added `domFactorySupport.test.js` as direct support coverage for panel/radio/input assembly, button/select/checkbox defaults, and debounce behavior.

## Verification Gate

Claims Verified: `DomFactory.js` remains the public detached-DOM façade; local support now owns detached element assembly and debounce mechanics; and compact-form/date-grid/schema-tab consumers keep the same DOM shape and default styles.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_dom_factory_support_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local DOM assembly support and adds direct tests; it does not redesign the `DomFactory` public API or move helper ownership out of the components slice.
Unverified But Suspected: if `Workspace / Form Entry` gets another cleanup pass, the next higher-value target is likely a slice-level consumer seam rather than reopening `DomFactory`, because the helper is now a thin façade over a local support module.
