---
name: Lint
description: Run and interpret lint commands for repo changes. Use when validation needs ESLint, when lint fails, or when architecture and naming violations must be resolved.
---

# Skill: Lint

Use this skill when workflow validation requires lint or when lint failures are the fastest signal for boundary and style issues.

## Commands

```bash
npm run lint:symbol
npm run lint:wedding
npm run lint:all
```

## Priorities

| Rule Type | Expectation |
|:----------|:------------|
| architecture boundaries | fix, do not suppress casually |
| unused variables | delete or justify immediately |
| naming violations | fix in files you already touch |
| complexity warnings | refactor if the current task already touches that area |

## Notes

- repo lint config lives in `shared/eslint.config.mjs`
- boundary violations matter more than cosmetic cleanup
- report what failed, what was fixed, and what was intentionally deferred
