# C2 Scope Lock: Test Run (Chạy Nháp) — Symbol CEP

## Files to Modify (≤3, chuẩn §E2)
1. `config_tab.js` — thêm nút `btn-dry-run` vào `_renderFooter()`
2. `config_persistence.js` — thêm method `handleDryRun(form, bridgeRef)`
3. `config_events.js` — bind event `btn-dry-run`

## Consumers Verified (§C2 grep)
- `ConfigPersistence` → consumed only by `config_events.js` (import + 3 call sites: handleSave, loadPreset)
- `_runImpositionEngineAsync(preset)` → defined in `action_tab.js`, called internally at line 301
- **KEY FINDING:** Dry Run cannot call `action_tab._runImpositionEngineAsync` directly (wrong layer). Must use `bridge.js` trigger → same JSX channel.

## Bridge Architecture
- `bridge.js` at line 4 uses `CSInterface.EXTENSION` path
- The ActionTab calls `this.bridge.callScript(...)` pattern
- `config_persistence.js` does not currently import `bridge.js` — must receive it as parameter OR use a shared singleton

## Risk Assessment
- 🟡 Medium: Need to check how `bridge` is exposed at app level to pass into `handleDryRun`
- 🟢 Low: `config_tab.js` and `config_events.js` changes are purely additive

## Impact
- ✅ `config_events.js` consumers: no break (additive click handler)
- ✅ `config_persistence.js` consumers: no break (new method only)
- ✅ `config_tab.js`: no break (new button in footer)
