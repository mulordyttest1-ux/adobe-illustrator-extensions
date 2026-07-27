# Symbol Config Hardening V1 Plan

1. Characterize current Config tab, schema mutation, persistence, and smoke contracts.
2. Make `ConfigEngine` pure and introduce schema-state normalization/fingerprinting.
3. Restrict schema editing to dynamic margin rows and add dirty-draft confirmation.
4. Remove write-only `last_active` compatibility and dead config renderer/schema editor files.
5. Add focused tests for catalog hydration, stale-field pruning, schema mutation, and event routing.
6. Update Symbol architecture docs and run lint, build, unit tests, and 2026 smoke.

## Risk Controls

- Preserve `presets.json` as a user-owned dirty file.
- Use existing repository/service injection seams.
- Keep host JSX and bridge contracts unchanged.
- Do not run the 2025 lane.
