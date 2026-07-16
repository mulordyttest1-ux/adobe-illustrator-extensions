# C2: Wedding Template Authoring V2 Docs Alignment

## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Align `wedding-cep` route and architecture docs with the current `Template Authoring V2` state after adding `template-authoring/templateAuthoringService.js` as the shared context root above auto and manual authoring paths.
- Execution mode: docs and governance alignment only; no runtime code, import graph, or file layout changes

## Files To Modify

- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/PROJECT_STATUS.md`

## Consumers Verified

- `wedding-cep/AGENTS.md`
- `AGENT_OPERATING_MODEL.md`

## Cross-App Impact

- None. This round only updates `wedding-cep` docs so future agents route correctly into the now facade-ready `Template Authoring` context.

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_template_authoring_v2_docs_alignment_scope.md`

## Notes Before Execution

- Do not widen this round into runtime refactors or `SchemaInjector` cleanup.
- Keep `Template Authoring` routed through action facades first; document `template-authoring/` as internal service/support seams beneath that route.
- Use this round to reflect current island state only, not to promise future `SchemaInjector` work.
