# Implementation Plan: Toolkit Place All Pages

## Panel

- Extend build-time discovery with optional module `request.js` adapters.
- Generalize the narrow picker service to accept PDF and AI source extensions.
- Parse the PDF with `pdf-lib`, producing ordered TrimBox dimensions and page
  rotation metadata.
- For AI, send only normalized source identity and let the host inspect
  artboards.
- Prepare the payload once, then reuse it for any host-runtime retry.

## Host

- Add an ES3 module island for request validation, grid layout, linked placement,
  result shaping, and rollback.
- Inspect AI artboards without mutating the source or target; reject the active
  target and open unsaved source documents.
- Set both documented PDF open options and Illustrator's PDF import page
  preference for every PDF page or AI artboard, restoring prior values in
  `finally`.
- Append a dedicated output layer and exact-size artboards below the existing
  artboard union without scaling linked artwork.

## Verification

- Unit-test picker filtering, source classification, PDF parsing, AI host
  inspection guards, payload reuse, and request-service boundaries.
- Smoke-test PDF and AI linked placement, exact artboard geometry, rollback,
  PDF compatibility failure, and artboard capacity on Illustrator 2026.
- Run encoding, architecture, lint, build, Toolkit unit, focused smoke, and full
  Toolkit smoke gates.
