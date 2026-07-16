# C2: Agent Operating Model Baseline Scope

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: Add repo-native multi-agent governance artifacts, symbol feature navigation, GitHub review/task templates, and ownership metadata without changing app runtime behavior.
- Execution mode: docs and governance only; no product code behavior changes.

## Files To Modify

- `AGENT_OPERATING_MODEL.md`
- `adr/0001-agent-operating-model.md`
- `adr/0002-bounded-context-ownership.md`
- `adr/0003-risk-tiers-and-gates.md`
- `symbol-cep/FEATURE_MAP.md`
- `README.md`
- `symbol-cep/PROJECT_STATUS.md`
- `symbol-cep/cep/README.md`
- `CODEOWNERS`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/agent-task.yml`
- `.github/ISSUE_TEMPLATE/bug.yml`

## Consumers Verified

- Root governance docs: `AGENTS.md`, `.agent/workflows/core_protocol.md`
- Existing `wedding-cep/FEATURE_MAP.md` as the routing pattern to mirror
- `symbol-cep` runtime entrypoints and imposition feature surfaces
- Existing CI workflow `/.github/workflows/ci.yml`

## Cross-App Impact

- Adds repo-wide governance and ownership vocabulary used by both apps
- Adds `symbol-cep` feature map to match the existing `wedding-cep` navigation surface
- Does not change runtime, bridge behavior, or validation logic in either app

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_agent_operating_model_baseline_scope.md`

## Notes Before Execution

- Keep `.agent` and `AGENTS.md` as the control plane
- Do not move product files or refactor runtime code
- Use the git remote owner `@mulordyttest1-ux` as the default owner in `CODEOWNERS` until a team map exists

## Review Gate

Scope Reviewed: Repo governance baseline, feature navigation docs, CODEOWNERS, and GitHub templates for agent-driven work

Top Risks: Accidentally creating a second source of truth; writing a `CODEOWNERS` file with unusable owners; making symbol navigation too vague to help agent routing

Required Fixes: Keep workflow law in repo docs, mirror the existing wedding feature-map pattern for symbol, and use a valid default owner derived from the current Git remote

No Blocking Findings: Yes; the rollout stays in docs/governance surfaces and does not modify runtime behavior

Validation Rerun Needed: No

## Verification Gate

Claims Verified: The repo now has an explicit agent operating model, root ownership metadata, GitHub task/review templates, and feature navigation docs for both apps

Evidence Run: `npm run check:encoding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_agent_operating_model_baseline_scope.md`

Remaining Limits: `symbol-cep` still relies mostly on smoke coverage and does not yet have a full architecture doc equivalent to `wedding-cep`; `CODEOWNERS` currently resolves to a single owner until team handles exist

Unverified But Suspected: The next useful follow-up is a pilot round that uses the new templates and bounded-context vocabulary on real `/plan` and `/build` tasks
