# Research: Immutable Golden Recovery Release

## Decision 1: disaster-recovery runtime artifact

The artifact is an **Immutable Golden Recovery Release**, a last-known-good runtime in the Disaster Recovery/Business Continuity layer. Git history and encrypted machine snapshots remain the source-development recovery mechanisms. A source escrow or full workstation image would solve a different problem and would make this artifact larger and harder to validate.

## Decision 2: materialized production extensions

Package the three `work` variants as ordinary directories. Do not package junctions, symlinks, or the three test/dev variants. A local materialized copy is required because GitHub cannot serve CEP runtime files directly and recovery must not depend on the original source checkout.

## Decision 3: unsigned per-user CEP installation

Install under `%APPDATA%\Adobe\CEP\extensions` and set `PlayerDebugMode=1` only for `CSXS.11` and `CSXS.12`. This matches the supported Illustrator 2025/2026 hosts and requires neither Administrator rights nor a signing certificate. A signed ZXP was rejected because certificate lifecycle and installer dependencies conflict with offline emergency recovery.

## Decision 4: exact commit and immutable GitHub release

Packaging is allowed only when the worktree is clean, HEAD is contained by `origin/main`, required runtime files exist, and the `recovery-v<semver>` tag does not exist locally or remotely. The published tag and assets are protected by GitHub Immutable Releases and verified with GitHub release/asset attestation commands. Following `main` or overwriting a prior release is forbidden.

## Decision 5: preset portability and preservation

The artifact contains the committed `symbol-cep/cep/data/presets.json` byte-for-byte, including the deliberately retained absolute output paths. The release manifest records this portability exception. During upgrade, the installer preserves the installed `presets.json` and `presets.usage.json`; on a fresh install it uses the artifact preset. Local dirty preset edits never enter a release.

## Decision 6: independently verified encrypted mirror

The devkit downloads the exact published asset, runs GitHub release and asset verification, checks SHA-256, then wraps the ZIP and checksum in a 7-Zip AES-256 archive with encrypted filenames. The destination is always operator-supplied. A plain Drive copy was rejected because it would weaken confidentiality and would not independently prove integrity.

## Decision 7: release build without source maps

Each existing esbuild entry gains an explicit production packaging mode that disables source maps and avoids development-wrapper synchronization. The normal development build remains unchanged. Rebuilding the bundle is preferable to stripping an inline map after the fact because the latter can leave invalid or ambiguous artifacts.
