# Contract: CLI and Artifact

## Product packaging

```powershell
npm run package:recovery -- --version <semver> --output <folder> [--json]
```

- Requires Windows release dependencies, a clean worktree, and HEAD contained in `origin/main`.
- Rejects an existing local or remote `recovery-v<semver>` tag.
- Builds production bundles without source maps and produces one unpacked directory plus one ZIP.
- JSON success output contains `version`, `release`, `commit`, `directory`, `archive`, `size`, `sha256`, and `status`.
- Exit `0` success, `1` policy or validation failure, `2` CLI/internal failure.

There is intentionally no dirty-worktree override.

## Product verification

```powershell
npm run verify:recovery -- --archive <zip> [--json]
```

- Verifies filename identity, maximum size, archive traversal safety, absence of links/forbidden paths, schema, extension set, manifest versions, SHA-256 inventory, and required files.
- Exit `0` PASS, `1` validation FAIL, `2` CLI/internal failure.
- JSON output: `{version, status, archive, checks:[{id,status,message,remediation}]}`.

## Installer

```text
install-silent.bat
uninstall-silent.bat
```

Public installer exit codes:

| Code | Meaning |
|---:|---|
| 0 | success |
| 10 | integrity or payload failure |
| 20 | Illustrator is running |
| 30 | copy, atomic replacement, or rollback failure |
| 40 | unsupported Windows/Illustrator environment |
| 50 | internal error |

The BAT files call the packaged PowerShell scripts. Test-only PowerShell parameters may redirect the CEP/local-state roots and bypass host/process discovery; production BAT files never pass those parameters.

## Devkit mirror

```powershell
.\mirror-recovery-release.ps1 -Version <semver> -Destination <folder> [-DryRun]
```

- Requires authenticated GitHub CLI and 7-Zip.
- Downloads only the exact asset for `recovery-v<semver>`.
- Runs GitHub release and asset verification and checks the published SHA-256.
- Writes an AES-256 7-Zip archive with encrypted filenames, tests it, and writes a SHA-256 sidecar.
- The password is prompted securely or supplied through the devkit's documented secret environment variable; it is never written to disk or logs.

## Artifact identity

```text
adobe-illustrator-cep-golden-recovery-v<semver>-<shortsha>.zip
```

The ZIP contains one root directory bearing the same basename and the documented recovery layout. All paths use forward slashes in the manifest. `SHA256SUMS.txt` covers the installer, documentation, and runtime payload; the release manifest contains the authoritative sorted runtime inventory.
