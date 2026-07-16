## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: the repo now has a cleaner routing chain for `symbol-cep`, but the thin pilot skills still point agents to the older surface set. This creates avoidable feature-discovery drift right at onboarding time.
- Goal: align the repo-context and CEP-boundary skills with the current repo SSOTs so they point agents to `AGENTS -> FEATURE_MAP -> ARCHITECTURE -> PROJECT_STATUS` for `symbol-cep` and expose both app-side boundary anchors where relevant.
- Non-goals: do not change skill frontmatter, do not add new skills, and do not duplicate architecture facts from the repo into skill bodies.

## Scope Lock

- Summary: update the thin skill routing guidance for `adobe-cep-repo-context` and `cep-es3-es6-boundary` so they match the repo's current doc chain and cross-app boundary surfaces.
- Execution mode: docs-only skill alignment; no app runtime, no repo workflow law, and no generated skill metadata changes unless validation proves a mismatch.

## Files To Modify

- `C:/Users/Admin/.codex/skills/adobe-cep-repo-context/SKILL.md`
- `C:/Users/Admin/.codex/skills/cep-es3-es6-boundary/SKILL.md`

## Consumers Verified

- `AGENTS.md`
- `AGENT_OPERATING_MODEL.md`
- `symbol-cep/AGENTS.md`
- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/ARCHITECTURE.md`
- `wedding-cep/AGENTS.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- Yes, agent-facing only. These skills route work for both `wedding-cep` and `symbol-cep`, but no runtime or repo workflow behavior changes.

## Validation Targets

- `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/adobe-cep-repo-context`
- `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/cep-es3-es6-boundary`
- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_skill_repo_route_alignment_scope.md`

## Notes Before Execution

- Keep skills thin and route-focused; facts stay in repo docs.
- Do not widen this into a skill-system refactor.
- Do not touch `agents/openai.yaml` unless the interface metadata is actually stale.

## Implementation Note

- Updated `adobe-cep-repo-context` so the `symbol-cep` route now follows the same repo-native chain as the app docs: `AGENTS -> FEATURE_MAP -> ARCHITECTURE -> PROJECT_STATUS`.
- Added `AGENT_OPERATING_MODEL.md` to the cross-app docs list in `adobe-cep-repo-context` because it is now a standing control-plane source of truth for agent behavior.
- Updated `cep-es3-es6-boundary` so it explicitly opens the app architecture doc before choosing a bridge/host entrypoint.
- Expanded the boundary skill's repo anchors to include the current `symbol-cep` bridge and host surfaces alongside the existing `wedding-cep` anchors.
- Left skill frontmatter and `agents/openai.yaml` unchanged because the trigger metadata did not change and validation showed no stale interface requirement.

## Review Gate

Scope Reviewed: thin routing-only edits in `adobe-cep-repo-context` and `cep-es3-es6-boundary`; no repo runtime or workflow-law files changed.
Top Risks: copying architecture facts into skills instead of routing to repo SSOTs, widening the skills beyond onboarding guidance, or leaving `symbol-cep` as a second-class route compared with `wedding-cep`.
Required Fixes: none after implementation; the final wording keeps skills as entrypoint layers and points back to repo-owned docs for the actual facts.
No Blocking Findings: yes; self-review found no drift with `symbol-cep/ARCHITECTURE.md`, `symbol-cep/FEATURE_MAP.md`, `wedding-cep/ARCHITECTURE.md`, or the standing operating model.
Validation Rerun Needed: yes; reran skill validation for both updated skills, repo encoding validation, performed fresh-agent forward-tests, and then reran the gate check after updating the receipt.

## Verification Gate

Claims Verified: the pilot skills now route `symbol-cep` through the same doc chain as the repo, the CEP boundary skill now exposes both app-side bridge/host anchors instead of implicitly biasing toward `wedding-cep`, and fresh agents follow the new chain before inspecting runtime files.
Evidence Run: `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/adobe-cep-repo-context`; `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/cep-es3-es6-boundary`; `npm run check:encoding`; fresh-agent forward-test with `$adobe-cep-repo-context` on a `symbol-cep` postflight-hook task; fresh-agent forward-test with `$cep-es3-es6-boundary` on a `symbol-cep` bridge/host bug-routing task; `npm run check:gates -- --file .task_steps/c2_skill_repo_route_alignment_scope.md`.
Remaining Limits: this keeps skills aligned at the routing layer only; it does not add new repo facts or automatically detect future drift if app docs change again later.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the smallest worthwhile follow-up after the new `symbol-cep/ARCHITECTURE.md` because agent entry skills are exactly where stale routing tends to survive after docs improve.
- Benefit: fresh agents now have a more symmetric path into both apps, which should reduce incorrect first-file guesses and lower onboarding noise.
- Forward-test signal: both fresh agents opened `symbol-cep/FEATURE_MAP.md` and `symbol-cep/ARCHITECTURE.md` before diving into code, which is the behavior this cleanup was meant to enforce.
- Boundaries held: no runtime code, no repo workflow law, no new skills, and no metadata regeneration beyond validation.
