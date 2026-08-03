# Implementation Plan

## Phase 1: Developer guards

1. Add Symbol checker support, CLI, and fixture tests.
2. Add Toolkit checker support, CLI, and fixture tests.
3. Keep Wedding on its existing dependency checker.

## Phase 2: Public routing

1. Add workspace `check:architecture` scripts.
2. Add the root `check:architecture` script.
3. Make root `verify` run architecture checks before broad validation.

## Phase 3: Documentation and ROI

1. Record guard contracts in Symbol and Toolkit architecture documents.
2. Record completion and the 2026-only validation lane in project status.
3. Update the repository inventory with completed guard work and deferred
   candidates.
4. Run the non-smoke validation and repository audit.
5. Pause proactive refactoring unless the audit provides new evidence.

## Safety

- Checkers are report-only and never modify source.
- Production runtime and JSX are outside the change set.
- Existing unrelated worktree changes remain untouched.
