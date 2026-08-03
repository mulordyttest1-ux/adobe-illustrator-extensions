# Wedding Domain

## Overview

- Package name: `@wedding/domain`
- Public entrypoint: `src/index.ts`
- Package boundary: pure wedding business logic only
- Scoped instructions: `AGENTS.md`

This package is the shared domain surface for wedding invitation rules that must stay independent from CEP, Illustrator host code, and panel UI.

## Navigation

- Scoped instructions: `AGENTS.md`
- Repo-wide governance: `../../../AGENTS.md`
- Owning app context that consumes this package most directly: `../../../wedding-cep/FEATURE_MAP.md`
- Architecture contract for the main consumer app: `../../../wedding-cep/ARCHITECTURE.md`

## Current Public Modules

- `src/lib/calendar.js`
- `src/lib/date-logic.js`
- `src/lib/name.js`
- `src/lib/rules.js`
- `src/lib/string.js`
- `src/lib/time.js`
- `src/lib/venue.js`

All public imports should flow through `src/index.ts`.

## What Belongs Here

- date calculations and date-derived wedding rules
- Vietnamese solar/lunar conversion is calculated offline in the domain; the
  application calendar CSV is retained only as a regression fixture.
- name splitting and related pure business helpers
- venue/business-field derivation that does not need CEP or DOM access
- string/business rule helpers reused across wedding flows

## What Does Not Belong Here

- CEP bridge logic
- Illustrator DOM operations
- panel state, widgets, builders, or toasts
- schema-loader, file access, or host transport code

## Validation

```powershell
npm --workspace @wedding/domain run lint
npm --workspace @wedding/domain run test
```

If a change also affects `wedding-cep` behavior, rerun the relevant app lane after the domain lane:

```powershell
npm run test:wedding
npm run test:smoke:wedding
```

## Notes

- Treat this package as elevated-risk because it is shared domain code.
- Prefer narrow, explicit changes and keep the exported contract stable unless a planned contract change is required.
