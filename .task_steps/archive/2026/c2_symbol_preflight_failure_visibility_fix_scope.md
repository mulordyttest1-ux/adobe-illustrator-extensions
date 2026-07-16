## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Surface readable operator feedback for `symbol-cep` preflight infrastructure failures that currently log and halt silently.
- Execution mode: Focused app-local bug fix with rule-level regression coverage and one representative smoke probe.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/imposition_copy.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.test.mjs`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.test.mjs`
- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/AGENTS.md`
- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. No shared libs, JSX host files, bridge payloads, or cross-app runtime surfaces are changed.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_preflight_failure_visibility_fix_scope.md`

## Notes Before Execution

- Keep valid `cancel`, `empty`, and business-warning semantics unchanged.
- Do not widen scope into `PreflightOrchestrator`, bridge/JSX, or execution handoff.
- Use `imposition_copy.js` as the copy source of truth; avoid hard-coded toast text in rules.

## Symptom

- Expected: when preflight halts because panel-to-host infrastructure fails, the operator should see a readable panel toast explaining that the preflight step could not complete.
- Actual: several `GroupCheckRule` and `GarbageRule` branches only log to console and return `false`, so the run appears blocked without clear operator-facing feedback.
- Reproduce path:
  - `GroupCheckRule`: `bridge.eval(...)` returns an `EvalScript...` error string or an invalid base64 payload.
  - `GarbageRule`: `bridge.eval(...)` returns an `EvalScript...` error string or an invalid base64 payload for garbage check or clear.

## Hypotheses

1. Silent halt behavior is isolated to rule-level infrastructure failure branches, not to `PreflightOrchestrator` or run handoff.
2. The existing preflight copy surface is missing dedicated operator-facing strings for infrastructure failures.
3. Current smoke coverage proves normal preflight warning UX, but not infrastructure-failure visibility, so this bug survived because only console logs covered the failing paths.

## Isolation

- Audit evidence already showed:
  - `imposition_run_service` stops safely after unsafe preflight.
  - `cancel` paths and auto-group restore behave correctly.
- Code inspection isolates the missing operator feedback to:
  - `GroupCheckRule` eval-error, parse-failure, and exception branches
  - `GarbageRule` eval-error, parse-failure, and exception branches

## Root Cause

- `GroupCheckRule` and `GarbageRule` both treated infrastructure failures as safe halts for the engine, but several branches only used `console.error(...)` plus `return false`.
- The copy surface in `imposition_copy.js` did not provide operator-facing strings for those infra-failure branches, so the panel had no readable toast to distinguish host/bridge failure from valid user cancel or other preflight outcomes.
- Existing smoke covered normal warnings and restore warnings, but there was no rule-level regression test or representative smoke probe for preflight infra-failure visibility, so the bug stayed latent.

## Verification Gate

Claims Verified: Preflight infrastructure failures now show readable operator-facing toasts instead of silent halts; valid `cancel`, `empty`, and existing business-warning semantics remain unchanged; no bridge payload, JSX host, shared lib, or execution handoff contract changed.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test` -> `45/45`; `npm run test:smoke:symbol` -> `29/29`; `npm run verify`.
Remaining Limits: Smoke covers one representative `GroupCheckRule` infrastructure-failure path through the debug surface; `GarbageRule` infra-failure visibility is locked at unit level rather than full panel smoke. Console error logging still occurs in failure branches by design, so test output remains noisy when those branches are exercised intentionally.
Unverified But Suspected: If future host failures need differentiated copy by exact bridge endpoint, this round's generic preflight infra-failure copy may be too coarse and should be revisited through a new `/plan`.

## Postmortem

- Root cause confirmed: rule-level infrastructure failure branches halted safely but did not surface readable feedback to the operator because they only logged to console and returned `false`.
- False hypotheses:
  - The run handoff in `imposition_run_service` might be swallowing preflight errors after the rules returned.
  - `PreflightOrchestrator` might be mutating context or suppressing a toast that should have been emitted downstream.
- Guardrail that should have caught this earlier: direct unit tests for rule-level infra-failure branches plus one representative smoke probe for preflight failure visibility.
- Reusable lesson: for CEP preflight rules, "safe halt" is not enough on its own; every infrastructure-failure branch needs explicit operator feedback distinct from valid cancel flows.
