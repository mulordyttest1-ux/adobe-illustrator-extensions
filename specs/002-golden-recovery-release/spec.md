# Feature Specification: Immutable Golden Recovery Release

**Feature Branch**: `codex/golden-recovery-release`

**Created**: 2026-07-17

**Status**: Approved

**Input**: User description: "Create an immutable, last-known-good Adobe Illustrator CEP runtime recovery bundle that installs silently on Windows and is preserved on GitHub plus encrypted Drive storage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restore Production Panels Offline (Priority: P1)

As the workstation owner, I can run one installer from a recovered bundle and restore the three production panels without installing developer tools or reconnecting the source repository.

**Why this priority**: Restoring a working production environment is the bundle's primary disaster-recovery purpose.

**Independent Test**: Extract the bundle on a supported Windows machine with Illustrator closed, run the installer once, and confirm the three production panels are installed for the current user.

**Acceptance Scenarios**:

1. **Given** Illustrator 2025 or 2026 is installed and closed, **When** the owner runs the silent installer, **Then** Imposition, Wedding Scripter, and Toolkit are installed without administrator rights.
2. **Given** a prior production installation exists, **When** the owner installs the same or a newer recovery release, **Then** existing preset state is retained and the operation completes without duplicate panels.
3. **Given** any payload file is corrupt, **When** installation begins, **Then** no production wrapper is replaced and the installer reports an integrity failure.

---

### User Story 2 - Produce a Trusted Last-Known-Good Artifact (Priority: P2)

As the repository owner, I can create a compact recovery artifact from an approved clean commit and prove which source revision produced it.

**Why this priority**: Recovery is trustworthy only when the runtime is traceable, complete, and protected from accidental replacement.

**Independent Test**: Build from a clean approved revision and verify that the archive is within budget, contains only production runtime files, and reports matching version, source revision, and integrity metadata.

**Acceptance Scenarios**:

1. **Given** an approved clean source revision, **When** a recovery release is produced, **Then** the artifact contains exactly three production extensions and the required installer/integrity metadata.
2. **Given** uncommitted source changes or an existing release version, **When** release packaging is attempted, **Then** the process refuses to publish.
3. **Given** a published release, **When** its integrity is checked, **Then** the release tag, source revision, and attached assets are verifiably unchanged.

---

### User Story 3 - Retain an Independent Encrypted Copy (Priority: P3)

As the repository owner, I can mirror the exact published recovery release to encrypted Drive storage and verify that it remains restorable independently of the working checkout.

**Why this priority**: A second provider and encrypted archive reduce dependency on one online service.

**Independent Test**: Mirror a published release to a chosen destination, verify the encrypted archive, and compare its recorded checksum with the published asset.

**Acceptance Scenarios**:

1. **Given** a valid published release and an explicit Drive destination, **When** mirroring runs, **Then** the exact verified assets are encrypted, tested, and accompanied by a checksum.
2. **Given** authentication, integrity, password, or destination validation fails, **When** mirroring runs, **Then** no successful backup is reported and partial output is removed.

### Edge Cases

- Illustrator is running during installation.
- Neither supported Illustrator version is installed.
- An existing wrapper contains filesystem junctions to a development checkout.
- Installation fails after the previous wrapper is staged for replacement.
- Runtime preset files exist in a prior installation but not in the new payload.
- A release archive includes a test panel, debug file, cache, secret-like file, symlink, or build-only file.
- The selected release tag or Drive archive already exists.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The recovery bundle MUST install exactly three production panels for the current Windows user.
- **FR-002**: Installation MUST work offline after extraction and MUST NOT require Node.js, Git, GitHub access, or administrator rights.
- **FR-003**: The installer MUST verify payload integrity before replacing an installed panel.
- **FR-004**: Installation MUST retain existing Imposition preset and usage state by default.
- **FR-005**: Installation MUST be idempotent and MUST restore the previous installation if replacement fails.
- **FR-006**: Installation MUST NOT delete or modify development and test wrappers.
- **FR-007**: The artifact MUST be produced only from a clean source revision already present on the public repository's main history.
- **FR-008**: The artifact MUST exclude dependencies, repository history, tests, debug surfaces, caches, logs, source maps, build tooling, credentials, licensed binaries, and machine authentication state.
- **FR-009**: The artifact MUST identify its release version, source revision, supported hosts, installed extension identities, integrity values, and known portability exceptions.
- **FR-010**: Each published release version MUST be immutable and MUST NOT be reused or overwritten.
- **FR-011**: The exact published assets MUST be mirrorable to a user-selected encrypted Drive destination with archive testing and checksum verification.
- **FR-012**: Source-development recovery MUST remain separate and continue to use GitHub plus the existing machine backup process.

### Key Entities

- **Recovery Release**: A versioned last-known-good archive tied to one approved source revision.
- **Runtime Extension**: One materialized production CEP panel with a production manifest and no live links.
- **Release Manifest**: The machine-readable identity, provenance, compatibility, integrity, and exception record for a release.
- **Installation State**: The current user's installed release version, source revision, log location, and rollback location.
- **Encrypted Mirror**: A tested Drive archive containing exact published release assets and independent checksum evidence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user restores all three production panels with one installer invocation and no more than one required manual action: closing Illustrator if it is open.
- **SC-002**: A fresh or repeated install completes without loss of existing Imposition preset state.
- **SC-003**: Every corrupt-payload test prevents replacement of the currently installed panels.
- **SC-004**: The compressed release remains at or below 15 MiB and contains zero forbidden development, cache, secret, or test files.
- **SC-005**: Every published artifact maps to one immutable release version and one source revision.
- **SC-006**: The encrypted Drive mirror passes archive testing and matches the published asset checksum.
- **SC-007**: All three panels open and pass their existing smoke scenarios in Illustrator 2025 and 2026 before the first immutable release is declared complete.

## Assumptions

- The supported host range remains Illustrator 2025 and 2026.
- The bundle is an unsigned per-user recovery distribution and enables only CSXS.11 and CSXS.12 debug mode.
- The artifact carries the committed `presets.json` values unchanged, including existing absolute output paths.
- Existing installed `presets.json` and `presets.usage.json` take precedence during reinstall or upgrade.
- GitHub remains the source-development system of record; this feature does not create a source escrow.
- Release assets are public, while the mirrored Drive archive uses the existing machine-backup password handling and never stores credentials in Git.
