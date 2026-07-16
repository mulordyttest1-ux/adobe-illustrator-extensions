## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: `libs/wedding/domain` is already a real shared surface in repo architecture and ownership, but it still has no repo-native front door. Agents can route into `wedding-cep` and `symbol-cep`, yet they still have to guess when a change belongs in `@wedding/domain`.
- Goal: add a proper shared-domain entry chain and align the thin routing skills so agents can explicitly choose `libs/wedding/domain` as the owning surface.
- Non-goals: do not refactor domain code, do not change exports or package metadata, and do not widen this into a full shared-surface governance rewrite.

## Scope Lock

- Summary: add `libs/wedding/domain/AGENTS.md`, replace the stub `README.md`, and align root/skill routing docs around that new shared-domain front door.
- Execution mode: docs-only shared-surface cleanup; no runtime, package, or workflow-law changes.

## Files To Modify

- `AGENTS.md`
- `.agent/README.md`
- `libs/wedding/domain/AGENTS.md`
- `libs/wedding/domain/README.md`
- `C:/Users/Admin/.codex/skills/adobe-cep-repo-context/SKILL.md`
- `C:/Users/Admin/.codex/skills/wedding-domain-knowledge/SKILL.md`

## Consumers Verified

- `wedding-cep/FEATURE_MAP.md`
- `AGENT_OPERATING_MODEL.md`
- `CODEOWNERS`
- `libs/wedding/domain/src/index.ts`
- `libs/wedding/domain/package.json`

## Cross-App Impact

- Yes, agent-facing only. This milestone changes routing and onboarding for a shared domain package used by `wedding-cep` and governed as an elevated-risk surface, but it changes no runtime behavior.

## Validation Targets

- `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/adobe-cep-repo-context`
- `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/wedding-domain-knowledge`
- `npm run check:encoding`
- one fresh-agent forward-test on a pure `@wedding/domain` task
- `npm run check:gates -- --file .task_steps/c2_wedding_domain_agent_entry_alignment_scope.md`

## Notes Before Execution

- Keep `libs/wedding/domain` documented as a pure shared domain package with no CEP/UI concerns.
- Keep skills thin; route to repo SSOTs instead of duplicating business rules.
- Do not touch `package.json`, `src/`, or `agents/openai.yaml` unless validation shows a real issue.

## Implementation Note

- Added `libs/wedding/domain/AGENTS.md` as the scoped front door for the shared wedding domain package.
- Replaced the stub `libs/wedding/domain/README.md` with a package-specific README covering purpose, public modules, boundaries, and validation.
- Added `libs/wedding/domain/AGENTS.md` to the scoped-instruction lists in root `AGENTS.md` and `.agent/README.md`.
- Updated `adobe-cep-repo-context` so fresh agents can explicitly route to `libs/wedding/domain` instead of guessing between app and shared surfaces.
- Updated `wedding-domain-knowledge` so it now distinguishes pure shared domain work from `wedding-cep` app-layer work.

## Review Gate

Scope Reviewed: shared-domain routing docs and thin skills only: root/control-plane references, `libs/wedding/domain` front-door docs, and the two updated skills.
Top Risks: creating a second source of truth for business rules, overstating package boundaries, or accidentally routing agents away from `wedding-cep` when a task really belongs in app-layer UX or packet orchestration.
Required Fixes: none after implementation; the final wording keeps rules thin, points back to repo-owned references, and explicitly says shared domain is only for pure business logic.
No Blocking Findings: yes; self-review found no runtime or package contract changes and no conflict with `wedding-cep/FEATURE_MAP.md`, `CODEOWNERS`, or the standing operating model.
Validation Rerun Needed: yes; reran skill validation for both updated skills, repo encoding validation, performed a fresh-agent forward-test on a pure shared-domain task, and then reran the gate check.

## Verification Gate

Claims Verified: `libs/wedding/domain` now has a repo-native front door; the repo and `.agent` surface lists now advertise that scoped instruction; and a fresh agent routes a pure business-logic task to `libs/wedding/domain` before falling back to app-layer files.
Evidence Run: `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/adobe-cep-repo-context`; `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/wedding-domain-knowledge`; `npm run check:encoding`; fresh-agent forward-test with `$wedding-domain-knowledge` and `$adobe-cep-repo-context` on `Adjust wedding name-splitting business logic without changing CEP or UI behavior.`; `npm run check:gates -- --file .task_steps/c2_wedding_domain_agent_entry_alignment_scope.md`.
Remaining Limits: this milestone improves routing and package discoverability only; it does not add new runtime tests or resolve whether future non-wedding consumers will use this package.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the smallest remaining high-value cleanup because `libs/wedding/domain` was already a real shared surface in architecture and ownership, but still looked like an unowned Nx stub to fresh agents.
- Benefit: shared business-logic tasks now have a first-class route, which should reduce misclassification into `wedding-cep` app code and keep domain changes closer to their real boundary.
- Forward-test signal: the fresh agent opened `libs/wedding/domain/AGENTS.md` and `libs/wedding/domain/README.md` first and correctly chose the domain package as the owner for a pure name-splitting task.
- Boundaries held: no runtime code, no package exports, no app logic, and no workflow-law changes.
