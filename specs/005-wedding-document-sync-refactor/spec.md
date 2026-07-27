# Wedding Document Sync Cleanup V1

## Goal

Keep scan and update behavior stable while making the Document Sync bounded
context use one explicit host dependency and one stateless assembly path.

## Scope

- `ScanAction`, `UpdateAction`, and `runApplyStrategyUpdate`
- Document Sync assembler contract
- Strategy planning surface and characterization tests
- Wedding architecture and inventory documentation

## Non-goals

- No changes to JSX, raw bridge transport, SchemaInjector, domain rules, UI
  form behavior, or Wedding Suite.
- No Illustrator 2025 smoke lane.

## Invariants

- Scan result remains `{ data, count }`.
- Update result keeps its existing success, failure, metadata, and binding fields.
- Apply strategy keeps its success, failure, no-frame, and no-plan results.
- Illustrator host behavior and operator-facing flow remain unchanged.
