# Wave 4: `symbol-cep` Preset Roundtrip Hardening

## Context

- Workflow: `build`
- Goal: shield the real operator roundtrip `edit -> save -> reload -> manage -> dry-run`
- App: `symbol-cep`
- Baseline:
  - `npm --workspace imposition-panel-cep run test` -> `45/45`
  - `npm run test:smoke:symbol` -> `32/32`

## Direction Brief

- Keep the wave narrow:
  - persistence seam regression in `configPersistenceService.test.mjs`
  - real panel smoke in `test_smoke.cjs`
  - no `config_pane_renderer` cleanup
  - no shared-lib, host payload, or `.jsx` change
- Preferred implementation:
  - install an in-memory `window.cep.fs` overlay for smoke
  - snapshot and restore `cep_imposition_presets_last_active`
  - run the real save/load/delete code paths without mutating tracked `symbol-cep/cep/data/presets*.json`

## Implementation Note

- The real Config-tab submit path is already wired in the current worktree.
- Wave 4 stays coverage-first; no extra runtime API was needed.

## Planned Scope

- Add CI-safe save/load and save-vs-dry-run parity regressions
- Add 3 real roundtrip smokes:
  - edit -> save -> reload
  - reload -> manage
  - reloaded form -> dry-run parity
- Record Wave 4 in a dedicated C2 gate receipt
