## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/bootstrap/tabBoot.js` is the public tab-boot seam, but it still mixes controller orchestration with compact/schema tab initialization and compact-ready waiting details in one file.
- Goal: extract local tab-boot support helpers so `tabBoot.js` reads as the public orchestration seam while the tab-specific init/wait behavior becomes easier to scan and test directly.
- Non-goals: do not redesign tab ordering, change ready-state semantics, or alter compact/schema boot behavior.

## Scope Lock

- Summary: add a local tab-boot support helper for tab phase updates, compact/schema tab init behavior, and compact-ready waiting; refactor `tabBoot.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Runtime / Boot`.

## Files To Modify

- `wedding-cep/cep/js/bootstrap/tabBoot.js`
- `wedding-cep/cep/js/bootstrap/tabBootSupport.js`
- `wedding-cep/cep/js/bootstrap/tabBootSupport.test.js`
- `.task_steps/c2_wedding_tab_boot_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/tabBoot.test.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local boot maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_tab_boot_support_split_scope.md`

## Notes Before Execution

- Keep `tabBoot.js` as the public tab-boot orchestration seam.
- Keep the new helper local to `bootstrap/`.
- Preserve current ready-state phases and compact/schema boot behavior.

## Implementation Note

- Added `tabBootSupport.js` as a local boot helper for tab phase updates, compact tab init, schema tab init, and compact-ready waiting.
- Refactored `tabBoot.js` so the public boot seam now reads as controller orchestration while the tab-specific init and wait behavior live in a directly testable local support file.
- Added `tabBootSupport.test.js` as direct coverage for tab phase updates, compact/schema initialization, and the compact-ready wait contract.

## Verification Gate

Claims Verified: `tabBoot.js` remains the public tab-boot orchestration seam; local support now owns compact/schema init details plus compact-ready waiting; and current ready-state phases and tab boot behavior stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_tab_boot_support_split_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local tab-boot support; it does not redesign tab ordering, change controller responsibilities, or alter downstream compact/schema wiring.
Unverified But Suspected: if `Runtime / Boot` gets another cleanup pass soon, the next more meaningful orchestration seam is likely `startup.js` consumers or a different slice entirely rather than reopening `tabBoot`, because the tab boot flow is now already thin and directly covered.
