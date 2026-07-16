# C2: Hybrid `.agent` Skill Pilot Scope

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: Keep `.agent` as repo-native governance, add `wedding-cep/FEATURE_MAP.md` as a repo SSOT for feature navigation, and create three thin pilot Codex skills for repo context, wedding domain routing, and CEP ES3/ES6 boundary routing.
- Execution mode: docs-plus-skills only; no runtime behavior or production code changes.

## Files To Modify

- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/cep/README.md`
- `C:/Users/Admin/.codex/skills/adobe-cep-repo-context/SKILL.md`
- `C:/Users/Admin/.codex/skills/wedding-domain-knowledge/SKILL.md`
- `C:/Users/Admin/.codex/skills/cep-es3-es6-boundary/SKILL.md`

## Consumers Verified

- `wedding-cep` maintainers and agents now have a feature navigation SSOT in `wedding-cep/FEATURE_MAP.md`
- Pilot skills were forward-tested through independent sub-agents on repo onboarding, wedding-domain routing, and CEP boundary routing tasks
- `skill-creator` validation confirmed all three skill folders are structurally valid

## Cross-App Impact

- The repo-context skill affects how agents route into both `wedding-cep` and `symbol-cep`
- No app runtime code or shared library behavior changed
- `.agent` remains the governance/control-plane source of truth

## Validation Targets

- `python quick_validate.py C:\Users\Admin\.codex\skills\adobe-cep-repo-context`
- `python quick_validate.py C:\Users\Admin\.codex\skills\wedding-domain-knowledge`
- `python quick_validate.py C:\Users\Admin\.codex\skills\cep-es3-es6-boundary`
- `npm run check:encoding`
- Forward-test each pilot skill with a fresh sub-agent and a realistic task prompt

## Notes Before Execution

- Keep facts in repo docs; keep skills thin and procedural
- Do not migrate `/plan`, `/build`, `/fix`, `AGENTS.md`, or `core_protocol.md` into skills
- Do not delete old `.agent/memory/skills` in the same round; keep this as a pilot

## Review Gate

Scope Reviewed: Hybrid split between repo governance and external pilot skills

Top Risks: External skills drifting from repo docs; creating a second source of truth for wedding feature routing; over-converting `.agent` workflow mechanics into optional skills

Required Fixes: Add a repo-native `FEATURE_MAP.md`; keep skill bodies thin and link to repo docs instead of copying long facts; forward-test the skills with independent sub-agents

No Blocking Findings: Yes; the pilot stays inside docs/onboarding surfaces and does not modify runtime behavior

Validation Rerun Needed: No

## Verification Gate

Claims Verified: `wedding-cep` now has a feature-level navigation SSOT; three pilot skills exist as thin entrypoints instead of duplicated knowledge dumps; the skills are structurally valid and usable by fresh agents

Evidence Run: `python quick_validate.py C:\Users\Admin\.codex\skills\adobe-cep-repo-context`; `python quick_validate.py C:\Users\Admin\.codex\skills\wedding-domain-knowledge`; `python quick_validate.py C:\Users\Admin\.codex\skills\cep-es3-es6-boundary`; `npm run check:encoding`; forward-test results from sub-agents for repo-context, wedding-domain routing, and CEP boundary routing

Remaining Limits: The old `.agent/memory/skills` surfaces still exist, so duplication risk remains until a later cleanup round; pilot skills live outside the repo tree, so maintainers still need repo docs to remain current

Unverified But Suspected: A future `symbol-domain-or-imposition-context` skill may be worth piloting once `symbol-cep` gets a feature map equivalent
