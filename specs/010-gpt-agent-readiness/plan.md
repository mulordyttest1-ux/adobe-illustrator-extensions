# Implementation Plan

1. Add the short agent context map and link it from root instructions.
2. Add a readiness checker with focused fixture tests.
3. Fix stale Symbol unit/smoke guidance.
4. Wire readiness into root npm scripts and `verify`.
5. Add a legacy map and classify abandoned specs explicitly.
6. Run strict readiness on clean-checkout CI.
7. Record current strict-mode warnings without staging or deleting user files.
8. Add a machine-readable ownership audit for the future Git normalization
   pass.
9. Run encoding, readiness, tooling tests, and full non-smoke verification.
