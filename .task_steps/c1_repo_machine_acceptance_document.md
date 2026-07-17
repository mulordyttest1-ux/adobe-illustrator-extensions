# C1: Machine acceptance closure

## Direction Brief

- Context: close the remaining Windows/Adobe/font/manual acceptance items for the approved AI-native two-repository migration.
- Scope: product and devkit machine tooling, smoke harnesses, acceptance receipts, and immutable pins; no product feature behavior or `libs/shared` change.
- Best practice: validate the actual one-command bootstrap from a clean worktree, then run real Illustrator panels and host smoke before completion.
- Anti-pattern: treating merged architecture code or a dry-run as proof that a new machine can be restored.
- Edge cases: WinGet/App Installer initially absent, current Codex config must not be overwritten, Illustrator 2025 has an unsaved operator document, legacy wrappers are warning-only, and private font inventory must remain ignored.
- Counterfactual: checklist-only acceptance would not have exposed the missing setup import, stale Wedding smoke fixtures, or missing Toolkit cleanup dependency injection.
- Chosen direction: release devkit v1.0.2 for portable inventory forwarding, pin it in product, bootstrap a clean worktree, preserve operator state, and repair only defects reproduced by the acceptance lane.

## Implementation Plan

1. Capture private tool/Adobe/font/Codex inventory and forward font comparison through devkit bootstrap/doctor.
2. Publish an immutable devkit release and update the product tag/SHA pin.
3. Run the real Windows bootstrap from the clean acceptance worktree.
4. Open three work panels on Illustrator 2025 and three test panels on Illustrator 2026.
5. Run doctor plus all host smoke suites, repair reproduced acceptance defects, and rerun full validation.
6. Close review/verification gates and publish only after local and GitHub CI evidence is green.
