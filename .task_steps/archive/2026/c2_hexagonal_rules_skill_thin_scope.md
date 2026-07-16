# C2: Thin `Hexagonal_Rules` Internal Skill

## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: No
Shared Change: No
Cross-App Impact: No

## Scope Lock

- Summary: Replace the oversized internal `Hexagonal_Rules` skill body with a thin repo-specific boundary guide that points back to repo SSOTs instead of acting like a generic architecture tutorial.
- Execution mode: Single-agent docs/skill cleanup with forward-test by one fresh explorer.

## Files To Modify

- .agent/memory/skills/Hexagonal_Rules/SKILL.md

## Consumers Verified

- .agent/memory/skills/Code_Examples/SKILL.md
- .agent/memory/skills/Coding_Principles/SKILL.md
- .agent/memory/skills/Wedding_Domain_Knowledge/SKILL.md
- AGENT_OPERATING_MODEL.md

## Cross-App Impact

- None on runtime code.
- Repo-wide benefit only: internal skill now matches the thin-skill rule already documented in the operating model.

## Validation Targets

- Skill content is materially thinner and repo-specific.
- Skill frontmatter validates under the current skill naming rules.
- Existing relative references to `Hexagonal_Rules` remain valid.
- Forward-test routes to repo docs instead of relying on the skill as a full tutorial.
- `python C:\Users\Admin\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agent\memory\skills\Hexagonal_Rules`
- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_hexagonal_rules_skill_thin_scope.md`

## Notes Before Execution

- Do not mass-rewrite neighboring internal skills in the same round.
- Keep repo facts in repo docs; keep the skill as entrypoint/routing guidance only.

## Verification Gate

Claims Verified: `Hexagonal_Rules` is now a thin repo-specific routing skill; the updated frontmatter passes current skill validation rules; and a fresh explorer routes a shared wedding business-rule task to `libs/wedding/domain` after opening repo docs first.
Evidence Run: `python C:\Users\Admin\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agent\memory\skills\Hexagonal_Rules`; `npm run check:encoding`; `npm run verify`; forward-test via fresh explorer `019d28f4-9948-7710-966b-8d6f26113d1a`.
Remaining Limits: neighboring legacy internal skills still use older frontmatter naming and broader body styles, but they were intentionally left out of scope.
Unverified But Suspected: if the repo later normalizes all internal memory skills to hyphen-case names, more cleanup rounds will likely be available outside this milestone.
