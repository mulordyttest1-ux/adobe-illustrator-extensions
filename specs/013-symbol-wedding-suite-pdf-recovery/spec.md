# Feature Specification: Wedding Suite PDF Export Recovery

## Goal

Prevent Wedding Suite from discarding the rendered working document when
Illustrator's Acrobat PDF plug-in fails during PDF export.

## Requirements

- Successful builds remain PDF-only and delete temporary AI files.
- PDF export failures return `WEDDING_SUITE_PDF_EXPORT_FAILED`.
- On that failure, the rendered AI is checkpointed in the temp job folder.
- The recovery AI is opened automatically when possible.
- If recovery export/open also fails, the in-memory working document stays open.
- The panel reports the recovery path in the build error.
- Partial staged PDFs are removed while the recovery AI is retained.
- If editable PDF export fails but regular PDF export succeeds, the build
  completes with a non-blocking warning that editability was not preserved.
- Output commit, dirty guard, previous-output cleanup and QA behavior do not change.

## Acceptance

- A PDF export failure never closes the only rendered working document.
- A normal successful build leaves no production AI artifact.
- Symbol unit, build and Illustrator 2026 smoke validation pass.
- Illustrator 2025 smoke is not run.
