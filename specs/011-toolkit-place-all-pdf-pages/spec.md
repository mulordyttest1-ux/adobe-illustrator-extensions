# Feature Specification: Toolkit Place All Pages

## Goal

Add one Toolkit command that selects a multi-page PDF or multi-artboard AI file
and appends every source unit to the active Illustrator document as one linked
`PlacedItem` plus one matching artboard.

## Requirements

- The command keeps id `place_all_pdf_pages` in `Daily Work` and displays as
  `Place All Pages`.
- The source PDF or AI file is selected once and its source type is detected
  automatically.
- PDF page count and geometry are parsed panel-side without opening the source.
- AI artboard count and geometry are inspected host-side before the target
  document is mutated.
- Each source unit remains linked to the original PDF or AI file and is never
  embedded.
- Each new artboard matches the PDF page TrimBox or AI `artboardRect` at 1:1.
- Existing artwork and artboards remain unchanged.
- New page artboards are arranged in a grid below existing artboards.
- A partial failure rolls back every new item, artboard, and output layer.
- Illustrator PDF import preferences, active artboard, and selection are
  restored on failure.
- The command rejects unreadable sources, AI sources that are the active target,
  unsaved open AI sources, and jobs exceeding the 1000-artboard limit before
  mutating the document.
- AI placement failure reports that the source must be saved with
  `Create PDF Compatible File`.

## Acceptance

- A three-page mixed-size PDF creates exactly three linked items and three
  exact-size artboards in page order.
- A three-artboard mixed-size AI creates exactly three linked items and three
  exact-size artboards in artboard order.
- Existing artboards and artwork survive both success and failure.
- Cancellation never calls the host.
- Runtime-sync retry does not reopen or reparse the PDF.
- AI inspection closes only documents opened by the module and restores the
  target document.
- Validation uses only the Illustrator 2026 Toolkit debug gate on port 9099.
