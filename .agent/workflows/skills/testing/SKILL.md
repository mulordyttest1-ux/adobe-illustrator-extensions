---
name: CEP Live Testing
description: Reproduce, smoke test, and debug CEP panels in real runtime conditions. Use when offline reasoning is not enough and Illustrator or panel behavior must be validated directly.
---

# Skill: CEP Live Testing

Use this skill when you need runtime evidence instead of code-only reasoning.

## Prerequisites

- run the supported machine setup once:
  - `npm run setup:dev`
- or refresh only the six managed wrappers:
  - `npm run install:cep-live-links`
- verify machine requirements and wrapper targets:
  - `npm run doctor:dev`

## Test Loop

1. build the panel you are changing:
   - `npm run build:wedding`
   - `npm run build:symbol`
   - `npm run build:toolkit`
2. reload the panel in Illustrator
3. run the matching smoke test:
   - `npm run test:smoke:wedding`
   - `npm run test:smoke:symbol`
   - `npm run test:smoke:toolkit`
4. neu can compatibility voi lenh cu, `test:e2e:*` hien chi la alias tro ve `test:smoke:*`

## Debugging Notes

- default debug ports:
  - Wedding: `http://localhost:9197`
  - Symbol: `http://localhost:9198`
  - Toolkit: `http://localhost:9099`
- use browser-like console and network debugging where available
- keep scratch scripts in intentional locations, not loose in repo root

## Regression Loop

1. capture the symptom
2. create or update a reproduce path
3. fix the bug
4. rerun and confirm

## Common Failures

| Symptom | Likely Fix |
|:--------|:-----------|
| code changes do not appear | rebuild the correct panel and reload it |
| connection refused | open the extension and verify the debug port |
| PowerShell policy blocks npm | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `require` is not defined | treat CEP panel code as browser-side code |

## Reporting

- say which panel you built
- say which runtime path you tested
- report outcome and residual uncertainty
