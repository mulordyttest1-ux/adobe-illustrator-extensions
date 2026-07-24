DINH SON ADOBE ILLUSTRATOR CEP - GOLDEN RECOVERY

Purpose
-------
This is a last-known-good runtime recovery package for the three production
panels. It is not a source-code backup and contains no Adobe application,
licensed font, credential, or development/test panel.

Requirements
------------
- Windows 10 or 11.
- Adobe Illustrator 2025 or 2026 already installed and licensed.
- Illustrator must be closed before install or uninstall.
- No Administrator, Node.js, Git, or internet connection is required.

Install
-------
1. Extract the complete ZIP to an ordinary local folder.
2. Close Illustrator.
3. Run install-silent.bat once.
4. Exit code 0 means success. Open Illustrator and check all three panels.

The installer verifies SHA-256 before changing extensions, enables the two
supported unsigned CEP debug-mode keys for the current user, keeps one
rollback, and preserves existing presets.json/presets.usage.json data.

Uninstall
---------
Close Illustrator and run uninstall-silent.bat. Only the three production
extension IDs are removed. Development and test wrappers are not touched.

Exit codes
----------
0 success; 10 integrity/payload; 20 Illustrator running;
30 copy/rollback; 40 unsupported environment; 50 internal error.

Authenticity
------------
Use SHA256SUMS.txt and the published GitHub release verification/attestation.
Never install an archive that fails verification.
