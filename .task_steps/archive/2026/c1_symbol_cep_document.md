# C1 Research: Agent Context Isolation + Shared Library

> Historical research artifact. Keep for reference only; current repo conventions may be stricter or more complete than this snapshot.

## Define

This research targeted two goals:

1. Shared UI primitives such as `UIFeedback` should be available to both apps through `@shared/*` rather than cross-imports.
2. Agent scope should stay local to the active app plus shared code, instead of loading both app contexts by default.

## Search Summary

- Hard enforcement should come from tooling, not documentation alone.
- Scoped `AGENTS.md` files are useful to keep symbol, wedding, and shared rules separated.
- Module boundaries should block direct symbol-to-wedding imports and reserve `@shared/*` for shared surfaces.

## Alignment

- A repo can keep a root `AGENTS.md` and still use scoped `AGENTS.md`.
- The important part is precedence: active module scope should win over broad repo context.
- Shared code should stay app-neutral and avoid coupling to app-specific controllers.

## Anti-Patterns

- Global whitelists that let lint pass without a valid runtime import path.
- Repo instructions without scoped module rules, which cause context bleed across apps.
- Shared libraries that call directly into app-specific code.

## Recommended Direction

- Keep shared UI in `libs/shared`.
- Keep symbol and wedding isolated except through shared APIs.
- Treat scoped instructions plus import boundaries as the main protection layer.
