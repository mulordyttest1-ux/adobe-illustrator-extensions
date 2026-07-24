# C2 Scope and Gate Receipt: Immutable Golden Recovery Release

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: yes

## Approved Scope

- Add recovery packaging/verifier tooling and tests.
- Add source-map-free packaging mode to existing build entry points.
- Add offline per-user installer/uninstaller templates.
- Add Windows immutable release workflow.
- Add private devkit mirror command and repin its immutable release.
- Fix successful native Git stderr capture discovered while verifying the pinned devkit upgrade.
- Do not modify product runtime behavior, `libs/shared`, or the existing live-link installer contract.

## Excluded State

- User-modified `symbol-cep/cep/data/presets.json` in the primary worktree.
- User note `prompt chạy cài script CEP máy mới.txt`.
- User's active `.specify/feature.json` and `specs/002-flexible-invite-stock/` in the primary worktree.
- Dev/test panels, credentials, font/Adobe binaries, cache/session/log state.

## Review Gate

Scope Reviewed: product packaging/verifier, three build-mode changes, silent installer/uninstaller, Windows release workflow, devkit mirror v1.0.3, and pinned-devkit native command fix.
Top Risks: payload traversal/link safety; unlisted file injection; installer rollback around junctions; preset loss; tag/asset overwrite; secret leakage through mirror errors; normal Git stderr treated as fatal.
Validation Rerun Needed: yes; rerun full product verify, focused Windows recovery suite, pinned devkit ensure, gate checker, and CI after publication fixes.
No Blocking Findings: review found no product runtime or `libs/shared` change; all identified tooling risks have explicit guards and regression tests.

## Verification Gate

Claims Verified: production-only allowlist, source-map-free ZIP, canonical version/commit identity, SHA inventory, 15 MiB budget, installer exit codes, preset preservation, idempotence, rollback, junction safety, immutable setting, devkit pin/release/mirror contract, and full repository compatibility.
Evidence Run: `npm run verify` PASS after the release-preflight fix with 42 repo-tooling tests; recovery workflow regression 8/8 PASS; PR CI and merged-main CI PASS on Ubuntu/Windows; devkit `tests/run-tests.ps1` and main/tag CI PASS; `npm run devkit:ensure -- --json` PASS at v1.0.3/ba224644; GitHub immutable-releases API returned enabled true.
Release Preflight Finding: the first dispatch stopped before tag/asset creation because the least-privilege `GITHUB_TOKEN` cannot read the Administration-scoped immutable-releases endpoint. The workflow now requires an administrator-confirmed `RECOVERY_IMMUTABLE_RELEASES_ENABLED=true` repository variable, with the real GitHub immutability setting remaining the enforcement control.
Remaining Limits: merged-main packaging/release attestation, encrypted mirror using the operator password/destination, and Illustrator 2025/2026 visual smoke acceptance must occur in release order.
Unverified But Suspected: none in the implemented tooling; Adobe visual behavior cannot be claimed before the host acceptance run.

## Release Gate

GitHub release immutability is enabled, the product branch is merged, and merged-main CI passes. Publication may proceed after the release-preflight fix merges; the release is not declared fully accepted until the encrypted mirror and Illustrator 2025/2026 manual checks pass. The workflow rejects an existing tag/release and independently verifies the release and asset attestations after publication.
