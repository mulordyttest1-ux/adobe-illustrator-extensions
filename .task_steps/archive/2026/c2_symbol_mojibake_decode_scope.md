## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix mojibake when `symbol-cep` decodes Base64 JSON returned from JSX/ExtendScript so host-side Vietnamese error strings render correctly in the CEP panel.
- Execution mode: Focused bug fix in `symbol-cep` JS boundary only; compare with `wedding-cep` bridge for reference, but do not modify `wedding-cep`.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.js`
- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- `symbol-cep/cep/js/app.js` if a shared decode helper is exposed there
- `symbol-cep/cep/debug_scripts/test_smoke.cjs` if regression coverage is needed

## Consumers Verified

- `symbol-cep` engine run path (`ActionTab._runImpositionEngineAsync`)
- preflight bridge rule calls
- postflight bridge response parsing
- reference only: `wedding-cep/cep/js/infrastructure/bridge.js`

## Cross-App Impact

- No code change planned outside `symbol-cep`.
- `wedding-cep` already appears to use a safer byte-string decode path and is being used only as a comparison baseline.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm run test:smoke:symbol`

## Notes Before Execution

- Symptom: panel shows mojibake such as `KhÃ´ng Äá»§ chá»...` for host-side Vietnamese errors.
- Expected: same host error should display clean Unicode text in CEP.
- Unknowns to confirm during isolation:
  - whether the source JSX string is already mojibake on disk
  - whether only `ActionTab` decode is broken or multiple bridge consumers are affected

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `symbol-cep` Base64 JSON decode boundary in action/preflight/postflight consumers; reference-checked against `wedding-cep` bridge decode approach.
Top Risks: partial fix in `ActionTab` only would leave preflight/postflight mojibake; changing payload shape would risk host contract drift.
Required Fixes: replace unsafe `JSON.parse(atob(...))` pattern at all active JSX response consumers in `symbol-cep`; add regression coverage for UTF-8 Vietnamese payloads.
No Blocking Findings: none after focused review of consumer list and validation plan.
Validation Rerun Needed: yes - rerun `lint`, `build`, package `test`, and `test:smoke` after the decode helper lands.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: JSX-originated UTF-8 JSON payloads now decode cleanly in `symbol-cep`; unsafe raw `atob` JSON parsing was removed from non-bundle source; existing runtime flows still pass.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`
Remaining Limits: no dedicated smoke case yet forces a real Illustrator layout failure toast end-to-end; coverage is via decode unit tests plus existing smoke/runtime bridge paths.
Unverified But Suspected: some legacy mojibake comments/strings may still exist in unrelated source files, but they are separate from this verified UTF-8 decode boundary bug.
