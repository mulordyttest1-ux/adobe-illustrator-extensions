# Data Model: Immutable Golden Recovery Release

## ReleaseManifest

- `schemaVersion`: integer, currently `1`.
- `release`: immutable tag, `recovery-v<semver>`.
- `version`: SemVer without the tag prefix.
- `commit`: full 40-character Git commit SHA.
- `builtAt`: UTC ISO-8601 timestamp.
- `supportedHosts`: `illustratorVersions` (`2025`, `2026`) and CEP registry keys (`CSXS.11`, `CSXS.12`).
- `extensions`: exactly three `ExtensionEntry` records.
- `files`: sorted relative POSIX paths with size and SHA-256.
- `portabilityExceptions`: explicit notice that committed preset output paths may be machine-specific.

## ExtensionEntry

- `id`: one of `com.dinhson.imposition`, `com.dinhson.weddingscripter`, `com.dinhson.toolkit`.
- `name`: stable display label.
- `version`: equal to `ReleaseManifest.version`.
- `relativePath`: directory below `extensions/`.
- `manifestPath`: relative path to the production `manifest.xml`.
- `hostRange`: `[29.0,30.9]` for Illustrator 2025/2026.

## FileDigest

- `path`: normalized relative POSIX path; never absolute and never contains `..`.
- `size`: non-negative integer byte count.
- `sha256`: lowercase 64-character hexadecimal digest.

## InstallState

Persisted below `%LOCALAPPDATA%\DinhSon\CEP` after success:

- schema version, release, version, commit, installed-at timestamp.
- extension root and installed extension IDs.
- rollback path retained for the preceding production installation.
- hash of the installed release manifest.

Credentials, environment variables, font data, or Adobe license state are never stored.

## MirrorReceipt

- release/tag, commit and GitHub asset URL/name.
- downloaded asset SHA-256 and GitHub verification result.
- encrypted archive path and SHA-256 sidecar path.
- mirror timestamp; no password or authentication token.

## State transitions

`source commit -> packaged -> locally verified -> draft release -> published immutable -> GitHub verified -> encrypted mirror verified`

No transition is reversible by overwriting a tag or asset. A new recovery build always receives a new SemVer and tag.
