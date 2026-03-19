# Implementation Plan — Symbol CEP Run-Now From Config Tab
*Date: 2026-03-19*

---

## Goal

Allow users to load a saved preset into `Config`, make one-off adjustments, and execute immediately without creating or overwriting a saved preset unless they explicitly click `Save`.

---

## COMPLIANCE EVIDENCE

- §C0/§M (Model): D1=3, current session model sufficient for planning
- §C1 (Community): searched one-off preset execution / apply button / Adobe preset workflows; conclusion = separate transient execution from preset persistence
- §C2 (Scope Lock): grep confirms execution lives in `action_tab.js`, save/load lives in `config_persistence.js` and `config_events.js`, tabs are bootstrapped from `app.js`

---

## Scope Lock

## Target files
- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/config_events.js`
- `symbol-cep/cep/js/features/imposition/config_persistence.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`

## Consumers checked
- `symbol-cep/cep/js/app.js` imports `ActionTab` and `ConfigTab`
- `config_events.js` is the only caller of `ConfigPersistence.handleSave()`
- `action_tab.js` owns preflight → engine → postflight execution chain

## Impact
- User-facing behavior change in `Config` tab only
- No planned schema/data format change
- No planned JSX engine change
- No planned preset file format change

---

## UX Contract

1. `Run Now` executes the current form values once.
2. `Run Now` does not create a preset.
3. `Run Now` does not overwrite the loaded preset.
4. `Save` keeps current semantics for create/update.
5. A missing `preset_name` must not block `Run Now`.
6. If current draft differs from a loaded preset, the draft is still executable.

---

## Proposed Design

### Phase 1 — Extract reusable execution path
- Refactor `ActionTab` so the actual engine pipeline can run from a preset object, not only from an ID lookup.
- Keep existing `handleTrigger(id)` behavior intact by delegating to the new reusable method.

### Phase 2 — Add transient payload builder in Config flow
- Add a helper in `ConfigPersistence` to serialize the current form into a transient preset-like payload.
- Reuse existing schema + rawValues + derived geometry/options.
- Mark the payload as transient in-memory only; do not write it via `dataStore.savePreset()`.

### Phase 3 — Add Config-tab command
- Add a second footer button in `ConfigTab`, likely secondary styling:
  - `Run Now`
- Bind it in `config_events.js`.
- On click:
  - build transient payload from current form
  - call shared execution path
  - do not require preset name
  - do not call save flow

### Phase 4 — Guardrails and polish
- Preserve preflight/postflight behavior for transient runs
- Avoid incrementing `usageCount` for transient runs
- Optional: show lightweight status text that current edits are unsaved

---

## Risks

1. `ActionTab.handleTrigger()` currently mixes lookup, usage analytics, and execution.
   - Mitigation: extract execution path instead of faking preset IDs.

2. Config form currently assumes submit means save.
   - Mitigation: bind `Run Now` as explicit button-click path, not form submit.

3. Users may think `Run Now` also saves changes.
   - Mitigation: keep distinct styling/copy and optionally show an unsaved-draft hint.

4. Execution without a saved preset name may break downstream assumptions.
   - Mitigation: build a transient label fallback such as `Draft Run` only for runtime payload, not persistence.

---

## Validation Plan

1. Load an existing preset, change one field, click `Run Now`
   - Expected: artwork runs with changed value
   - Expected: no new preset added to `presets.json`
   - Expected: original preset unchanged

2. Load an existing preset, change one field, click `Save`
   - Expected: current create/update flow still works exactly as before

3. Start from blank form, leave `preset_name` empty, click `Run Now`
   - Expected: runtime works if required execution data is present
   - Expected: no save validation on name

4. Run a saved preset from `Actions` tab
   - Expected: old behavior unchanged, including usage increment

5. Verify preflight/postflight still run for both saved and transient execution paths

---

## Decision

### Recommended
- Approve implementation of `Run Now` in `Config` tab as a transient execution path.

### Reason
- This matches community best practice and Adobe-style preset workflows:
  - presets are reusable baselines
  - current edits are a working copy
  - saving is optional and explicit

---

## Approval Gate

No code changes should start until you approve this plan.
