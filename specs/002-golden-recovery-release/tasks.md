# Tasks: Immutable Golden Recovery Release

## Phase 1: Specification and safety gates

- [x] T001 Record the approved specification, design artifacts, C1 direction brief, and C2 D1-3 cross-app scope.
- [x] T002 Confirm the implementation uses an isolated clean worktree and preserves unrelated user changes.

## Phase 2: Foundational packaging primitives

- [x] T003 Add unit-tested SemVer, path-policy, manifest, digest, Git-policy, and archive helpers in `scripts/recovery_core.cjs`.
- [x] T004 Add explicit source-map-free production modes to the three existing CEP build entry points without changing normal development builds.
- [x] T005 Implement the three-extension runtime allowlist, production manifest generation, and preset portability declaration.

## Phase 3: User Story 1 - offline one-run recovery install

- [x] T006 [US1] Implement `package:recovery` with clean/published-commit/tag/runtime guards and deterministic artifact naming.
- [x] T007 [US1] Implement the packaged `install-silent.bat` and PowerShell installer with integrity, Illustrator, CSXS, staging, rollback, logging, and preset-preservation behavior.
- [x] T008 [US1] Implement `uninstall-silent.bat` and scoped PowerShell removal that never follows or removes development/test links.
- [x] T009 [US1] Add Windows integration tests for fresh/idempotent/upgrade/corruption/running-process/rollback scenarios using temporary roots.

## Phase 4: User Story 2 - independently verifiable immutable release

- [x] T010 [US2] Implement `verify:recovery` with schema, hashes, extension set, forbidden-content, traversal/link, manifest-version, and 15 MiB checks.
- [x] T011 [US2] Add package scripts and cross-platform unit tests for CLI parsing, exit codes, allowlist/denylist, hashes, and artifact model.
- [x] T012 [US2] Add a Windows GitHub workflow that verifies, packages, integration-tests, drafts/uploads, and publishes `recovery-v<semver>`.
- [x] T013 [US2] Document and enforce the immutable-release prerequisite, attestation verification, and non-overwrite policy.

## Phase 5: User Story 3 - encrypted off-site mirror

- [x] T014 [US3] Implement the devkit `mirror-recovery-release.ps1` command and testable core logic for GitHub verification, SHA comparison, AES-256/mhe archive, archive test, and sidecar.
- [x] T015 [US3] Update devkit documentation, manifest/release metadata, CI/tests, publish a pinned devkit release, and repin the product lock.

## Phase 6: Verification and release

- [x] T016 Run product lint/build/test/encoding/gate verification and Windows recovery integration tests after all fixes.
- [x] T017 Run Review Gate and Verification Gate, resolve findings, and record fresh evidence in C2.
- [x] T018 Push the scoped branch and open a draft pull request without staging unrelated files.
- [x] T019a After merge, enable GitHub Immutable Releases and publish/verify `recovery-v1.0.0`.
- [ ] T019b Create and test the Drive AES mirror using the operator-held password.
- [ ] T020 Complete Illustrator 2025/2026 manual panel acceptance, preset checks, smoke tests, and restore development live links.
