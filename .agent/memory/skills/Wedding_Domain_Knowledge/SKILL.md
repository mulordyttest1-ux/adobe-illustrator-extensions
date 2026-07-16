---
name: Wedding_Domain_Knowledge
description: Thin repo-local routing wrapper for wedding domain rules, field semantics, and packet flow. Use when changing wedding business logic or schema-related behavior.
---

# Skill: Wedding Domain Knowledge

Use this skill to route wedding-specific work to the right repo facts before editing code. Keep business facts in repo docs and the local reference files.

## Quick Start

1. Open [AGENTS.md](C:/Projects/adobe-illustrator-extensions/AGENTS.md).
2. If the change should stay in shared pure business logic, open [libs/wedding/domain/AGENTS.md](C:/Projects/adobe-illustrator-extensions/libs/wedding/domain/AGENTS.md) and [README.md](C:/Projects/adobe-illustrator-extensions/libs/wedding/domain/README.md) first.
3. Open [wedding-cep/AGENTS.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/AGENTS.md) when the task belongs to the app layer.
4. Open [wedding-cep/FEATURE_MAP.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/FEATURE_MAP.md).
5. Open [wedding-cep/ARCHITECTURE.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/ARCHITECTURE.md) if the change may move logic across boundaries.

## Choose The Right Reference

- Glossary and invitation terms:
  - [glossary.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/glossary.md)
- Field shape, prefixes, and derived fields:
  - [data-model.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/data-model.md)
- Name, date, venue, and sync rules:
  - [business-rules.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/business-rules.md)
- Form to packet to Illustrator flow or reverse sync:
  - [data-flow.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/data-flow.md)
- State and lifecycle:
  - [state-lifecycle.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/state-lifecycle.md)
- Map concepts to code surfaces:
  - [architecture-mapping.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/architecture-mapping.md)
- Common pitfalls:
  - [scenarios-and-pitfalls.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/scenarios-and-pitfalls.md)
- Adding or changing field types:
  - [adding-field-types.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Wedding_Domain_Knowledge/references/adding-field-types.md)

## Repo Defaults

- Pure shared business logic belongs in `@wedding/domain`.
- Form data becomes a packet before it reaches adapters or Illustrator.
- `date.tiec` is the base date family unless a rule says otherwise.
- Reverse sync behavior depends on sync mode, not only on visible UI fields.
- If the change also crosses architecture boundaries, open [Hexagonal_Rules](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Hexagonal_Rules/SKILL.md).

## Exit Condition

Stop using this skill once you know:

- which business rule family owns the change
- which capability in `FEATURE_MAP.md` is the starting point
- which reference file contains the domain fact you need
