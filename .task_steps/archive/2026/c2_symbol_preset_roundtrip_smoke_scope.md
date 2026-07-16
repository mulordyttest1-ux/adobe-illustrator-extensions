## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Harden `symbol-cep` preset roundtrip coverage across real Config-tab save, reload, manager-run resolution, and dry-run parity.
- Execution mode: coverage-first build.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/preset-config/configPersistenceService.test.mjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- Config tab real save flow
- Config tab reload flow
- Action tab manager-run flow
- Dry-run preset shaping from a reloaded preset

## Cross-App Impact

- None. All changes are app-local to `symbol-cep`.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_preset_roundtrip_smoke_scope.md`

## Notes Before Execution

- Use an in-memory `window.cep.fs` overlay in smoke so tracked `symbol-cep/cep/data/presets*.json` are not mutated.
- Snapshot and restore `cep_imposition_presets_last_active` inside each roundtrip smoke.
- Keep Wave 4 out of rename-conflict, delete UX, and config-layout cleanup.

## Verification Gate

Claims Verified: `symbol-cep` now has CI-safe roundtrip coverage at the persistence seam plus a dedicated panel smoke matrix for the real Config-tab save path, reload through the preset dropdown, manager-run resolution, and dry-run parity from a reloaded preset. The smoke lane uses an in-memory CEP fs overlay and restores the patched fs methods after each test so Wave 4 does not depend on mutating tracked preset files.
Evidence Run: `npm run lint:symbol` -> pass; `npm run build:symbol` -> pass; `npm --workspace imposition-panel-cep run test` -> `47/47`; `npm run test:smoke:symbol` -> `35/35`; `npm run verify` -> pass.
Remaining Limits: Rename-conflict and update-in-place policy remain out of scope. Delete-manager UX stays covered by its pre-existing smoke. Tracked preset data files were already dirty in the worktree before this closeout; Wave 4 smoke itself runs through the in-memory overlay instead of writing to them.
Unverified But Suspected: none.
