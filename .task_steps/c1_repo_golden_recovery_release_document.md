# C1 Direction Brief: Immutable Golden Recovery Release

**Task Tier:** D1-3
**Shared Change:** no
**Cross-App Impact:** yes

## Define

Create a small, immutable, offline-installable recovery runtime for the three production CEP panels without replacing source backup or modifying product behavior.

## Search and evidence

1. Existing repository build and live-link installer define the three production IDs and their runtime layouts.
2. Existing work manifests target Illustrator host range `[29.0,30.9]`.
3. Adobe CEP guidance requires `PlayerDebugMode` for unsigned extensions.
4. GitHub Immutable Releases lock published tag/assets and attach release attestation.
5. `gh release verify` and `gh release verify-asset` provide independent release/asset verification.
6. The committed preset file contains machine-specific output paths that the user explicitly chose to retain.

## Best practices

- Build only from a clean commit already on `origin/main`.
- Materialize runtime files and verify every payload digest before installation.
- Keep GitHub release identity immutable and mirror the verified exact asset independently.
- Preserve mutable user preset data during upgrades and keep one atomic rollback.

## Anti-patterns

- Do not package live links, dev/test panels, source maps, caches, credentials, fonts, or Adobe binaries.
- Do not package dirty local files or provide a policy bypass.
- Do not overwrite/move an existing recovery tag or release asset.
- Do not force-kill Illustrator or require Administrator rights.

## Edge cases

- An installed production wrapper may be a junction from the developer workflow.
- A user may have both `presets.json` and generated `presets.usage.json` data.
- Integrity failure must happen before any production directory is changed.
- Copy failure after staging must restore the previous production wrapper.

## Counterfactuals

- A signed ZXP adds certificate and installer dependencies that weaken offline recoverability.
- Running CEP directly from GitHub is impossible because Illustrator needs local extension files.
- A whole source snapshot is larger, less focused, and duplicates Git/AES recovery.

## Alignment

Aligned with the approved plan: runtime-only DR/BC artifact, unsigned per-user install, public immutable GitHub release, private encrypted mirror, and no product/shared-library behavior changes.

`C1-RESEARCH: DEFINE=1 | SEARCH=6 | BEST=4 | ANTI=4 | EDGE=4 | COUNTER=3 | ALIGN=aligned`
