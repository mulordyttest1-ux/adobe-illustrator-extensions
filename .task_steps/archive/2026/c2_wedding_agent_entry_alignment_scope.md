## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep` already has strong architecture and feature-map docs, but its app-local entry surfaces still stop short of the full repo-native chain. Compared with `symbol-cep`, the first hop into this legacy-heavier app still requires more guesswork.
- Goal: align `wedding-cep` front-door docs so agents and maintainers are explicitly routed through `AGENTS -> FEATURE_MAP -> ARCHITECTURE -> PROJECT_STATUS`.
- Non-goals: do not change runtime code, do not alter control-plane law at the repo root, and do not open a broader cross-app docs initiative.

## Scope Lock

- Summary: add explicit routing cues to `wedding-cep/AGENTS.md`, `wedding-cep/FEATURE_MAP.md`, and `wedding-cep/cep/README.md`.
- Execution mode: docs-only single-app cleanup for `wedding-cep`; no runtime, host, or shared changes.

## Files To Modify

- `wedding-cep/AGENTS.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/cep/README.md`

## Consumers Verified

- `AGENT_OPERATING_MODEL.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/ARCHITECTURE.md`
- `C:/Users/Admin/.codex/skills/adobe-cep-repo-context/SKILL.md`

## Cross-App Impact

- None. This milestone only aligns the `wedding-cep` app-local entry chain with the repo's existing routing model.

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- one fresh-agent forward-test with `$adobe-cep-repo-context` on a `wedding-cep` task
- `npm run check:gates -- --file .task_steps/c2_wedding_agent_entry_alignment_scope.md`

## Notes Before Execution

- Keep this round limited to front-door docs only.
- `FEATURE_MAP.md` stays feature-routing only.
- `PROJECT_STATUS.md` stays health/status only and does not need editing in this round.

## Implementation Note

- Added an explicit routing line to `wedding-cep/AGENTS.md` so app-local onboarding now points to `FEATURE_MAP.md`, `ARCHITECTURE.md`, and `PROJECT_STATUS.md` instead of relying on implicit repo knowledge.
- Added a health/status pointer to the `wedding-cep/FEATURE_MAP.md` header so it mirrors the more complete `symbol-cep` entry chain.
- Added a short `Navigation` section to `wedding-cep/cep/README.md` linking scoped instructions, feature routing, architecture, and project status.
- Kept `wedding-cep/PROJECT_STATUS.md` unchanged so it remains the health/status source of truth instead of becoming another routing document.

## Review Gate

Scope Reviewed: `wedding-cep` front-door docs only: `AGENTS.md`, `FEATURE_MAP.md`, and `cep/README.md`.
Top Risks: making `FEATURE_MAP.md` or the README compete with `ARCHITECTURE.md`, widening the cleanup into a broader docs rewrite, or claiming a stronger onboarding guarantee than the app-local docs can actually enforce.
Required Fixes: none after implementation; the final wording keeps routing cues short and leaves facts in the established source-of-truth documents.
No Blocking Findings: yes; self-review found no conflict with root `AGENTS.md`, `AGENT_OPERATING_MODEL.md`, or `wedding-cep/ARCHITECTURE.md`.
Validation Rerun Needed: yes; reran `check:encoding`, full `verify`, a fresh-agent forward-test, and the gate check after updating the receipt.

## Verification Gate

Claims Verified: `wedding-cep` now advertises the full app-local doc chain from its own entry surfaces, and a fresh agent routed through `FEATURE_MAP.md` and `ARCHITECTURE.md` before inspecting runtime files for a real `wedding-cep` task.
Evidence Run: `npm run check:encoding`; `npm run verify`; fresh-agent forward-test with `$adobe-cep-repo-context` on `Adjust optional date.nhap handling in wedding postflight/update behavior.`; `npm run check:gates -- --file .task_steps/c2_wedding_agent_entry_alignment_scope.md`.
Remaining Limits: the forward-test did not need to open `wedding-cep/PROJECT_STATUS.md` for this specific technical task, so this milestone improves availability of the full chain more than it guarantees every task will consume all four docs.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the smallest worthwhile next step after the `symbol-cep` cleanup because `wedding-cep` still had weaker first-hop routing in the legacy-heavier app.
- Benefit: app-local docs now reinforce the same repo-native navigation model that skills and governance already use, which should reduce first-file guesswork in `wedding-cep`.
- Forward-test signal: the fresh agent opened `wedding-cep/FEATURE_MAP.md` and `wedding-cep/ARCHITECTURE.md` before runtime code, which is the most important behavior this round was meant to improve.
- Boundaries held: no runtime code, no shared libs, no root governance rewrite, and no cross-app taxonomy changes.
