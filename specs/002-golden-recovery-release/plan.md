# Implementation Plan: Immutable Golden Recovery Release

**Branch**: `codex/golden-recovery-release` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

## Summary

Build a materialized, last-known-good runtime recovery package containing only the three production CEP panels. The package is created from a clean commit already on `origin/main`, verifies every runtime file before install, installs per-user without Node/Git/Administrator, retains one rollback, and is published as an immutable GitHub release before an independently verified AES-256 mirror is made by the private devkit.

## Technical Context

**Language/Version**: Node.js 24/npm 11; PowerShell 5.1+; Windows batch; CEP panel JavaScript; Illustrator ExtendScript ES3
**Primary Dependencies**: existing esbuild pipeline, Git/GitHub CLI for release automation, 7-Zip for archive/mirror operations, Windows registry/PowerShell filesystem APIs for installation
**Storage**: ZIP artifact, `%APPDATA%\Adobe\CEP\extensions`, `%LOCALAPPDATA%\DinhSon\CEP`, GitHub Releases, operator-selected encrypted mirror destination
**Testing**: `node:test`, temporary Git repositories/directories, Windows PowerShell integration tests, existing repository verify/smoke suites
**Target Platform**: Windows 10/11 with Adobe Illustrator 2025 or 2026
**Project Type**: cross-app monorepo release tooling plus private workstation devkit command
**Performance Goals**: offline install in one invocation; ZIP no larger than 15 MiB; idempotent reinstall
**Constraints**: no product runtime or `libs/shared` behavior changes; no source maps, dev/test panels, credentials, symlinks, or machine-local state; preserve user preset data on upgrade; exact release commit only
**Scale/Scope**: three production extension IDs, two Illustrator host generations, one rollback generation

## Constitution Check

- [x] Runtime boundary: existing `.jsx` content is copied unchanged and remains ES3-compatible.
- [x] Ownership: no wedding-domain or shared-library ownership boundary is changed.
- [x] Cross-app: classified D1-3 / Shared Change no / Cross-App Impact yes.
- [x] Safety: packaging rejects dirty/unpublished commits, forbidden files, links, missing runtime files, and existing release tags.
- [x] Review: Review Gate and Verification Gate evidence is required before release publication.
- [x] Secrets: no credentials, environment files, sessions, caches, Adobe binaries, fonts, or machine-local Codex state are eligible.
- [x] Reproducibility: artifact name, manifest, hashes, tag, and commit form an immutable identity.

The constitution check remains satisfied after design: the implementation adds release tooling and generated packaging only; product behavior and shared libraries remain untouched.

## Project Structure

### Documentation

```text
specs/002-golden-recovery-release/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- cli-and-artifact.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Product repository

```text
recovery/
|-- RECOVERY_README.txt
|-- install-silent.bat
|-- uninstall-silent.bat
`-- installer/
    |-- install.ps1
    `-- uninstall.ps1
scripts/
|-- recovery_core.cjs
|-- package_recovery.cjs
`-- verify_recovery.cjs
test/
|-- recovery_core.test.cjs
|-- recovery_installer.test.cjs
`-- recovery_roundtrip.test.cjs
.github/workflows/
`-- recovery-release.yml
```

### Private devkit repository

```text
mirror-recovery-release.ps1
machine/
`-- mirror_recovery_release.cjs
test/
`-- mirror_recovery_release.test.cjs
```

**Structure Decision**: keep materialized runtime generation in the public product because it owns the runtime contract; keep credentials-aware GitHub verification and encrypted off-site mirroring in the private devkit. The existing live-link installer remains unchanged.

## Complexity Tracking

No constitution violation requires an exception.
