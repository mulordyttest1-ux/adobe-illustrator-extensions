---
name: ES3_ES6_Boundary
description: Thin repo-local routing wrapper for CEP panel JavaScript versus Illustrator ExtendScript ES3. Use when edits cross `cep/js`, `cep/jsx`, or bridge paths.
---

# Skill: ES3 ES6 Boundary

Use this skill as a thin routing layer. Keep facts in repo docs and the local reference files, not in the wrapper body.

## Quick Start

1. Open [AGENTS.md](C:/Projects/adobe-illustrator-extensions/AGENTS.md).
2. Open the nearest scoped `AGENTS.md` for the app you are changing.
3. Open the app architecture doc before choosing the boundary:
   - [wedding-cep/ARCHITECTURE.md](C:/Projects/adobe-illustrator-extensions/wedding-cep/ARCHITECTURE.md)
   - [symbol-cep/ARCHITECTURE.md](C:/Projects/adobe-illustrator-extensions/symbol-cep/ARCHITECTURE.md)
4. Treat `cep/js` as panel-side modern JavaScript.
5. Treat `cep/jsx` and other host-side files as ES3 unless a repo fact proves otherwise.

## Open The Right Reference

- Runtime ownership unclear:
  - [boundary-map.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/ES3_ES6_Boundary/references/boundary-map.md)
- Panel-side JS:
  - [cep-es6.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/ES3_ES6_Boundary/references/cep-es6.md)
- Host-side ExtendScript:
  - [extendscript-es3.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/ES3_ES6_Boundary/references/extendscript-es3.md)
- Safe helpers or fallback patterns:
  - [polyfills.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/ES3_ES6_Boundary/references/polyfills.md)
- Side-by-side examples:
  - [examples.md](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/ES3_ES6_Boundary/references/examples.md)

## Repo Defaults

- Keep heavy logic in panel-side JS when possible.
- Keep `.jsx` files ES3-only and focused on Illustrator IO plus narrow document operations.
- Validate payloads before crossing the bridge.
- If the change also moves logic across larger architecture boundaries, open [Hexagonal_Rules](C:/Projects/adobe-illustrator-extensions/.agent/memory/skills/Hexagonal_Rules/SKILL.md).

## Exit Condition

Stop using this skill once you know:

- which runtime owns the logic
- which syntax rules apply
- which reference file contains the exact boundary fact you need
