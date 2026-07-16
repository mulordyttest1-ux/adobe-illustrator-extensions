---
name: hexagonal-rules
description: Repo-specific architecture boundary rules for the Adobe Illustrator CEP monorepo. Use when moving code across domain, use-case, adapter, UI, host, or shared-package boundaries; reviewing import direction; or checking whether a refactor still matches the repo's layered design.
---

# Hexagonal Rules

Use this skill as a thin routing and review aid for boundary decisions in this repo. Do not use it as a generic architecture tutorial. Facts live in repo docs; this skill only points to the right source of truth and the red flags to check.

## Quick Start

1. Open [AGENTS.md](C:/Projects/adobe-illustrator-extensions/AGENTS.md).
2. Open the nearest scoped `AGENTS.md` for the code you will touch.
3. Open [AGENT_OPERATING_MODEL.md](C:/Projects/adobe-illustrator-extensions/AGENT_OPERATING_MODEL.md).
4. Open the owning architecture or package routing doc:
   - [wedding-cep/ARCHITECTURE.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/ARCHITECTURE.md)
   - [symbol-cep/ARCHITECTURE.md](C:/Projects/adobe-illustrator-extensions/symbol-cep/ARCHITECTURE.md)
   - [libs/shared/AGENTS.md](C:/Projects/adobe-illustrator-extensions/libs/shared/AGENTS.md) and [libs/shared/README.md](C:/Projects/adobe-illustrator-extensions/libs/shared/README.md)
   - [libs/wedding/domain/AGENTS.md](C:/Projects/adobe-illustrator-extensions/libs/wedding/domain/AGENTS.md) and [libs/wedding/domain/README.md](C:/Projects/adobe-illustrator-extensions/libs/wedding/domain/README.md)
5. If the change crosses panel-side JS and host-side JSX, also open [ES3_ES6_Boundary](../ES3_ES6_Boundary/SKILL.md).

## Repo Boundary Defaults

- Keep `libs/wedding/domain` pure. Do not import CEP, UI, or Illustrator host code into it.
- Keep app-local business flow inside the owning app. Do not drift behavior between `wedding-cep` and `symbol-cep` without an explicit shared artifact.
- Keep panel-side JS as the place for orchestration, validation, and heavier logic.
- Keep `.jsx` files ES3-only and limited to host IO and narrow document operations.
- Treat `libs/shared` as elevated-risk shared surface. Route it through the shared package docs and the repo operating model before editing.

## Route By Change Type

- Wedding business rule or derived data:
  - Start with [libs/wedding/domain/README.md](C:/Projects/adobe-illustrator-extensions/libs/wedding/domain/README.md)
  - Then open [wedding-cep/FEATURE_MAP.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/FEATURE_MAP.md) if runtime consumers are involved
- Wedding UI/report or validator flow:
  - Start with [wedding-cep/FEATURE_MAP.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/FEATURE_MAP.md)
  - Keep presentation, action/orchestration, and validation boundaries separate
- Symbol execution or postflight hook work:
  - Start with [symbol-cep/FEATURE_MAP.md](C:/Projects/adobe-illustrator-extensions/symbol-cep/FEATURE_MAP.md)
  - Treat `postflight` there as hooks/orchestration, not as validation-report UI
- Host bridge or `.jsx` work:
  - Escalate immediately if the task changes contract shape, packet shape, or host boundary ownership

## Review Checklist

- Is the code being changed in the owning bounded context?
- Does dependency direction still point inward toward domain/business logic rather than outward toward UI/host details?
- Is host-side `.jsx` still doing narrow IO instead of absorbing orchestration?
- Did a shared or cross-app change get treated as elevated-risk work?
- Does the repo already have a closer seam where this logic should live?

## Red Flags

- Domain logic starts importing CEP, DOM, bridge, or panel helpers.
- `.jsx` gains modern JS syntax or starts shaping business data.
- A local refactor quietly creates a new cross-app dependency.
- A change to `libs/shared` or `libs/wedding/domain` is treated like a normal app-local edit.
- A task uses this skill instead of the owning app/package docs as the final source of truth.

## Exit Condition

Stop using this skill once you know:

- which bounded context owns the change
- which repo doc is the correct source of truth
- whether the task is app-local, shared, or host-boundary work
