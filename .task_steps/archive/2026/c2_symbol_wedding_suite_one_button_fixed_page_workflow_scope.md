# C2 Template: Scope Lock and Gate Receipt

## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Replace the Wedding Suite Standard operator-facing workspace with a fixed-page one-button quick-build flow that treats page 1 as envelope, page 2 as info, page 3-5 as invites, ignores extra pages, rotates landscape info/invite pages 90 degrees for placement, and keeps QA-first PDF output with remembered source/save directories.
- Execution mode: build

## Files To Modify

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/workspacePreferences.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/*.test.mjs`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep` Wedding Suite tab users handling repetitive wedding-suite imposition
- QA readers who rely on the first artboard for counts and labels
- Print operators who use envelope and production artboards from a single exported PDF

## Cross-App Impact

- None. The change stays inside the `symbol-cep` Wedding Suite island.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_one_button_fixed_page_workflow_scope.md`

## Notes Before Execution

- Do not route this workflow back through legacy preset/config/action ownership.
- Source picker precedence must stay: active document folder -> last source directory -> last save directory.
- Output stays QA-first and source files must remain untouched.

## Verification Gate

Claims Verified: Wedding Suite now exposes a one-button fixed-page workflow instead of source-mode/binding/recipe/sheet-recipe editing, reads page 1-5 from a selected source file, remembers last source and save directories, defaults the filename stem to `info`, and builds QA-first output plans that mark landscape info/invite pages for 90-degree rotation before placement.

Evidence Run: `node --test symbol-cep/cep/js/features/wedding-suite-standard/planner.test.mjs symbol-cep/cep/js/features/wedding-suite-standard/workspacePreferences.test.mjs symbol-cep/cep/js/features/wedding-suite-standard/recipeStore.test.mjs`; `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`

Remaining Limits: The fixed-page workflow is intentionally optimized for the 90% source contract and still ignores page > 5 rather than offering advanced overrides. Host-side fidelity is covered through the new JSX path and smoke request assertions, but not yet by a real artwork-host smoke on operator files.

Unverified But Suspected: Exact Illustrator rich-text behavior still depends on live artwork characteristics even though the host now treats source pages as fixed fidelity units and only applies duplication/rotation/fit transforms at placement time.
