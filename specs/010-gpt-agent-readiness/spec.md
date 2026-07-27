# GPT Agent Readiness V1

## Goal

Make the repository easier and safer for GPT coding agents to navigate,
change, and verify without changing product runtime behavior.

## Scope

- A concise repository agent context map.
- An explicit legacy compatibility map.
- A machine-checkable readiness contract for required context, commands,
  specs, and clean-clone reproducibility.
- A cancellation marker for abandoned specs.
- Current Symbol test guidance.
- Root verification and documentation routing.

## Non-goals

- No product JS/JSX, bridge, schema, preset, or UI behavior changes.
- No automatic Git staging or migration of untracked files.
- No deletion of legacy adapters or historical artifacts.
- No Illustrator smoke run for this tooling-only pass.

## Contracts

- `AGENTS.md` remains the instruction authority.
- `AGENT_CONTEXT.md` is the short operational map.
- `LEGACY_MAP.md` identifies allowed compatibility seams and removal triggers.
- `CANCELLED.md` prevents an abandoned spec directory from being treated as
  active work.
- `npm run check:agent-ready` reports readiness errors and warnings.
- `npm run check:agent-ready:strict` also rejects untracked source/context/test
  files.
- `npm run audit:agent-ready` emits the exact untracked ownership plan as JSON.
- Root `verify` runs the non-strict readiness check.
- Clean-checkout CI runs strict readiness before `verify`.
- `.specify/feature.json` remains a machine-local active-feature pointer and is
  ignored rather than tracked.
