# C2: Wedding V2 Island Docs Alignment

## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Align `wedding-cep` architecture and feature-routing docs with the completed `Document Sync V2` upgrades and the current `Template Authoring V2` island shape.
- Execution mode: focused docs-only update inside `wedding-cep` architecture/navigation surfaces

## Files To Modify

- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/PROJECT_STATUS.md`

## Consumers Verified

- `wedding-cep/AGENTS.md`
- `AGENT_OPERATING_MODEL.md`

## Cross-App Impact

- None. This round updates only `wedding-cep` docs and does not change runtime code, shared libs, or cross-app taxonomy.

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_v2_island_docs_alignment_scope.md`

## Notes Before Execution

- Keep `FEATURE_MAP` focused on entry routing, not implementation trivia.
- Do not widen this round into file moves, runtime code changes, or `symbol-cep` doc edits.
- This round is justified only if it removes routing drift after the completed `Document Sync V2` and current `Template Authoring V2` work.
