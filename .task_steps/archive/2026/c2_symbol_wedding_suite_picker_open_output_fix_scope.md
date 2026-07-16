# C2: Wedding Suite Picker Memory and Open-Output Fix Scope

## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix Wedding Suite quick-build so the PDF picker reuses the last-used source folder, the generated AI stays open on QA after build, the runtime keeps the operator-tuned envelope reference instead of reverting to the retired local offsets, and rerunning build against an open dirty output stops immediately with one clear warning instead of rewriting the AI or letting Illustrator spam save prompts.
- Execution mode: Focused `/fix` inside `symbol-cep` Wedding Suite only.

## Files To Modify

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. Scope stays app-local to `symbol-cep`.

## Validation Targets

- `npm.cmd run lint:symbol`
- `npm.cmd --workspace imposition-panel-cep run test`
- `npm.cmd run build:symbol`
- `npm.cmd run test:smoke:symbol`
- `npm.cmd run verify`

## Notes Before Execution

- Symptom: picker feels like it forgets the last PDF directory because active-document fallback wins too early.
- Symptom: successful builds immediately close the AI output, forcing the operator to reopen it just to inspect or print QA.
- Symptom: the operator-tuned envelope reference was drifting back to the previous local offset instead of staying on the current runtime override.
- Symptom: when the already-generated AI is still open and dirty, rerunning build can rewrite that file or trigger repeated native save prompts instead of stopping once with a clear operator-facing warning.

## Review Gate

Scope Reviewed: Wedding Suite panel preference precedence, bridge-side host priming, unsaved-output build blocking, and smoke expectations for the generated AI staying open.
Top Risks: Leaving the AI open could break smoke or leave the wrong active artboard; changing picker precedence could regress first-run behavior; moving the envelope override into the bridge path could drift smoke if tests still hard-code the retired offsets; letting the dirty-output guard key off the wrong document-path seam would silently rewrite the open AI instead of stopping once.
Required Fixes: Prefer current/remembered source folders before active-doc fallback, prime the host so builds reopen and keep the output AI active on QA, compare envelope placement against the live host reference rather than the old fixed numbers, and stop rebuilds against an open dirty output using `_getDocumentPathSafe(...)` plus a single app-level warning.
No Blocking Findings: yes
Validation Rerun Needed: yes

## Verification Gate

Claims Verified: partial
- Wedding Suite source picker prefers the current or remembered PDF folder before falling back to the active-document directory.
- Wedding Suite build requests prime the host with the operator-tuned envelope reference and reopen the saved AI so the operator can inspect QA immediately.
- Wedding Suite now flushes stale toast state and surfaces one explicit `OUTPUT_FILE_UNSAVED_OPEN` warning instead of queueing it behind older info/success toasts.
- The host build guard now keys off `_getDocumentPathSafe(openDoc)` so it can match the already-open AI it previously missed.

Evidence Run: partial
- `npm.cmd run lint:symbol`
- `npm.cmd --workspace imposition-panel-cep run test -- symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `npm.cmd run build:symbol`
- `npm.cmd run test:smoke:symbol` reproduced the dirty-output rewrite bug before the path-safe guard landed, then later blocked on the `symbol-cep` panel dropping port `9098` / `ECONNREFUSED` before a clean full rerun could complete.

Remaining Limits: yes
- Full runtime smoke confirmation of the final dirty-output guard is still pending until the `symbol-cep` panel is reopened and listening again on port `9098`.
- Repo-level `npm.cmd run verify` is still red on unrelated pre-existing `wedding-cep` lint debt outside this scope.

Unverified But Suspected: yes
- The final dirty-output runtime behavior is likely correct now that the guard and the panel-side warning both use the right seams, but the last host-smoke confirmation is blocked by the closed `symbol-cep` panel rather than by a remaining Wedding Suite assertion.
