# Implementation Plan

1. Wrap the host PDF `saveAs` call with a stage-specific error code.
2. Capture and open a recovery AI when that error reaches `buildJob`.
3. Skip destructive cleanup if only the live working document can be retained.
4. Include recovery details in the panel error message.
5. Add panel and host composition regression tests.
6. Run Symbol lint, unit, build and Illustrator 2026 smoke validation.
