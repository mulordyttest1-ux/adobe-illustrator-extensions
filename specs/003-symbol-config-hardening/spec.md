# Symbol Config Hardening V1

## Scope

Harden the Symbol CEP Config tab without changing preset schema meaning, bridge payloads, or imposition runtime behavior.

## Requirements

- Config rule compilation is pure and must not mutate an embedded preset schema.
- Runtime schema editing is limited to dynamic margin rows in `sec_margins`.
- Removing a dynamic row removes its raw values and border controls from the draft.
- Switching presets asks before discarding a dirty draft.
- Saved presets are normalized to the active schema, so removed fields are not persisted.
- Persistence, state, event, and schema-edit concerns remain behind named service seams.
- Validation uses Symbol unit tests and Illustrator 2026 smoke only.

## Non-Goals

- No mass migration or rewrite of `symbol-cep/cep/data/presets.json`.
- No change to imposition engine order, host payloads, or PDF output.
- No Illustrator 2025 smoke lane.
