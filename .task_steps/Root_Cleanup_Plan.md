# Root Setup Cleanup Plan

The root directory contains 35 files (excluding folders). Many of these are scratchpads, old test scripts, or legacy files that should not be in the root of a monorepo.

## 1. Scratchpad & Temporary Test Scripts
There are numerous temporary scripts seemingly used for testing regex or specific logic in isolation. These clutter the root.
**Action:** Move to a designated `scripts/scratchpads/` folder, or delete if no longer needed.
- `test_atomic_braces.cjs`
- `test_atomic_bug.cjs`
- `test_atomic_bug2.cjs`
- `test_overlap.mjs`
- `test_regex.mjs`
- `test_regex_braces.mjs`
- `test_regex_frames.mjs`
- `test_regex_pure.mjs`
- `test_live_ai.cjs`
- `schema_refactor.test.js`

## 2. Debug & Eval Scripts
These scripts (`debug_cep.js`, `eval_cep.js`, `reload_cep.cjs`, `clear_cache.js`) seem to be utilities for interacting with the CEP environment or debugging. 
**Action:** Move to `scripts/debug_utils/` to keep them accessible but out of the root.
- `debug_cep.js`
- `debug_check.js`
- `eval_cep.js`
- `reload_cep.cjs`
- `clear_cache.js`

## 3. Legacy / Domain Specific Scripts
These look like visual basic / extendscript macros specifically for Imposition/DataMerge. They belong in the `symbol-cep` project, not the root.
**Action:** Move to `symbol-cep/legacy_scripts/` or a similar appropriate folder.
- `Tao2File_DataMerge_A4_CutStack.bas`
- `Tao2File_InLatTay_NoAccent.bas`

## 4. Lint/Audit Output Logs
These are generated logs from old CI or manual runs.
**Action:** Delete. (In general, these should trace to `.gitignore` or `/tmp/`).
- `lint_output.txt`
- `lint_symbol_output.txt`
- `machine_audit_results.md`

## 5. Stray Files
- `panel_screenshot.png`: Likely an old screenshot. Delete or move to a `docs/` folder.
- `Generate-Context.ps1`: Already exists a version in `.agent` or `scripts`? Keep if active, delete if duplicate.

## Recommendation
This leaves only essential configuration files (`nx.json`, `package.json`, `tsconfig.*.json`, etc.) at the root, making the project much more professional and easier to navigate.
