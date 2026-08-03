# Implementation Plan

1. Inventory the existing runner, manifest, registration blocks, helper
   dependencies, and scenario order.
2. Move cleanup, output decoding, and expression factories into
   `smoke_support.cjs`; keep `test_smoke.cjs` as the CLI entrypoint.
3. Split each top-level smoke suite into bounded family registrars while
   preserving each original `runner.addTest()` block verbatim.
4. Keep the existing manifest IDs and registration order through thin
   top-level suite registrars.
5. Add manifest snapshot, registrar boundary, and temp-root safety tests.
6. Run Symbol encoding, lint, build, unit, and Illustrator 2026 smoke gates.

## Risk Controls

- Do not alter scenario strings, waits, browser DOM operations, or host
  expressions.
- Validate every original scenario name appears exactly once after extraction.
- Keep cleanup path guards and 2026 port defaults unchanged.
