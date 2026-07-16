## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Replace the false-positive postflight orphan warning with binding-aware validation that compares filled schema-backed form keys against template bindings captured before render, not against rendered frame text after update.
- Execution mode: Root-cause fix with focused architecture cleanup inside `wedding-cep` only.

## Files To Modify

- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.test.js`
- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.test.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.test.js`
- `wedding-cep/cep/js/logic/use-cases/support/templateBindings.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `wedding-cep/cep/js/logic/validators/rules/UnboundFormDataRule.js`
- `wedding-cep/cep/js/logic/validators/rules/SchemaGapRule.js`
- `wedding-cep/cep/js/logic/validators/support/formKeyScope.js`
- `wedding-cep/cep/js/types.d.ts`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`

## Cross-App Impact

- None. `symbol-cep` keeps its `postflight/hooks` contract untouched.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_binding_coverage_fix_scope.md`

## Notes Before Execution

- Do not patch this by disabling postflight globally.
- Safe default: if render-time template bindings are unavailable, skip the global unused-data warning instead of guessing from rendered text.
- Keep the change focused to `wedding-cep`; no shared extraction and no `symbol-cep` changes.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `wedding-cep` render postflight path from `collectFrames` through `runApplyStrategyUpdate`, `runUpdateDocument`, `UpdateAction`, and `PostflightValidator`.
Top Risks: suppressing a legitimate global warning by over-filtering keys; missing fresh placeholder bindings during extraction; masking real schema-gap warnings if helper-key filtering is too broad.
Required Fixes: replace rendered-text inference with pre-render template bindings; centralize helper-key filtering; skip the global unused-data warning when template bindings are unavailable.
No Blocking Findings: Yes. Self-review found no remaining path that derives binding coverage from rendered text.
Validation Rerun Needed: Yes. Rerun lint/build/test/smoke/verify after implementation.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: the false-positive global warning no longer scans rendered text for `{key}` placeholders after update; render postflight now compares filled schema-backed form keys against template bindings captured before render; UI/helper keys (`ui.*`, `_idx`, `_auto`) are excluded consistently from schema-gap and unused-data warnings; `UpdateAction` forwards template binding context into postflight without moving business logic into the action layer.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding` (pass); `npm run test:smoke:wedding` (second consecutive pass after one transient inject-selection flake); `npm run verify`.
Remaining Limits: no new focused smoke was added for the exact `UNBOUND_FORM_DATA` message path, so that regression is locked by use-case/action/validator tests plus full smoke; the earlier one-off smoke failure on auto-inject orphan reselection was treated as a transient host flake because the next two consecutive smoke runs passed without code changes in that path.
Unverified But Suspected: None for the postflight binding fix itself.
