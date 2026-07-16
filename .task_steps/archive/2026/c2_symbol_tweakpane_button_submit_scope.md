## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix accidental preset form submission when interacting with internal Tweakpane buttons in `symbol-cep` Config, especially after loading an existing preset.
- Execution mode: Focused UI/runtime bug fix in `symbol-cep` Config renderer and smoke coverage only.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_pane_renderer.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep` Config tab render path
- `ConfigEvents` submit handler on `#config-form`
- Tweakpane folder/header interaction inside `config-pane-root`

## Cross-App Impact

- No code change outside `symbol-cep`.
- No `libs/shared` changes.
- `wedding-cep` not touched.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`

## Notes Before Execution

- Symptom: after selecting a preset, clicking internal Config pane controls/folder headers could trigger a save/update instead of simply opening or collapsing the panel.
- Expected: internal pane controls must never submit `#config-form`; only explicit footer save should submit.
- Root-cause hypothesis confirmed during isolation: Tweakpane renders internal `<button>` elements inside the form, and buttons without `type="button"` default to submit behavior.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: Tweakpane-mounted controls inside the Config form and the `submit` boundary in `symbol-cep`.
Top Risks: fixing only one visible button would leave other internal pane buttons able to submit; over-broad event suppression could break legitimate footer actions.
Required Fixes: enforce `type="button"` for internal pane buttons after mount and on DOM mutations; add regression coverage for “load preset then click internal pane button”.
No Blocking Findings: none after focused review.
Validation Rerun Needed: yes - rerun lint/build/unit/smoke after the button guard lands.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: internal Tweakpane buttons no longer submit the preset form; preset load still works; existing Config and host smoke coverage remains green.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`
Remaining Limits: manual Illustrator click-through was not repeated in this turn because smoke now covers the specific regression path.
Unverified But Suspected: if a future Tweakpane upgrade changes its internal markup, the guard may need to be revisited, but current smoke should catch the regression quickly.
