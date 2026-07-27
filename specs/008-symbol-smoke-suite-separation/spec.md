# Symbol Smoke Suite Separation V1

## Goal

Make the Symbol smoke harness easier to navigate and diagnose without changing
the scenarios, runner contract, or Illustrator behavior under test.

## Scope

- Smoke runner support helpers and scenario family registration.
- Action, Config, Host, and Wedding Suite smoke family files.
- Manifest/order/count contract tests and temp cleanup safety tests.
- Illustrator 2026 smoke lane on port `9198`.

## Non-goals

- No production JS/JSX, bridge, geometry, installer, or bundle behavior
  changes.
- No changes to standalone diagnostic scripts that use port `9098`.
- No rewriting or deduplication of browser/Illustrator expressions inside
  scenarios.
- No Illustrator 2025 smoke lane.

## Invariants

- Top-level suite IDs remain `action`, `config`, `host`, and `wedding_suite`.
- Scenario names, order, and total count remain `46`.
- Suite counts remain `14`, `19`, `6`, and `7`.
- `npm run test:smoke:symbol` remains the supported entrypoint.
