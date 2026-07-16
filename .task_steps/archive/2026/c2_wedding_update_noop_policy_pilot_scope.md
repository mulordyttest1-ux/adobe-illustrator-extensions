## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `UpdateAction` currently treats no-op update results like normal success, so the operator gets no explicit feedback and postflight can still run even when nothing was written.
- Goal: Add a local no-op policy for `wedding-cep` document sync so empty writes surface an info toast and stop before postflight, while successful writes keep the current behavior.
- Non-goals: Do not change packet assembly, schema metadata extraction, bridge payloads, template binding capture, or postflight rule semantics.

## Scope Lock

- Summary: Run Milestone 2 of the continuation protocol by handling `updated: 0` + empty `affected` as a document-sync no-op inside `UpdateAction`.
- Execution mode: Focused `wedding-cep/Document Sync` policy change in the action layer only; use the existing `runUpdateDocument` result shape and keep host-side/runtime contracts unchanged.

## Files To Modify

- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.test.js`

## Consumers Verified

- `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`

## Cross-App Impact

- None. The change stays inside `wedding-cep` and does not touch `symbol-cep`, shared libs, or `.jsx` host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_update_noop_policy_pilot_scope.md`

## Notes Before Execution

- Treat this as a `T1` single-app, single-context policy change under the operating model baseline.
- No-op means `updated === 0` and `affected` is missing or empty.
- For no-op results, show an info toast and skip postflight.
- Keep button-state handling, error toasts, and successful update behavior unchanged.

## Implementation Note

- Added a local `isNoOpUpdateResult(...)` guard in `UpdateAction.js` so `updated: 0` plus empty `affected` is handled as an info-path instead of falling through to postflight.
- For no-op results, `UpdateAction` now shows `Không có thay đổi nào được áp dụng trong vùng chọn hiện tại.` and returns early without calling `runPostflight(...)`.
- Extended `UpdateAction.test.js` with a dedicated no-op scenario that asserts the info toast, preserved button reset, and skipped postflight call.

## Review Gate

Scope Reviewed: `wedding-cep` document-sync action policy only, limited to `UpdateAction.js` and `UpdateAction.test.js`.
Top Risks: accidentally changing successful update behavior, surfacing a misleading no-op message on real writes, or introducing a hidden contract change by depending on new fields from `runUpdateDocument`.
Required Fixes: none after implementation; the final patch stayed inside the action layer and used only the existing `updated` and `affected` fields.
No Blocking Findings: yes; self-review found no boundary violations and no reason to touch `runUpdateDocument`, `applyStrategyUpdate`, or host-side code for this pilot.
Validation Rerun Needed: yes; reran `test:wedding`, `lint:wedding`, `build:wedding`, `test:smoke:wedding`, and `verify` after the final patch.

## Verification Gate

Claims Verified: no-op update results now show an info toast, skip postflight, keep button-state/error behavior intact, and the change stayed within the `wedding-cep/Document Sync` action boundary.
Evidence Run: `npm run test:wedding`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:smoke:wedding`; `npm run verify`.
Remaining Limits: the no-op toast wording is covered by unit tests but not by a dedicated smoke scenario yet; full wedding smoke regression stayed green.
Unverified But Suspected: none.

## Postmortem

- Pilot outcome: success. The task forced routing into a harder `Document Sync` seam, and the correct entrypoint was still clear: `UpdateAction` owned the policy while `runUpdateDocument` and `applyStrategyUpdate` stayed unchanged.
- Tradeoff kept intentionally: the no-op path uses one operator-facing message for both `No frames found` and `No changes needed`. Distinguishing those would require widening the internal result contract, which was out of scope for this `T1` pilot.
- What this says about the operating model: the feature map and current action/use-case split are good enough for focused policy changes in `Document Sync`; the next milestone can move to `symbol-cep` without reopening the wedding routing question.
